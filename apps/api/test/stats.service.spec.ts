import { StatsService } from '../src/stats/stats.service';
import { PrismaService } from '../src/common/prisma.service';

describe('StatsService', () => {
  let service: StatsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      user: { count: jest.fn().mockResolvedValue(1000) },
      driver: { count: jest.fn().mockResolvedValue(150) },
      subscription: { count: jest.fn().mockResolvedValue(120) },
      trip: { count: jest.fn().mockResolvedValue(500), aggregate: jest.fn() },
      sOSAlert: { count: jest.fn().mockResolvedValue(0) },
      supportTicket: { count: jest.fn().mockResolvedValue(5) },
    };
    service = new StatsService(prismaMock as PrismaService);
  });

  describe('getPlatformStats', () => {
    it('returns totals, today, and deltas', async () => {
      prismaMock.trip.aggregate
        .mockResolvedValueOnce({ _sum: { totalFare: 15000 } }) // today
        .mockResolvedValueOnce({ _sum: { totalFare: 12000 } }); // last week

      const stats = await service.getPlatformStats();

      expect(stats.totals).toEqual({ users: 1000, drivers: 150, activeSubscriptions: 120 });
      expect(stats.today).toHaveProperty('trips');
      expect(stats.today).toHaveProperty('revenue', 15000);
      expect(stats.today).toHaveProperty('activeDrivers');
      expect(stats.today).toHaveProperty('pendingDrivers');
      expect(stats.today).toHaveProperty('activeSosAlerts', 0);
      expect(stats.today).toHaveProperty('openSupportTickets', 5);
      expect(stats.deltas).toHaveProperty('tripsWeekOverWeek');
      expect(stats.deltas).toHaveProperty('revenueWeekOverWeek');
      expect(stats.timestamp).toBeTruthy();
    });

    it('handles zero last-week revenue without NaN', async () => {
      prismaMock.trip.aggregate
        .mockResolvedValueOnce({ _sum: { totalFare: 5000 } })
        .mockResolvedValueOnce({ _sum: { totalFare: null } });
      const stats = await service.getPlatformStats();
      expect(stats.deltas.revenueWeekOverWeek).toBe(0);
    });
  });

  describe('getTripFunnel', () => {
    it('aggregates trip counts by status for the date range', async () => {
      prismaMock.trip.count
        .mockResolvedValueOnce(100) // requested
        .mockResolvedValueOnce(95)  // assigned
        .mockResolvedValueOnce(90)  // completed
        .mockResolvedValueOnce(5)   // cancelled
        .mockResolvedValueOnce(5);  // noDriver

      const funnel = await service.getTripFunnel(
        new Date('2026-07-01'),
        new Date('2026-07-09'),
      );

      expect(funnel).toEqual({
        requested: 100, assigned: 95, completed: 90, cancelled: 5, noDriver: 5,
      });
    });
  });
});
