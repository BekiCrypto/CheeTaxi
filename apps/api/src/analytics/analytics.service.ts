import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

/**
 * Analytics service — powers the executive dashboard, cohort analysis,
 * and revenue forecasting. Cached aggressively (1 hour TTL) since
 * analytics queries are expensive.
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger('AnalyticsService');
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /** Executive dashboard — high-level KPIs for the last 30 days. */
  async getExecutiveDashboard(days = 30): Promise<ExecutiveDashboard> {
    const cacheKey = `analytics:executive:${days}`;
    const cached = await this.redis.get<ExecutiveDashboard>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 3600 * 1000);
    const prevStart = new Date(start.getTime() - days * 24 * 3600 * 1000);

    const [
      totalUsers, totalDrivers, totalTrips, totalRevenue,
      newUsersPeriod, newDriversPeriod, tripsPeriod, revenuePeriod,
      newUsersPrev, tripsPrev, revenuePrev,
      activeSubscriptions,
      completedTrips, cancelledTrips, noDriverTrips,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.driver.count(),
      this.prisma.trip.count(),
      this.prisma.trip.aggregate({ where: { status: 'COMPLETED' }, _sum: { totalFare: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: start } } }),
      this.prisma.driver.count({ where: { createdAt: { gte: start } } }),
      this.prisma.trip.count({ where: { requestedAt: { gte: start } } }),
      this.prisma.trip.aggregate({ where: { status: 'COMPLETED', completedAt: { gte: start } }, _sum: { totalFare: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: prevStart, lt: start } } }),
      this.prisma.trip.count({ where: { requestedAt: { gte: prevStart, lt: start } } }),
      this.prisma.trip.aggregate({ where: { status: 'COMPLETED', completedAt: { gte: prevStart, lt: start } }, _sum: { totalFare: true } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE', endsAt: { gt: now } } }),
      this.prisma.trip.count({ where: { status: 'COMPLETED', completedAt: { gte: start } } }),
      this.prisma.trip.count({ where: { status: { in: ['CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER', 'CANCELLED_BY_SYSTEM'] }, cancelledAt: { gte: start } } }),
      this.prisma.trip.count({ where: { status: 'NO_DRIVER_FOUND', requestedAt: { gte: start } } }),
    ]);

    const result: ExecutiveDashboard = {
      totals: {
        users: totalUsers,
        drivers: totalDrivers,
        trips: totalTrips,
        revenue: Number(totalRevenue._sum.totalFare ?? 0),
        activeSubscriptions,
      },
      period: {
        days,
        newUsers: newUsersPeriod,
        newDrivers: newDriversPeriod,
        trips: tripsPeriod,
        revenue: Number(revenuePeriod._sum.totalFare ?? 0),
        completedTrips,
        cancelledTrips,
        noDriverTrips,
        completionRate: tripsPeriod > 0 ? (completedTrips / tripsPeriod) * 100 : 0,
        cancellationRate: tripsPeriod > 0 ? (cancelledTrips / tripsPeriod) * 100 : 0,
      },
      deltas: {
        usersWow: newUsersPrev > 0 ? ((newUsersPeriod - newUsersPrev) / newUsersPrev) * 100 : 0,
        tripsWow: tripsPrev > 0 ? ((tripsPeriod - tripsPrev) / tripsPrev) * 100 : 0,
        revenueWow: Number(revenuePrev._sum.totalFare ?? 0) > 0
          ? ((Number(revenuePeriod._sum.totalFare ?? 0) - Number(revenuePrev._sum.totalFare ?? 0)) / Number(revenuePrev._sum.totalFare ?? 0)) * 100
          : 0,
      },
      generatedAt: now.toISOString(),
    };

    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  /** Revenue trend — daily revenue for the last N days. */
  async getRevenueTrend(days = 30): Promise<Array<{ date: string; revenue: number; trips: number }>> {
    const cacheKey = `analytics:revenue:trend:${days}`;
    const cached = await this.redis.get<Array<{ date: string; revenue: number; trips: number }>>(cacheKey);
    if (cached) return cached;

    const start = new Date(Date.now() - days * 24 * 3600 * 1000);
    const trips = await this.prisma.trip.findMany({
      where: { status: 'COMPLETED', completedAt: { gte: start } },
      select: { totalFare: true, completedAt: true },
    });

    const byDay = new Map<string, { revenue: number; trips: number }>();
    for (const trip of trips) {
      if (!trip.completedAt) continue;
      const date = trip.completedAt.toISOString().slice(0, 10);
      const existing = byDay.get(date) ?? { revenue: 0, trips: 0 };
      existing.revenue += Number(trip.totalFare);
      existing.trips++;
      byDay.set(date, existing);
    }

    const result = Array.from(byDay.entries())
      .map(([date, v]) => ({ date, revenue: Math.round(v.revenue * 100) / 100, trips: v.trips }))
      .sort((a, b) => a.date.localeCompare(b.date));

    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  /** Passenger cohort analysis — retention by signup month. */
  async getPassengerCohorts(cohortMonths = 6): Promise<CohortAnalysis> {
    const cacheKey = `analytics:cohorts:${cohortMonths}`;
    const cached = await this.redis.get<CohortAnalysis>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const cohorts: Cohort[] = [];

    for (let i = 0; i < cohortMonths; i++) {
      const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const cohortEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const cohortPassengers = await this.prisma.passenger.findMany({
        where: {
          user: { createdAt: { gte: cohortStart, lt: cohortEnd } },
        },
        select: { id: true, userId: true },
      });

      if (cohortPassengers.length === 0) continue;

      const passengerIds = cohortPassengers.map((p) => p.id);
      const passengerUserIds = cohortPassengers.map((p) => p.userId);

      // Count trips per month since cohort
      const retention: number[] = [];
      for (let m = 0; m <= i; m++) {
        const monthStart = new Date(cohortStart.getFullYear(), cohortStart.getMonth() + m, 1);
        const monthEnd = new Date(cohortStart.getFullYear(), cohortStart.getMonth() + m + 1, 1);
        const activeThisMonth = await this.prisma.trip.count({
          where: {
            passengerId: { in: passengerIds },
            requestedAt: { gte: monthStart, lt: monthEnd },
          },
        });
        retention.push(cohortPassengers.length > 0 ? (activeThisMonth / cohortPassengers.length) * 100 : 0);
      }

      cohorts.push({
        cohortMonth: cohortStart.toISOString().slice(0, 7),
        cohortSize: cohortPassengers.length,
        retention, // index 0 = month 0 (signup month), index 1 = month 1, etc.
      });
    }

    const result: CohortAnalysis = { cohorts, generatedAt: now.toISOString() };
    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  /** Driver churn analysis — drivers who stopped driving. */
  async getDriverChurn(days = 90): Promise<DriverChurnAnalysis> {
    const cacheKey = `analytics:driver-churn:${days}`;
    const cached = await this.redis.get<DriverChurnAnalysis>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 3600 * 1000);

    const allDrivers = await this.prisma.driver.findMany({
      select: { id: true, createdAt: true, locationUpdatedAt: true, completedTrips: true, status: true },
    });

    const active = allDrivers.filter((d) => d.locationUpdatedAt && d.locationUpdatedAt > start);
    const churned = allDrivers.filter((d) => !d.locationUpdatedAt || d.locationUpdatedAt < start);
    const newDrivers = allDrivers.filter((d) => d.createdAt > start);

    const churnedWithFewTrips = churned.filter((d) => d.completedTrips < 10).length;
    const churnedWithManyTrips = churned.filter((d) => d.completedTrips >= 50).length;

    const result: DriverChurnAnalysis = {
      total: allDrivers.length,
      active: active.length,
      churned: churned.length,
      newInPeriod: newDrivers.length,
      churnRate: allDrivers.length > 0 ? (churned.length / allDrivers.length) * 100 : 0,
      churnedByTripCount: {
        fewerThan10: churnedWithFewTrips,
        between10and50: churned.length - churnedWithFewTrips - churnedWithManyTrips,
        moreThan50: churnedWithManyTrips,
      },
      generatedAt: now.toISOString(),
    };

    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  /** City-level performance comparison. */
  async getCityComparison(): Promise<CityComparison[]> {
    const cacheKey = 'analytics:cities';
    const cached = await this.redis.get<CityComparison[]>(cacheKey);
    if (cached) return cached;

    // Group by pickup geohash prefix (proxy for city — would use geofence in production)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const trips = await this.prisma.trip.findMany({
      where: { requestedAt: { gte: thirtyDaysAgo } },
      select: { pickupGeohash: true, status: true, totalFare: true },
    });

    const byCity = new Map<string, { trips: number; completed: number; revenue: number }>();
    for (const trip of trips) {
      if (!trip.pickupGeohash) continue;
      const city = trip.pickupGeohash.slice(0, 3); // very coarse — would be geofence in production
      const existing = byCity.get(city) ?? { trips: 0, completed: 0, revenue: 0 };
      existing.trips++;
      if (trip.status === 'COMPLETED') {
        existing.completed++;
        existing.revenue += Number(trip.totalFare);
      }
      byCity.set(city, existing);
    }

    const result: CityComparison[] = Array.from(byCity.entries())
      .map(([city, v]) => ({
        city,
        trips: v.trips,
        completedTrips: v.completed,
        revenue: Math.round(v.revenue * 100) / 100,
        completionRate: v.trips > 0 ? (v.completed / v.trips) * 100 : 0,
      }))
      .sort((a, b) => b.trips - a.trips);

    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  /** Revenue forecast — simple linear projection based on the last 30 days. */
  async getRevenueForecast(days = 30): Promise<RevenueForecast> {
    const cacheKey = `analytics:forecast:${days}`;
    const cached = await this.redis.get<RevenueForecast>(cacheKey);
    if (cached) return cached;

    const trend = await this.getRevenueTrend(days);
    if (trend.length < 7) {
      return { forecast: [], method: 'insufficient_data', generatedAt: new Date().toISOString() };
    }

    // Simple linear regression on daily revenue
    const n = trend.length;
    const xs = trend.map((_, i) => i);
    const ys = trend.map((t) => t.revenue);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i]!, 0);
    const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Forecast next 7 days
    const forecast: Array<{ date: string; projectedRevenue: number }> = [];
    const lastDate = new Date(trend[trend.length - 1]!.date);
    for (let i = 1; i <= 7; i++) {
      const projectedDate = new Date(lastDate.getTime() + i * 24 * 3600 * 1000);
      const projectedRevenue = Math.max(0, Math.round(slope * (n + i - 1) + intercept));
      forecast.push({ date: projectedDate.toISOString().slice(0, 10), projectedRevenue });
    }

    const result: RevenueForecast = {
      forecast,
      method: 'linear_regression',
      slopePerDay: Math.round(slope * 100) / 100,
      generatedAt: new Date().toISOString(),
    };

    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }
}

