# Changelog

All notable changes to CheeTaxi are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] — 2026-07-10

### Added — Phase 4 Scale Features

#### Advanced Dispatch
- New `HeatMapService` (`dispatch/heatmap.service.ts`)
- `getHeatMap()` — demand vs supply per geohash cell, cached 30 min
- `getDriverRecommendations()` — top 5 hot zones for a driver based on predicted demand + distance
- Predictive demand — hourly cron aggregates 4 weeks of trip history per geohash × hour-of-week
- Scheduled pre-allocation — every 5 min, scans scheduled trips ≤30 min ahead and pre-positions drivers
- New endpoints: `GET /dispatch/heatmap`, `GET /dispatch/recommendations`
- Periodic refresh via `@Cron` decorators (every 5 min for heat map, every hour for demand)

#### Corporate Portal (new web app)
- New `apps/web-corporate/` — Next.js portal for fleet managers
- Login flow with JWT storage
- Sidebar with 6 sections: Overview, Drivers, Vehicles, Billing, Reports, Settings
- Drivers table with KYC status + ratings
- Billing page with invoice history + plan summary
- Reports page with 5 report types (trip summary, revenue, performance, utilization, cost)
- Settings page (company profile, API access, spending limits, notifications)
- Production Dockerfile with standalone output

#### Analytics Platform
- New `AnalyticsModule` with `AnalyticsService`
- `getExecutiveDashboard()` — totals, period stats, week-over-week deltas (cached 1 hour)
- `getRevenueTrend()` — daily revenue + trip count for the last N days
- `getPassengerCohorts()` — retention by signup month (6 months default)
- `getDriverChurn()` — active vs churned drivers, churn rate, breakdown by trip count
- `getCityComparison()` — trips, revenue, completion rate per city
- `getRevenueForecast()` — linear regression projection for next 7 days
- New endpoints under `/analytics/*` (admin/finance/regional/auditor roles only)
- All queries cached in Redis for 1 hour

#### Webhook System
- New `WebhookEndpoint` and `WebhookDelivery` Prisma models
- New `WebhooksModule` with `WebhooksService`
- HMAC-SHA256 signed payloads (constant-time signature verification)
- Exponential backoff retry: 1m, 5m, 25m, 125m, 625m (5 attempts max)
- 10-second delivery timeout
- Auto-disables endpoints after repeated failures
- Cron job every minute processes pending + retrying deliveries
- New endpoints: `POST /webhooks/endpoints`, `GET /webhooks/endpoints`, `DELETE /webhooks/endpoints/:id`
- Wired into `TripsService` — `trip.completed` and `trip.cancelled` events trigger webhooks
- `verifySignature()` helper for partners to verify on receipt

#### Developer SDKs
- **JavaScript / TypeScript SDK** (`sdks/javascript/`)
  - Typed client with `CheeTaxiClient` class
  - Resources: `trips`, `pricing`, `subscriptions`, `wallets`, `webhooks`, `health`
  - `CheeTaxiError` with status code + details
  - Webhook signature verification helper
  - 30-second default timeout, configurable
- **Python SDK** (`sdks/python/`)
  - Sync `CheeTaxiClient` + async `AsyncCheeTaxiClient`
  - Same resource interface as JavaScript SDK
  - Uses `httpx` for HTTP, supports async context manager
  - `verify_webhook_signature()` helper using `hmac.compare_digest` (constant-time)
  - `pyproject.toml` for modern packaging

### Changed
- `apps/api/src/app.module.ts` — imports `AnalyticsModule`, `WebhooksModule`
- `apps/api/src/dispatch/dispatch.module.ts` — imports `GeoModule`, provides `HeatMapService`
- `apps/api/src/dispatch/dispatch.controller.ts` — heat map + recommendations endpoints
- `apps/api/src/geo/geo.module.ts` — exports `GeoService`
- `apps/api/src/trips/trips.module.ts` — imports `WebhooksModule`
- `apps/api/src/trips/trips.service.ts` — injects `WebhooksService`, triggers `trip.completed` + `trip.cancelled`
- `packages/database/prisma/schema.prisma` — added `WebhookEndpoint` + `WebhookDelivery` models
- `pnpm-workspace.yaml` — includes `sdks/javascript`

