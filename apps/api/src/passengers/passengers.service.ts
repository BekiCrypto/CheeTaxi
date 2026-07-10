import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PassengersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const p = await this.prisma.passenger.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, phone: true, email: true, firstName: true, lastName: true, avatarUrl: true },
        },
        savedPlaces: true,
        favoriteDrivers: { include: { driver: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } }, currentVehicle: true } } } },
      },
    });
    if (!p) throw new NotFoundException('Passenger profile not found');
    return p;
  }

  async addSavedPlace(userId: string, data: {
    label: string;
    address: string;
    latitude: number;
    longitude: number;
    placeType?: string;
  }) {
    const passenger = await this.prisma.passenger.findUnique({ where: { userId } });
    if (!passenger) throw new NotFoundException('Passenger not found');
    return this.prisma.savedPlace.create({
      data: { ...data, passengerId: passenger.id, userId },
    });
  }

  async removeSavedPlace(userId: string, placeId: string) {
    return this.prisma.savedPlace.deleteMany({ where: { id: placeId, userId } });
  }

  async addFavoriteDriver(userId: string, driverId: string, nickname?: string) {
    const passenger = await this.prisma.passenger.findUnique({ where: { userId } });
    if (!passenger) throw new NotFoundException('Passenger not found');
    return this.prisma.favoriteDriver.upsert({
      where: { passengerId_driverId: { passengerId: passenger.id, driverId } },
      update: { nickname },
      create: { passengerId: passenger.id, driverId, userId, nickname },
    });
  }

  async removeFavoriteDriver(userId: string, driverId: string) {
    return this.prisma.favoriteDriver.deleteMany({ where: { userId, driverId } });
  }

  async getTripHistory(userId: string, page = 1, limit = 20) {
    const passenger = await this.prisma.passenger.findUnique({ where: { userId } });
    if (!passenger) throw new NotFoundException('Passenger not found');
    const [items, total] = await Promise.all([
      this.prisma.trip.findMany({
        where: { passengerId: passenger.id },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          driver: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } }, currentVehicle: true } },
          ratings: true,
        },
      }),
      this.prisma.trip.count({ where: { passengerId: passenger.id } }),
    ]);
    return { items, total, page, limit };
  }
}
