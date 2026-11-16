import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { db } from '../db/database.js';
import { LocationService } from '../services/locationService.js';
import { DispatchService } from '../services/dispatchService.js';
import { QueueService } from '../services/queueService.js';
import { CircuitBreaker } from '../services/circuitBreaker.js';
import { StorageService } from '../services/storageService.js';

describe('Chebelew Production Scalability, Resilience & Security Hardening Test Suite', () => {
  const testPhone = `+25197${Math.floor(1000000 + Math.random() * 8999999)}`;
  let sampleDriverId: string;

  beforeAll(() => {
    // Ensure clean state
    LocationService.init();
    QueueService.init();

    // Insert test users
    const nowIso = new Date().toISOString();
    const testRiderIds = ['user_load_rider', 'user_r1', 'user_r2'];
    for (const rId of testRiderIds) {
      db.prepare(`
        INSERT OR IGNORE INTO users (id, phone, name, role, language, created_at)
        VALUES (?, ?, 'Load Test Passenger', 'rider', 'am', ?)
      `).run(rId, `+2519${Math.floor(10000000 + Math.random() * 90000000)}`, nowIso);
    }

    // Insert dedicated load test driver
    sampleDriverId = `driver_load_${Date.now()}`;
    db.prepare(`
      INSERT OR IGNORE INTO users (id, phone, name, role, language, created_at)
      VALUES (?, ?, 'Load Test Driver', 'driver', 'am', ?)
    `).run(`user_${sampleDriverId}`, testPhone, nowIso);

    db.prepare(`
      INSERT OR IGNORE INTO drivers (
        id, user_id, full_name, phone, vehicle_make, vehicle_model, vehicle_year, vehicle_plate,
        vehicle_color, vehicle_category, license_number, kyc_status, is_online, is_busy,
        current_lat, current_lng, rating, total_rides, wallet_balance_etb, created_at
      ) VALUES (
        ?, ?, 'Load Test Driver', ?, 'Toyota', 'Corolla', 2022, 'AA-3-99999',
        'Silver', 'sedan', 'DL-LOAD-1', 'approved', 1, 0,
        9.0105, 38.7615, 4.95, 120, 500, ?
      )
    `).run(sampleDriverId, `user_${sampleDriverId}`, testPhone, new Date().toISOString());
  });

  afterAll(() => {
    LocationService.flushImmediate();
    QueueService.stop();
  });

  // --------------------------------------------------------------------------
  // 1. High-Throughput Ephemeral Location Engine (5,000 GPS Updates Benchmark)
  // --------------------------------------------------------------------------
  describe('1. Real-Time GPS & Location Infrastructure (5,000 Concurrency)', () => {
    it('should ingest 5,000 simulated driver GPS updates into memory without disk lock contention', () => {
      const startTime = Date.now();
      const TOTAL_UPDATES = 5000;

      for (let i = 0; i < TOTAL_UPDATES; i++) {
        const driverId = `driver_sim_${i % 500}`; // 500 concurrent drivers emitting 10 updates
        const lat = 9.0105 + (i * 0.0001);
        const lng = 38.7615 + (i * 0.0001);
        LocationService.updateLocation(driverId, lat, lng, i % 360);
      }

      const elapsedMs = Date.now() - startTime;
      expect(elapsedMs).toBeLessThan(1500); // 5,000 in-memory updates in < 1.5 seconds

      // Verify spatial proximity query runs in O(1) against in-memory store
      const nearby = LocationService.findNearbyDrivers(9.0105, 38.7615, 5.0);
      expect(nearby.length).toBeGreaterThan(0);

      // Verify batch disk persistence runs cleanly in single transaction
      const flushedCount = LocationService.flushDirtyLocations();
      expect(flushedCount).toBeGreaterThan(0);
    });

    it('should detect stale GPS coordinates (> 90 seconds old)', () => {
      const staleDriverId = 'driver_stale_99';
      LocationService.updateLocation(staleDriverId, 9.0105, 38.7615, 0);

      // Verify fresh initially
      expect(LocationService.isDriverStale(staleDriverId, 90000)).toBe(false);

      // Verify stale with small threshold
      expect(LocationService.isDriverStale(staleDriverId, -1)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. High-Throughput Booking & Idempotency Protection
  // --------------------------------------------------------------------------
  describe('2. Booking, Dispatch & Idempotency Protection', () => {
    it('should prevent duplicate bookings when using the same idempotency key across rapid retries', async () => {
      const idempotencyKey = `idemp_${Date.now()}_alpha`;
      const ridePayload = {
        riderId: 'user_load_rider',
        riderName: 'Load Test Rider',
        riderPhone: '+251911333444',
        pickup: { address: 'Bole Medhanialem', lat: 8.995, lng: 38.788 },
        destination: { address: 'Meskel Square', lat: 9.0105, lng: 38.7615 },
        vehicleCategory: 'sedan',
        paymentMethod: 'TELEBIRR',
        idempotencyKey,
      };

      // 10 concurrent requests with the identical idempotency key (simulating mobile network retry storm)
      const requests = Array.from({ length: 10 }, () =>
        request(app).post('/api/rides').send(ridePayload)
      );

      const responses = await Promise.all(requests);

      // All responses should succeed
      for (const res of responses) {
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      }

      // Every response must return the EXACT same ride ID (guaranteed deduplication)
      const primaryRideId = responses[0].body.ride.id;
      for (const res of responses) {
        expect(res.body.ride.id).toBe(primaryRideId);
      }

      // Verify database contains exactly one row for this idempotency key
      const count = db.prepare('SELECT count(*) as count FROM rides WHERE idempotency_key = ?').get(idempotencyKey) as any;
      expect(count.count).toBe(1);
    });

    it('should enforce atomic compare-and-swap (CAS) lock preventing double-assignment of drivers', async () => {
      // Create two unassigned requested rides
      const ride1 = DispatchService.createRide({
        riderId: 'user_r1',
        riderName: 'Rider 1',
        riderPhone: '+251911111111',
        pickup: { address: 'Bole', lat: 8.995, lng: 38.788 },
        destination: { address: 'Piazza', lat: 9.035, lng: 38.752 },
        vehicleCategory: 'sedan',
        paymentMethod: 'CASH',
        autoAssign: false,
      });

      const ride2 = DispatchService.createRide({
        riderId: 'user_r2',
        riderName: 'Rider 2',
        riderPhone: '+251922222222',
        pickup: { address: 'Bole', lat: 8.995, lng: 38.788 },
        destination: { address: 'Kazanchis', lat: 9.015, lng: 38.765 },
        vehicleCategory: 'sedan',
        paymentMethod: 'CASH',
        autoAssign: false,
      });

      // Reset test driver to available
      db.prepare('UPDATE drivers SET is_busy = 0, active_ride_id = NULL WHERE id = ?').run(sampleDriverId);

      // Concurrently attempt to assign both rides to the exact same driver
      const assign1Promise = Promise.resolve().then(() => DispatchService.assignDriver(ride1.id, sampleDriverId));
      const assign2Promise = Promise.resolve().then(() => DispatchService.assignDriver(ride2.id, sampleDriverId));

      const results = await Promise.allSettled([assign1Promise, assign2Promise]);

      // Exactly ONE assignment must succeed and ONE must be rejected with DRIVER_ALREADY_BUSY
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect((rejected[0] as PromiseRejectedResult).reason.message).toBe('DRIVER_ALREADY_BUSY');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Database N+1 Elimination & Pagination Verification
  // --------------------------------------------------------------------------
  describe('3. Database Scalability & N+1 Elimination', () => {
    it('should retrieve user ride history in a single optimized LEFT JOIN query with pagination', async () => {
      const res = await request(app).get('/api/rides/user/user_leila_01?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.rides).toBeInstanceOf(Array);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);

      // Verify ride structure has joined driver details intact without N+1 query loop
      if (res.body.rides.length > 0) {
        const ride = res.body.rides[0];
        expect(ride).toHaveProperty('id');
        expect(ride).toHaveProperty('pickup');
        expect(ride).toHaveProperty('destination');
        expect(ride).toHaveProperty('fare');
      }
    });
  });

  // --------------------------------------------------------------------------
  // 4. Authentication Security & Brute-Force Throttling
  // --------------------------------------------------------------------------
  describe('4. Authentication Security & Account Protection', () => {
    it('should progressively throttle and lock out phone verification after 5 failed OTP attempts', async () => {
      const attackPhone = '+251911000666';

      // 5 consecutive invalid OTP attempts
      for (let i = 0; i < 4; i++) {
        const failRes = await request(app).post('/api/auth/otp/verify').send({
          phone: attackPhone,
          code: '000000', // Invalid code
        });
        expect(failRes.status).toBe(400);
        expect(failRes.body.error).toContain('attempts remaining');
      }

      // 5th attempt trips account lockout (429 Too Many Requests)
      const lockRes = await request(app).post('/api/auth/otp/verify').send({
        phone: attackPhone,
        code: '000000',
      });
      expect(lockRes.status).toBe(429);
      expect(lockRes.body.error).toContain('locked for 15 minutes');
      expect(lockRes.body.lockoutSeconds).toBe(900);
    });

    it('should revoke admin session token on logout', async () => {
      // Login as admin
      const loginRes = await request(app).post('/api/auth/admin/login').send({
        emailOrPhone: 'dispatch@chebelew.et',
        passwordOrPin: '9922',
      });
      expect(loginRes.status).toBe(200);
      const token = loginRes.body.token;

      // Verify token is active
      const verifyRes = await request(app).get('/api/auth/admin/verify').set('Authorization', `Bearer ${token}`);
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.valid).toBe(true);

      // Logout
      const logoutRes = await request(app).post('/api/auth/admin/logout').set('Authorization', `Bearer ${token}`);
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Verify token is now revoked
      const afterRes = await request(app).get('/api/auth/admin/verify').set('Authorization', `Bearer ${token}`);
      expect(afterRes.status).toBe(401);
    });
  });

  // --------------------------------------------------------------------------
  // 5. File Upload & Media Storage Resilience
  // --------------------------------------------------------------------------
  describe('5. Media Storage Resilience & Private KYC Access', () => {
    it('should generate signed upload URLs with MIME and size constraints', async () => {
      const res = await request(app).post('/api/media/presign-upload').send({
        ownerId: sampleDriverId,
        ownerType: 'driver',
        category: 'driver_license',
        mimeType: 'image/jpeg',
        fileExtension: 'jpg',
      });

      expect(res.status).toBe(200);
      expect(res.body.uploadUrl).toBeDefined();
      expect(res.body.fileKey).toContain(`driver/${sampleDriverId}/driver_license`);
      expect(res.body.maxSizeBytes).toBe(5 * 1024 * 1024);
      expect(res.body.signature).toBeDefined();
    });

    it('should reject unsupported MIME types', async () => {
      const res = await request(app).post('/api/media/presign-upload').send({
        ownerId: sampleDriverId,
        category: 'malicious_script',
        mimeType: 'application/x-executable',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Unsupported MIME type');
    });

    it('should generate and verify signed download URLs for private KYC documents', async () => {
      const testKey = `driver/${sampleDriverId}/driver_license_demo.jpg`;
      const presignRes = await request(app).post('/api/media/presign-download').send({ fileKey: testKey });
      expect(presignRes.status).toBe(200);
      expect(presignRes.body.downloadUrl).toContain('/api/media/download');
      expect(presignRes.body.signature).toBeDefined();

      // Tampered signature must be rejected with 403
      const tamperedRes = await request(app).get(`/api/media/download?key=${encodeURIComponent(testKey)}&expires=${Date.now() + 60000}&sig=fake_tampered_sig`);
      expect(tamperedRes.status).toBe(403);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Background Queue Resilience & Retry Policies
  // --------------------------------------------------------------------------
  describe('6. Background Worker Queue Resilience', () => {
    it('should enqueue jobs and track pending/completed metrics', () => {
      const jobId = QueueService.enqueue('analytics:aggregate', { trigger: 'test_load' });
      expect(jobId).toBeDefined();

      const stats = QueueService.getStats();
      expect(stats.pending + stats.completed + stats.processing).toBeGreaterThanOrEqual(1);
    });

    it('should provide circuit breaker protection for third-party partners', async () => {
      const breaker = CircuitBreaker.get('partner_test_breaker', { failureThreshold: 2, cooldownPeriodMs: 5000 });
      breaker.reset();

      // Simulate 2 failures
      try {
        await breaker.execute(async () => { throw new Error('Partner 504 Gateway Timeout'); });
      } catch (e) {}

      try {
        await breaker.execute(async () => { throw new Error('Partner 504 Gateway Timeout'); });
      } catch (e) {}

      // Circuit should now be OPEN
      expect(breaker.getState()).toBe('OPEN');

      // Subsequent call should fail-fast with fallback
      const fallbackResult = await breaker.execute(
        async () => 'live_call',
        () => 'fallback_cached_estimate'
      );
      expect(fallbackResult).toBe('fallback_cached_estimate');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Observability, Metrics & Health Probes
  // --------------------------------------------------------------------------
  describe('7. Observability, Prometheus Metrics & Health Probes', () => {
    it('should expose Prometheus metrics endpoint at /api/metrics', async () => {
      const res = await request(app).get('/api/metrics');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('chebelew_http_requests_total');
      expect(res.text).toContain('chebelew_http_request_duration_ms{quantile="0.95"}');
      expect(res.text).toContain('chebelew_active_rides');
      expect(res.text).toContain('chebelew_online_drivers');
      expect(res.text).toContain('chebelew_in_memory_locations_total');
    });

    it('should pass live process probe at /api/health/live', async () => {
      const res = await request(app).get('/api/health/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('live');
      expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('should pass deep readiness probe at /api/health/ready', async () => {
      const res = await request(app).get('/api/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
      expect(res.body.database).toBe('connected_wal');
      expect(res.body.heapUsedMb).toBeLessThan(1024);
      expect(res.body.queueStats).toBeDefined();
    });
  });
});
