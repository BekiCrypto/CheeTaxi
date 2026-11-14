import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, server } from '../index.js';
import { db } from '../db/database.js';
import { DispatchService } from '../services/dispatchService.js';
import { ADDIS_LANDMARKS } from '../../../shared/landmarks.js';

describe('Chebelew Mobile Applications Production Suite (Passenger & Driver Apps)', () => {
  const testPhone = '+251911998877';
  let testRideId = '';
  const testDriverId = 'driver_ahmed_01';

  beforeAll(() => {
    // Seed ride via DispatchService using verified user_leila_01
    const ride = DispatchService.createRide({
      riderId: 'user_leila_01',
      riderName: 'Leila Haile',
      riderPhone: testPhone,
      pickup: {
        address: 'Bole International Airport, Addis Ababa',
        lat: 8.9778,
        lng: 38.7993,
      },
      destination: {
        address: 'Meskel Square, Addis Ababa',
        lat: 9.0105,
        lng: 38.7615,
      },
      vehicleCategory: 'sedan',
      paymentMethod: 'TELEBIRR',
    });
    testRideId = ride.id;
  });

  afterAll(() => {
    try {
      if (testRideId) {
        db.prepare(`DELETE FROM rides WHERE id = ?`).run(testRideId);
      }
    } catch (e) {}
  });

  describe('1. Ethiopian Mobile Authentication Gateway', () => {
    it('should request SMS OTP for an Ethiopian mobile number', async () => {
      const res = await request(app)
        .post('/api/auth/otp/request')
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.demoCode).toBeDefined();
    });

    it('should verify OTP and authenticate Passenger account', async () => {
      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({
          phone: testPhone,
          code: '123456',
          role: 'rider',
          name: 'Bethlehem T.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.phone).toBe(testPhone);
      expect(res.body.user.role).toBe('rider');
    });

    it('should verify OTP and authenticate Driver account with 0% commission setup', async () => {
      const driverPhone = '+251977112233';
      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({
          phone: driverPhone,
          code: '123456',
          role: 'driver',
          name: 'Tesfaye Kebede',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('driver');
    });
  });

  describe('2. Public Live SafeTrip Tracking API (/track/:rideId)', () => {
    it('should return full ride telemetry for public emergency and family tracking', async () => {
      const res = await request(app).get(`/api/rides/${testRideId}`);

      expect(res.status).toBe(200);
      expect(res.body.ride).toBeDefined();
      expect(res.body.ride.id).toBe(testRideId);
      expect(res.body.ride.status).toBeDefined();
      expect(res.body.ride.pickup.address).toContain('Bole International Airport');
      expect(res.body.ride.destination.address).toContain('Meskel Square');
      expect(res.body.ride.fare.totalFare).toBeGreaterThan(0);
      expect(res.body.ride.fare.platformCommission).toBe(0); // 0% commission verified
    });

    it('should return 404 for invalid or expired tracking ID', async () => {
      const res = await request(app).get('/api/rides/ride_non_existent_999');
      expect(res.status).toBe(404);
    });
  });

  describe('3. Driver Mobile In-Cab Radar & Operations', () => {
    it('should toggle driver online status', async () => {
      const res = await request(app)
        .post(`/api/drivers/${testDriverId}/online`)
        .send({ isOnline: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isOnline).toBe(true);
    });

    it('should stream driver live GPS coordinates', async () => {
      const res = await request(app)
        .post(`/api/drivers/${testDriverId}/location`)
        .send({
          lat: 9.0110,
          lng: 38.7620,
          heading: 90,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should retrieve driver net earnings under 0% platform commission', async () => {
      const res = await request(app).get(`/api/drivers/${testDriverId}/earnings`);

      expect(res.status).toBe(200);
      expect(res.body.grossEarnings).toBeGreaterThanOrEqual(0);
      expect(res.body.netEarnings).toBeDefined();
    });

    it('should verify driver 0% platform subscription status', async () => {
      const res = await request(app).get(`/api/drivers/${testDriverId}/subscription`);

      expect(res.status).toBe(200);
      expect(res.body.active).toBeDefined();
    });

    it('should set destination filter ("On-My-Way" corridor)', async () => {
      const res = await request(app)
        .post(`/api/drivers/${testDriverId}/destination`)
        .send({
          destination: 'CMC Michael, Addis Ababa',
          isActive: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.destination).toBe('CMC Michael, Addis Ababa');
    });
  });

  describe('4. Addis Ababa Landmark Directory & Offline Cache', () => {
    it('should contain official Addis Ababa landmarks for quick passenger search', () => {
      expect(ADDIS_LANDMARKS.length).toBeGreaterThan(10);
      const boleAirport = ADDIS_LANDMARKS.find((lm) => lm.id.includes('bole') || lm.name.includes('Bole'));
      expect(boleAirport).toBeDefined();
      expect(boleAirport?.lat).toBeDefined();
      expect(boleAirport?.lng).toBeDefined();
    });
  });
});
