import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async register(driverUserId: string, data: {
    plateNumber: string;
    make: string;
    model: string;
    year: number;
    color: string;
    vehicleType: string;
    capacity?: number;
    hasAC?: boolean;
    insuranceNumber: string;
    insuranceExpiry: string;
    registrationNumber: string;
    registrationExpiry: string;
    photoUrl?: string;
  }) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new NotFoundException('Driver not found');

    const existing = await this.prisma.vehicle.findUnique({ where: { plateNumber: data.plateNumber } });
    if (existing) throw new BadRequestException('Plate number already registered');

    return this.prisma.vehicle.create({
      data: {
        driverId: driver.id,
        ...data,
        vehicleType: data.vehicleType as any,
        capacity: data.capacity ?? 4,
        hasAC: data.hasAC ?? true,
        insuranceExpiry: new Date(data.insuranceExpiry),
        registrationExpiry: new Date(data.registrationExpiry),
        status: 'VERIFICATION_PENDING',
      },
    });
  }

  async listForDriver(driverUserId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new NotFoundException('Driver not found');
    return this.prisma.vehicle.findMany({ where: { driverId: driver.id } });
  }

  async verify(vehicleId: string, verifiedBy: string) {
    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'ACTIVE', verifiedAt: new Date(), verifiedBy },
    });
  }

  async reject(vehicleId: string, reason: string) {
    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'SUSPENDED' },
    });
  }

  async setActive(driverUserId: string, vehicleId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new NotFoundException('Driver not found');
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, driverId: driver.id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found for this driver');
    if (vehicle.status !== 'ACTIVE') throw new BadRequestException('Vehicle is not verified');
    await this.prisma.driver.update({
      where: { id: driver.id },
      data: { currentVehicleId: vehicle.id },
    });
    return vehicle;
  }
}
