# CheeTaxi — Load Testing Suite

> k6 scripts for measuring platform capacity.

## Setup

```bash
# Install k6
brew install k6  # macOS
# or
sudo apt install k6  # Debian/Ubuntu
# or download from https://k6.io/open-source/

# Verify
k6 version
```

## Scripts

### 1. Auth flow — `auth-flow.js`
Simulates users signing in via phone OTP and hitting authenticated endpoints.

```bash
k6 run tests/load/auth-flow.js --env API_URL=http://localhost:4000
```

- **VUs:** ramps 100 → 500
- **Duration:** ~5 minutes
- **Targets:** p99 < 500ms, error rate < 1%

### 2. Trip lifecycle — `trip-lifecycle.js`
Simulates the full trip request flow: pickup/dropoff → request → poll status.

```bash
k6 run tests/load/trip-lifecycle.js --env API_URL=http://localhost:4000
```

- **VUs:** ramps 50 → 200
- **Duration:** ~9 minutes
- **Targets:** p99 < 1s, error rate < 2%

### 3. Driver location broadcast — `driver-location.js`
Simulates drivers broadcasting their location every 5 seconds. This is the
highest-frequency endpoint — 10K online drivers × 0.2 RPS = 2K RPS sustained.

```bash
k6 run tests/load/driver-location.js --env API_URL=http://localhost:4000
```

- **VUs:** ramps 100 → 10K (simulating 10K concurrent drivers)
- **Duration:** ~14 minutes
- **Targets:** p99 < 200ms, error rate < 0.1%

## Running all tests in sequence

```bash
for script in auth-flow trip-lifecycle driver-location; do
  echo "=== Running $script ==="
  k6 run tests/load/$script.js --env API_URL=$API_URL
done
```

## Results

Each script outputs:
- A JSON summary in `tests/load/results/`
- A human-readable summary on stdout
- Prometheus-compatible metrics via `k6 run --out experimental-prometheus-rw=...`

## Production targets

These are the targets we must hit before declaring production-ready:

| Scenario                            | Target                        |
| ----------------------------------- | ----------------------------- |
| 1K concurrent auth flows            | p99 < 500ms, error < 1%       |
| 100 concurrent trip requests        | p99 < 1s, success rate > 80%  |
| 10K drivers broadcasting location   | p99 < 200ms, error < 0.1%     |
| 1K RPS sustained for 30 min         | No memory leaks, no degradation |
| Spike to 5K RPS in 30s              | HPA scales correctly, no 5xx  |

## Integration with CI

Add to `.github/workflows/load-test.yml` (Phase 3 — runs nightly on staging):

```yaml
name: Nightly Load Test
on:
  schedule:
    - cron: '0 2 * * *'  # 02:00 UTC
jobs:
  load:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/k6-action@v0.3.1
        with:
          filename: tests/load/driver-location.js
          flags: --env API_URL=https://staging-api.cheetaxi.africa
```
