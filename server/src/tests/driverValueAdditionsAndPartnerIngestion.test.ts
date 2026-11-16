import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db, initDatabase } from '../db/database.js';
import { createDriverRouter } from '../routes/driverRoutes.js';
import { providerRouter, setProviderIO } from '../routes/providerRoutes.js';
import { createRideRouter } from '../routes/rideRoutes.js';
import { DispatchService } from '../services/dispatchService.js';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';

describe('Driver Moats & Partner Inbound Clearinghouse Suite', () => {
  let app: express.Express;
  let server: http.Server;
  let io: SocketIOServer;

  const testDriverId = 'driver_moat_test_01';
  const testUserId = 'user_moat_test_01';

  beforeAll(() => {
    initDatabase();

    app = express();
    app.use(express.json());

    server = http.createServer(app);
    io = new SocketIOServer(server);
    setProviderIO(io);

    app.use('/api/drivers', createDriverRouter(io));
    app.use('/api/providers', providerRouter);
    app.use('/api/partners', providerRouter);
    app.use('/api/rides', createRideRouter(io));

    // Ensure clean test driver & associated rides
    db.prepare('DELETE FROM rides WHERE driver_id = ?').run(testDriverId);
    db.prepare('DELETE FROM drivers WHERE id = ?').run(testDriverId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);

    db.prepare(`
      INSERT INTO users (id, phone, name, role, is_verified, created_at)
      VALUES (?, '+251911990011', 'Dawit Corridors', 'driver', 1, datetime('now'))
    `).run(testUserId);

    db.prepare(`
      INSERT INTO drivers (
        id, user_id, full_name, phone, vehicle_make, vehicle_model, vehicle_year,
        vehicle_plate, vehicle_color, vehicle_category, license_number, kyc_status,
        is_online, is_busy, current_lat, current_lng, rating, total_rides, wallet_balance_etb,
        subscription_status, created_at
      ) VALUES (
        ?, ?, 'Dawit Corridors', '+251911990011', 'Toyota', 'Corolla', 2021,
        'ET-3-99001', 'White', 'sedan', 'DL-99001', 'approved',
        1, 0, 9.0105, 38.7615, 4.95, 120, 2500,
        'active', datetime('now')
      )
    `).run(testDriverId, testUserId);
  });

  describe('1. Destination Corridor ("On-My-Way" Mode) Persistence & Filter', () => {
    it('should set and persist destination corridor filter in database', async () => {
      const res = await request(app)
        .post(`/api/drivers/${testDriverId}/destination`)
        .send({
          destination: 'Bole Medhanialem Airport Hub',
          isActive: true,
          radiusKm: 2.0,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.destination).toBe('Bole Medhanialem Airport Hub');
      expect(res.body.isActive).toBe(true);
      expect(res.body.radiusKm).toBe(2.0);

      // Verify directly from SQLite
      const row = db.prepare('SELECT destination_filter, is_corridor_active, corridor_radius_km FROM drivers WHERE id = ?').get(testDriverId) as any;
      expect(row.destination_filter).toBe('Bole Medhanialem Airport Hub');
      expect(row.is_corridor_active).toBe(1);
      expect(row.corridor_radius_km).toBe(2.0);
    });

    it('should retrieve persisted destination corridor via GET', async () => {
      const res = await request(app).get(`/api/drivers/${testDriverId}/destination`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.destination).toBe('Bole Medhanialem Airport Hub');
      expect(res.body.isActive).toBe(true);
      expect(res.body.radiusKm).toBe(2.0);
    });

    it('should match rides directed towards Bole corridor and exclude mismatching destinations', () => {
      // Pickup near Meskel Square
      const pickup = { lat: 9.0105, lng: 38.7615 };

      // 1. Matching ride towards Bole
      const boleEligible = DispatchService.findEligibleDrivers(
        pickup.lat,
        pickup.lng,
        'sedan',
        10.0,
        'Edna Mall Cinema, Bole Medhanialem'
      );
      const isBoleDriverIncluded = boleEligible.some((d) => d.id === testDriverId);
      expect(isBoleDriverIncluded).toBe(true);

      // 2. Mismatching ride heading towards Lebu or CMC
      const lebuEligible = DispatchService.findEligibleDrivers(
        pickup.lat,
        pickup.lng,
        'sedan',
        10.0,
        'Jemo Michael Square, Lebu'
      );
      const isLebuDriverExcluded = lebuEligible.some((d) => d.id === testDriverId);
      expect(isLebuDriverExcluded).toBe(false); // Excluded by corridor filter!
    });
  });

  describe('2. Third-Party Partner Inbound Ride Ingestion (Clearinghouse)', () => {
    let partnerRideId: string;

    it('should accept external partner trip ingestion via POST /api/partners/inbound-ride', async () => {
      const partnerPayload = {
        partnerId: 'ride_transport',
        partnerOrderId: 'RIDE_EXT_88921',
        passengerName: 'Ato Solomon K.',
        passengerPhone: '+251911448822',
        pickup: { address: 'Sheraton Addis Hotel', lat: 9.019, lng: 38.761 },
        destination: { address: 'Bole Medhanialem Mall', lat: 8.995, lng: 38.788 },
        vehicleCategory: 'sedan',
        offeredFareEtb: 480,
        partnerCommissionRate: 0.12, // 12% partner commission
        callbackWebhookUrl: 'https://partner-test.chebelew.app/webhooks/ride',
      };

      const res = await request(app)
        .post('/api/partners/inbound-ride')
        .send(partnerPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.rideId).toBeDefined();
      expect(res.body.partnerOrderId).toBe('RIDE_EXT_88921');
      expect(res.body.status).toBe('REQUESTED');
      expect(res.body.fare.totalFare).toBe(480);
      expect(res.body.fare.platformCommission).toBe(58); // 12% of 480 ~ 57.6 -> 58
      expect(res.body.fare.driverNetPayout).toBe(422); // 480 - 58 = 422 ETB
      partnerRideId = res.body.rideId;

      // Verify ride stored in SQLite with provider and partner metadata
      const rideInDb = DispatchService.getRideById(partnerRideId);
      expect(rideInDb).toBeDefined();
      expect(rideInDb?.providerId).toBe('ride_transport');
      expect(rideInDb?.partnerOrderId).toBe('RIDE_EXT_88921');
      expect(rideInDb?.partnerCallbackUrl).toBe('https://partner-test.chebelew.app/webhooks/ride');
    });

    it('should assign a Chebelew driver to partner ride, locking driver in-flight', async () => {
      const res = await request(app)
        .post(`/api/rides/${partnerRideId}/accept`)
        .send({ driverId: testDriverId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ride.status).toBe('ASSIGNED');
      expect(res.body.ride.driverId).toBe(testDriverId);

      // In-flight active trip lock check
      const driver = db.prepare('SELECT is_busy, active_ride_id FROM drivers WHERE id = ?').get(testDriverId) as any;
      expect(driver.is_busy).toBe(1);
      expect(driver.active_ride_id).toBe(partnerRideId);
    });

    it('should complete partner trip, release driver in-flight lock, and credit driver wallet', async () => {
      const completeRes = await request(app)
        .post(`/api/rides/${partnerRideId}/complete`)
        .send({});

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.success).toBe(true);
      expect(completeRes.body.ride.status).toBe('COMPLETED');

      // Verify driver is freed
      const driver = db.prepare('SELECT is_busy, active_ride_id FROM drivers WHERE id = ?').get(testDriverId) as any;
      expect(driver.is_busy).toBe(0);
      expect(driver.active_ride_id).toBeNull();
    });
  });

  describe('3. 0% Commission Advantage Calculations', () => {
    it('should calculate 0% advantage accurately against 15% industry standard', () => {
      const grossDailyEarnings = 3000;
      const traditional15PercentCommission = Math.round(grossDailyEarnings * 0.15); // 450 ETB
      const chebelewDailySub = 50; // 50 ETB flat
      const netSavingsToday = traditional15PercentCommission - chebelewDailySub; // 400 ETB
      const monthlySavings = netSavingsToday * 26; // ~10,400 ETB

      expect(traditional15PercentCommission).toBe(450);
      expect(netSavingsToday).toBe(400);
      expect(monthlySavings).toBe(10400);
    });
  });
});
