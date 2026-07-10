// CheeTaxi — Auth load test
// Simulates users signing in via OTP and hitting authenticated endpoints.
//
// Run: k6 run tests/load/auth-flow.js --env API_URL=http://localhost:4000

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const API_URL = __ENV.API_URL || 'http://localhost:4000';

const otpRequestDuration = new Trend('otp_request_duration');
const otpVerifyDuration = new Trend('otp_verify_duration');
const meRequestDuration = new Trend('me_request_duration');
const authSuccess = new Counter('auth_success');
const authFailure = new Counter('auth_failure');

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // ramp to 100 VUs
    { duration: '1m', target: 100 },    // hold 100 VUs
    { duration: '30s', target: 500 },   // ramp to 500 VUs
    { duration: '2m', target: 500 },    // hold 500 VUs
    { duration: '30s', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'],
    http_req_failed: ['rate<0.01'],
    'auth_success': ['count>0'], // at least one auth success
  },
};

const PHONES = Array.from({ length: 1000 }, (_, i) =>
  `+251911${String(200000 + i).padStart(6, '0')}`
);

export default function () {
  const phone = PHONES[Math.floor(Math.random() * PHONES.length)];

  group('OTP auth flow', () => {
    // 1. Request OTP
    const otpReq = http.post(
      `${API_URL}/auth/otp/request`,
      JSON.stringify({ phone, purpose: 'login' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    otpRequestDuration.add(otpReq.timings.duration);

    const otpOk = check(otpReq, {
      'otp request 200': (r) => r.status === 200,
    });

    if (!otpOk) {
      authFailure.add(1);
      return;
    }

    sleep(0.5); // simulate user reading SMS

    // 2. Verify OTP — in dev mode (SMS_PROVIDER=console), we don't know the code
    // For load testing, we use the test backdoor: code "000000" if SMS_PROVIDER=console
    // (Note: this requires a test-mode bypass in OtpService — not in production code)
    const verifyReq = http.post(
      `${API_URL}/auth/otp/verify`,
      JSON.stringify({ phone, code: '000000' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    otpVerifyDuration.add(verifyReq.timings.duration);

    const verifyOk = check(verifyReq, {
      'verify 200': (r) => r.status === 200,
    });

    if (!verifyOk) {
      authFailure.add(1);
      return;
    }

    authSuccess.add(1);

    // 3. Use access token to hit /auth/me
    const body = verifyReq.json('data');
    if (body && body.accessToken) {
      const meReq = http.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${body.accessToken}` },
      });
      meRequestDuration.add(meReq.timings.duration);
      check(meReq, { 'me 200': (r) => r.status === 200 });
    }
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'tests/load/results/auth-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  return `
=== CheeTaxi Auth Load Test Summary ===
Total requests: ${data.metrics.http_reqs?.values?.count ?? 0}
Duration: ${data.state?.testRunDurationMs ?? 0}ms
Avg RPS: ${data.metrics.http_reqs?.values?.rate?.toFixed(2) ?? 0}
p50 latency: ${data.metrics.http_req_duration?.values?.['p(50)']?.toFixed(2) ?? 0}ms
p99 latency: ${data.metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) ?? 0}ms
Error rate: ${((data.metrics.http_req_failed?.values?.rate ?? 0) * 100).toFixed(2)}%
Auth successes: ${data.metrics.auth_success?.values?.count ?? 0}
Auth failures: ${data.metrics.auth_failure?.values?.count ?? 0}
`;
}
