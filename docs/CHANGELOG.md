# Changelog

All notable changes to CheeTaxi are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
