import { RatingsService } from '../src/ratings/ratings.service';
import { PrismaService } from '../src/common/prisma.service';

describe('RatingsService', () => {
  let service: RatingsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      trip: { findUnique: jest.fn(), update: jest.fn() },
      rating: { findUnique: jest.fn(), create: jest.fn() },
      driver: { findUnique: jest.fn(), update: jest.fn() },
      passenger: { findUnique: jest.fn(), update: jest.fn() },
    };
    service = new RatingsService(prismaMock as PrismaService);
  });

  describe('rateTrip', () => {
    const baseTrip = {
      id: 't1', status: 'COMPLETED',
      passengerId: 'p1', passengerUserId: 'passenger-u1',
      driverId: 'd1', driver: { userId: 'driver-u1' },
    };

    it('rejects non-completed trips', async () => {
      prismaMock.trip.findUnique.mockResolvedValue({ ...baseTrip, status: 'IN_PROGRESS' });
      await expect(
        service.rateTrip('user1', 't1', { role: 'PASSENGER_TO_DRIVER', stars: 5 }),
      ).rejects.toThrow(/only rate completed/i);
    });

    it('rejects stars outside 1-5 range', async () => {
      prismaMock.trip.findUnique.mockResolvedValue(baseTrip);
      await expect(
        service.rateTrip('user1', 't1', { role: 'PASSENGER_TO_DRIVER', stars: 0 }),
      ).rejects.toThrow(/1-5/i);
      await expect(
        service.rateTrip('user1', 't1', { role: 'PASSENGER_TO_DRIVER', stars: 6 }),
      ).rejects.toThrow(/1-5/i);
    });

    it('rejects duplicate rating', async () => {
      prismaMock.trip.findUnique.mockResolvedValue(baseTrip);
      prismaMock.rating.findUnique.mockResolvedValue({ id: 'r1' });
      await expect(
        service.rateTrip('passenger-u1', 't1', { role: 'PASSENGER_TO_DRIVER', stars: 4 }),
      ).rejects.toThrow(/Already rated/i);
    });

    it('creates rating and updates driver average', async () => {
      prismaMock.trip.findUnique.mockResolvedValue(baseTrip);
      prismaMock.rating.findUnique.mockResolvedValue(null);
      prismaMock.rating.create.mockResolvedValue({ id: 'r1', stars: 5 });
      prismaMock.driver.findUnique.mockResolvedValue({
        id: 'd1', ratingAverage: 4.5, ratingCount: 10,
      });

      await service.rateTrip('passenger-u1', 't1', {
        role: 'PASSENGER_TO_DRIVER', stars: 5, comment: 'great',
      });

      // Verify new average is (4.5*10 + 5)/11 = 4.545...
      const updateCall = prismaMock.driver.update.mock.calls[0][0];
      expect(updateCall.where.id).toBe('d1');
      expect(updateCall.data.ratingCount).toBe(11);
      expect(updateCall.data.ratingAverage).toBeCloseTo(4.545, 1);
      // Verify trip marked as passengerRated
      expect(prismaMock.trip.update).toHaveBeenCalledWith({
        where: { id: 't1' }, data: { passengerRated: true },
      });
    });
  });
});
