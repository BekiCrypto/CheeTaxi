import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { db } from '../db/database.js';
import { DispatchService } from '../services/dispatchService.js';
import { rankAndRecommendOffers, evaluateTripValue, calculateDistanceKm, estimateCorridorTraffic } from '../../../shared/tripOptimizer.js';
import { Ride } from '../../../shared/types.js';

describe('Multi-Provider Simultaneous Offer Comparison & In-Flight Cab Lock Suite', () => {
  const driverId = 'driver_multiprovider_test_99';
  const userId = 'user_multiprovider_test_99';
  let createdRideId = '';

  beforeAll(() => {
    const now = new Date().toISOString();
    // Clean up if existing
    db.prepare(`DELETE FROM rides WHERE driver_id = ?`).run(driverId);
    db.prepare(`DELETE FROM drivers WHERE id = ?`).run(driverId);
    db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);

    // Create isolated user and driver
    db.prepare(`
      INSERT INTO users (id, phone, name, email, role, language, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, '+251999888777', 'Test MultiOffer Driver', 'test_multioffer@chebelew.et', 'driver', 'am', now);

    db.prepare(`
      INSERT INTO drivers (
        id, user_id, full_name, phone, avatar_url, vehicle_make, vehicle_model,
        vehicle_year, vehicle_plate, vehicle_color, vehicle_category, license_number,
        kyc_status, is_online, is_busy, current_lat, current_lng, heading,
        rating, total_rides, wallet_balance_etb, subscription_status, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `).run(
      driverId, userId, 'Test MultiOffer Driver', '+251999888777', '', 'Toyota', 'Corolla',
      2020, 'ET-3-99999', 'White', 'sedan', 'DL-ET-99999',
      'approved', 1, 0, 9.0105, 38.7615, 90,
      4.95, 120, 1500, 'active', now
    );
  });

  afterAll(() => {
    // Clean up test rides, driver, and user
    if (createdRideId) {
      db.prepare(`DELETE FROM rides WHERE id = ?`).run(createdRideId);
    }
    db.prepare(`DELETE FROM rides WHERE driver_id = ?`).run(driverId);
    db.prepare(`DELETE FROM drivers WHERE id = ?`).run(driverId);
    db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
  });

  describe('1. AI-Powered Trip Value Optimizer & Scoring Engine', () => {
    it('should accurately calculate distance and corridor traffic index in Addis Ababa', () => {
      const dist = calculateDistanceKm(8.995, 38.788, 9.0105, 38.7615);
      expect(dist).toBeGreaterThan(3.0);
      expect(dist).toBeLessThan(7.0);

      const expressTraffic = estimateCorridorTraffic(
        { address: 'Bole Airport Departure Terminal', lat: 8.9778, lng: 38.7993 },
        { address: 'Bole Medhanialem Mall', lat: 8.995, lng: 38.788 }
      );
      expect(expressTraffic.index).toBeLessThanOrEqual(1.15);
      expect(expressTraffic.description).toContain('Express');

      const denseTraffic = estimateCorridorTraffic(
        { address: 'Mercato Autobus Tera', lat: 9.035, lng: 38.735 },
        { address: 'Piassa Churchill Avenue', lat: 9.032, lng: 38.751 }
      );
      expect(denseTraffic.index).toBeGreaterThanOrEqual(1.5);
      expect(denseTraffic.description).toContain('Heavy Congestion');
    });

    it('should score and rank multiple simultaneous offers from Chebelew, Yango, and RIDE', () => {
      const mockOffers: Ride[] = [
        {
          id: 'offer_cheb_test',
          riderId: 'rider_01',
          riderName: 'Leila Haile',
          riderPhone: '+251911223344',
          pickup: { address: 'Bole Medhanialem Mall', lat: 8.995, lng: 38.788 },
          destination: { address: 'Meskel Square', lat: 9.0105, lng: 38.7615 },
          vehicleCategory: 'sedan',
          distanceKm: 4.8,
          durationMinutes: 14,
          fare: { totalFare: 380, driverNetPayout: 380, platformCommission: 0, vatAmount: 49.56 } as any,
          paymentMethod: 'TELEBIRR',
          status: 'REQUESTED',
          providerId: 'chebelew',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'offer_yango_test',
          riderId: 'rider_02',
          riderName: 'Dawit B.',
          riderPhone: '+251922334455',
          pickup: { address: 'Edna Mall Cinema', lat: 8.998, lng: 38.786 },
          destination: { address: 'Kazanchis Commercial Hub', lat: 9.0185, lng: 38.7705 },
          vehicleCategory: 'sedan',
          distanceKm: 5.2,
          durationMinutes: 18,
          fare: { totalFare: 420, driverNetPayout: 369.6, platformCommission: 50.4, vatAmount: 54.78 } as any,
          paymentMethod: 'CASH',
          status: 'REQUESTED',
          providerId: 'yango',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'offer_ride_test',
          riderId: 'rider_03',
          riderName: 'Selamawit T.',
          riderPhone: '+251933445566',
          pickup: { address: 'Atlas Hotel', lat: 9.006, lng: 38.782 },
          destination: { address: 'Piassa Churchill Avenue', lat: 9.032, lng: 38.751 },
          vehicleCategory: 'sedan',
          distanceKm: 6.9,
          durationMinutes: 26,
          fare: { totalFare: 490, driverNetPayout: 416.5, platformCommission: 73.5, vatAmount: 63.91 } as any,
          paymentMethod: 'TELEBIRR',
          status: 'REQUESTED',
          providerId: 'ride',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const ranked = rankAndRecommendOffers(mockOffers, { lat: 9.0105, lng: 38.7615 });

      expect(ranked).toHaveLength(3);
      // Top offer must be flagged with isAiRecommended = true
      expect(ranked[0].valueMetrics.isAiRecommended).toBe(true);
      expect(ranked[0].valueMetrics.compositeScore).toBeGreaterThanOrEqual(ranked[1].valueMetrics.compositeScore);
      expect(ranked[0].valueMetrics.effectiveHourlyRateEtb).toBeGreaterThan(0);
      expect(ranked[0].valueMetrics.recommendationTag).toContain('TOP VALUE');
      // Comparative advantage must be calculated
      expect(ranked[0].valueMetrics.profitAdvantagePercent).toBeDefined();
    });
  });

  describe('2. Multi-Provider Concurrent Offer Simulation API', () => {
    it('should generate simultaneous multi-provider offers when driver is idle and online', async () => {
      const res = await request(app)
        .post(`/api/drivers/${driverId}/simulate-multi-offers`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.offersCount).toBe(3);
      expect(res.body.offers).toBeInstanceOf(Array);
      expect(res.body.offers[0].providerId).toBe('chebelew');
      expect(res.body.offers[1].providerId).toBe('yango');
      expect(res.body.offers[2].providerId).toBe('ride');
    });

    it('should block incoming dispatch offers when driver is engaged on an active trip (409 Conflict)', async () => {
      // Engage driver on active trip
      db.prepare(`UPDATE drivers SET is_busy = 1, active_ride_id = 'ride_active_in_flight' WHERE id = ?`).run(driverId);

      const res = await request(app)
        .post(`/api/drivers/${driverId}/simulate-multi-offers`)
        .send();

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('DRIVER_ACTIVE_TRIP_LOCKED');
      expect(res.body.isBusy).toBe(true);

      // Release driver
      db.prepare(`UPDATE drivers SET is_busy = 0, active_ride_id = NULL WHERE id = ?`).run(driverId);
    });
  });

  describe('3. Real-Time Provider Fleet Availability Endpoint', () => {
    it('should return available non-busy cabs for partner aggregator routing', async () => {
      const res = await request(app)
        .get('/api/providers/availability?lat=9.0105&lng=38.7615&radius=10')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.activeProtectionStatus).toBe('BLOCK_BUSY_DRIVERS_ACTIVE');
      expect(res.body.availableCabsCount).toBeGreaterThan(0);

      // Verify that every returned cab is not busy and has no active trip
      for (const cab of res.body.cabs) {
        expect(cab.isBusy).toBe(false);
        expect(cab.activeRideId).toBeNull();
      }
    });

    it('should strictly exclude busy driver from provider availability when on an active trip', async () => {
      // Mark driver as busy
      db.prepare(`UPDATE drivers SET is_busy = 1, active_ride_id = 'ride_in_transit_01' WHERE id = ?`).run(driverId);

      const res = await request(app)
        .get('/api/providers/availability?lat=9.0105&lng=38.7615&radius=10')
        .send();

      expect(res.status).toBe(200);
      const busyCab = res.body.cabs.find((c: any) => c.driverId === driverId);
      expect(busyCab).toBeUndefined(); // Must NOT be in available cabs list

      // Reset driver
      db.prepare(`UPDATE drivers SET is_busy = 0, active_ride_id = NULL WHERE id = ?`).run(driverId);
    });
  });

  describe('4. In-Flight Active Trip Locking in Dispatch Service', () => {
    it('should exclude busy driver from candidate matching pool', () => {
      // Mark driver busy
      db.prepare(`UPDATE drivers SET is_busy = 1, active_ride_id = 'ride_in_progress' WHERE id = ?`).run(driverId);

      const candidates = DispatchService.findEligibleDrivers(9.0105, 38.7615, 'sedan', 10);
      const found = candidates.find(c => c.id === driverId);
      expect(found).toBeUndefined();

      // Release driver
      db.prepare(`UPDATE drivers SET is_busy = 0, active_ride_id = NULL WHERE id = ?`).run(driverId);
      const idleCandidates = DispatchService.findEligibleDrivers(9.0105, 38.7615, 'sedan', 10);
      const idleFound = idleCandidates.find(c => c.id === driverId);
      expect(idleFound).toBeDefined();
    });

    it('should prevent direct manual assignment to an active cab and leave ride in REQUESTED state', () => {
      // Engage driver on active trip
      db.prepare(`UPDATE drivers SET is_busy = 1, active_ride_id = 'ride_active_engagement' WHERE id = ?`).run(driverId);

      const ride = DispatchService.createRide({
        riderId: 'user_leila_01',
        riderName: 'Leila Haile',
        riderPhone: '+251911223344',
        pickup: { address: 'Bole Medhanialem Mall', lat: 8.995, lng: 38.788 },
        destination: { address: 'Meskel Square', lat: 9.0105, lng: 38.7615 },
        vehicleCategory: 'sedan',
        paymentMethod: 'TELEBIRR',
        driverId, // Try to force direct assignment to busy cab
      });

      createdRideId = ride.id;
      // Because driver was busy, assignment must be blocked and set to REQUESTED
      expect(ride.status).toBe('REQUESTED');
      expect(ride.driverId).toBeUndefined();

      // Clean up
      db.prepare(`UPDATE drivers SET is_busy = 0, active_ride_id = NULL WHERE id = ?`).run(driverId);
    });
  });
});
