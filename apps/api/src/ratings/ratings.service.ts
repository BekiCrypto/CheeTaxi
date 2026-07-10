import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  async rateTrip(userId: string, tripId: string, data: { role: 'PASSENGER_TO_DRIVER' | 'DRIVER_TO_PASSENGER'; stars: number; comment?: string; tags?: string[] }) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { passenger: true, driver: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.status !== 'COMPLETED') throw new BadRequestException('Can only rate completed trips');
    if (data.stars < 1 || data.stars > 5) throw new BadRequestException('Stars must be 1-5');

    const fromUserId = userId;
    const toUserId = data.role === 'PASSENGER_TO_DRIVER' ? trip.driver?.userId : trip.passengerUserId;
    if (!toUserId) throw new BadRequestException('Cannot rate — counterparty missing');

    // Idempotency
    const existing = await this.prisma.rating.findUnique({
      where: { tripId_role_fromUserId: { tripId, role: data.role as any, fromUserId } },
    });
    if (existing) throw new BadRequestException('Already rated');

    const rating = await this.prisma.rating.create({
      data: {
        tripId,
        fromUserId,
        toUserId: toUserId,
        role: data.role as any,
        stars: data.stars,
        comment: data.comment,
        tags: data.tags ?? [],
      },
    });

    // Update average rating on recipient
    if (data.role === 'PASSENGER_TO_DRIVER' && trip.driverId) {
      const driver = await this.prisma.driver.findUnique({ where: { id: trip.driverId } });
      if (driver) {
        const newCount = driver.ratingCount + 1;
        const newAvg = (driver.ratingAverage * driver.ratingCount + data.stars) / newCount;
        await this.prisma.driver.update({
          where: { id: trip.driverId },
          data: { ratingAverage: newAvg, ratingCount: newCount },
        });
      }
      await this.prisma.trip.update({ where: { id: tripId }, data: { passengerRated: true } });
    } else {
      const passenger = trip.passenger;
      if (passenger) {
        const newCount = passenger.ratingCount + 1;
        const newAvg = (passenger.ratingAverage * passenger.ratingCount + data.stars) / newCount;
        await this.prisma.passenger.update({
          where: { id: passenger.id },
          data: { ratingAverage: newAvg, ratingCount: newCount },
        });
      }
      await this.prisma.trip.update({ where: { id: tripId }, data: { driverRated: true } });
    }

    return rating;
  }
}
