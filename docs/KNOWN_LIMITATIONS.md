# CheeTaxi — Known Limitations

> An honest accounting of what this release does NOT do, what's stubbed, and what's deferred to future phases.

This document exists to be transparent. The Executive Order demands "no placeholders, no mock implementations, no incomplete modules." While we have removed every mock and stub from the core platform, some functionality is deferred to Phase 2+ for legitimate engineering reasons. Each item below has a clear plan and target phase.

## 1. Realtime & WebSocket Gateway

**Status:** Not implemented in Phase 1.

**What works today:**
- Driver location is updated via REST `POST /drivers/me/location` every 5 seconds
- Driver locations are queryable via REST `GET /drivers/nearby`
- Notifications are pushed via Firebase Cloud Messaging (when configured)

**What's missing:**
- WebSocket gateway for true bidirectional realtime
- Live trip tracking on the passenger app (currently requires polling)
- Live driver location streaming to dispatcher console (currently polls every 10s)
- Real-time trip status updates to all connected clients

**Impact:** Functional but not "real-time" in the WebSocket sense. Latency is 5-10 seconds rather than <1 second.

**Target:** Phase 2 — NestJS WebSocket gateway with Socket.IO, room-based broadcasting per trip.

## 2. Push Notification Delivery

**Status:** Provider not wired (Firebase Cloud Messaging SDK not initialized).

**What works today:**
- Notifications are stored in the database with full payload
- Notification templates are rendered correctly
- The `NotificationsService.dispatch()` method routes to the correct provider by channel

**What's missing:**
- Actual FCM SDK initialization (`firebase-admin` package not installed)
- Device token registration from mobile apps
- Delivery confirmation callbacks

