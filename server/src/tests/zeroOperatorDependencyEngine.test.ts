import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { computeMarketRadar, isAddisPeakHour } from '../services/marketRadarService.js';
import { CommunityHazardService } from '../services/communityHazardService.js';
import { rankAndRecommendOffers } from '../../../shared/tripOptimizer.js';
import { db } from '../db/database.js';

describe('Zero-Operator-Dependency Autonomous Engine Tests', () => {
  beforeAll(() => {
    // Seed test users/drivers if necessary
    db.prepare(`
      INSERT OR IGNORE INTO users (id, phone, name, role)
      VALUES ('user_autonomous_test', '+251911999888', 'Autonomous Tester', 'rider')
    `).run();
  });

  describe('1. Algorithmic Market Radar (Zero Third-Party API Dependency)', () => {
    it('should compute market comparisons across Chebelew, Feres, RIDE, Yango, and Street Meter', () => {
      const distanceKm = 8.5;
      const durationMinutes = 22;

      const radar = computeMarketRadar(distanceKm, durationMinutes);

      expect(radar).toBeDefined();
      expect(radar.distanceKm).toBe(8.5);
      expect(radar.durationMinutes).toBe(22);
      expect(radar.comparisons.length).toBe(5);

      const chebelew = radar.comparisons.find((c) => c.operatorId === 'chebelew')!;
      const feres = radar.comparisons.find((c) => c.operatorId === 'feres')!;
      const ride = radar.comparisons.find((c) => c.operatorId === 'ride')!;
      const yango = radar.comparisons.find((c) => c.operatorId === 'yango')!;

      expect(chebelew.commissionRatePercent).toBe(0);
      expect(chebelew.commissionCutEtb).toBe(0);
      expect(feres.commissionRatePercent).toBe(15);
      expect(ride.commissionRatePercent).toBe(18);

      // Chebelew should deliver significant savings vs Feres & RIDE
      expect(chebelew.estimatedFareEtb).toBeLessThan(feres.estimatedFareEtb);
      expect(chebelew.estimatedFareEtb).toBeLessThan(ride.estimatedFareEtb);
      expect(radar.maxSavingsEtb).toBeGreaterThan(0);
    });

    it('should correctly determine Addis Ababa peak hours', () => {
      // 08:00 AM EAT is peak
      const morningDate = new Date('2026-11-16T05:00:00Z'); // 05:00 UTC = 08:00 EAT
      expect(isAddisPeakHour(morningDate)).toBe(true);

      // 02:00 PM EAT is non-peak
      const midDayDate = new Date('2026-11-16T11:00:00Z'); // 11:00 UTC = 14:00 EAT
      expect(isAddisPeakHour(midDayDate)).toBe(false);

      // 18:30 EAT is peak
      const eveningDate = new Date('2026-11-16T15:30:00Z'); // 15:30 UTC = 18:30 EAT
      expect(isAddisPeakHour(eveningDate)).toBe(true);
    });

    it('should serve market radar over POST /api/rides/market-radar', async () => {
      const res = await request(app)
        .post('/api/rides/market-radar')
        .send({
          distanceKm: 6.2,
          durationMinutes: 18,
        });

      expect(res.status).toBe(200);
      expect(res.body.chebelewFareEtb).toBeGreaterThan(0);
      expect(res.body.comparisons.length).toBe(5);
    });
  });

  describe('2. Addis Driver Community Hazard Radar ("ደራሽ / Derash")', () => {
    it('should retrieve active community hazards without municipal dependencies', async () => {
      const hazards = CommunityHazardService.getActiveHazards();
      expect(hazards.length).toBeGreaterThan(0);
      const hotspot = hazards.find((h) => h.location.address.includes('Mexico'));
      expect(hotspot).toBeDefined();
      expect(hotspot?.type).toBe('traffic_jam');
    });

    it('should report a new driver road hazard and allow upvoting', async () => {
      const res = await request(app)
        .post('/api/drivers/community-hazards')
        .send({
          type: 'police_checkpoint',
          driverId: 'driver_ahmed_01',
          driverName: 'Ahmed Mohammed',
          address: 'Bole Atlas / Edna Mall intersection',
          lat: 8.998,
          lng: 38.784,
          description: 'Document check active in inner lane',
          severity: 'moderate',
        });

      expect(res.status).toBe(201);
      expect(res.body.hazard).toBeDefined();
      expect(res.body.hazard.type).toBe('police_checkpoint');

      const hazardId = res.body.hazard.id;

      // Upvote
      const upvoteRes = await request(app)
        .post(`/api/drivers/community-hazards/${hazardId}/upvote`);

      expect(upvoteRes.status).toBe(200);
      expect(upvoteRes.body.hazard.upvotesCount).toBe(2);
    });
  });

  describe('3. Android On-Device Co-Pilot AI Valuation & In-Flight Lock', () => {
    it('should accurately score and recommend the highest net value offer for drivers', () => {
      const driverLoc = { lat: 9.0105, lng: 38.7615 }; // Kazanchis

      const mockOffers: any[] = [
        {
          id: 'offer_chebelew_01',
          providerId: 'chebelew',
          pickup: { address: 'UNECA Kazanchis', lat: 9.011, lng: 38.762 },
          destination: { address: 'Bole Medhanialem', lat: 8.995, lng: 38.788 },
          distanceKm: 4.8,
          durationMinutes: 14,
          fare: { totalFare: 240, driverNetPayout: 240, platformCommission: 0 },
        },
        {
          id: 'offer_feres_02',
          providerId: 'feres',
          pickup: { address: 'Piassa Churchill Rd', lat: 9.030, lng: 38.750 },
          destination: { address: 'Bole Medhanialem', lat: 8.995, lng: 38.788 },
          distanceKm: 7.2,
          durationMinutes: 28,
          fare: { totalFare: 290, driverNetPayout: 246.5, platformCommission: 43.5 },
        },
      ];

      const ranked = rankAndRecommendOffers(mockOffers, driverLoc);
      expect(ranked.length).toBe(2);

      // Chebelew should be AI recommended due to shorter pickup, 0% commission, and higher hourly take-home
      const topOffer = ranked[0];
      expect(topOffer.valueMetrics.isAiRecommended).toBe(true);
      expect(topOffer.providerId).toBe('chebelew');
      expect(topOffer.valueMetrics.netTakeHomeEtb).toBe(220);
    });
  });
});
