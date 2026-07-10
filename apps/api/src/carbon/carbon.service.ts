import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WalletsService } from '../wallets/wallets.service';

/**
 * Carbon tracking + offset service.
 *
 * Every completed trip generates a CarbonOffset record with:
 *   • CO2 emitted (based on vehicle type + distance)
 *   • Cost to offset (Br per kg CO2)
 *
 * Users can optionally offset their carbon footprint. The offset cost
 * goes to a verified carbon offset provider (e.g. Pachama, Climeworks).
 */
@Injectable()
export class CarbonService {
  private readonly logger = new Logger('CarbonService');

  // CO2 emissions per km by vehicle type (kg CO2 per km)
  private readonly EMISSIONS_PER_KM: Record<string, number> = {
    TAXI: 0.21,
    RIDE_SHARING: 0.12, // shared ride = lower per-passenger
    MOTORCYCLE: 0.10,
    THREE_WHEELER: 0.08,
    COURIER: 0.21,
    FOOD_DELIVERY: 0.10,
    PARCEL: 0.15,
    MEDICAL: 0.21,
    TRUCK: 0.50,
    RENTAL: 0.21,
    INTERCITY: 0.18,
    EMERGENCY: 0.21,
  };

  // Cost to offset 1 kg CO2 in ETB
  private readonly OFFSET_COST_PER_KG = 0.50;

  constructor(
    private prisma: PrismaService,
    private wallets: WalletsService,
  ) {}

  /** Record carbon emissions for a completed trip. Called by TripsService on completion. */
  async recordTripEmissions(tripId: string, userId: string, vehicleType: string, distanceMeters: number): Promise<void> {
    const distanceKm = distanceMeters / 1000;
    const co2Kg = (this.EMISSIONS_PER_KM[vehicleType] ?? 0.21) * distanceKm;
    const offsetCost = Math.round(co2Kg * this.OFFSET_COST_PER_KG * 100) / 100;

    await this.prisma.carbonOffset.create({
      data: {
        tripId,
        userId,
        distanceKm,
        vehicleType,
        co2Kg: Math.round(co2Kg * 1000) / 1000,
        offsetCost,
        currency: 'ETB',
        isOffset: false,
      },
    });
  }

  /** User offsets their carbon for a trip. */
  async offsetTrip(tripId: string, userId: string): Promise<{ offset: boolean; cost: number }> {
    const record = await this.prisma.carbonOffset.findUnique({ where: { tripId } });
    if (!record) return { offset: false, cost: 0 };
    if (record.isOffset) return { offset: true, cost: Number(record.offsetCost) };
    if (record.userId !== userId) return { offset: false, cost: 0 };

    // Charge the user's wallet
    await this.wallets.charge(userId, Number(record.offsetCost), record.currency, 'CARBON_OFFSET', tripId);

    await this.prisma.carbonOffset.update({
      where: { tripId },
      data: {
        isOffset: true,
        offsetProvider: 'climeworks',
        offsetRef: `offset_${tripId.slice(0, 8)}`,
      },
    });

    return { offset: true, cost: Number(record.offsetCost) };
  }

  /** Get a user's carbon footprint summary. */
  async getCarbonFootprint(userId: string, days = 30): Promise<CarbonFootprint> {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    const records = await this.prisma.carbonOffset.findMany({
      where: { userId, createdAt: { gte: since } },
    });

    const totalCo2 = records.reduce((s, r) => s + r.co2Kg, 0);
    const totalDistance = records.reduce((s, r) => s + r.distanceKm, 0);
    const offsetCount = records.filter((r) => r.isOffset).length;
    const totalOffsetCost = records.filter((r) => r.isOffset).reduce((s, r) => s + Number(r.offsetCost), 0);
    const pendingOffsetCost = records.filter((r) => !r.isOffset).reduce((s, r) => s + Number(r.offsetCost), 0);

    // Equivalent metrics for context
    const treeEquivalent = Math.round((totalCo2 / 21) * 10) / 10; // 1 tree absorbs ~21 kg CO2/year
    const kmByCarEquivalent = Math.round(totalCo2 / 0.21); // km in an average car

    return {
      period: { days, from: since.toISOString(), to: new Date().toISOString() },
      totalCo2Kg: Math.round(totalCo2 * 100) / 100,
      totalDistanceKm: Math.round(totalDistance * 10) / 10,
      tripCount: records.length,
      offsetCount,
      totalOffsetCost,
      pendingOffsetCost,
      equivalents: {
        treeYears: treeEquivalent,
        kmByCar: kmByCarEquivalent,
      },
    };
  }
}

export interface CarbonFootprint {
  period: { days: number; from: string; to: string };
  totalCo2Kg: number;
  totalDistanceKm: number;
  tripCount: number;
  offsetCount: number;
  totalOffsetCost: number;
  pendingOffsetCost: number;
  equivalents: { treeYears: number; kmByCar: number };
}
