# CheeTaxi — Repository Structure Guide

A map of every directory and key file in this monorepo.

## Top-level Layout

```
cheetaxi/
├── apps/                       # Deployable applications
│   ├── api/                    # NestJS backend (the brain)
│   ├── web-landing/            # Public marketing website (Next.js)
│   ├── web-admin/              # Operations dashboard (Next.js)
│   ├── web-dispatcher/         # Live dispatch console (Next.js)
│   ├── mobile-passenger/       # Passenger mobile app (Flutter)
│   └── mobile-driver/          # Driver mobile app (Flutter)
│
├── packages/                   # Shared libraries
│   ├── database/               # Prisma schema + client + seed
│   └── shared/                 # TypeScript domain types + DTOs
│
├── brand/                      # Brand assets (logos, icons, templates)
│   ├── logos/                  # SVG logos in variants
│   ├── app-store/              # App icons, splash screens
│   ├── social/                 # OpenGraph images, social cards
│   └── email-templates/        # HTML email templates
│
├── docs/                       # All documentation
│   ├── README.md               # Documentation index
│   ├── ARCHITECTURE.md
│   ├── PRD.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   ├── DEVELOPER_GUIDE.md
│   ├── QUICK_START.md
│   ├── OPERATIONS_MANUAL.md
│   ├── INCIDENT_RESPONSE.md
│   ├── BACKUP_STRATEGY.md
│   ├── BRAND_GUIDELINES.md
│   ├── CONTRIBUTING.md
│   ├── REPOSITORY_STRUCTURE.md
│   ├── ROADMAP.md
│   ├── CHANGELOG.md
│   ├── RELEASE_NOTES.md
│   ├── KNOWN_LIMITATIONS.md
│   ├── LAUNCH_CHECKLIST.md
│   ├── TESTING_REPORT.md
│   ├── SECURITY_AUDIT.md
│   ├── PERFORMANCE_REPORT.md
│   └── LICENSE.md
│
├── infra/                      # Infrastructure as Code
│   ├── kubernetes/             # K8s manifests
│   │   └── production.yaml
│   └── terraform/              # AWS IaC
│       ├── main.tf
│       └── production.tfvars
│
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD pipeline
│
├── .env.example                # Environment variable template
├── .gitignore
├── .prettierrc
├── tsconfig.base.json          # Shared TypeScript config
├── turbo.json                  # Turborepo pipeline
├── pnpm-workspace.yaml         # pnpm workspace config
├── package.json                # Root package.json
├── docker-compose.yml          # Local dev: Postgres + Redis + OpenSearch + Mailhog
├── docker-compose.full.yml     # Full stack local
├── LICENSE                     # Proprietary license
├── README.md                   # Project overview + Executive Order
└── CONTRIBUTING.md             # Pointer to docs/CONTRIBUTING.md
```

## Application Layout

### apps/api (NestJS Backend)

