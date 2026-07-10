import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

const DRIVER_LOCATION_KEY = 'geo:drivers:online';
const DRIVER_TTL_SECONDS = 90; // expire offline drivers after 90s of no updates

@Injectable()
export class DriversService {
  private readonly logger = new Logger('DriversService');

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async onboard(userId: string, data: {
    licenseNumber: string;
    licenseExpiry: string;
    licenseFrontUrl: string;
    licenseBackUrl?: string;
  }) {
    const existing = await this.prisma.driver.findUnique({ where: { licenseNumber: data.licenseNumber } });
    if (existing) throw new BadRequestException('License number already registered');

    const driver = await this.prisma.driver.create({
      data: {
        userId,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        licenseFrontUrl: data.licenseFrontUrl,
        licenseBackUrl: data.licenseBackUrl,
        kycStatus: 'KYC_SUBMITTED',
        status: 'PENDING_KYC',
      },
    });

    // Promote user role
    await this.prisma.userRoleAssignment.upsert({
      where: { userId_role_scope: { userId, role: 'DRIVER' as any, scope: null as any } },
      update: {},
      create: { userId, role: 'DRIVER' as any, grantedBy: 'system' },
    });

    return driver;
  }

  async getProfile(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, phone: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
        vehicles: true,
        fleet: true,
        fleetMemberships: { include: { fleet: true } },
      },
    });
    if (!driver) throw new NotFoundException('Driver profile not found');
    return driver;
  }

  async setOnlineStatus(userId: string, online: boolean) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver not found');
    if (driver.kycStatus !== 'ONBOARDING_COMPLETE' && online) {
      throw new BadRequestException('Driver onboarding not complete');
    }
    const status = online ? 'ONLINE' : 'OFFLINE';
    const updated = await this.prisma.driver.update({
      where: { userId },
      data: { online, status: status as any, locationUpdatedAt: new Date() },
    });

    if (!online) {
      await this.redis.geoRemove(DRIVER_LOCATION_KEY, driver.id);
    }
    return updated;
  }

  async updateLocation(
    userId: string,
    location: { latitude: number; longitude: number; heading?: number; speedKmh?: number; accuracyMeters?: number },
  ) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver not found');

    // Update DB (less frequently in production — every ~30s)
    await this.prisma.driver.update({
      where: { userId },
      data: {
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        speedKmh: location.speedKmh,
        accuracyMeters: location.accuracyMeters,
        locationUpdatedAt: new Date(),
      },
    });

    // Write to Redis GEO set for fast nearby-driver queries
    if (driver.online) {
      await this.redis.geoAdd(DRIVER_LOCATION_KEY, location.longitude, location.latitude, driver.id);
      await this.redis.set(`driver:online:${driver.id}`, { ts: Date.now() }, DRIVER_TTL_SECONDS);
    }

    // Write location history (rate-limited in production)
    await this.prisma.driverLocationHistory.create({
      data: {
        driverId: driver.id,
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        speedKmh: location.speedKmh,
        accuracyMeters: location.accuracyMeters,
      },
    });

    return { ok: true };
  }

  async findNearby(location: { latitude: number; longitude: number }, radiusMeters = 3000, limit = 20) {
    const nearby = await this.redis.geoRadius(
      DRIVER_LOCATION_KEY,
      location.longitude,
      location.latitude,
      radiusMeters,
    );
    if (nearby.length === 0) return [];

    const top = nearby.slice(0, limit);
    const driverIds = top.map((n) => n.member);
    const drivers = await this.prisma.driver.findMany({
      where: { id: { in: driverIds }, online: true, status: 'ONLINE' },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true, phone: true } },
        currentVehicle: true,
      },
    });

    // Merge with distance
    return drivers.map((d) => {
      const match = top.find((n) => n.member === d.id);
      return {
        ...d,
        distanceMeters: match?.distance ?? null,
        etaSeconds: match ? Math.round((match.distance / 30) * 3.6) : null, // ~30km/h estimate
      };
    });
  }

  async approve(driverId: string, approvedBy: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    return this.prisma.driver.update({
      where: { id: driverId },
      data: {
        kycStatus: 'ONBOARDING_COMPLETE',
        backgroundCheckPassed: true,
        backgroundCheckDate: new Date(),
        approvedAt: new Date(),
        approvedBy,
      },
    });
  }

  async reject(driverId: string, reason: string) {
    return this.prisma.driver.update({
      where: { id: driverId },
      data: { status: 'REJECTED', deactivationReason: reason, deactivatedAt: new Date() },
    });
  }

  async listPending(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.driver.findMany({
        where: { kycStatus: { not: 'ONBOARDING_COMPLETE' }, status: { in: ['PENDING_KYC', 'OFFLINE'] } },
        include: { user: { select: { firstName: true, lastName: true, phone: true, email: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.driver.count({ where: { kycStatus: { not: 'ONBOARDING_COMPLETE' } } }),
    ]);
    return { items, total, page, limit };
  }

  async getEarningsSummary(userId: string, daysBack = 30) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver not found');
    const since = new Date(Date.now() - daysBack * 24 * 3600 * 1000);

    const [trips, withdrawals] = await Promise.all([
      this.prisma.trip.findMany({
        where: { driverId: driver.id, status: 'COMPLETED', completedAt: { gte: since } },
        select: { totalFare: true, completedAt: true, distanceMeters: true, durationSeconds: true },
      }),
      this.prisma.withdrawalRequest.findMany({
        where: { driverId: driver.id, createdAt: { gte: since } },
        select: { amount: true, status: true },
      }),
    ]);

    const grossEarnings = trips.reduce((s, t) => s + Number(t.totalFare), 0);
    const completedTrips = trips.length;
    const totalDistance = trips.reduce((s, t) => s + (t.distanceMeters ?? 0), 0);
    const totalDuration = trips.reduce((s, t) => s + (t.durationSeconds ?? 0), 0);
    const withdrawn = withdrawals
      .filter((w) => w.status === 'SUCCESS')
      .reduce((s, w) => s + Number(w.amount), 0);

    return {
      period: { from: since, to: new Date(), days: daysBack },
      grossEarnings,
      completedTrips,
      totalDistanceMeters: totalDistance,
      totalDurationSeconds: totalDuration,
      avgFare: completedTrips ? grossEarnings / completedTrips : 0,
      withdrawn,
      pendingBalance: Number(driver.totalEarnings) - withdrawn,
    };
  }
}
