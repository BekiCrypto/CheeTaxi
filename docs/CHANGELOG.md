# Changelog

All notable changes to CheeTaxi are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
