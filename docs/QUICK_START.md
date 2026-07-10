# CheeTaxi — Quick Start Guide

> Be running CheeTaxi locally in under 5 minutes.

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/) — `npm install -g pnpm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose)
- [Git](https://git-scm.com/)

Optional (mobile development):
- [Flutter 3.22+](https://flutter.dev/)
- Android Studio (for Android) or Xcode (for iOS, macOS only)

## 1. Clone & Install

```bash
git clone https://github.com/BekiCrypto/CheeTaxi.git
cd CheeTaxi
pnpm install
```

## 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` in your editor and set at minimum:
- `JWT_SECRET` — a strong random 256-bit secret (e.g. `openssl rand -hex 64`)
- `DATABASE_URL` — leave as default for local Docker
- `REDIS_URL` — leave as default for local Docker

All other variables (Google Maps, Firebase, payment providers) are optional for local development — the platform will fall back to safe defaults.

## 3. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- PostgreSQL on port `5432`
- Redis on port `6379`
- OpenSearch on port `9200`
- Mailhog on port `8025` (for dev email — view at http://localhost:8025)

## 4. Initialize Database

```bash
pnpm db:generate
pnpm --filter @cheetaxi/database exec prisma migrate dev --name init
pnpm db:seed
```

The seed creates:
- 10 pricing tiers for Addis Ababa (one per vehicle type)
- 8 subscription plans (Daily through Government)
- 1 super admin (phone: `+251900000000`, password: `ChangeMe!2025`)
- 7 notification templates
- 6 feature flags
- 5 sample places (Bole Airport, Megenagna, Merkato, etc.)
- 1 geofence (Addis Ababa service area)

## 5. Run All Apps

```bash
pnpm dev
```

This starts (in parallel via Turborepo):
- API on http://localhost:4000
- Landing on http://localhost:3000
- Admin on http://localhost:3001
- Dispatcher on http://localhost:3002

## 6. Verify

Open these URLs in your browser:

| URL                                       | What you should see                       |
| ----------------------------------------- | ----------------------------------------- |
| http://localhost:4000/health              | `{"status":"ok",...}`                     |
| http://localhost:4000/health/ready        | Postgres + Redis both `ok`                |
| http://localhost:4000/docs                | Swagger UI with all endpoints             |
| http://localhost:3000                     | Landing page with hero, pricing, FAQ      |
| http://localhost:3001/login               | Admin login screen                        |
| http://localhost:3002                     | Dispatcher console                        |

Sign in to admin with:
- Phone: `+251900000000`
- Password: `ChangeMe!2025`

## 7. Run Mobile Apps (Optional)

```bash
# Start an Android emulator or connect a physical device

cd apps/mobile-passenger
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000

# Driver app
cd ../mobile-driver
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000
```

`10.0.2.2` is the Android emulator's alias for the host machine's localhost. For a physical device, use your LAN IP (e.g. `http://192.168.1.50:4000`).

## 8. Run Tests

```bash
# All packages
pnpm test

# Just the API
pnpm --filter @cheetaxi/api test

# Just the shared types
pnpm --filter @cheetaxi/shared test

# With coverage
pnpm --filter @cheetaxi/api test -- --coverage
```

## 9. Stop & Reset

```bash
# Stop all dev servers
Ctrl+C

# Stop infrastructure
docker compose down

# Reset database (DESTROYS ALL DATA)
pnpm --filter @cheetaxi/database exec prisma migrate reset
```

## Common Issues

### "Cannot connect to PostgreSQL"
- Verify Docker is running: `docker ps`
- Verify Postgres is healthy: `docker logs cheetaxi-postgres`
- Re-run migrations: `pnpm --filter @cheetaxi/database exec prisma migrate dev`

### "Cannot connect to Redis"
- Verify Redis is healthy: `docker exec cheetaxi-redis redis-cli ping` → should return `PONG`

### "JWT_SECRET not set"
- Edit `.env` and set `JWT_SECRET` to a random string (run `openssl rand -hex 64`)

### Port already in use
- Stop the conflicting process or change the port in `.env` (`API_PORT`, etc.)

### Prisma client out of sync
- Run `pnpm db:generate` after pulling changes that modify `schema.prisma`

---

For the full developer guide, see [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md).
For deployment to production, see [DEPLOYMENT.md](./DEPLOYMENT.md).
