# CheeTaxi — Roadmap

> This document tracks what's done, what's in progress, and what's planned.

## Status Legend
- ✅ **Done** — production-ready or scaffolded and functional
- 🚧 **In Progress** — actively being built
- 📋 **Planned** — designed but not started
- 🔮 **Future** — on the long-term roadmap

---

## Phase 1 — Foundation (Weeks 1-4) ✅

### ✅ Monorepo & Tooling
- pnpm workspace + Turborepo
- TypeScript strict mode across all packages
- ESLint + Prettier configured
- GitHub Actions CI/CD pipeline
- Dockerfiles for all deployable apps

### ✅ Database & Domain Model
- Complete Prisma schema (40+ models)
- All enums: roles, statuses, vehicle types, payment methods, etc.
- Seed script with pricing tiers, subscription plans, notification templates, sample places, super admin
- Migrations ready to apply

### ✅ Backend API (NestJS)
- Authentication: JWT + refresh tokens + phone OTP
- User management with RBAC + ABAC
- Passenger profiles, saved places, favorite drivers
- Driver onboarding, KYC, location tracking
- Vehicle registration and verification
- Fleet management (corporate / government / partner)
- Full trip lifecycle: request → accept → arrive → start → complete → cancel
- Dispatch engine with Redis GEO-based nearby driver search
- Pricing engine with surge zones and promo codes
- Geo service (geocoding, reverse geocoding, geofences, haversine)
- Subscription purchase and activation
- Wallets with atomic transactions
- Modular payment provider abstraction (Stripe, Chapa, Telebirr, Cash, Wallet)
- Notifications (Push, SMS, Email, In-app, WhatsApp) with templating
- SOS safety alerts with safety-team notification
- Support tickets with messages and assignment
- Two-way ratings (passenger ↔ driver) with average updates
- Promotions and referral tracking
- Immutable audit log
- Health checks (liveness + readiness)

### ✅ Web — Landing
- Full marketing site with hero, stats, transport modes, subscription plans, Africa-first, safety, FAQ
- SEO metadata, sitemap.xml, robots.txt
- Production-ready Tailwind design system

### ✅ Web — Admin Dashboard
- Login flow with JWT storage
- Sidebar navigation (10 sections)
- Dashboard overview with KPIs
- Drivers management (pending approvals + all drivers)
- Users management with search
- Trips table
- Subscriptions table
- Finance KPIs
- Support tickets
- Active SOS alerts
- Audit log
- Settings

### ✅ Web — Dispatcher Console
- Real-time driver map (SVG-based mock)
- Active trip queue
- Online/on-trip/searching counters
- Live clock

### ✅ Mobile — Passenger App (Flutter)
- Splash + auth flow (OTP-based)
- Home screen with Google Maps
- Ride mode selection (Taxi, Moto, Bajaj, Parcel)
- Trip request with fare estimate
- API client with token refresh

### ✅ Mobile — Driver App (Flutter)
- Splash + auth + onboarding flow
- Home with map + online/offline toggle
- Background location broadcasting (every 5s)
- Earnings summary
- Profile display

### ✅ Infrastructure
- docker-compose.yml for local dev (Postgres, Redis, OpenSearch, Mailhog)
- docker-compose.full.yml for full stack
- Kubernetes manifests (Deployments, Services, Ingress, HPA, PVC)
- Terraform skeleton for AWS (VPC, Aurora, ElastiCache, EKS)

### ✅ Documentation
- ARCHITECTURE.md
- PRD.md
- API.md (full endpoint reference)
- DEPLOYMENT.md
- SECURITY.md
- DEVELOPER_GUIDE.md
- ROADMAP.md (this file)

---

## Phase 2 — Production Hardening (Weeks 5-8) ✅

### ✅ Realtime & WebSockets
- Socket.IO gateway for trip events
- Driver location push to passengers during trip
- Dispatcher live updates
- Connection authentication
- Server emits: trip lifecycle (7 events), driver location, driver status, trip offer, notification, SOS, wallet updates

