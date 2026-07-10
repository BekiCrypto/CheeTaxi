import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class StatsService {
  private readonly logger = new Logger('StatsService');

  constructor(private prisma: PrismaService) {}

  /** Platform-wide snapshot for the admin dashboard. */
  async getPlatformStats() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);

    const [
      totalUsers,
      totalDrivers,
      activeDrivers,
      pendingDrivers,
      activeSubscriptions,
      tripsToday,
      completedTripsToday,
      revenueToday,
      activeSosAlerts,
      openSupportTickets,
      tripsLastWeek,
      revenueLastWeek,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.driver.count(),
      this.prisma.driver.count({ where: { online: true, status: 'ONLINE' } }),
      this.prisma.driver.count({ where: { kycStatus: { not: 'ONBOARDING_COMPLETE' } } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE', endsAt: { gt: now } } }),
      this.prisma.trip.count({ where: { requestedAt: { gte: todayStart } } }),
      this.prisma.trip.count({ where: { status: 'COMPLETED', completedAt: { gte: todayStart } } }),
      this.prisma.trip.aggregate({
        where: { status: 'COMPLETED', completedAt: { gte: todayStart } },
        _sum: { totalFare: true },
      }),
      this.prisma.sOSAlert.count({
        where: { status: { in: ['TRIGGERED', 'ACKNOWLEDGED'] } },
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      this.prisma.trip.count({ where: { requestedAt: { gte: lastWeekStart, lt: weekStart } } }),
      this.prisma.trip.aggregate({
        where: { status: 'COMPLETED', completedAt: { gte: lastWeekStart, lt: weekStart } },
        _sum: { totalFare: true },
      }),
    ]);

    const revenueTodayNum = Number(revenueToday._sum.totalFare ?? 0);
    const revenueLastWeekNum = Number(revenueLastWeek._sum.totalFare ?? 0);
    const tripsDeltaPct = tripsLastWeek > 0 ? ((tripsToday - tripsLastWeek) / tripsLastWeek) * 100 : 0;
    const revenueDeltaPct = revenueLastWeekNum > 0 ? ((revenueTodayNum - revenueLastWeekNum) / revenueLastWeekNum) * 100 : 0;

    return {
      totals: {
        users: totalUsers,
        drivers: totalDrivers,
        activeSubscriptions,
      },
      today: {
        trips: tripsToday,
        completedTrips: completedTripsToday,
        revenue: revenueTodayNum,
        activeDrivers,
        pendingDrivers,
        activeSosAlerts,
        openSupportTickets,
      },
      deltas: {
        tripsWeekOverWeek: Math.round(tripsDeltaPct * 10) / 10,
        revenueWeekOverWeek: Math.round(revenueDeltaPct * 10) / 10,
      },
      timestamp: now.toISOString(),
    };
  }

  /** Trip funnel for a date range. */
  async getTripFunnel(from: Date, to: Date) {
    const [requested, assigned, completed, cancelled, noDriver] = await Promise.all([
      this.prisma.trip.count({ where: { requestedAt: { gte: from, lt: to } } }),
      this.prisma.trip.count({ where: { acceptedAt: { gte: from, lt: to } } }),
      this.prisma.trip.count({ where: { completedAt: { gte: from, lt: to } } }),
      this.prisma.trip.count({
        where: {
          cancelledAt: { gte: from, lt: to },
          status: { in: ['CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER', 'CANCELLED_BY_SYSTEM'] },
        },
      }),
      this.prisma.trip.count({ where: { status: 'NO_DRIVER_FOUND', requestedAt: { gte: from, lt: to } } }),
    ]);
    return { requested, assigned, completed, cancelled, noDriver };
  }
}
