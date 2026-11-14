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

  it('PUT /api/admin/tariffs and POST /api/admin/tariffs/reset dynamic tuning', async () => {
    // 1. Update Sedan tariff
    const updateRes = await request(app)
      .put('/api/admin/tariffs')
      .send({
        tariffs: {
          sedan: {
            baseFare: 85,
            perKm: 16,
            minFare: 125,
          },
        },
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.tariffs.sedan.baseFare).toBe(85);
    expect(updateRes.body.tariffs.sedan.perKm).toBe(16);

    // Verify GET reflects the update
    const getRes = await request(app).get('/api/admin/tariffs');
    expect(getRes.body.tariffs.sedan.baseFare).toBe(85);

    // 2. Reset back to defaults
    const resetRes = await request(app).post('/api/admin/tariffs/reset');
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.tariffs.sedan.baseFare).toBe(70);
  });

  it('GET and PUT /api/admin/settings for regulatory, dispatch, and subscription parameters', async () => {
    // 1. GET settings
    const getRes = await request(app).get('/api/admin/settings');
    expect(getRes.status).toBe(200);
    expect(getRes.body.settings).toBeDefined();
    expect(getRes.body.settings.vatRate).toBe(0.15);
    expect(getRes.body.settings.driverCommissionPercent).toBe(0);
    expect(getRes.body.settings.emergencyPoliceHotline).toBe('991');

    // 2. PUT update settings
    const putRes = await request(app)
      .put('/api/admin/settings')
      .send({
        settings: {
          maxDispatchRadiusKm: 8.5,
          driverAcceptanceTimeoutSec: 30,
          customerSupportHotline: '9922',
        },
      });
    expect(putRes.status).toBe(200);
    expect(putRes.body.success).toBe(true);
    expect(putRes.body.settings.maxDispatchRadiusKm).toBe(8.5);
    expect(putRes.body.settings.driverAcceptanceTimeoutSec).toBe(30);
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

  it('Aggregator Provider Orchestration: Config, Circuit Breaker, Health Ping & Dispatch', async () => {
    // 1. Get Provider Statuses & Configs
    const configRes = await request(app).get('/api/providers/config');
    expect(configRes.status).toBe(200);
    expect(Array.isArray(configRes.body.providers)).toBe(true);
    expect(configRes.body.providers.length).toBeGreaterThanOrEqual(4);

    const rideConfig = configRes.body.providers.find((p: any) => p.id === 'ride');
    expect(rideConfig).toBeDefined();
    expect(rideConfig.name).toContain('Meter');

    // 2. Patch Provider Config (markup, timeout, mode)
    const patchRes = await request(app)
      .patch('/api/providers/config/ride')
      .send({
        markupPercent: 9.5,
        timeoutMs: 3800,
        dispatchMode: 'webhook_push',
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.provider.markupPercent).toBe(9.5);
    expect(patchRes.body.provider.timeoutMs).toBe(3800);

    // 3. Test Handshake Ping
    const pingRes = await request(app).post('/api/providers/test-ping/ride');
    expect(pingRes.status).toBe(200);
    expect(pingRes.body.success).toBe(true);
    expect(pingRes.body.latencyMs).toBeGreaterThan(0);
    expect(pingRes.body.httpStatus).toBe(200);

    // 4. Test Live Partner Dispatch Orchestration & Legacy Alias
    const dispatchRes = await request(app)
      .post('/api/providers/dispatch/ride')
      .send({
        pickupAddress: 'Bole Medhanialem',
        destinationAddress: 'Meskel Square',
        vehicleCategory: 'sedan',
        passengerName: 'Abebe Bikila',
        fareEtb: 380.0,
      });
    expect(dispatchRes.status).toBe(200);
    expect(dispatchRes.body.success).toBe(true);
    expect(dispatchRes.body.partnerOrderId).toContain('RIDE-BK-');
    expect(dispatchRes.body.assignedDriver).toBeDefined();

    // 5. Test Circuit Breaker Set State and Reset
    const tripRes = await request(app)
      .post('/api/providers/circuit/set-state')
      .send({ providerId: 'feres', state: 'HALF_OPEN' });
    expect(tripRes.status).toBe(200);

    const resetAllRes = await request(app).post('/api/providers/reset-breaker');
    expect(resetAllRes.status).toBe(200);

    // 6. Test Routing Logs
    const logsRes = await request(app).get('/api/providers/logs?limit=10');
    expect(logsRes.status).toBe(200);
    expect(Array.isArray(logsRes.body.logs)).toBe(true);
    expect(logsRes.body.logs.length).toBeGreaterThan(0);
  });

  it('Admin Security: /api/auth/admin/login and /verify should protect executive console', async () => {
    // 1. Invalid PIN should be rejected
    const badLogin = await request(app)
      .post('/api/auth/admin/login')
      .send({ emailOrPhone: 'dispatch@chebelew.et', passwordOrPin: 'wrongpin' });
    expect(badLogin.status).toBe(401);

    // 2. Valid PIN should authenticate and return session token
    const goodLogin = await request(app)
      .post('/api/auth/admin/login')
      .send({ emailOrPhone: 'dispatch@chebelew.et', passwordOrPin: '9922' });
    expect(goodLogin.status).toBe(200);
    expect(goodLogin.body.success).toBe(true);
    expect(goodLogin.body.token).toBeDefined();
    expect(goodLogin.body.admin).toBeDefined();

    // 3. Verify valid token
    const verifyRes = await request(app)
      .get('/api/auth/admin/verify')
      .set('Authorization', `Bearer ${goodLogin.body.token}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.valid).toBe(true);
    expect(verifyRes.body.admin.role).toBeDefined();

    // 4. Invalid token verification
    const invalidVerify = await request(app)
      .get('/api/auth/admin/verify')
      .set('Authorization', 'Bearer invalid_random_token');
    expect(invalidVerify.status).toBe(401);
    expect(invalidVerify.body.valid).toBe(false);
  });

  it('Driver & Flight Operator Advanced KYC with Admin Override Protection', async () => {
    // 1. Reset a pending driver
    const driverId = 'driver_solomon_05';
    db.prepare("UPDATE drivers SET kyc_status = 'pending', is_online = 0 WHERE id = ?").run(driverId);

    // 2. Unapproved driver should be blocked from going online (403 KYC_NOT_APPROVED)
    const blockedOnlineRes = await request(app)
      .post(`/api/drivers/${driverId}/status`)
      .send({ isOnline: true });
    expect(blockedOnlineRes.status).toBe(403);
    expect(blockedOnlineRes.body.code).toBe('KYC_NOT_APPROVED');

    // 3. Driver submits Advanced Self-Assisted AI KYC with Flight Operator badge
    const kycRes = await request(app)
      .post(`/api/drivers/${driverId}/advanced-kyc`)
      .send({
        operatorType: 'airport_flight_operator',
        airportBadgeNumber: 'ADD-BOLE-SEC-8841',
        licenseNumber: 'AA-DL-44129',
        faydaId: 'ET-FIN-9921-4451-2290',
        documents: {
          licenseUrl: 'https://cdn.chebelew.et/kyc/license_dl44129.jpg',
          libriUrl: 'https://cdn.chebelew.et/kyc/libri_et3b44129.jpg',
          boloUrl: 'https://cdn.chebelew.et/kyc/bolo_2026.jpg',
        },
        autoApproveIfQualified: true,
      });
    expect(kycRes.status).toBe(200);
    expect(kycRes.body.success).toBe(true);
    expect(kycRes.body.aiVerificationScore).toBeGreaterThanOrEqual(95);
    expect(kycRes.body.checks.length).toBeGreaterThan(0);

    // 4. Admin KYC Queue check
    const adminLogin = await request(app)
      .post('/api/auth/admin/login')
      .send({ emailOrPhone: 'dispatch@chebelew.et', passwordOrPin: '9922' });
    const adminToken = adminLogin.body.token;

    const queueRes = await request(app)
      .get('/api/admin/kyc-queue')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(queueRes.status).toBe(200);
    expect(Array.isArray(queueRes.body.pendingDrivers)).toBe(true);

    // 5. Admin Override & Approval
    const overrideRes = await request(app)
      .post(`/api/admin/kyc/${driverId}/decide`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'override',
        notes: 'Kazanchis operations center verified and granted Bole airport clearance pass',
      });
    expect(overrideRes.status).toBe(200);
    expect(overrideRes.body.success).toBe(true);
    expect(overrideRes.body.status).toBe('approved');

    // 6. Now the driver CAN go online
    const onlineRes = await request(app)
      .post(`/api/drivers/${driverId}/status`)
      .send({ isOnline: true });
    expect(onlineRes.status).toBe(200);
    expect(onlineRes.body.success).toBe(true);
    expect(onlineRes.body.isOnline).toBe(true);
  });
});
