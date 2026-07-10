# CheeTaxi — Developer Guide

## 1. Getting Started

### Prerequisites
- Node.js 20+ (`node --version`)
- pnpm 9+ (`npm install -g pnpm`)
- Docker + Docker Compose
- Git
- (Mobile) Flutter 3.22+ + Dart 3.4+
- (Mobile) Android Studio or Xcode

### Setup (5 minutes)

```bash
git clone https://github.com/BekiCrypto/CheeTaxi.git
cd CheeTaxi
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate
pnpm --filter @cheetaxi/database exec prisma migrate dev --name init
pnpm db:seed
pnpm dev
```

Open in your editor:
- API Swagger: http://localhost:4000/docs
- Landing: http://localhost:3000
- Admin: http://localhost:3001 (login with seeded super admin)
- Dispatcher: http://localhost:3002

## 2. Project Structure

See `docs/ARCHITECTURE.md` for the full layout. Key conventions:

### Monorepo
- `apps/*` — deployable applications
- `packages/*` — shared libraries consumed by apps
- `infra/*` — infrastructure as code
- `docs/*` — documentation

### App conventions
- Every app has its own `package.json`, `tsconfig.json`, `Dockerfile`
- Cross-package imports use workspace protocol: `"@cheetaxi/database": "workspace:*"`
- Build orchestration via Turborepo (`turbo.json`)

### API module conventions
Every domain module in `apps/api/src/<domain>/` follows:
```
<domain>.module.ts       # NestJS module definition
<domain>.controller.ts   # HTTP routes — thin, only validation + delegation
<domain>.service.ts      # Business logic
dto/                     # class-validator DTOs
```

## 3. Common Workflows

### 3.1 Add a new API endpoint

1. Add a method to the service:
```typescript
// apps/api/src/drivers/drivers.service.ts
async getDriverStats(driverId: string) {
  return this.prisma.driver.findUnique({ where: { id: driverId }, select: { ... } });
}
```

2. Add the controller method with proper decorators:
```typescript
@Get(':id/stats')
@Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'OPERATIONS')
@ApiOperation({ summary: 'Get driver statistics' })
stats(@Param('id') id: string) {
  return this.drivers.getDriverStats(id);
}
```

3. The Swagger docs auto-update on next dev server start.

### 3.2 Add a new database model

1. Edit `packages/database/prisma/schema.prisma`
2. Run: `pnpm --filter @cheetaxi/database exec prisma migrate dev --name add_<model>`
3. The Prisma client is regenerated automatically
4. Use the model in any service: `this.prisma.<modelName>.findMany(...)`

### 3.3 Add a new admin role

1. Add the role to the `UserRole` enum in `schema.prisma`
2. Run migration
3. Update `packages/shared/src/index.ts` `USER_ROLES` array
4. Use `@Roles('NEW_ROLE')` decorator on any controller method
5. Assign the role via `POST /users/:id/roles`

### 3.4 Add a new notification template

1. Add a row to `packages/database/prisma/seed.ts`
2. Use it from any service:
```typescript
await this.notifications.sendToUser(userId, {
  channel: 'PUSH',
  code: 'MY_NEW_CODE',
  vars: { name: 'Abebe' },
});
```

### 3.5 Add a new payment provider

1. Create an adapter class implementing `PaymentProviderAdapter` in `apps/api/src/payments/payments.service.ts`
2. Add a case to `getAdapter()` switch
3. Add a webhook route to `payments.controller.ts` if needed
4. Update the frontend to offer the new payment method

## 4. Code Style

### TypeScript
- Strict mode everywhere (`strict: true` in tsconfig)
- `noUncheckedIndexedAccess: true` (must check for undefined)
- No `any` types — use `unknown` + narrowing instead
- Prefer interfaces over types for object shapes
- Use `as const` for literal arrays/objects

### Naming
- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for React components
- Variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces/Classes: `PascalCase`
- Database tables: `snake_case` (Prisma handles this)
- Database columns: `camelCase` (Prisma default)

