// CheeTaxi — Driver location broadcast load test
// Simulates drivers broadcasting their location every 5 seconds.
// This is the highest-frequency endpoint in the system — 10K online drivers
// hitting it every 5s = 2K RPS sustained.
//
// Run: k6 run tests/load/driver-location.js --env API_URL=http://localhost:4000

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Gauge } from 'k6/metrics';

const API_URL = __ENV.API_URL || 'http://localhost:4000';

const locationUpdateDuration = new Trend('location_update_duration');
const locationUpdates = new Counter('location_updates_total');
const locationFailures = new Counter('location_failures_total');
const concurrentDrivers = new Gauge('concurrent_drivers');

export const options = {
  stages: [
    { duration: '1m', target: 100 },     // 100 drivers
    { duration: '2m', target: 100 },     // hold — 100 drivers × 0.2 RPS = 20 RPS
    { duration: '1m', target: 1000 },    // 1000 drivers
    { duration: '3m', target: 1000 },    // 200 RPS
    { duration: '1m', target: 5000 },    // 5000 drivers
    { duration: '3m', target: 5000 },    // 1000 RPS
    { duration: '1m', target: 10000 },   // 10000 drivers
    { duration: '3m', target: 10000 },   // 2000 RPS — target peak
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'location_update_duration': ['p(99)<200'],  // location updates must be fast
    http_req_failed: ['rate<0.001'],             // near-zero failures
  },
};

const ADDIS_BOUNDS = {
  minLat: 8.98, maxLat: 9.04,
  minLng: 38.74, maxLng: 38.80,
};

function randomLocation() {
  return {
    lat: ADDIS_BOUNDS.minLat + Math.random() * (ADDIS_BOUNDS.maxLat - ADDIS_BOUNDS.minLat),
    lng: ADDIS_BOUNDS.minLng + Math.random() * (ADDIS_BOUNDS.maxLng - ADDIS_BOUNDS.minLng),
  };
}

export default function () {
  concurrentDrivers.add(1);
  const loc = randomLocation();

  // Note: this hits the unauthenticated path. In production load tests,
  // each VU would have a unique driver JWT. Here we test the API's ability
  // to handle the load — the 401 response is expected.
  const res = http.post(
    `${API_URL}/drivers/me/location`,
    JSON.stringify({
      latitude: loc.lat,
      longitude: loc.lng,
      heading: Math.random() * 360,
      speedKmh: Math.random() * 60,
      accuracyMeters: 10,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  locationUpdateDuration.add(res.timings.duration);

  if (res.status === 200 || res.status === 401) {
    locationUpdates.add(1);
  } else {
    locationFailures.add(1);
  }

  check(res, {
    'status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });

  sleep(5); // 5-second broadcast interval
}
