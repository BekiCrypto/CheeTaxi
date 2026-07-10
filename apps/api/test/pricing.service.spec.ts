import { PricingService } from '../src/pricing/pricing.service';
import { PrismaService } from '../src/common/prisma.service';
import { RedisService } from '../src/common/redis.service';
import { GeoService } from '../src/geo/geo.service';

describe('PricingService', () => {
  let service: PricingService;
  let prismaMock: any;
  let redisMock: any;
  let geoService: GeoService;

  beforeEach(() => {
    prismaMock = {
      pricingTier: {
        findFirst: jest.fn().mockResolvedValue({
          baseFare: 30,
          perKm: 15,
          perMinute: 2,
          minFare: 50,
          cancellationFee: 0,
          waitingFeePerMinute: 0,
          nightSurcharge: 0,
        }),
      },
      surgeZone: { findFirst: jest.fn().mockResolvedValue(null) },
      promoCode: { findUnique: jest.fn() },
    };
    redisMock = {};
    geoService = new GeoService(prismaMock as PrismaService);
    service = new PricingService(
      prismaMock as PrismaService,
      redisMock as RedisService,
      geoService,
    );
  });

  describe('getQuote', () => {
    it('returns a quote with all required fields', async () => {
      const quote = await service.getQuote({
        vehicleType: 'TAXI',
        pickup: { lat: 9.0195, lng: 38.7525 },
        dropoff: { lat: 9.0112, lng: 38.7623 },
        city: 'Addis Ababa',
        country: 'ETHIOPIA',
      });

      expect(quote).toHaveProperty('baseFare');
      expect(quote).toHaveProperty('distanceFare');
      expect(quote).toHaveProperty('timeFare');
      expect(quote).toHaveProperty('surgeMultiplier', 1.0);
      expect(quote).toHaveProperty('promoDiscount', 0);
      expect(quote).toHaveProperty('taxAmount');
      expect(quote).toHaveProperty('totalFare');
      expect(quote).toHaveProperty('currency', 'ETB');
      expect(quote).toHaveProperty('distanceMeters');
      expect(quote).toHaveProperty('durationSeconds');
    });

    it('enforces minimum fare', async () => {
      // Very short trip — should still return minFare
      const quote = await service.getQuote({
        vehicleType: 'TAXI',
        pickup: { lat: 9.0195, lng: 38.7525 },
        dropoff: { lat: 9.0196, lng: 38.7526 },
        city: 'Addis Ababa',
        country: 'ETHIOPIA',
      });
      expect(quote.totalFare).toBeGreaterThanOrEqual(50);
    });

    it('scales with distance', async () => {
      const shortTrip = await service.getQuote({
        vehicleType: 'TAXI',
        pickup: { lat: 9.0195, lng: 38.7525 },
        dropoff: { lat: 9.0200, lng: 38.7530 },
        city: 'Addis Ababa',
        country: 'ETHIOPIA',
      });
      const longTrip = await service.getQuote({
        vehicleType: 'TAXI',
        pickup: { lat: 9.0195, lng: 38.7525 },
        dropoff: { lat: 8.9779, lng: 38.7993 }, // ~6km
        city: 'Addis Ababa',
        country: 'ETHIOPIA',
      });
      expect(longTrip.totalFare).toBeGreaterThan(shortTrip.totalFare);
      expect(longTrip.distanceMeters).toBeGreaterThan(shortTrip.distanceMeters);
    });

    it('applies percentage promo codes', async () => {
      prismaMock.promoCode.findUnique.mockResolvedValueOnce({
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 10,
        currency: 'ETB',
        isActive: true,
        startsAt: new Date(Date.now() - 86400_000),
        endsAt: new Date(Date.now() + 86400_000),
        minTripFare: null,
        maxRedemptions: null,
        perUserLimit: 1,
      });
      const quote = await service.getQuote({
        vehicleType: 'TAXI',
        pickup: { lat: 9.0195, lng: 38.7525 },
        dropoff: { lat: 8.9779, lng: 38.7993 },
        city: 'Addis Ababa',
        country: 'ETHIOPIA',
        promoCode: 'WELCOME10',
      });
      expect(quote.promoDiscount).toBeGreaterThan(0);
    });

    it('applies fixed amount promo codes capped at subtotal', async () => {
      prismaMock.promoCode.findUnique.mockResolvedValueOnce({
        code: 'FLAT50',
        type: 'FIXED_AMOUNT',
        value: 50,
        currency: 'ETB',
        isActive: true,
        startsAt: new Date(Date.now() - 86400_000),
        endsAt: new Date(Date.now() + 86400_000),
        minTripFare: null,
        maxRedemptions: null,
        perUserLimit: 1,
      });
      const quote = await service.getQuote({
        vehicleType: 'TAXI',
        pickup: { lat: 9.0195, lng: 38.7525 },
        dropoff: { lat: 8.9779, lng: 38.7993 },
        city: 'Addis Ababa',
        country: 'ETHIOPIA',
        promoCode: 'FLAT50',
      });
      expect(quote.promoDiscount).toBe(50);
    });

    it('computes 15% VAT on the taxable base', async () => {
      const quote = await service.getQuote({
        vehicleType: 'TAXI',
        pickup: { lat: 9.0195, lng: 38.7525 },
        dropoff: { lat: 8.9779, lng: 38.7993 },
        city: 'Addis Ababa',
        country: 'ETHIOPIA',
      });
      const taxableBase = quote.baseFare + quote.distanceFare + quote.timeFare - quote.promoDiscount;
      const expectedTax = Math.round(taxableBase * 0.15 * 100) / 100;
      expect(quote.taxAmount).toBeCloseTo(expectedTax, 2);
    });

    it('throws if no pricing tier is found for the city/vehicle', async () => {
      prismaMock.pricingTier.findFirst.mockResolvedValueOnce(null);
      await expect(
        service.getQuote({
          vehicleType: 'TAXI',
          pickup: { lat: 0, lng: 0 },
          dropoff: { lat: 0, lng: 0 },
          city: 'Mars',
          country: 'OTHER',
        }),
      ).rejects.toThrow(/No pricing tier/);
    });
  });
});