export interface ExecutiveDashboard {
  totals: { users: number; drivers: number; trips: number; revenue: number; activeSubscriptions: number };
  period: {
    days: number;
    newUsers: number; newDrivers: number;
    trips: number; revenue: number;
    completedTrips: number; cancelledTrips: number; noDriverTrips: number;
    completionRate: number; cancellationRate: number;
  };
  deltas: { usersWow: number; tripsWow: number; revenueWow: number };
  generatedAt: string;
}

export interface CohortAnalysis {
  cohorts: Cohort[];
  generatedAt: string;
}

export interface Cohort {
  cohortMonth: string; // YYYY-MM
  cohortSize: number;
  retention: number[]; // % active at month 0, 1, 2, ...
}

export interface DriverChurnAnalysis {
  total: number;
  active: number;
  churned: number;
  newInPeriod: number;
  churnRate: number;
  churnedByTripCount: { fewerThan10: number; between10and50: number; moreThan50: number };
  generatedAt: string;
}

export interface CityComparison {
  city: string;
  trips: number;
  completedTrips: number;
  revenue: number;
  completionRate: number;
}

export interface RevenueForecast {
  forecast: Array<{ date: string; projectedRevenue: number }>;
  method: string;
  slopePerDay?: number;
  generatedAt: string;
}