```
apps/api/
├── src/
│   ├── main.ts                 # Bootstrap — Swagger, CORS, helmet, pipes
│   ├── app.module.ts           # Root module — imports all feature modules
│   │
│   ├── auth/                   # Authentication
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts  # /auth/signup, /auth/login, /auth/otp/*, /auth/refresh
│   │   ├── auth.service.ts     # Token issuance, refresh rotation
│   │   ├── jwt.strategy.ts     # Passport JWT validation
│   │   ├── jwt-auth.guard.ts   # JWT auth guard
│   │   ├── otp.service.ts      # OTP generation + SMS dispatch (Twilio / AT / console)
│   │   └── dto.ts
│   │
│   ├── users/                  # User CRUD, role assignment, GDPR deletion
│   ├── passengers/             # Passenger profiles, saved places, favorites
│   ├── drivers/                # Onboarding, KYC, live location, earnings
│   ├── vehicles/               # Registration, verification, active selection
│   ├── fleets/                 # Corporate / government / partner fleet mgmt
│   ├── trips/                  # Trip lifecycle (request → complete → cancel)
│   ├── dispatch/               # Nearby-driver search + sequential offering
│   ├── pricing/                # Fare quotes, surge zones, promo codes
│   ├── geo/                    # Geocoding, reverse geocoding, geofences
│   ├── subscriptions/          # Plan catalog, purchase, activation
│   ├── payments/               # Stripe / Chapa / Telebirr / Cash / Wallet
│   ├── wallets/                # Atomic wallet transactions
│   ├── notifications/          # Push / SMS / Email / In-app
│   ├── sos/                    # Safety alerts
│   ├── support/                # Tickets + messages
│   ├── ratings/                # Two-way ratings
│   ├── promotions/             # Promo codes + referrals
│   ├── audit/                  # Immutable audit log
│   ├── stats/                  # Platform stats for admin dashboard
│   ├── health/                 # Liveness + readiness probes
│   │
│   └── common/
│       ├── prisma.module.ts    # Global Prisma module
│       ├── prisma.service.ts
│       ├── redis.module.ts     # Global Redis module
│       ├── redis.service.ts    # Geo commands, distributed locks
│       ├── decorators/         # @Roles, @Permissions, @CurrentUser
│       ├── guards/             # RolesGuard, PermissionsGuard
│       ├── interceptors/       # Logging, transform
│       ├── filters/            # HttpExceptionFilter (Prisma-aware)
│       ├── services/           # RoleService (RBAC + ABAC)
│       └── dto/                # PaginationDto, GeoPointDto, etc.
│
├── test/                       # Jest unit tests
│   ├── setup.ts
│   ├── geo.service.spec.ts
│   ├── otp.service.spec.ts
│   ├── pricing.service.spec.ts
│   ├── roles.guard.spec.ts
│   └── http-exception.filter.spec.ts
│
├── Dockerfile                  # Multi-stage production image
├── nest-cli.json
├── package.json
├── tsconfig.json
└── jest.config.js
```

### apps/web-landing (Next.js Marketing)

```
apps/web-landing/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout — fonts, metadata
│   │   ├── page.tsx            # Home page (assembles components)
│   │   ├── globals.css         # Tailwind base + component classes
│   │   ├── robots.ts           # robots.txt generation
│   │   └── sitemap.ts          # sitemap.xml generation
│   ├── components/
│   │   ├── navbar.tsx
│   │   ├── hero.tsx
│   │   ├── stats-bar.tsx
│   │   ├── passenger-cta.tsx
│   │   ├── driver-cta.tsx
│   │   ├── transport-modes.tsx
│   │   ├── subscription-plans.tsx
│   │   ├── africa-first.tsx
│   │   ├── safety.tsx
│   │   ├── faq.tsx
│   │   └── footer.tsx
│   ├── lib/
│   │   └── api.ts              # API client (rarely used — landing is static)
│   └── styles/
│       └── globals.css
├── public/
│   └── favicon.svg
├── Dockerfile
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

### apps/web-admin (Next.js Dashboard)

```
apps/web-admin/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Redirects to /dashboard or /login
│   │   ├── globals.css
│   │   ├── login/
│   │   │   └── page.tsx        # Phone + password login
│   │   └── dashboard/
│   │       ├── layout.tsx      # Sidebar + user menu
│   │       ├── page.tsx        # Overview (live stats from /stats/platform)
│   │       ├── drivers/        # Pending approvals + all drivers
│   │       ├── users/          # User search + role management
│   │       ├── trips/          # Trip table
│   │       ├── subscriptions/  # All subscriptions
│   │       ├── finance/        # KPIs + transactions
│   │       ├── support/        # Support tickets
│   │       ├── safety/         # Active SOS alerts
│   │       ├── audit/          # Audit log viewer
│   │       └── settings/       # Pricing, feature flags, integrations
│   └── lib/
│       └── api.ts              # Auth-aware API client
├── Dockerfile
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### apps/web-dispatcher (Next.js Console)

