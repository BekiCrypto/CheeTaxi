# CheeTaxi — Performance Report

> Status as of v1.0.0 (Phase 1 Foundation). Honest assessment — no load testing has been performed yet.

## 1. Performance Targets

| Metric                              | Target             | Status               |
| ----------------------------------- | ------------------ | -------------------- |
| API p50 latency (read)              | < 50ms             | Not measured         |
| API p99 latency (read)              | < 200ms            | Not measured         |
| API p99 latency (write)             | < 500ms            | Not measured         |
| API cold start                      | < 2s               | Not measured         |
| Web landing LCP                     | < 2.5s             | Not measured         |
| Web landing Lighthouse Performance  | > 90               | Not measured         |
| Mobile app cold start               | < 3s               | Not measured         |
| Driver location update              | < 100ms server-side | Architecturally sound |
| Trip request → driver offer         | < 5s               | Architecturally sound |
| Concurrent users at 1% error rate   | 100K               | Not load-tested      |
| Sustained RPS                       | 10K                | Not load-tested      |

**Honest summary:** No performance testing has been conducted. All targets above are design goals, not measured values.

## 2. Architectural Performance Characteristics

While we haven't load-tested, the architecture is designed for performance:

### 2.1 API Layer
- **Stateless NestJS** — horizontally scalable to 30+ replicas via HPA
- **Connection pooling** — Prisma client with configurable pool size
- **Redis caching** for hot paths:
  - User roles/permissions (60s TTL)
  - Driver locations (GEO set, 90s TTL per entry)
  - Pricing tiers (5 min TTL)
  - Surge zones (30s TTL)
- **Indexed database queries** — every foreign key has an index, additional `@@index` declarations on hot query paths

### 2.2 Database
- **Aurora PostgreSQL** with 2 instances (writer + reader) in multi-AZ
- **Read replicas** can be added for read-heavy workloads
- **Connection pooling** via Prisma (default 10 connections per instance, configurable)
- **Indexes** on all foreign keys + explicit indexes on hot paths:
  - `User.phone`, `User.email`, `User.role+status`, `User.country+city`
  - `Trip.passengerId+status`, `Trip.driverId+status`, `Trip.status+requestedAt`, `Trip.mode+status`, `Trip.pickupGeohash`
  - `Driver.userId`, `Driver.status+online`, `Driver.fleetId`, `Driver.kycStatus`
  - `DispatchQueue.geohash+vehicleType+status+createdAt`

### 2.3 Caching Layer
- **Redis GEO set** for O(log N) radius queries on driver locations
- **Redis hash cache** for user access (roles + permissions)
- **Redis rate limiting counters**
- **Redis distributed locks** for atomic operations

### 2.4 CDN
- **Cloudflare** for static assets, edge caching, DDoS protection
- **Next.js standalone output** for smaller container images
- **Image optimization** via Next.js Image component (AVIF + WebP)

### 2.5 Mobile
- **Flutter** with native compilation (no JS bridge)
- **Dio HTTP client** with connection pooling
- **Background location updates** every 5s via native geolocator (battery-optimized)

## 3. Theoretical Capacity Estimates

Based on architecture (not measurement):

| Resource                  | Capacity Estimate             |
| ------------------------- | ----------------------------- |
| Aurora PostgreSQL (r6g.large) | ~10K writes/sec, ~50K reads/sec |
| ElastiCache Redis (r6g.large, 3 nodes) | ~100K ops/sec |
| EKS nodes (3 × m6i.large) | ~6 vCPU, 12GB RAM per node   |
| API pod (1 vCPU, 1GB RAM) | ~500 RPS sustained             |
| 30 API pods (max HPA)     | ~15K RPS sustained             |

**Theoretical max: ~15K RPS** with the default Terraform configuration. Scaling EKS nodes + Aurora instance size can push this to 100K+ RPS.

**Caveat:** These are estimates based on similar architectures. Real capacity must be measured via load testing (Phase 2).

## 4. Known Performance Risks

### 4.1 Database — HIGH risk
- Aurora r6g.large may be undersized for production launch
- Some queries may not use indexes effectively (no `EXPLAIN ANALYZE` done)
- No query timeout configured — slow queries can hold connections
- No connection pooler (PgBouncer) — Prisma's built-in pool may exhaust connections under load

