import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { db } from '../db/database.js';
import { DispatchService } from '../services/dispatchService.js';

describe('Passenger & Driver App End-to-End Connectivity & Dispatch Lifecycle Suite', () => {
  const passengerUserId = 'user_test_e2e_passenger';
  const driverId = 'driver_test_e2e_driver';
  const driverUserId = 'user_test_e2e_driver';
  const passengerPhone = '+251911998877';
  const driverPhone = '+251922338877';
  let createdRideId = '';

  beforeAll(() => {
    const now = new Date().toISOString();

    // Clean up if existing by ID or phone
    db.prepare('DELETE FROM rides WHERE rider_id = ? OR driver_id = ?').run(passengerUserId, driverId);
    db.prepare('DELETE FROM drivers WHERE id = ? OR phone = ?').run(driverId, driverPhone);
    db.prepare('DELETE FROM users WHERE id IN (?, ?) OR phone IN (?, ?)').run(passengerUserId, driverUserId, passengerPhone, driverPhone);

    // Create passenger
    db.prepare(`
      INSERT INTO users (id, phone, name, email, role, language, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(passengerUserId, passengerPhone, 'E2E Test Passenger', 'e2e_passenger@chebelew.et', 'rider', 'en', now);

    // Create driver
    db.prepare(`
      INSERT INTO users (id, phone, name, email, role, language, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(driverUserId, driverPhone, 'E2E Test Driver', 'e2e_driver@chebelew.et', 'driver', 'am', now);

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
      driverId, driverUserId, 'E2E Test Driver', '+251922338877', '', 'Toyota', 'Corolla Exec',
      2022, 'ET-3-88776', 'Silver', 'sedan', 'DL-ET-88776',
      'approved', 1, 0, 8.9955, 38.7885, 90,
      4.98, 310, 5000, 'active', now
    );
  });

  afterAll(() => {
    if (createdRideId) {
      db.prepare('DELETE FROM rides WHERE id = ?').run(createdRideId);
    }
    db.prepare('DELETE FROM rides WHERE rider_id = ? OR driver_id = ?').run(passengerUserId, driverId);
    db.prepare('DELETE FROM drivers WHERE id = ?').run(driverId);
    db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(passengerUserId, driverUserId);
  });

  describe('1. Ride Request Creation & Matchmaking Broadcast', () => {
    it('should create ride in REQUESTED state with null driver when autoAssign is false', async () => {
      const res = await request(app)
        .post('/api/rides')
        .send({
          riderId: passengerUserId,
          riderName: 'E2E Test Passenger',
          riderPhone: '+251911998877',
          pickup: {
            address: 'Bole Medhanialem Mall, Addis Ababa',
            lat: 8.9950,
            lng: 38.7880,
          },
          destination: {
            address: 'Meskel Square, Addis Ababa',
            lat: 9.0105,
            lng: 38.7615,
          },
          vehicleCategory: 'sedan',
          paymentMethod: 'TELEBIRR',
          autoAssign: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.ride).toBeDefined();

      const ride = res.body.ride;
      createdRideId = ride.id;

      expect(ride.status).toBe('REQUESTED');
      expect(ride.driverId).toBeUndefined();
      expect(ride.pickup.address).toContain('Bole');
      expect(ride.fare.totalFare).toBeGreaterThan(0);
    });

    it('should find online driver within proximity of the pickup location', () => {
      const candidates = DispatchService.findEligibleDrivers(8.9950, 38.7880, 'sedan', 5.0);
      const matched = candidates.find(c => c.id === driverId);
      expect(matched).toBeDefined();
      expect(matched?.distanceToPickupKm).toBeLessThan(1.0);
    });
  });

  describe('2. Driver Acceptance & In-Flight Lock Activation', () => {
    it('should allow online driver to accept the ride and transition to ASSIGNED', async () => {
      const res = await request(app)
        .post(`/api/rides/${createdRideId}/accept`)
        .send({ driverId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ride.status).toBe('ASSIGNED');
      expect(res.body.ride.driverId).toBe(driverId);
      expect(res.body.ride.driver).toBeDefined();
      expect(res.body.ride.driver.fullName).toBe('E2E Test Driver');

      // Verify in-flight active trip lock in DB
      const driverInDb = db.prepare('SELECT is_busy, active_ride_id FROM drivers WHERE id = ?').get(driverId) as any;
      expect(driverInDb.is_busy).toBe(1);
      expect(driverInDb.active_ride_id).toBe(createdRideId);
    });

    it('should block another ride from being assigned to the busy driver', () => {
      const candidates = DispatchService.findEligibleDrivers(8.9950, 38.7880, 'sedan', 10.0);
      const busyCheck = candidates.find(c => c.id === driverId);
      expect(busyCheck).toBeUndefined(); // In-Flight Lock active: must be excluded
    });
  });

  describe('3. Active Trip Lifecycle & REST Redundancy', () => {
    it('should retrieve active in-flight trip for session restore', async () => {
      const res = await request(app).get(`/api/rides/active/${passengerUserId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ride).toBeDefined();
      expect(res.body.ride.id).toBe(createdRideId);
      expect(res.body.ride.status).toBe('ASSIGNED');
    });

    it('should transition status to ARRIVED via REST /arrive', async () => {
      const res = await request(app).post(`/api/rides/${createdRideId}/arrive`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ride.status).toBe('ARRIVED');
    });

    it('should transition status to IN_PROGRESS via REST /start', async () => {
      const res = await request(app).post(`/api/rides/${createdRideId}/start`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ride.status).toBe('IN_PROGRESS');
    });

    it('should complete trip via REST /complete, reconcile cash, and release in-flight lock', async () => {
      const res = await request(app).post(`/api/rides/${createdRideId}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ride.status).toBe('COMPLETED');

      // Verify driver in-flight lock released in database
      const releasedDriver = db.prepare('SELECT is_busy, active_ride_id FROM drivers WHERE id = ?').get(driverId) as any;
      expect(releasedDriver.is_busy).toBe(0);
      expect(releasedDriver.active_ride_id).toBeNull();
    });

    it('should verify active trip returns null after completion', async () => {
      const res = await request(app).get(`/api/rides/active/${passengerUserId}`);
      expect(res.status).toBe(200);
      expect(res.body.ride).toBeNull();
    });

    it('should log emergency SOS incident and return rapid emergency contacts', async () => {
      const res = await request(app).post('/api/safety/sos').send({
        rideId: createdRideId,
        reporterUserId: passengerUserId,
        reporterName: 'E2E Test Passenger',
        reporterPhone: '+251911998877',
        reporterRole: 'rider',
        currentLat: 8.9950,
        currentLng: 38.7880,
        safetyNotes: 'Test Emergency SOS from Passenger',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.incident).toBeDefined();
      expect(res.body.incident.reporterUserId).toBe(passengerUserId);
      expect(res.body.emergencyContacts.police).toBe('991');
      expect(res.body.emergencyContacts.chebelewHotline).toBe('9922');
    });
  });
});
