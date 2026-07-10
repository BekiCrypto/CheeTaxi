# CheeTaxi — System Architecture

> The most modern mobility platform designed for Africa.

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            CLIENTS                                       │
│  Passenger App    Driver App    Admin Web    Dispatcher    Landing       │
│   (Flutter)        (Flutter)    (Next.js)     (Next.js)    (Next.js)      │
└─────┬───────────────┬──────────────┬────────────┬─────────────┬──────────┘
      │               │              │            │             │
      │   HTTPS + WebSocket (TLS via Cloudflare)  │             │
      ▼               ▼              ▼            ▼             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       CLOUDFLARE EDGE                                    │
│   CDN · WAF · DDoS · Rate-limit · TLS termination                        │
└─────┬────────────────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER (EKS)                              │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Ingress (nginx-ingress)  →  cert-manager (Let's Encrypt)       │   │
│   └──────────────────────────┬──────────────────────────────────────┘   │
│                              │                                            │
│   ┌─────────────┐  ┌─────────┴──────────┐  ┌────────────────────────┐   │
│   │ Web Landing │  │   API (NestJS)      │  │  Web Admin / Dispatch  │   │
│   │  2 replicas │  │   3–30 replicas    │  │   2 replicas each      │   │
│   └─────────────┘  └─────────┬──────────┘  └────────────────────────┘   │
│                              │                                            │
│              ┌───────────────┼───────────────┐                            │
│              ▼               ▼               ▼                            │
│      ┌──────────────┐  ┌──────────┐  ┌────────────────┐                  │
│      │  PostgreSQL  │  │  Redis   │  │  OpenSearch    │                  │
│      │  (Aurora)    │  │ (Elastic)│  │  (search/log)  │                  │
│      │  Multi-AZ    │  │ Cluster  │  │                │                  │
│      └──────┬───────┘  └────┬─────┘  └────────────────┘                  │
│             │               │                                               │
└─────────────┼───────────────┼───────────────────────────────────────────┘
              │               │
              ▼               ▼
       ┌────────────┐   ┌──────────┐
       │ S3 backups │   │ Firebase │
       │ (daily +   │   │  (Push)  │
       │  WAL)      │   │          │
       └────────────┘   └──────────┘

External integrations:
  • Google Maps + OpenStreetMap + Mapbox (modular)
  • Stripe (international cards)
  • Chapa + Telebirr (Ethiopia)
  • Twilio / Africa's Talking (SMS)
  • SendGrid (Email)
  • Sentry (errors)
  • Datadog / Prometheus + Grafana (metrics)
```

## 2. Monorepo Layout

```
cheetaxi/
├── apps/
│   ├── api/                  # NestJS backend (this is the brain)
│   ├── web-landing/          # Public marketing site (Next.js)
│   ├── web-admin/            # Operations dashboard (Next.js)
│   ├── web-dispatcher/       # Live dispatch console (Next.js)
│   ├── mobile-passenger/     # Passenger app (Flutter)
│   └── mobile-driver/        # Driver app (Flutter)
├── packages/
│   ├── database/             # Prisma schema + client (single source of truth)
│   └── shared/               # TypeScript domain types + DTOs
├── infra/
│   ├── kubernetes/           # K8s manifests
│   └── terraform/            # IaC for AWS
├── docs/                     # You are here
├── docker-compose.yml        # Local dev: Postgres + Redis + OpenSearch + Mailhog
├── docker-compose.full.yml   # Full stack local
├── turbo.json                # Turborepo pipeline config
├── pnpm-workspace.yaml
└── package.json
```

## 3. API Module Architecture

Every domain module follows the same pattern:

```
src/<domain>/
├── <domain>.module.ts        # NestJS module
├── <domain>.controller.ts    # HTTP routes
├── <domain>.service.ts       # Business logic
└── dto/                      # Validation DTOs
```

### Current modules

| Module           | Purpose                                                   |
| ---------------- | --------------------------------------------------------- |
| `auth`           | JWT access + refresh tokens, phone OTP, session rotation  |
| `users`          | User CRUD, RBAC role assignment, GDPR deletion            |
| `passengers`     | Passenger profile, saved places, favorite drivers         |
| `drivers`        | Onboarding, KYC, live location, online/offline, earnings  |
| `vehicles`       | Vehicle registration, verification, active selection      |
| `fleets`         | Corporate / government / partner fleet management         |
| `trips`          | Full trip lifecycle: request → accept → arrive → complete |
| `dispatch`       | Geo-radius driver search, sequential offering, expiry     |
| `pricing`        | Fare quotes, surge zones, promo code discount             |
| `geo`            | Geocoding, reverse geocoding, geofences, haversine        |
| `subscriptions`  | Plan catalog, purchase, activation, grace period          |
| `wallets`        | Driver / passenger / fleet wallets, transactions          |
| `payments`       | Modular: Stripe / Chapa / Telebirr / Cash / Wallet        |
| `notifications`  | Push / SMS / Email / In-app, templated, queued            |
| `sos`            | One-tap SOS, safety team alert, acknowledge, resolve      |
| `support`        | Tickets, messages, assignment, SLA tracking               |
| `ratings`        | Two-way ratings (passenger ↔ driver), averages            |
| `promotions`     | Promo codes, redemption limits, referral tracking         |
| `audit`          | Immutable audit log of every privileged action            |
| `health`         | Liveness + readiness probes                               |

## 4. Data Model

See `packages/database/prisma/schema.prisma` — **40+ models** covering:

- Identity: `User`, `UserRoleAssignment`, `UserPermission`, `UserSession`, `UserDevice`
- Passengers: `Passenger`, `SavedPlace`, `FavoriteDriver`
- Drivers: `Driver`, `DriverLocationHistory`, `DriverHeatMap`, `DriverDocument`
- Vehicles: `Vehicle`
- Fleets: `Fleet`, `FleetMember`
- Trips: `Trip`, `TripEvent`
- Pricing: `PricingTier`, `SurgeZone`
- Subscriptions: `SubscriptionPlan`, `Subscription`, `DriverSubscriptionAssignment`
- Payments: `Wallet`, `WalletTransaction`, `Payment`, `WithdrawalRequest`, `Invoice`
- Quality: `Rating`, `Complaint`
- Growth: `PromoCode`, `PromoRedemption`, `Referral`
- Support: `SupportTicket`, `SupportMessage`
- Notifications: `Notification`, `NotificationTemplate`
- Safety: `SOSAlert`
- Compliance: `AuditLog`
- I18n: `Translation`, `FeatureFlag`
- Dispatch: `DispatchQueue`, `DriverOffer`
- Geo: `Geofence`, `Place`

## 5. Authentication & Authorization

- **JWT access tokens** (15 min) + **refresh tokens** (30 days) with server-side session rotation
- **Phone OTP** as primary auth — required for signup and login
- **RBAC + ABAC** — 19 roles + arbitrary fine-grained permissions per resource
- **RolesGuard / PermissionsGuard** as NestJS guards on every privileged route
- **Role assignments cached in Redis** (60s TTL) for sub-ms authorization checks
- **Audit log** records every privileged action

## 6. Dispatch Engine

1. Passenger requests a trip → trip is created in `REQUESTED` status
2. Trip is enqueued in `DispatchQueue` with pickup geohash
3. DispatchService queries Redis GEO set for nearby online drivers (sorted by distance)
4. Filters by: valid active subscription, vehicle type match, online status
5. Offers the trip to the closest driver with a 15s TTL
6. If accepted → trip moves to `DRIVER_ASSIGNED`, push notification sent to passenger
7. If declined or timed out → next driver in the queue is offered
8. If no driver accepts within 5 minutes → trip moves to `NO_DRIVER_FOUND`

## 7. Pricing

```
totalFare = max(
  minFare,
  (baseFare + perKm × distance + perMinute × duration) × surge − promo + tax
)
```

- Pricing tiers are per **city × country × vehicle type**
- Surge multipliers are stored per geohash with an expiry timestamp
- Promo codes support 4 types: PERCENTAGE, FIXED_AMOUNT, FREE_RIDE, WALLET_CREDIT
- Tax is computed at the platform level (Ethiopia VAT 15% sample)

## 8. Subscription Model

Drivers pay one flat subscription — no commission, ever.

| Plan             | Price (ETB) | Duration   | Saves vs. Daily |
| ---------------- | ----------- | ---------- | --------------- |
| Daily            | 100         | 1 day      | —               |
| Weekly           | 500         | 7 days     | 28%             |
| Monthly          | 1,800       | 30 days    | 40%             |
| Quarterly        | 5,000       | 90 days    | 44%             |
| Yearly           | 18,000      | 365 days   | 50%             |
| Corporate Fleet  | 15,000      | 30 days    | 10 drivers      |
| Enterprise       | 65,000      | 30 days    | 50 drivers      |
| Government       | Custom      | 365 days   | 100 drivers     |

The DispatchService refuses to offer trips to drivers without an active subscription.

## 9. Realtime

- **Driver location broadcasts** — every 5 seconds from the driver app via `POST /drivers/me/location`
- **Stored in Redis GEO set** for O(log N) radius queries
- **Postgres** stores the latest position + history for analytics
- **WebSocket gateway** (NestJS + Socket.IO) pushes trip events to passengers, drivers, and dispatchers in real time
- **Firebase Cloud Messaging** delivers push notifications when the app is backgrounded

## 10. Observability

| Signal     | Tool                          |
| ---------- | ----------------------------- |
| Metrics    | Prometheus + Grafana          |
| Logs       | ELK (OpenSearch + Logstash)   |
| Traces     | OpenTelemetry → Tempo         |
| Errors     | Sentry                        |
| Uptime     | Status page + synthetic checks |

## 11. Multi-region readiness

The architecture is region-agnostic from day one:

- Database: Aurora PostgreSQL with cross-region read replicas
- Redis: ElastiCache Global Datastore for multi-region reads
- API: Stateless — runs in any region behind a global load balancer
- Object storage: S3 with cross-region replication
- CDN: Cloudflare edges in 300+ cities including 50+ in Africa

Scaling to a new country = deploy the Helm chart in a new region + add a geofence + configure local pricing tiers + wire local payment provider. **Zero code changes.**