**Mitigation:** Phase 2 — load test, add PgBouncer if needed, tune Aurora instance size

### 4.2 Redis — MEDIUM risk
- Single Redis shard (3-node replication) — no horizontal scaling
- Driver location GEO set grows unbounded if drivers don't go offline cleanly (90s TTL mitigates)

**Mitigation:** Phase 2 — monitor Redis memory, add sharding if needed

### 4.3 API — LOW risk
- Stateless, horizontally scalable
- HPA configured (3-30 replicas based on CPU)

**Mitigation:** Already architected for scale

### 4.4 Web — LOW risk
- Next.js standalone output is efficient
- Static pages cached at CDN edge
- No server-side rendering on hot paths

### 4.5 Mobile — MEDIUM risk
- Background location broadcasting every 5s may drain battery
- No batching of API calls

**Mitigation:** Phase 2 — adaptive location update frequency based on speed + trip state

## 5. Optimization Opportunities

### 5.1 Database
- Add `EXPLAIN ANALYZE` to top 10 queries — verify index usage
- Add query timeout (e.g. `statement_timeout = 5s`)
- Consider PgBouncer for connection pooling
- Add materialized views for analytics queries (stats endpoint)

### 5.2 Caching
- Cache `PricingTier` lookups in Redis (currently cached in memory per request)
- Cache `Place` search results (1 min TTL)
- Cache `/stats/platform` response (30s TTL) — currently computed on every request

### 5.3 API
- Add response compression (gzip / brotli)
- Add ETag headers for cacheable responses
- Add request batching endpoint for mobile (reduce round-trips)
- Consider GraphQL for mobile clients (fetch only needed fields)

### 5.4 Web
- Add `next/image` to all images for optimization
- Add font subsetting (only load used character ranges)
- Preload critical resources (fonts, hero image)
- Use `next/script` strategy for analytics scripts

### 5.5 Mobile
- Use ` Dio`'s built-in HTTP cache
- Implement request debouncing for search inputs
- Use `const` constructors and `const` widgets everywhere
- Profile with Flutter DevTools for jank

## 6. Phase 2 Load Testing Plan

### 6.1 Tool: k6
```javascript
// Example k6 script (to be created in Phase 2)
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 1000 },   // ramp to 1K RPS
    { duration: '5m', target: 1000 },   // hold 1K RPS
    { duration: '2m', target: 5000 },   // ramp to 5K RPS
    { duration: '5m', target: 5000 },   // hold 5K RPS
    { duration: '2m', target: 10000 },  // ramp to 10K RPS
    { duration: '10m', target: 10000 }, // hold 10K RPS
    { duration: '5m', target: 0 },      // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'],   // 99% of requests < 500ms
    http_req_failed: ['rate<0.01'],     // error rate < 1%
  },
};
```

### 6.2 Scenarios to test
1. **Authentication load** — 1K OTP requests/sec for 5 min
2. **Trip request load** — 100 trip requests/sec for 10 min
3. **Driver location update load** — 10K location updates/sec for 5 min (simulating 10K online drivers)
4. **Mixed read/write** — 80% reads, 20% writes, ramping to 10K RPS
5. **Spike test** — jump from 100 to 10K RPS in 10 seconds
6. **Soak test** — 1K RPS sustained for 1 hour (detect memory leaks)

### 6.3 Acceptance criteria
- p99 latency < 500ms under 10K RPS
- Error rate < 1% under 10K RPS
- No memory leaks over 1-hour soak
- HPA scales correctly (3 → 30 pods) under spike
- Aurora CPU < 70% under peak load

## 7. Honest Conclusion

The CheeTaxi v1.0.0 platform is **architected for performance** — stateless API, indexed database, Redis caching, CDN, horizontal scalability. The architecture should support 10K+ RPS based on similar systems.

However, **no performance testing has been conducted**. We do not know:
- Actual API latency under load
- Actual database capacity
- Actual Redis throughput
- Mobile app cold start time on low-end devices
- Web landing Lighthouse score

**Recommendation:** Do not declare "production-ready for 100M users" per the Executive Order until Phase 2 load testing is complete. The current release handles normal traffic patterns but peak capacity is unverified.

**Report prepared by:** CheeTaxi AI Engineering Organization
**Report date:** 2026-07-10
**Next review:** After Phase 2 load testing
