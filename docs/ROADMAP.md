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

## Phase 2 — Production Hardening (Weeks 5-8) 🚧

### 🚧 Realtime & WebSockets
- Socket.IO gateway for trip events
- Driver location push to passengers during trip
- Dispatcher live updates
- Connection authentication

### 🚧 Payments
- Real Stripe integration with webhook signature verification
- Real Chapa integration
- Real Telebirr integration
- Wallet top-up flow with provider callbacks

### 🚧 Push Notifications
- Firebase Cloud Messaging integration
- Topic-based push (per city, per driver)
- Background notification handling
- Notification delivery tracking

### 🚧 Testing
- Unit tests for all services (target 80% coverage)
- E2E tests for critical paths (auth, trip lifecycle, payments)
- Load tests with k6 (target: 100K concurrent users)
- Chaos engineering with Litmus

### 🚧 Observability
- Prometheus metrics exporter
- Grafana dashboards (API, trip funnel, driver heatmap)
- OpenTelemetry tracing
- Sentry integration
- ELK log aggregation

### 🚧 Mobile Polish
- Trip tracking screen with live driver position
- Driver offer modal with accept/reject
- Trip completion + rating flow
- Wallet top-up screen
- Subscription purchase screen
- Offline support (queue actions)
- Dark mode
- Amharic / Oromo localization

---

## Phase 3 — Launch (Weeks 9-12) 📋

### 📋 Launch Readiness
- Production deployment to AWS EKS
- DNS configuration (cheetaxi.africa, api.cheetaxi.africa, admin.cheetaxi.africa)
- TLS certificates via cert-manager + Let's Encrypt
- Backups configured and verified
- DR drill completed
- Security review (third-party pen test)
- Performance validation (load test passes)
- Accessibility audit (WCAG 2.1 AA)

### 📋 Mobile App Store Submission
- Android: Google Play Store listing, screenshots, privacy policy
- iOS: App Store submission, TestFlight beta
- App Store Optimization (ASO) for "taxi Ethiopia", "ride Addis Ababa"

### 📋 Operational Setup
- 24/7 safety operations center procedures
- Support team training
- Driver onboarding playbook
- Incident response runbook
- Status page (status.cheetaxi.africa)

### 📋 Marketing Launch
- Press release
- Influencer partnerships (Ethiopian creators)
- Social media campaign
- Driver referral program
- Passenger referral program (free first ride)

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
