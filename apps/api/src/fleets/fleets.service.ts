import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class FleetsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    type: string;
    contactName: string;
    contactEmail?: string;
    contactPhone: string;
    country?: string;
    city?: string;
    taxId?: string;
  }) {
    return this.prisma.fleet.create({
      data: {
        ...data,
        type: data.type as any,
        country: (data.country ?? 'ETHIOPIA') as any,
      },
    });
  }

  async list(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.fleet.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { vehicles: true, members: true } } },
      }),
      this.prisma.fleet.count(),
    ]);
    return { items, total, page, limit };
  }

  async get(id: string) {
    const fleet = await this.prisma.fleet.findUnique({
      where: { id },
      include: {
        members: { include: { driver: { include: { user: { select: { firstName: true, lastName: true, phone: true } }, currentVehicle: true } } } },
        vehicles: true,
        corporateWallet: true,
      },
    });
    if (!fleet) throw new NotFoundException('Fleet not found');
    return fleet;
  }

  async addMember(fleetId: string, driverId: string, role = 'driver') {
    return this.prisma.fleetMember.upsert({
      where: { fleetId_driverId: { fleetId, driverId } },
      update: { role },
      create: { fleetId, driverId, role },
    });
  }

  async removeMember(fleetId: string, driverId: string) {
    await this.prisma.fleetMember.delete({
      where: { fleetId_driverId: { fleetId, driverId } },
    });
    return { ok: true };
  }

  async update(id: string, data: Partial<{ name: string; contactName: string; contactEmail: string; contactPhone: string; isActive: boolean }>) {
    return this.prisma.fleet.update({ where: { id }, data });
  }
}