### Formatting
- Prettier config in `.prettierrc` (single quotes, trailing commas, 100 char width)
- Run `pnpm lint --fix` before committing

### Commits
Follow Conventional Commits:
```
feat: add surge pricing engine
fix: handle null driver on trip cancel
chore: bump NestJS to 10.4.1
docs: add API reference for /trips endpoint
refactor: extract geohash logic to GeoService
test: add e2e tests for trip lifecycle
```

## 5. Testing

### Unit tests
```bash
pnpm --filter @cheetaxi/api test
```

### E2E tests
```bash
pnpm --filter @cheetaxi/api test:e2e
```

### Coverage
```bash
pnpm --filter @cheetaxi/api test -- --coverage
```

Aim for:
- 80%+ line coverage on services
- 100% on guards and pipes
- Critical paths covered by e2e tests (auth flow, trip lifecycle, payment flow)

## 6. Mobile Development

### Run passenger app on Android emulator
```bash
cd apps/mobile-passenger
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000
```

`10.0.2.2` is the Android emulator's alias for the host machine's `localhost`.

### Run on a physical device
1. Enable USB debugging on the device
2. Find your LAN IP (e.g. `192.168.1.50`)
3. `flutter run --dart-define=API_BASE_URL=http://192.168.1.50:4000`

### Code generation
If you add JSON serializable models:
```bash
cd apps/mobile-passenger
dart run build_runner build --delete-conflicting-outputs
```

## 7. Debugging

### API logs
```bash
pnpm --filter @cheetaxi/api dev  # logs to stdout in pretty format
```

### Database inspection
```bash
pnpm --filter @cheetaxi/database db:studio  # opens Prisma Studio at http://localhost:5555
```

### Redis inspection
```bash
docker exec -it cheetaxi-redis redis-cli
> KEYS *
> GET user:access:abc123
```

### WebSocket events
Use the Swagger UI or connect with `wscat`:
```bash
wscat -c ws://localhost:4000/socket
```

## 8. Performance

### API response time targets
- Read endpoints: < 100ms p99
- Write endpoints: < 200ms p99
- Trip request → driver offer: < 5s
- Driver location update: < 50ms

### Database
- Every foreign key has an index (Prisma auto-creates)
- Every `@@index` declared explicitly in schema
- Use `select` in queries to avoid over-fetching
- Pagination enforced (max 100 items per page)

### Caching
- User access (roles + permissions): Redis, 60s TTL
- Pricing tiers: Redis, 5 min TTL
- Driver locations: Redis GEO set, 90s TTL on each entry
- Surge zones: Redis, 30s TTL

## 9. Git Workflow

### Branches
- `main` — production-ready, protected
- `develop` — staging branch for integration
- `feat/<scope>` — feature branches
- `fix/<scope>` — bugfix branches
- `hotfix/<scope>` — urgent production fixes

### Pull Requests
- Required for all changes to `main` and `develop`
- At least 1 approval required
- CI must pass (typecheck, lint, build, test)
- Squash-merge to `main` with conventional commit message

### Releases
- Tag releases with semver: `v1.0.0`, `v1.1.0`, `v2.0.0`
- GitHub Releases with auto-generated changelog
- Container images tagged with both `latest` and the git SHA

## 10. FAQ

**Q: How do I reset my local database?**
A: `pnpm --filter @cheetaxi/database exec prisma migrate reset`

**Q: The API is returning 401 — what do I do?**
A: Your access token expired. The client should auto-refresh using the refresh token. If refresh fails, re-login.

**Q: I changed the Prisma schema but the API doesn't see the new fields.**
A: Run `pnpm db:generate` to regenerate the Prisma client, then restart the dev server.

**Q: How do I test payment webhooks locally?**
A: Use Stripe CLI: `stripe listen --forward-to http://localhost:4000/payments/webhooks/stripe`

**Q: How do I add a new city?**
A: Add a `PricingTier` for that city via Prisma Studio or admin UI. Add a `Geofence` for the service area. Drivers in that city are automatically discovered by the dispatch engine.
