import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { initDatabase, db } from '../db/database.js';

describe('Chebelew REST API Endpoints & Operational Flows', () => {
  beforeAll(() => {
    initDatabase();
  });

  beforeEach(() => {
    db.prepare('UPDATE drivers SET is_busy = 0, is_online = 1, active_ride_id = NULL').run();
  });

  it('GET /api/health should return ok with Addis Ababa timezone', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.addisTimezone).toBe('Africa/Addis_Ababa');
  });

  it('GET /api/auth/users should return seed users for quick switching', async () => {
    const res = await request(app).get('/api/auth/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThanOrEqual(4);
  });

  it('POST /api/auth/otp/request and /verify should simulate SMS OTP login', async () => {
    const reqRes = await request(app)
      .post('/api/auth/otp/request')
      .send({ phone: '+251911998877' });
    expect(reqRes.status).toBe(200);
    expect(reqRes.body.success).toBe(true);
    expect(reqRes.body.demoCode).toBeDefined();

    const verifyRes = await request(app)
      .post('/api/auth/otp/verify')
      .send({ phone: '+251911998877', code: reqRes.body.demoCode, name: 'Abebe Bikila' });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.user.phone).toBe('+251911998877');
  });

  it('POST /api/rides/estimate should return estimates and aggregator comparisons', async () => {
    const res = await request(app)
      .post('/api/rides/estimate')
      .send({
        pickup: { lat: 8.9950, lng: 38.7880 }, // Bole Medhanialem
        destination: { lat: 9.0105, lng: 38.7615 }, // Meskel Square
      });

    expect(res.status).toBe(200);
    expect(res.body.distanceKm).toBeGreaterThan(0);
    expect(res.body.estimates.length).toBeGreaterThanOrEqual(4);
  });

  it('GET /api/drivers and POST status toggle', async () => {
    const listRes = await request(app).get('/api/drivers');
    expect(listRes.status).toBe(200);
    expect(listRes.body.drivers.length).toBeGreaterThan(0);

    const driverId = listRes.body.drivers[0].id;
    const toggleRes = await request(app)
      .post(`/api/drivers/${driverId}/status`)
      .send({ isOnline: true });
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.isOnline).toBe(true);
  });

  it('POST /api/admin/manual-dispatch should create call-in phone ride', async () => {
    const res = await request(app)
      .post('/api/admin/manual-dispatch')
      .send({
        callerPhone: '+251922334455',
        callerName: 'Eleni Gebre',
        pickup: {
          address: 'Meskel Square',
          lat: 9.0105,
          lng: 38.7615,
        },
        destination: {
          address: 'Bole Airport',
          lat: 8.9778,
          lng: 38.7993,
        },
        vehicleCategory: 'sedan',
      });

    expect(res.status).toBe(201);
    expect(res.body.ride.isManualDispatch).toBe(true);
    expect(res.body.ride.riderPhone).toBe('+251922334455');
  });

  it('GET /api/admin/vat-report should report Regulation No. 570/2025 compliance ledger', async () => {
    const res = await request(app).get('/api/admin/vat-report');
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.vatRegulationReference).toContain('Regulation No. 570/2025');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /api/geo/places and /reverse should return Addis Ababa landmarks', async () => {
    const placesRes = await request(app).get('/api/geo/places?q=Bole');
    expect(placesRes.status).toBe(200);
    expect(placesRes.body.places.length).toBeGreaterThan(0);

    const reverseRes = await request(app).get('/api/geo/reverse?lat=8.9778&lng=38.7993');
    expect(reverseRes.status).toBe(200);
    expect(reverseRes.body.location.address).toContain('Bole');
  });

  it('GET and POST /api/admin/tickets should manage customer support and incident resolution', async () => {
    const listRes = await request(app).get('/api/admin/tickets');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.tickets)).toBe(true);

    const createRes = await request(app)
      .post('/api/admin/tickets')
      .send({
        userId: 'user_leila_01',
        userName: 'Leila Haile',
        userPhone: '+251911223344',
        userRole: 'rider',
        category: 'fare_dispute',
        subject: 'Fare meter discrepancy inquiry',
        message: 'Checked route fare vs estimated quote on Bole road.',
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.ticket.id).toBeDefined();

    const resolveRes = await request(app)
      .post(`/api/admin/tickets/${createRes.body.ticket.id}/resolve`)
      .send({ notes: 'Explained distance and time breakdown per VAT Reg 570/2025.' });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.success).toBe(true);
  });

  it('GET /api/admin/tariffs should return rates for Sedan, Minivan, and Comfort', async () => {
    const res = await request(app).get('/api/admin/tariffs');
    expect(res.status).toBe(200);
    expect(res.body.tariffs.sedan).toBeDefined();
    expect(res.body.tariffs.minivan).toBeDefined();
    expect(res.body.tariffs.sedan.baseFare).toBe(70);
  });

  it('Developer API keys: CRUD and OpenAPI spec endpoint', async () => {
    // 1. Fetch OpenAPI spec
    const specRes = await request(app).get('/api/developer/openapi.json');
    expect(specRes.status).toBe(200);
    expect(specRes.body.openapi).toBe('3.0.3');

    // 2. List keys
    const listRes = await request(app).get('/api/developer/keys');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.keys)).toBe(true);

    // 3. Create a key
    const createRes = await request(app)
      .post('/api/developer/keys')
      .send({ name: 'Integration Test Key', environment: 'test' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.key.apiKey).toBeDefined();
    const createdId = createRes.body.key.id;

    // 4. Toggle key active status
    const toggleRes = await request(app).patch(`/api/developer/keys/${createdId}/toggle`);
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.isActive).toBe(false);

    // 5. Revoke/delete key
    const deleteRes = await request(app).delete(`/api/developer/keys/${createdId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});