### ✅ Payments (deepened)
- Real Stripe integration with webhook signature verification (HMAC)
- Real Chapa integration (REST API)
- Real Telebirr integration (REST API)
- Wallet top-up flow with provider callbacks
- Modular adapter pattern — adding a new provider = 1 class

### ⚠️ Push Notifications (partial)
- FCM integration scaffolded in code but Firebase Admin SDK not initialized
- Device token registration from mobile apps not yet implemented
- Notification delivery tracking not yet implemented

### ✅ Observability
- Prometheus metrics exporter at `/metrics`
- Grafana dashboards (API, trip funnel, driver count)
- OpenTelemetry tracing exported via OTLP
- Sentry integration for frontend + backend errors
- Prometheus alerting rules (API down, error rate, SOS, payment failures)

### ✅ Security Automation
- `pnpm audit --audit-level=high` blocking in CI
- Trivy container image scanning (HIGH/CRITICAL blocking)
- GitHub CodeQL static analysis (`security-extended`)
- CycloneDX SBOM generation
- Weekly scheduled security scans

### ✅ Load Testing
- k6 scripts written for: auth flow, trip lifecycle, driver location broadcast
- Targets documented (p99 < 500ms auth, < 1s trip, < 200ms location)
- ⚠️ Not yet run against staging environment

### ✅ Mobile Polish (partial)
- Trip tracking screen with live driver position (passenger app)
- Driver offer modal with 15s countdown (driver app)
- Trip completion + rating flow (passenger app)
- Wallet top-up screen (passenger app)
- Subscription purchase screen (driver app)
- Driver earnings + withdrawal screen (driver app)
- Offline support (queue actions) — not yet implemented (Phase 3)
- Dark mode — not yet implemented (Phase 3)
- Amharic localization — ARB files created, not yet wired into screens (Phase 3)

### ✅ i18n (partial)
- Web: 3 language files (en, am, fr) created
- Mobile: ARB files for English + Amharic created
- l10n.yaml config for Flutter code generation
- ⚠️ Strings not yet wired into the actual UI components (Phase 3)

### ✅ Tests (expanded)
- 11 unit test files (was 6)
- 83 test cases (was 47, +76%)
- Coverage estimated ~50% (was ~25%)
- Critical services tested: AuthService, WalletsService, RatingsService, RoleService, StatsService, PricingService, OtpService, GeoService
- ⚠️ Still untested: TripsService, DispatchService, PaymentsService (Phase 3 priority)

---

## Phase 3 — Launch (Weeks 9-12) ✅

### ✅ i18n — fully wired
- Web: next-intl with middleware, locale-aware layout, language switcher in navbar
- Mobile: Flutter localizations with ARB files (en + am), locale persisted via SharedPreferences
- 3 web languages (en, am, fr) and 2 mobile languages (en, am) at launch

### ✅ FCM Push Notification Delivery
- `FcmService` with `firebase-admin` SDK
- Device token registration / unregistration endpoints
- Batch sending (500 per batch — FCM limit)
- Invalid token auto-cleanup
- Graceful no-op when credentials not configured

### ✅ Mobile Offline Support
- `OfflineStore` (passenger) + `DriverOfflineStore` (driver) — SQLite-backed
- Pending operations queue with auto-sync on connectivity restore
- Driver location batching when offline
- Connectivity stream for UI feedback

### ✅ Integration Tests (Testcontainers)
- Real PostgreSQL 16 + Redis 7 containers per test run
- TripsService — full lifecycle, fare computation, stats updates, invoice creation
- WalletsService — topUp, charge, insufficient balance rejection, audit trail
- DispatchService — Redis GEO search, queue + offering

### ✅ E2E Tests (Supertest)
- Full NestJS app boot with real Postgres + Redis
- Auth flow, health checks, metrics endpoint, public endpoints, error cases

### ✅ Mobile Widget Tests
- Color palette integrity
- Theme smoke tests
- API client singleton + logout

