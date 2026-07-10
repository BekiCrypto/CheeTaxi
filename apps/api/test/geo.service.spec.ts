import { encodeGeohash, GeoService } from '../src/geo/geo.service';
import { PrismaService } from '../src/common/prisma.service';

describe('GeoService', () => {
  let service: GeoService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {};
    service = new GeoService(prismaMock as PrismaService);
  });

  describe('haversineMeters', () => {
    it('returns 0 for identical points', () => {
      const d = service.haversineMeters(
        { lat: 9.0195, lng: 38.7525 },
        { lat: 9.0195, lng: 38.7525 },
      );
      expect(d).toBe(0);
    });

    it('computes distance between Bole Airport and Meskel Square correctly', () => {
      const d = service.haversineMeters(
        { lat: 8.9779, lng: 38.7993 }, // Bole Airport
        { lat: 9.0112, lng: 38.7623 }, // Meskel Square
      );
      // Real-world distance is ~5-6 km
      expect(d).toBeGreaterThan(4000);
      expect(d).toBeLessThan(8000);
    });

    it('computes long-distance correctly (Addis to Nairobi)', () => {
      const d = service.haversineMeters(
        { lat: 9.0195, lng: 38.7525 }, // Addis
        { lat: -1.2864, lng: 36.8172 }, // Nairobi
      );
      // ~1200 km
      expect(d).toBeGreaterThan(1_000_000);
      expect(d).toBeLessThan(1_500_000);
    });
  });

  describe('etaSeconds', () => {
    it('returns 0 for zero distance', () => {
      expect(service.etaSeconds(0)).toBe(0);
    });

    it('estimates ~6 minutes for 2.5 km at 25 km/h', () => {
      const eta = service.etaSeconds(2500);
      // 2.5 km / 25 km/h = 0.1 h = 6 min = 360 s
      expect(eta).toBeGreaterThanOrEqual(300);
      expect(eta).toBeLessThanOrEqual(420);
    });
  });

  describe('geohash', () => {
    it('produces stable geohash for Addis Ababa', () => {
      const hash = service.geohash(9.0195, 38.7525, 7);
      expect(hash).toHaveLength(7);
      expect(hash).toMatch(/^[0-9bcdefghjkmnpqrstuvwxyz]+$/);
    });

    it('produces longer geohashes for higher precision', () => {
      const short = service.geohash(9.0195, 38.7525, 5);
      const long = service.geohash(9.0195, 38.7525, 9);
      expect(long.startsWith(short)).toBe(true);
    });

    it('produces different geohashes for distant points', () => {
      const addis = service.geohash(9.0195, 38.7525, 4);
      const nairobi = service.geohash(-1.2864, 36.8172, 4);
      expect(addis).not.toBe(nairobi);
    });
  });

  describe('encodeGeohash (exported helper)', () => {
    it('matches the service method output', () => {
      const direct = encodeGeohash(9.0195, 38.7525, 7);
      const viaService = service.geohash(9.0195, 38.7525, 7);
      expect(direct).toBe(viaService);
    });
  });
});