```
apps/web-dispatcher/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Live driver map + driver roster
│   │   └── globals.css         # Dark theme
│   └── lib/
│       └── api.ts              # Token-shared with admin
├── Dockerfile
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### apps/mobile-passenger (Flutter)

```
apps/mobile-passenger/
├── lib/
│   ├── main.dart               # App entry + theme
│   ├── theme/
│   │   └── app_colors.dart     # Brand color palette
│   ├── services/
│   │   └── api_client.dart     # Dio-based HTTP + token refresh
│   └── screens/
│       ├── splash_screen.dart
│       ├── auth_screen.dart    # Phone entry
│       ├── otp_verify_screen.dart
│       ├── home_screen.dart    # Map + ride mode selection
│       └── ride_request_sheet.dart
├── android/                    # Android manifest, Gradle, signing config
├── ios/                        # Info.plist, AppDelegate, signing
├── pubspec.yaml
└── README.md
```

### apps/mobile-driver (Flutter)

```
apps/mobile-driver/
├── lib/
│   ├── main.dart
│   ├── theme/
│   │   └── app_colors.dart
│   ├── services/
│   │   └── api_client.dart     # Driver-specific API + location broadcasting
│   └── screens/
│       ├── splash_screen.dart
│       ├── auth_screen.dart
│       ├── otp_verify_screen.dart
│       ├── onboarding_screen.dart  # 6-step onboarding flow
│       └── home_screen.dart         # Map + online toggle + earnings
├── android/
├── ios/
└── pubspec.yaml
```

## Packages

### packages/database

```
packages/database/
├── prisma/
│   ├── schema.prisma           # 40+ models, 18 enums — single source of truth
│   ├── seed.ts                 # Pricing tiers, plans, super admin, templates
│   └── migrations/             # Auto-generated by Prisma migrate
├── src/
│   └── index.ts                # Prisma client singleton (dev hot-reload safe)
├── package.json
└── tsconfig.json
```

### packages/shared

```
packages/shared/
├── src/
│   ├── index.ts                # Domain types + DTOs + constants
│   └── index.spec.ts           # Unit tests for domain types
├── jest.config.js
├── package.json
└── tsconfig.json
```

## Infra

### infra/kubernetes

- `production.yaml` — Namespace, ConfigMap, Deployments (API, web-landing, web-admin, web-dispatcher, Redis), Services, Ingress, HPA, PVC

### infra/terraform

- `main.tf` — VPC, Aurora PostgreSQL, ElastiCache Redis, EKS cluster
- `production.tfvars` — Environment-specific variables

## Configuration Files

| File                  | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `.env.example`        | Template for all environment variables             |
| `.gitignore`          | Ignores node_modules, .next, .env, Flutter build   |
| `.prettierrc`         | Code formatter config (single quotes, 100 chars)   |
| `tsconfig.base.json`  | Shared TypeScript strict config                    |
| `turbo.json`          | Turborepo build/dev/test pipeline                  |
| `pnpm-workspace.yaml` | Declares `apps/*` and `packages/*` as workspaces   |
| `package.json`        | Root scripts: build, dev, test, lint, db:*         |

## File Naming Conventions

- **TypeScript source files:** `kebab-case.ts` for utilities, `<PascalCase>.module.ts` / `.service.ts` / `.controller.ts` for NestJS
- **React components:** `kebab-case.tsx`
- **Flutter screens:** `snake_case.dart`
- **Documentation:** `UPPER_CASE_WITH_UNDERSCORES.md`
- **Tests:** `<name>.spec.ts` (unit), `<name>.e2e-spec.ts` (e2e)

## Where to Find Things

| I want to...                                | Look in...                                   |
| ------------------------------------------- | -------------------------------------------- |
| Add a new API endpoint                      | `apps/api/src/<module>/`                     |
| Add a new database model                    | `packages/database/prisma/schema.prisma`     |
| Change the marketing landing page           | `apps/web-landing/src/components/`           |
| Add an admin dashboard page                 | `apps/web-admin/src/app/dashboard/`          |
| Change the dispatch map                     | `apps/web-dispatcher/src/app/page.tsx`       |
| Add a passenger app screen                  | `apps/mobile-passenger/lib/screens/`         |
| Add a driver app screen                     | `apps/mobile-driver/lib/screens/`            |
| Change the brand color                      | `apps/web-landing/tailwind.config.js` + `brand/logos/` |
| Add a CI step                               | `.github/workflows/ci.yml`                   |
| Update production infrastructure            | `infra/terraform/main.tf`                    |
| Add a new K8s deployment                    | `infra/kubernetes/production.yaml`           |
| Find what's planned next                    | `docs/ROADMAP.md`                            |
| Understand the system                       | `docs/ARCHITECTURE.md`                       |
| Deploy to production                        | `docs/DEPLOYMENT.md`                         |