### ✅ Accessibility Audit
- Lighthouse CI config with assertions on accessibility + SEO (blocking)
- CI workflow runs on every PR + weekly

### ✅ Launch Marketing Assets
- Press release
- ASO copy (passenger + driver)
- Social media templates (Twitter, Instagram, LinkedIn, Telegram, email)

### ⚠️ Still pending before public launch
- Mobile app store builds + submission (requires macOS for iOS)
- Third-party penetration test
- Production deployment + DNS + TLS
- 24/7 safety operations team staffing
- Soft launch with 50 drivers + 500 passengers
- Founder sign-off on the Launch Checklist (docs/LAUNCH_CHECKLIST.md)

---

## Phase 4 — Scale (Months 4-12) 📋

### 📋 Multi-city expansion
- Dire Dawa, Bahir Dar, Hawassa (Ethiopia)
- Nairobi (Kenya)
- Lagos (Nigeria)
- Accra (Ghana)
- Per-city pricing tiers, geofences, local payment providers

### 📋 Advanced dispatch
- Predictive demand forecasting (ML)
- Driver heat maps with recommendations
- Multi-destination matching for ride-sharing
- Scheduled trip pre-allocation

### 📋 Corporate / Enterprise
- Corporate portal with employee management
- Centralized billing with monthly invoicing
- Custom SLA tiers
- API access for corporate clients

### 📋 Delivery Platform
- Restaurant partner portal
- Live order tracking
- Multi-order batching
- Proof of delivery (photo + signature + OTP)

### 📋 Analytics Platform
- Executive dashboard
- Revenue forecasting
- Driver churn prediction
- Passenger cohort analysis
- City-level performance comparison

---

## Phase 5 — Long-term Vision (Year 2+) 🔮

### 🔮 Pan-African coverage
- All 54 African countries live
- Local payment integrations per country (M-Pesa, MTN Mobile Money, Airtel Money, etc.)
- Local language support (50+ African languages)
- Compliance with each country's transport regulations

### 🔮 Autonomous Vehicle Support
- AV-ready dispatch API (architecture supports this today)
- AV fleet integration (Waymo, Cruise, local partners)
- Hybrid human + AV dispatch

### 🔮 Super App
- CheeTaxi Wallet as a payment method for third-party merchants
- Bill payments (electricity, water, telecom)
- Micro-insurance (trip insurance, vehicle insurance)
- Loyalty program with tiers
- Embedded financial services (driver loans against future earnings)

### 🔮 Developer Platform
- Public API with rate limits and API keys
- SDKs: JavaScript, Python, Dart, Swift, Kotlin
- Webhook subscriptions
- Partner marketplace

### 🔮 AI / ML
- Dynamic pricing optimization
- Fraud detection models
- Route optimization
- Demand prediction
- Chatbot for support (multi-language)

---

## Success Metrics (12-month target)

| Metric                          | Target          |
| ------------------------------- | --------------- |
| Cities live                     | 10              |
| Registered drivers              | 100,000         |
| Active drivers (monthly)        | 50,000          |
| Registered passengers           | 1,000,000       |
| Active passengers (monthly)     | 500,000         |
| Trips per month                 | 5,000,000       |
| Gross merchandise value         | $50M / month    |
| Driver retention (3-month)      | 70%             |
| Passenger retention (3-month)   | 60%             |
| Average rating                  | 4.7+            |
| SOS response time (median)      | < 60 seconds    |
| API uptime                      | 99.95%          |
| App Store rating                | 4.5+            |

---

## How to Contribute

1. Pick a task from this roadmap (or open an issue describing new work)
2. Create a branch: `feat/<scope>` or `fix/<scope>`
3. Implement following `docs/DEVELOPER_GUIDE.md`
4. Open a PR with a clear description and link to the issue
5. Get review from at least one other engineer
6. Squash-merge to `develop` for staging, or `main` for production

For questions, contact `engineering@cheetaxi.africa`.
