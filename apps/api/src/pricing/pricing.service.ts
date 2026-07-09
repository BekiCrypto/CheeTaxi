import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { GeoService } from '../geo/geo.service';

interface FareInput {
  vehicleType: string;
  pickup: { lat: number; lng: number; address?: string };
  dropoff: { lat: number; lng: number; address?: string };
  city?: string;
  country?: string;
  scheduledFor?: string;
  promoCode?: string;
}

interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  promoDiscount: number;
  taxAmount: number;
  totalFare: number;
  currency: string;
  distanceMeters: number;
  durationSeconds: number;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger('PricingService');

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private geo: GeoService,
  ) {}

  async getQuote(input: FareInput): Promise<FareBreakdown> {
    const country = (input.country ?? 'ETHIOPIA') as any;
    const city = input.city ?? 'Addis Ababa';

    const tier = await this.prisma.pricingTier.findFirst({
      where: {
        vehicleType: input.vehicleType as any,
        city,
        country,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (!tier) throw new NotFoundException(`No pricing tier for ${input.vehicleType} in ${city}, ${country}`);

    const distanceMeters = this.geo.haversineMeters(
      { lat: input.pickup.lat, lng: input.pickup.lng },
      { lat: input.dropoff.lat, lng: input.dropoff.lng },
    );
    const durationSeconds = this.geo.etaSeconds(distanceMeters);

    const baseFare = Number(tier.baseFare);
    const distanceFare = Number(tier.perKm) * (distanceMeters / 1000);
    const timeFare = Number(tier.perMinute) * (durationSeconds / 60);

    // Surge: check Redis for active surge zone at pickup
    const surgeMultiplier = await this.getSurgeMultiplier(input.pickup.lat, input.pickup.lng);

    // Promo code
    let promoDiscount = 0;
    if (input.promoCode) {
      promoDiscount = await this.computePromoDiscount(input.promoCode, baseFare + distanceFare + timeFare);
    }

    // Tax — Ethiopia VAT 15% on transport (sample)
    const taxRate = 0.15;
    const taxableBase = Math.max(0, baseFare + distanceFare + timeFare - promoDiscount);
    const taxAmount = taxableBase * taxRate * surgeMultiplier;

    const totalFare = Math.max(
      Number(tier.minFare),
      (baseFare + distanceFare + timeFare) * surgeMultiplier - promoDiscount + taxAmount,
    );

    return {
      baseFare: round2(baseFare),
      distanceFare: round2(distanceFare),
      timeFare: round2(timeFare),
      surgeMultiplier,
      promoDiscount: round2(promoDiscount),
      taxAmount: round2(taxAmount),
      totalFare: round2(totalFare),
      currency: 'ETB',
      distanceMeters: Math.round(distanceMeters),
      durationSeconds,
    };
  }

  private async getSurgeMultiplier(lat: number, lng: number): Promise<number> {
    const geohash = this.geo.geohash(lat, lng, 6);
    const surge = await this.prisma.surgeZone.findFirst({
      where: { geohash: { startsWith: geohash.slice(0, 5) }, isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { multiplier: 'desc' },
    });
    return surge?.multiplier ?? 1.0;
  }

  private async computePromoDiscount(code: string, subtotal: number): Promise<number> {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code, isActive: true },
    });
    if (!promo) return 0;
    if (promo.endsAt && promo.endsAt < new Date()) return 0;
    if (promo.startsAt > new Date()) return 0;
    if (promo.minTripFare && subtotal < Number(promo.minTripFare)) return 0;

    switch (promo.type) {
      case 'PERCENTAGE':
        return round2(subtotal * Number(promo.value) / 100);
      case 'FIXED_AMOUNT':
        return Math.min(Number(promo.value), subtotal);
      case 'FREE_RIDE':
        return subtotal;
      case 'WALLET_CREDIT':
        return 0; // Credited to wallet after trip
      default:
        return 0;
    }
  }

  /** Update pricing tier (admin). */
  async updateTier(id: string, data: Partial<{
    baseFare: number;
    perKm: number;
    perMinute: number;
    minFare: number;
    cancellationFee: number;
    waitingFeePerMinute: number;
    nightSurcharge: number;
    isActive: boolean;
  }>) {
    return this.prisma.pricingTier.update({ where: { id }, data });
  }

  async listTiers() {
    return this.prisma.pricingTier.findMany({
      where: { isActive: true },
      orderBy: [{ country: 'asc' }, { city: 'asc' }, { vehicleType: 'asc' }],
    });
  }

  /** Set surge multiplier for a geohash zone (admin / auto-trigger). */
  async setSurge(geohash: string, multiplier: number, reason: string, durationMinutes = 30) {
    return this.prisma.surgeZone.create({
      data: {
        geohash,
        city: 'Addis Ababa', // resolved upstream
        multiplier,
        reason,
        expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
      },
    });
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
