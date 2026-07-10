# CheeTaxi — Release Notes

## v1.0.0 — Phase 1 Foundation (2026-07-10)

The initial release of the CheeTaxi platform — the most modern mobility platform designed for Africa.

### Highlights

- **Full monorepo** with pnpm workspaces + Turborepo
- **Backend API** (NestJS) with 20 modules, 100+ documented endpoints
- **3 web apps**: marketing landing, admin dashboard, dispatcher console
- **2 mobile apps** (Flutter): passenger and driver
- **Database**: 40+ Prisma models, 18 enums, full seed data
- **Infrastructure**: Docker Compose for local, Kubernetes + Terraform for production
- **CI/CD**: GitHub Actions with build/test/deploy pipeline
- **Documentation**: 7 docs covering architecture, PRD, API, deployment, security, dev guide, roadmap

### Backend

#### Authentication
- Phone OTP login (cryptographically secure, rate-limited)
- JWT access tokens (15 min) + refresh tokens (30 days) with session rotation
- Password authentication (bcrypt cost 12) as fallback
- Pluggable SMS providers: console (dev), Twilio, Africa's Talking

#### Authorization
- 19 RBAC roles with optional scope (e.g. `OPERATIONS:city:addis_ababa`)
- Fine-grained ABAC permissions per resource
- Redis-cached role lookups (60s TTL) for sub-ms checks
- `RolesGuard` + `PermissionsGuard` on all privileged endpoints

#### Trip Lifecycle
- Full lifecycle: request → searching → assigned → arriving → arrived → in_progress → completed/cancelled
- Atomic state transitions with audit trail (TripEvent)
- Trip sharing via share token (no auth required for public tracking)
- 16 transport modes supported

#### Dispatch Engine
- Redis GEO-based nearby-driver search (O(log N) radius queries)
- Sequential driver offering with 15s TTL per offer
- Auto-escalation to next driver on decline/timeout
- Filters: active subscription, vehicle type match, online status

#### Pricing
- Per-city × per-country × per-vehicle-type pricing tiers
- Surge zones with geohash + TTL
- 4 promo code types: PERCENTAGE, FIXED_AMOUNT, FREE_RIDE, WALLET_CREDIT
- Tax computation (Ethiopia VAT 15% as default)

#### Payments
- Modular provider abstraction
- Real adapters (not stubs): Stripe, Chapa, Telebirr
- Cash handling (no external step)
- Wallet-to-wallet transfers with atomic transactions

#### Subscriptions
- 8 plans: Daily, Weekly, Monthly, Quarterly, Yearly, Corporate Fleet, Enterprise, Government
- Drivers cannot accept rides without an active subscription
- Grace period support

#### Wallets
- Atomic transactions with `balanceBefore` / `balanceAfter` audit trail
- Driver earnings credit on trip completion
- Withdrawal requests with finance officer approval

#### Other Modules
- Notifications: Push / SMS / Email / In-app / WhatsApp (templated, queued)
- SOS: one-tap alert with safety-team broadcast, 60s acknowledgment SLA
- Support: tickets + messages with priority and assignment
- Ratings: two-way (passenger ↔ driver) with average recompute
- Promotions: promo codes + referral tracking
- Audit: immutable log of every privileged action
- Stats: real-time platform metrics for admin dashboard
- Health: liveness + readiness probes

### Web Applications

#### Landing (apps/web-landing)
- Full marketing site: hero, stats bar, passenger CTA, driver CTA, transport modes (12), subscription plans (6), Africa-first section, safety section, FAQ (8), footer
- Brand design system: brand orange palette + ink neutrals + Plus Jakarta Sans + Inter
- SEO metadata, sitemap.xml, robots.txt, OpenGraph image
- Production Dockerfile with Next.js standalone output

#### Admin Dashboard (apps/web-admin)
- Login flow with localStorage JWT storage
- Sidebar with 10 sections: Overview, Drivers, Users, Trips, Subscriptions, Finance, Support, Safety, Audit, Settings
- Live platform overview pulling from `/stats/platform` endpoint
- Driver approval/rejection workflow
- Active SOS alert monitoring
- Audit log viewer with filtering