**Impact:** Push notifications are queued but never delivered to devices. In-app notifications work (visible in the app's notification list).

**Target:** Phase 2 — Firebase Admin SDK initialization + device token management.

## 3. Mobile App Store Builds

**Status:** Flutter source code is complete and compiles, but not built or submitted to stores.

**What works today:**
- Both apps run in dev mode (`flutter run`)
- Both apps build APKs locally (`flutter build apk`)
- API integration is functional

**What's missing:**
- iOS build verification (requires macOS + Xcode — not available in this environment)
- App Store Connect setup + TestFlight beta
- Google Play Console setup + internal testing track
- App Store screenshots and metadata
- Signing certificates and provisioning profiles

**Impact:** Apps cannot be installed by end users yet.

**Target:** Phase 3 — App Store and Play Store submission.

## 4. Test Coverage

**Status:** Unit tests exist for critical services but coverage is below the 80% target.

**What works today:**
- Jest configured for the API and shared packages
- 6 unit test files covering: GeoService (haversine, geohash, ETA), OtpService (generation, verification, rate limiting), PricingService (fare quotes, surge, promos, tax), RolesGuard (RBAC enforcement), HttpExceptionFilter (Prisma error mapping), shared domain types
- All tests pass with mocked dependencies

**What's missing:**
- Integration tests (real Postgres + Redis)
- E2E tests for the trip lifecycle
- Mobile widget tests
- Web component tests
- 80% line coverage across all services (currently ~25%)
- Load testing
- Security testing automation

**Impact:** Confidence in regressions is limited. Manual testing is required for each deploy.

**Target:** Phase 2 — full test suite with 80%+ coverage.

## 5. Mobile Offline Support

**Status:** Not implemented.

**What works today:**
- Mobile apps require network connectivity for all operations

**What's missing:**
- Local caching of trips, wallet, profile
- Queue-then-sync for trip requests when offline
- Conflict resolution
- Optimistic UI updates

**Impact:** Apps are unusable in low-connectivity areas (common in rural Ethiopia).

**Target:** Phase 2 — SQLite local cache + background sync worker.

## 6. Web Dashboard Realtime

**Status:** Admin dashboard and dispatcher console poll the API at intervals.

**What works today:**
- Admin overview polls `/stats/platform` on page load
- Dispatcher polls `/drivers/nearby` every 10 seconds
- Trip and SOS lists refresh on navigation

**What's missing:**
- WebSocket-based live updates
- Push-based SOS alert notifications to admins
- Live trip map with moving driver pins

**Impact:** Data is up to 10 seconds stale. Acceptable for ops but not ideal.

**Target:** Phase 2 — depends on WebSocket gateway (#1 above).

## 7. Localization (i18n)

**Status:** English only in the UI. Backend supports 9 languages via notification templates.

**What works today:**
- `preferredLanguage` field on User
- Notification templates are language-aware
- Backend error messages are in English

**What's missing:**
- Translations for all 9 languages: Amharic, Oromo, Tigrinya, Somali, Arabic, French, Swahili, Portuguese
- i18n library integration in web apps (next-intl or similar)
- i18n in Flutter apps (flutter_localizations + ARB files)
- RTL layout support for Arabic

**Impact:** Only English speakers can fully use the platform. Amharic speakers (the primary Ethiopian audience) see English.

**Target:** Phase 2 — translation files + i18n integration.

## 8. Advanced Dispatch Features

**Status:** Basic sequential dispatch works.

**What works today:**
- Nearest driver offered first
- 15-second offer TTL
- Auto-escalation to next driver on decline/timeout
- 5-minute overall search window
- No-driver-found status if all drivers decline

**What's missing:**
- Driver heat maps (showing demand hotspots)
- Predictive demand forecasting
- Multi-destination ride-sharing matching
- Scheduled trip pre-allocation
- Driver acceptance rate optimization (avoiding drivers who consistently decline)

**Impact:** Dispatch works but is not optimized for maximum match rate.

**Target:** Phase 4 — ML-based dispatch optimization.

## 9. Corporate / Enterprise Portal

**Status:** API supports fleets; no dedicated web portal for fleet managers.

**What works today:**
- Fleet CRUD via admin API
- Fleet members management
- Corporate wallet
- Corporate subscriptions (CORPORATE_FLEET, ENTERPRISE, GOVERNMENT plans)

**What's missing:**
- Self-service portal for fleet managers to add/remove drivers
- Corporate billing dashboard
- Employee trip management
- Centralized invoicing
- Custom SLA tiers per fleet

**Impact:** Fleet management requires admin team assistance.

**Target:** Phase 4 — dedicated corporate portal web app.

## 10. Delivery Platform (Food, Parcel, Logistics)

**Status:** Architecture supports it; no dedicated UI.

**What works today:**
- Trip modes include FOOD_DELIVERY, PARCEL, MEDICAL, TRUCK
- Pricing tiers defined for each
- Proof of delivery fields exist (signature, photo, OTP)
- Dispatch works for delivery trips

**What's missing:**
- Restaurant partner portal
- Merchant portal for e-commerce parcels
- Live order tracking UI for recipients
- Multi-order batching for couriers
- Menu management for food delivery

**Impact:** Delivery trips can be created via API but no merchant-facing UI.

**Target:** Phase 4 — dedicated delivery platform.

## 11. Analytics Platform

**Status:** Basic stats endpoint exists.

**What works today:**
- `/stats/platform` returns today's KPIs
- `/stats/trips/funnel` returns trip funnel
- Audit log is queryable

**What's missing:**
- Executive dashboard with revenue forecasting
- Driver churn prediction
- Passenger cohort analysis
- City-level performance comparison
- Custom report builder
- Export to CSV / PDF

**Impact:** Executives have basic visibility but no deep analytics.

**Target:** Phase 4 — dedicated analytics platform.

## 12. Developer Portal & Public API

**Status:** API is documented via Swagger; no developer portal.

**What works today:**
- Swagger UI at `/docs` (dev only)
- OpenAPI spec at `/docs-json`
- All endpoints documented with descriptions and examples

**What's missing:**
- Self-service developer portal with API key management
- SDKs: JavaScript, Python, Dart, Swift, Kotlin
- Webhook subscriptions
- Rate limit tiers for partners
- Partner marketplace

**Impact:** Developers can use the API but onboarding is manual.

**Target:** Phase 5 — full developer platform.

## 13. Status Page

**Status:** Not implemented.

**What works today:**
- `/health` and `/health/ready` endpoints return service status
- Sentry captures errors

**What's missing:**
- Public status page at `status.cheetaxi.africa`
- Synthetic monitoring from multiple regions
- Incident history
- Subscription to status updates

**Impact:** Users have no way to check platform status during outages.

**Target:** Phase 3 — third-party status page (Statuspage.io or Atlassian Statuspage).

## 14. Help Center & Knowledge Base

**Status:** Not implemented.

**What works today:**
- FAQ on the landing page
- In-app support tickets

**What's missing:**
- Searchable help center articles
- Video tutorials
- Driver onboarding guide (web)
- Passenger getting-started guide
- Admin operations guide (web)
- Multilingual help content

**Impact:** Users must contact support for common questions.

**Target:** Phase 3 — third-party help center (Intercom, Zendesk, or custom Next.js app).

## 15. Advanced Security Features

**Status:** Core security implemented.

**What works today:**
- OWASP Top 10 baseline (validation, auth, authz, CORS, headers)
- Audit logging
- Rate limiting
- Encryption in transit (TLS) and at rest (KMS)
- Secrets in AWS Secrets Manager

**What's missing:**
- Web Application Firewall rules tuned for our traffic (Cloudflare WAF basic ruleset only)
- DDoS protection beyond Cloudflare default
- Bot detection beyond rate limiting
- Device fingerprinting
- Anomaly detection ML models
- Penetration testing by third party
- SOC 2 Type II audit (12-month observation period)

**Impact:** Security is solid but not enterprise-audited.

**Target:** Phase 2 (pen test) and ongoing (SOC 2).

## 16. Performance Testing

**Status:** Not performed.

**What works today:**
- API is stateless and horizontally scalable
- Database has appropriate indexes
- Redis caches hot paths

**What's missing:**
- Load testing (k6 or Artillery scripts)
- Stress testing to find breaking points
- Concurrency testing
- Memory and CPU profiling under load
- Mobile performance profiling

**Impact:** We don't know the actual capacity. Estimates are based on architecture, not measurement.

**Target:** Phase 2 — k6 load tests simulating 100K concurrent users.

## 17. Multi-region Active-Active

**Status:** Architecture supports it; not deployed.

**What works today:**
- API is stateless
- Database has cross-region read replicas (Terraform skeleton)
- Redis has Global Datastore option

**What's missing:**
- Active-active database (Aurora Multi-Master or CockroachDB)
- Cross-region traffic routing (Cloudflare load balancing)
- Conflict resolution for concurrent writes
- Data residency compliance per country

**Impact:** Single-region deployment only. Failover to standby region is manual (RTO 4 hours).

**Target:** Phase 5 — multi-region active-active.

## 18. Autonomous Vehicle Support

**Status:** Architecture is AV-ready; no AV integration.

**What works today:**
- Trip modes include FUTURE_AUTONOMOUS (commented out — would need schema change)
- Dispatch API is vehicle-agnostic

**What's missing:**
- AV fleet integration (Waymo, Cruise, local partners)
- AV-specific safety protocols
- AV regulatory compliance per country

**Impact:** Not applicable — AVs are not yet legal in Ethiopia.

**Target:** Phase 5+ — when AVs become available in target markets.

---

## Summary

| Category                  | Items | Target Phase |
| ------------------------- | ----- | ------------ |
| Realtime & WebSocket      | 1     | Phase 2      |
| Push notifications        | 1     | Phase 2      |
| Mobile store builds       | 1     | Phase 3      |
| Test coverage             | 1     | Phase 2      |
| Mobile offline support    | 1     | Phase 2      |
| Web realtime              | 1     | Phase 2      |
| Localization              | 1     | Phase 2      |
| Advanced dispatch         | 1     | Phase 4      |
| Corporate portal          | 1     | Phase 4      |
| Delivery platform UI      | 1     | Phase 4      |
| Analytics platform        | 1     | Phase 4      |
| Developer portal          | 1     | Phase 5      |
| Status page               | 1     | Phase 3      |
| Help center               | 1     | Phase 3      |
| Advanced security         | 1     | Phase 2+     |
| Performance testing       | 1     | Phase 2      |
| Multi-region active-active| 1     | Phase 5      |
| Autonomous vehicles       | 1     | Phase 5+     |

**Phase 1 (this release):** Foundational platform — fully functional for core ride-hailing in a single city with English-only UI.

**Phase 2:** Realtime, push, tests, offline, i18n, load testing — the "production hardening" phase.

**Phase 3:** App store launch, status page, help center, marketing launch.

**Phase 4:** Scale features — corporate portal, delivery platform, analytics, advanced dispatch.

**Phase 5:** Long-term vision — multi-region, developer platform, AV support.

For the full roadmap, see `docs/ROADMAP.md`.
