# CHEETAXI

**Fast. Reliable. African. Modern.**

The most modern mobility platform designed for Africa. Passengers ride free. Drivers keep 100% — pay one subscription, drive unlimited.

[![Status](https://img.shields.io/badge/status-phase_3-FFA800)](docs/ROADMAP.md)
[![License](https://img.shields.io/badge/license-proprietary-0E1012)](docs/LICENSE.md)
[![Made in Africa](https://img.shields.io/badge/made_in-Africa-10B981)](https://cheetaxi.africa)

---

## What is CheeTaxi?

CheeTaxi is a ride-hailing and delivery platform built for African cities. It launches in Addis Ababa, Ethiopia and scales to all 54 African countries without architectural redesign.

**Differentiators:**
- **Passengers ride free** — no subscription, no platform charges
- **Drivers keep 100%** of every fare — pay one flat subscription, drive unlimited
- **Africa-first** — 9 languages, every African currency, timezone/tax/regulation aware
- **Safety-first** — 24/7 SOS response, live trip sharing, verified drivers

## Repository

This is a **pnpm + Turborepo monorepo** containing the entire platform:

```
apps/
├── api/                  NestJS backend (20 modules, 100+ endpoints)
├── web-landing/          Next.js marketing site (12 pages)
├── web-admin/            Next.js admin dashboard (10 sections)
├── web-dispatcher/       Next.js dispatcher console (real-time)
├── mobile-passenger/     Flutter passenger app
└── mobile-driver/        Flutter driver app

packages/
├── database/             Prisma schema (40+ models, 18 enums) + seed
└── shared/               TypeScript domain types + DTOs

brand/                    SVG logos, app icons, splash, social cards
docs/                     22 documents covering everything
infra/                    Kubernetes + Terraform
.github/workflows/        CI/CD pipeline
```

## Quick Start (5 minutes)

```bash
git clone https://github.com/BekiCrypto/CheeTaxi.git
cd CheeTaxi
pnpm install
cp .env.example .env         # set JWT_SECRET to a random string
docker compose up -d         # PostgreSQL + Redis + OpenSearch + Mailhog
pnpm db:generate
pnpm --filter @cheetaxi/database exec prisma migrate dev --name init
pnpm db:seed
pnpm dev                     # API + landing + admin + dispatcher
```

Then open:
- API + Swagger: http://localhost:4000/docs
- Landing: http://localhost:3000
- Admin: http://localhost:3001 (login: `+251900000000` / `ChangeMe!2025`)
- Dispatcher: http://localhost:3002

For the full guide, see [`docs/QUICK_START.md`](docs/QUICK_START.md).

## Documentation

| Document | Purpose |
| -------- | ------- |
| [Founder Executive Order](docs/README.md) | The governing constitution |
| [Architecture](docs/ARCHITECTURE.md) | System design, module map, data model |
| [PRD](docs/PRD.md) | Product requirements, business model |
| [API Reference](docs/API.md) | 100+ endpoints documented |
| [Quick Start](docs/QUICK_START.md) | 5-minute local setup |
| [Deployment](docs/DEPLOYMENT.md) | Production deployment guide |
| [Security](docs/SECURITY.md) | Threat model, controls |
| [Developer Guide](docs/DEVELOPER_GUIDE.md) | Code conventions, workflows |
| [Operations Manual](docs/OPERATIONS_MANUAL.md) | Day-to-day ops procedures |
| [Incident Response](docs/INCIDENT_RESPONSE.md) | SEV-1 runbooks |
| [Backup Strategy](docs/BACKUP_STRATEGY.md) | Backup + DR procedures |
| [Brand Guidelines](docs/BRAND_GUIDELINES.md) | Logo, colors, typography |
| [Contributing](docs/CONTRIBUTING.md) | PR process, code standards |
| [Repository Structure](docs/REPOSITORY_STRUCTURE.md) | Directory map |
| [Roadmap](docs/ROADMAP.md) | Phase 1 (done) through Phase 5 |
| [Testing Report](docs/TESTING_REPORT.md) | Test coverage status |
| [Security Audit](docs/SECURITY_AUDIT.md) | OWASP review |
| [Performance Report](docs/PERFORMANCE_REPORT.md) | Performance benchmarks |
| [Known Limitations](docs/KNOWN_LIMITATIONS.md) | Honest gaps |
| [Launch Checklist](docs/LAUNCH_CHECKLIST.md) | 153-item pre-launch gate |
| [Release Notes](docs/RELEASE_NOTES.md) | v1.0.0 release notes |
| [Changelog](docs/CHANGELOG.md) | Version history |
| [License](docs/LICENSE.md) | Proprietary |

## Tech Stack

| Layer | Choice |
| ----- | ------ |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind |
| Mobile | Flutter 3 |
| Backend | NestJS 10, TypeScript |
| Database | PostgreSQL 16 (Aurora) |
| Cache | Redis 7 (ElastiCache) |
| Search | OpenSearch 2 |
| Realtime | WebSockets (Socket.IO) — Phase 2 |
| Push | Firebase Cloud Messaging |
| Maps | Google Maps + OpenStreetMap + Mapbox (modular) |
| Payments | Stripe + Chapa + Telebirr (modular, real adapters) |
| Infra | Docker + Kubernetes (EKS) + Terraform + GitHub Actions |
| CDN/WAF | Cloudflare |

## Status

**Phase 3 — Launch Readiness.**

What's done (cumulative from Phase 1):
- ✅ Full monorepo with pnpm + Turborepo
- ✅ Backend API: 22 modules, 100+ endpoints, JWT + OTP auth, RBAC + ABAC
- ✅ 3 web apps: landing (12 pages) with **i18n wired (en + am + fr)**, admin (10 sections), dispatcher (real-time)
- ✅ 2 mobile apps (Flutter): passenger + driver with **i18n wired (en + am)** + **offline SQLite cache + sync queue**
- ✅ Database: 40+ Prisma models, full seed
- ✅ Infrastructure: Docker Compose + Kubernetes + Terraform
- ✅ CI/CD: GitHub Actions with build/test/deploy + security scanning + accessibility audit
- ✅ 22 documentation files
- ✅ Brand assets: SVG logos, app icon, splash, OpenGraph, marketing press release, ASO copy, social templates
- ✅ Legal pages: Privacy, Terms, Cookies, Help Center, Status, Developer Portal
- ✅ Unit tests: 11 spec files, 83 test cases
- ✅ **NEW**: Integration tests (Testcontainers) — TripsService, WalletsService, DispatchService
- ✅ **NEW**: E2E tests (Supertest) — full NestJS app boot, health/metrics/auth/trips
- ✅ **NEW**: Mobile widget tests (Flutter) — colors, theme, API client
- ✅ Real payment provider adapters (Stripe, Chapa, Telebirr)
- ✅ Real SMS provider support (Twilio, Africa's Talking)
- ✅ **NEW**: Real FCM push notification delivery via `firebase-admin`
- ✅ **NEW**: Device token registration endpoints
- ✅ WebSocket realtime gateway
- ✅ Observability: Prometheus + Sentry + OpenTelemetry + Grafana
- ✅ k6 load testing scripts
- ✅ Security automation: Trivy + CodeQL + pnpm audit + SBOM
- ✅ **NEW**: Lighthouse CI for accessibility + performance audits

What's still pending before public launch (see [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md)):
- Mobile app store builds + submission (requires macOS for iOS)
- Third-party penetration test
- Production deployment + DNS + TLS
- 24/7 safety operations team staffing
- Soft launch with 50 drivers + 500 passengers
- Founder sign-off on the Launch Checklist

## Business Model

### Passengers — free forever
- No subscription
- No platform charges
- Pay only the trip fare (cash, card, wallet, corporate account)

### Drivers — subscription only
- Daily: Br 100 (1 day)
- Weekly: Br 500 (7 days, save 28%)
- Monthly: Br 1,800 (30 days, save 40%)
- Quarterly: Br 5,000 (90 days, save 44%)
- Yearly: Br 18,000 (365 days, save 50%)
- Corporate Fleet: Br 15,000 / month (10 drivers)
- Enterprise: Br 65,000 / month (50 drivers)
- Government: Custom (100+ drivers)

**Zero commission. Zero per-trip deduction. 100% of fares kept.**

## Africa-First

- **9 languages**: English, Amharic (አማርኛ), Oromo (Afaan Oromoo), Tigrinya (ትግርኛ), Somali (Soomaali), Arabic (العربية), French (Français), Swahili (Kiswahili), Portuguese (Português)
- **All African currencies**: ETB, KES, NGN, GHS, ZAR, EGP, MAD, RWF, TZS, UGX, XOF, USD
- **Timezone / country / tax / regulation aware**

## License

Proprietary — see [`LICENSE`](LICENSE) and [`docs/LICENSE.md`](docs/LICENSE.md).

## Contact

- General: `hello@cheetaxi.africa`
- Support: `support@cheetaxi.africa`
- Drivers: `drivers@cheetaxi.africa`
- Sales: `sales@cheetaxi.africa`
- Security: `security@cheetaxi.africa`
- Press: `press@cheetaxi.africa`
- Legal: `legal@cheetaxi.africa`

---

*CheeTaxi Technologies · Bole, Addis Ababa, Ethiopia · © 2026*