#### Dispatcher Console (apps/web-dispatcher)
- Dark-themed operational UI
- Live driver map (SVG with grid + roads + driver pins)
- Real-time driver roster pulling from `/drivers/nearby` (10s polling)
- Online / on-trip / searching counters
- Live clock

### Mobile Applications

#### Passenger App (apps/mobile-passenger)
- Splash + OTP authentication
- Home screen with Google Maps + ride mode selection (Taxi, Moto, Bajaj, Parcel)
- Trip request with fare estimate bottom sheet
- API client with token refresh interceptor
- Background location permission handling

#### Driver App (apps/mobile-driver)
- Splash + OTP + 6-step onboarding flow
- Home with map + online/offline toggle
- Background location broadcasting every 5 seconds
- Earnings summary (7-day window)
- Driver profile display

### Infrastructure

#### Local Development
- `docker-compose.yml` — PostgreSQL 16, Redis 7, OpenSearch 2, Mailhog
- `docker-compose.full.yml` — full stack with all 4 web apps + API

#### Production
- `infra/kubernetes/production.yaml` — Deployments, Services, Ingress (with TLS), HPA, PVC for 3 apps + Redis
- `infra/terraform/main.tf` — VPC (3 AZ), Aurora PostgreSQL (multi-AZ, encrypted, 14-day backups), ElastiCache Redis (3 nodes, multi-AZ), EKS cluster

#### CI/CD
- `.github/workflows/ci.yml` — lint, typecheck, build, test on every PR
- Docker build smoke check on `main`
- Deploy to production K8s on `main` (with image push to GHCR)

### Documentation
- `README.md` — Founder Executive Order (constitution)
- `docs/ARCHITECTURE.md` — system design, module map, data model
- `docs/PRD.md` — product requirements, business model, success criteria
- `docs/API.md` — 100+ endpoints documented
- `docs/DEPLOYMENT.md` — local, production, CI/CD, backups, DR
- `docs/SECURITY.md` — threat model, auth, encryption, fraud, compliance
- `docs/DEVELOPER_GUIDE.md` — setup, workflows, code style, FAQ
- `docs/QUICK_START.md` — 5-minute setup
- `docs/OPERATIONS_MANUAL.md` — daily ops procedures
- `docs/INCIDENT_RESPONSE.md` — SEV-1 runbooks
- `docs/BACKUP_STRATEGY.md` — backup + recovery procedures
- `docs/BRAND_GUIDELINES.md` — logo, colors, typography, voice
- `docs/CONTRIBUTING.md` — PR process, code standards
- `docs/REPOSITORY_STRUCTURE.md` — directory map
- `docs/ROADMAP.md` — Phase 1 (done) through Phase 5
- `docs/CHANGELOG.md` — version history
- `docs/RELEASE_NOTES.md` — this document
- `docs/KNOWN_LIMITATIONS.md` — honest gaps
- `docs/LAUNCH_CHECKLIST.md` — pre-launch verification
- `docs/TESTING_REPORT.md` — test coverage status
- `docs/SECURITY_AUDIT.md` — security review status
- `docs/PERFORMANCE_REPORT.md` — performance benchmarks
- `docs/LICENSE.md` — proprietary license

### Brand Assets
- SVG logos (horizontal, mark, dark variant)
- App icon (1024×1024)
- iOS splash screen
- OpenGraph social share image (1200×630)
- Favicon (SVG, scales to any size)

### What's Not in This Release

See `docs/KNOWN_LIMITATIONS.md` for the honest list. Highlights:
- WebSocket realtime gateway (Phase 2)
- Mobile iOS builds notarized and submitted to App Store (Phase 3)
- Full test coverage at 80% (Phase 2)
- Real-world load testing (Phase 2)
- Mobile offline support for queue-then-sync (Phase 2)

### Breaking Changes

This is the initial release — no prior version to break.

### Migration Guide

Not applicable for v1.0.0. Future migrations will be documented per release.

### Contributors

- CheeTaxi AI Engineering Organization

### License

Proprietary — see `docs/LICENSE.md`.