### Honest Status
Phase 4 adds the scale-out features: advanced dispatch (heat maps + predictive demand),
corporate portal, analytics platform, webhook system, and official SDKs in JavaScript + Python.

What's still pending:
- Delivery platform UI (restaurant/merchant portal) — Phase 5
- Full multi-city expansion (pricing + geofences per city) — Phase 5
- Additional API tests for the new modules — Phase 5
- Mobile offline support deep integration with UI — Phase 5

## [1.2.0] — 2026-07-10

### Added — Phase 3 Launch Readiness

#### Internationalization (i18n) — fully wired
- Web landing: next-intl integration with `middleware.ts`, `i18n/request.ts`, `NextIntlClientProvider`
- Language switcher component in navbar (English / Amharic / French)
- Hero, StatsBar, Navbar components use `useTranslations()` for all strings
- Mobile (passenger + driver): `flutter_localizations` + ARB files (en + am)
- `LocaleNotifier` persists preferred locale via SharedPreferences
- Language switcher in passenger auth screen
- Both apps pass `supportedLocales` and `localizationsDelegates` to MaterialApp

#### FCM Push Notification Delivery
- New `FcmService` (`notifications/providers/fcm.service.ts`)
- Initializes `firebase-admin` with `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- No-op if credentials not set (graceful degradation — notifications still stored + delivered via WebSocket)
- Sends to all device tokens per user in batches of 500 (FCM limit)
- Android priority `high`, iOS sound `default` + badge `1`
- Auto-removes invalid tokens (UNREGISTERED / INVALID_ARGUMENT responses)
- New endpoints: `POST /notifications/device/register`, `POST /notifications/device/unregister`
- Wired into `NotificationsService.dispatch()` — replaces the previous log-only stub
- `firebase-admin` added to API dependencies

#### Mobile Offline Support
- New `OfflineStore` in passenger app (`services/offline_store.dart`)
  - SQLite database (`cheetaxi.db`) with tables: trips, notifications, pending_ops
  - Listens to `connectivity_plus` for online/offline transitions
  - Queues POST/PUT/DELETE operations when offline; replays on reconnect
  - `syncPending()` called on app start and on connectivity restore
  - Exposes `isOnline` + `onOnlineChange` stream for UI feedback
- New `DriverOfflineStore` in driver app
  - SQLite database (`cheetaxi_driver.db`) with tables: active_trip, earnings, pending_ops, pending_locations
  - Queues location updates when offline; flushes most-recent on reconnect
  - Same sync-queue pattern as passenger app
- Both apps: `sqflite`, `connectivity_plus`, `path_provider` added to pubspec

#### Integration Tests (Testcontainers)
- New `jest.integration.config.js` with 120s timeout
- New `test/integration-setup.ts` — starts real PostgreSQL 16 + Redis 7 containers
- Runs Prisma migrations against the test database automatically
- New integration test files:
  - `trips.integration-spec.ts` — full trip lifecycle (request → accept → arrive → start → complete → cancel), fare computation, driver/passenger stats updates, invoice creation
  - `wallets.integration-spec.ts` — wallet creation, topUp, charge (with insufficient balance rejection), transaction audit trail
  - `dispatch.integration-spec.ts` — Redis GEO search, dispatch queue, driver offering
- New npm script: `pnpm --filter @cheetaxi/api test:integration`
- `testcontainers` added to devDependencies

#### E2E Tests (Supertest)
- New `jest.e2e.config.js` with 180s timeout
- New `test/e2e/auth-trips.e2e-spec.ts` — boots the full NestJS app and exercises:
  - OTP request + verify flow
  - Unauthenticated trip request rejected (401)
  - Health check (200 + status:ok)
  - Readiness check (postgres + redis both ok)
  - Prometheus metrics endpoint contains `cheetaxi_http_requests_total`
  - Subscription plans list (public)
  - Pricing tiers list (public)
  - Trip share token lookup (404 for non-existent)
- New npm script: `pnpm --filter @cheetaxi/api test:e2e`

#### Mobile Widget Tests
- New `apps/mobile-passenger/test/` directory with 3 test files:
  - `app_colors_test.dart` — color palette integrity
  - `theme_smoke_test.dart` — MaterialApp renders, FAB tap increments counter
  - `api_client_test.dart` — singleton, logout clears storage
- New `apps/mobile-driver/test/api_client_test.dart` — singleton, Dio instance, stopLocationBroadcast

#### Accessibility & Performance Audit
- New `lighthouserc.json` for the landing page with assertions:
  - Performance ≥ 0.8 (warn)
  - Accessibility ≥ 0.9 (error — blocking)
  - Best Practices ≥ 0.9 (warn)
  - SEO ≥ 0.9 (error — blocking)
- New `.github/workflows/accessibility-audit.yml` — runs Lighthouse CI on every PR + weekly
- Audits 6 pages: home, drivers, corporate, help, privacy, terms

#### Launch Marketing Assets
- `brand/marketing/press/press-release-2026-07-10.md` — full press release
- `brand/marketing/aso/app-store-copy.md` — ASO copy for both apps (titles, descriptions, keywords, categories)
- `brand/marketing/social/templates.md` — Twitter, Instagram, LinkedIn, Telegram, email templates

### Changed
- `apps/web-landing/package.json` — added `next-intl`
- `apps/web-landing/next.config.js` — wrapped with `withNextIntl` plugin
- `apps/web-landing/src/app/layout.tsx` — wraps children in `NextIntlClientProvider`
- `apps/web-landing/src/components/navbar.tsx` — uses `useTranslations()`, includes `LanguageSwitcher`
- `apps/web-landing/src/components/hero.tsx` — uses `useTranslations()` for all strings
- `apps/web-landing/src/components/stats-bar.tsx` — uses `useTranslations()`
- `apps/mobile-passenger/lib/main.dart` — `ConsumerStatefulWidget`, locale provider, `localizationsDelegates`
- `apps/mobile-passenger/lib/screens/auth_screen.dart` — uses `AppLocalizations`, language switcher
- `apps/mobile-passenger/pubspec.yaml` — added sqflite, connectivity_plus, path_provider
- `apps/mobile-driver/lib/main.dart` — same locale provider pattern
- `apps/mobile-driver/pubspec.yaml` — added sqflite, connectivity_plus, path_provider
- `apps/api/src/notifications/notifications.service.ts` — uses real `FcmService` for PUSH channel
- `apps/api/src/notifications/notifications.module.ts` — provides `FcmService`
- `apps/api/src/notifications/notifications.controller.ts` — device register/unregister endpoints
- `apps/api/package.json` — added `firebase-admin`, `testcontainers`, integration + e2e test scripts

### Honest Status
Phase 3 is the launch-readiness phase. Major additions: real i18n wired into UIs, real FCM push delivery,
mobile offline support with SQLite cache, integration + e2e tests against real containers,
mobile widget tests, accessibility audit, marketing launch assets.

What's still pending before public launch (per `docs/LAUNCH_CHECKLIST.md`):
- Mobile app store builds + submission (requires macOS for iOS)
- Third-party penetration test
- Production deployment + DNS + TLS
- 24/7 safety operations team staffing
- Soft launch with 50 drivers + 500 passengers
- Founder sign-off on the Launch Checklist

## [1.1.0] — 2026-07-10

### Added — Phase 2 Production Hardening

#### Realtime & WebSocket
- New `RealtimeModule` with `RealtimeGateway` (Socket.IO) on `/realtime` namespace
- JWT-authenticated WebSocket connections (token via handshake auth or query)
- Auto-join personal channel `user:<userId>` on connect
- Subscribe/unsubscribe to trip channels via `trip:subscribe` / `trip:unsubscribe`
- Driver location broadcast via `driver:location` event (alternative to REST polling)
- Trip offer response via `driver:offer:respond` event
- Server emits typed events for: trip lifecycle (requested/assigned/arrived/started/completed/cancelled), driver location, driver status, trip offer, notification, SOS triggered, wallet updated
- Wired into `TripsService` (every lifecycle method now emits WS events)
- Wired into `NotificationsService` (every notification pushes to WS)
- Wired into `SosService` (SOS triggers broadcast to all safety-team sockets)
- Wired into `WalletsService` (every balance change pushes to WS)

#### Observability
- New `ObservabilityModule` with `MetricsService` (Prometheus)
- `/metrics` endpoint exposing Prometheus text format
- Counters: HTTP requests, errors, trips requested/completed/cancelled, payments processed/failed, SOS triggered, OTP sent
- Histograms: HTTP request latency (10 buckets), DB query latency (7 buckets)
- Gauges: drivers online, trips in progress, active subscriptions, WebSocket connections
- `MetricsInterceptor` records every HTTP request automatically
- Sentry integration (`@sentry/node` + `@sentry/profiling-node`) — auto-captures errors, scrubs auth headers
- OpenTelemetry tracing (`@opentelemetry/sdk-node`) with HTTP + Express instrumentation
- Tracing initialized before NestJS bootstrap (per OTel best practice)
- Graceful shutdown flushes Sentry + OTel on SIGTERM
- Prometheus config (`infra/observability/prometheus/prometheus.yml`) for scraping
- Alerting rules (`infra/observability/prometheus/alerts.yml`) for: API down, high error rate, high latency, SOS triggered, payment failure spike, driver count drop
- Grafana dashboard (`infra/observability/grafana/dashboards/api-overview.json`) with: request rate, p50/p99 latency, error rate, trips/min, drivers online, trips in progress, active subscriptions, WebSocket connections

#### Mobile Polish — Passenger App
- `TripTrackingScreen` — live Google Maps with driver marker, status banner, driver card with call/SOS buttons, cancel button
- `RatingScreen` — 5-star rating, tag chips (safe driving, friendly, clean car, on time, quiet ride, knows city, helped with bags), optional comment
- `WalletScreen` — balance card with gradient, top-up sheet (Chapa), transaction history with credit/debit indicators
- `RealtimeClient` — WebSocket client with auto-reconnect, trip subscribe/unsubscribe, typed events

#### Mobile Polish — Driver App
- `TripOfferModal` — pulsing header with 15-second countdown, fare + distance + ETA, pickup/dropoff route card, accept/decline buttons
- `SubscriptionScreen` — active subscription card, plan list with "Most popular" badge on MONTHLY, one-tap purchase (CASH)
- `DriverWalletScreen` — earnings balance, withdrawal sheet with method dropdown (bank/mobile_money/cash_pickup), earnings history
- `DriverRealtimeClient` — WebSocket client with location broadcasting and offer response

#### Internationalization (i18n)
- Web landing: 3 language files (en, am, fr) in `apps/web-landing/messages/`
- Passenger app: ARB files for English + Amharic in `apps/mobile-passenger/lib/l10n/`
- Driver app: ARB files for English + Amharic in `apps/mobile-driver/lib/l10n/`
- l10n.yaml config for both Flutter apps (generates `AppLocalizations` class)
- All major UI strings externalized to translation files

#### Load Testing
- New `tests/load/` directory with 3 k6 scripts:
  - `auth-flow.js` — simulates 100-500 concurrent OTP auth flows
  - `trip-lifecycle.js` — simulates 50-200 concurrent trip requests
  - `driver-location.js` — simulates up to 10K drivers broadcasting location (2K RPS)
- Each script outputs JSON summary + human-readable stdout
- Targets documented: p99 < 500ms auth, < 1s trip, < 200ms location
- README with usage and CI integration example

#### Security Automation
- New `.github/workflows/security-scan.yml`:
  - **Dependency scan**: `pnpm audit --audit-level=high --prod` (blocking)
  - **SBOM generation**: CycloneDX format, uploaded as artifact
  - **Container scan**: Trivy scans all 4 Docker images for HIGH/CRITICAL vulns (blocking)
  - **CodeQL**: GitHub's static analysis with `security-extended` queries
- Runs on every push + PR + weekly schedule (Monday 06:00 UTC)

#### Tests (Phase 2 expansion)
- 5 new unit test files:
  - `auth.service.spec.ts` — signup, login, OTP verify, conflict handling (8 tests)
  - `wallets.service.spec.ts` — topUp, charge, creditDriver, requestWithdrawal (8 tests)
  - `ratings.service.spec.ts` — rateTrip, duplicate prevention, average recompute (7 tests)
  - `permissions.guard.spec.ts` — ABAC enforcement (3 tests)
  - `role.service.spec.ts` — RBAC + caching + invalidation (6 tests)
  - `stats.service.spec.ts` — platform stats + trip funnel (4 tests)
- Total: 36 new test cases (was 47, now 83)

### Fixed
- `RealtimeGateway` properly injected via module imports (not circular)
- `WalletsService` now emits `wallet.updated` events after every balance change
- `TripsService` emits trip lifecycle events after every state transition
- `SosService` broadcasts SOS triggers to all connected safety-team sockets in real-time

### Changed
- `main.ts` now initializes OpenTelemetry tracing before any NestJS imports
- `main.ts` initializes Sentry (no-op if SENTRY_DSN not set)
- `main.ts` registers `MetricsInterceptor` as a global interceptor
- `app.module.ts` imports `RealtimeModule` and `ObservabilityModule`
- API package.json adds: `prom-client`, `@sentry/node`, `@sentry/profiling-node`, `@opentelemetry/*`
- All WebSocket events use the typed constants from `@cheetaxi/shared` `WS_EVENTS`

## [1.0.0] — 2026-07-10

### Added

#### Monorepo & Tooling
- pnpm workspace configuration with `apps/*` and `packages/*`
- Turborepo pipeline for build/dev/test/lint/typecheck
- TypeScript strict mode across all packages
- ESLint + Prettier with single quotes, 100 char width
- `.env.example` documenting all environment variables
- `.gitignore` covering Node, Next.js, Flutter, IDE, OS artifacts

#### Database (`packages/database`)
- 40+ Prisma models covering identity, passengers, drivers, vehicles, fleets, trips, dispatch, pricing, subscriptions, wallets, payments, ratings, complaints, promotions, referrals, support, notifications, SOS, audit, localization, feature flags, geofences, places
- 18 enums: UserRole, UserStatus, Gender, VehicleType, VehicleStatus, DriverStatus, DriverVerificationStage, TripStatus, TripMode, PaymentMethod, TransactionType, TransactionStatus, SubscriptionPlanTier, SubscriptionStatus, WalletType, RatingRole, SupportTicketStatus, SupportTicketPriority, NotificationChannel, NotificationStatus, SOSStatus, FleetType, PromoCodeType, AuditAction, Country
- Seed script with pricing tiers, 8 subscription plans, super admin, 7 notification templates, 6 feature flags, Addis Ababa geofence + 5 landmarks
- Auto-generated Prisma client with global singleton (dev hot-reload safe)

#### Shared Types (`packages/shared`)
- Domain types mirroring Prisma enums
- DTOs: AuthSignupDto, AuthLoginDto, TripRequestDto, TripQuote, DriverLocationUpdate, SubscriptionPurchaseDto, WalletTopupDto, SOSRequestDto
- WebSocket event constants
- 9 supported languages + 12 African currencies catalog
- Unit tests for all domain type definitions

#### Backend API (`apps/api`)
- **Auth module**: phone OTP, JWT access (15min) + refresh (30d) tokens with rotation, pluggable SMS providers (console / Twilio / Africa's Talking)
- **Users module**: CRUD, role assignment, GDPR deletion
- **Passengers module**: profile, saved places, favorite drivers, trip history
- **Drivers module**: onboarding, KYC, location tracking (Redis GEO), earnings
- **Vehicles module**: registration, verification, active selection
- **Fleets module**: corporate / government / partner fleet management
- **Trips module**: full lifecycle (request → accept → arrive → start → complete → cancel)
- **Dispatch module**: nearby-driver search, sequential offering with TTL
- **Pricing module**: fare quotes with surge + promo + tax
- **Geo module**: geocoding (OpenStreetMap Nominatim), reverse geocoding, geofences, haversine, geohash
- **Subscriptions module**: 8 plans, purchase, activation
- **Wallets module**: atomic transactions with audit trail
- **Payments module**: real Stripe / Chapa / Telebirr adapters + cash + wallet
- **Notifications module**: Push / SMS / Email / In-app / WhatsApp with templates
- **SOS module**: one-tap alert with safety-team broadcast
- **Support module**: tickets + messages with priority + assignment
- **Ratings module**: two-way ratings with average recompute
- **Promotions module**: promo codes + referral tracking
- **Audit module**: immutable audit log
- **Stats module**: real-time platform metrics
- **Health module**: liveness + readiness probes
- Global filters: Prisma-aware HttpExceptionFilter
- Global interceptors: Logging, Transform (standardized response envelope)
- Global guards: Throttler (600 req/min, 30 req/sec), Roles, Permissions
- Helmet, CORS, Swagger / OpenAPI docs at `/docs`
- 6 unit test files covering geo, OTP, pricing, roles guard, exception filter

#### Web — Landing (`apps/web-landing`)
- Full marketing site: hero with phone mockup, stats bar, passenger CTA, driver CTA, transport modes (12 cards), subscription plans (6 tiers), Africa-first (9 languages, 12 countries), safety (6 features), FAQ (8 questions), footer
- Brand design system: brand orange palette (50-900), ink neutrals (50-900), Plus Jakarta Sans + Inter
- Animations: fade-in-up, pulse-slow
- SEO metadata, OpenGraph, sitemap.xml, robots.txt
- Mobile-responsive with hamburger menu
- Production Dockerfile with Next.js standalone output

#### Web — Admin (`apps/web-admin`)
- Login flow with localStorage JWT storage
- Sidebar with 10 sections
- Live platform overview (pulls from `/stats/platform`)
- Driver approval/rejection workflow
- Users search with role filter
- Trips table
- Subscriptions table
- Finance KPIs
- Support tickets table
- Active SOS alerts monitoring
- Audit log viewer with filtering
- Settings page with placeholders for pricing, feature flags, roles, integrations
- Production Dockerfile

#### Web — Dispatcher (`apps/web-dispatcher`)
- Dark-themed operational UI
- Live driver map (SVG with grid, roads, glow effect on pins)
- Real-time driver roster from `/drivers/nearby` (10s polling)
- Online / on-trip / searching counters
- Live clock (updates every second)
- Production Dockerfile

#### Mobile — Passenger (`apps/mobile-passenger`)
- Splash screen
- Phone entry screen
- OTP verification screen
- Home screen with Google Maps + ride mode selection (Taxi, Moto, Bajaj, Parcel)
- Ride request bottom sheet with fare estimate
- API client (Dio) with token refresh interceptor
- Brand color palette + Plus Jakarta Sans theming

#### Mobile — Driver (`apps/mobile-driver`)
- Splash screen
- Phone entry + OTP verification
- 6-step onboarding flow UI
- Home screen with Google Maps + online/offline toggle
- Background location broadcasting (every 5 seconds via Timer)
- Earnings summary (7-day window)
- Driver profile display

#### Infrastructure
- `docker-compose.yml`: PostgreSQL 16, Redis 7, OpenSearch 2, Mailhog
- `docker-compose.full.yml`: full stack with all 4 web apps + API
- `infra/kubernetes/production.yaml`: Namespace, ConfigMap, 4 Deployments, 4 Services, Ingress (TLS via cert-manager), HPA (3-30 replicas), PVC for Redis
- `infra/terraform/main.tf`: VPC (3 AZ), Aurora PostgreSQL (2 instances, multi-AZ, encrypted, 14-day backups), ElastiCache Redis (3 nodes, multi-AZ, encrypted), EKS cluster (3+ nodes)
- `infra/terraform/production.tfvars`: production config

#### CI/CD
- `.github/workflows/ci.yml`: build, typecheck, lint, test on every PR (with Postgres + Redis service containers); Docker build smoke check on main; deploy to K8s on main

#### Documentation
- 22 documents in `docs/` covering everything from architecture to launch checklist
- Brand assets: SVG logos (3 variants), app icon, splash screen, OpenGraph image, favicon
- README updated to reflect the full platform

### Security
- All passwords hashed with bcrypt cost 12
- JWT signed with HS256 secret (256-bit recommended)
- Refresh tokens stored as bcrypt hash in DB (not plaintext)
- All endpoints behind JWT auth except: `/auth/*`, `/payments/webhooks/*`, `/health`, `/trips/share/:token`, `/pricing/tiers`
- Rate limiting: 600 req/min, 30 req/sec, OTP 10/hour
- Helmet for security headers
- CORS whitelist (no wildcard in production)
- Audit log records every privileged action
- No secrets in code or env files (`.env.example` only)
- Container runs as non-root user (UID 1001)
- Read-only root filesystem in K8s (configurable)

### Known Limitations
- See `docs/KNOWN_LIMITATIONS.md` for the full list

[1.0.0]: https://github.com/BekiCrypto/CheeTaxi/releases/tag/v1.0.0
