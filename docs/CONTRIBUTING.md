# CheeTaxi — Contribution Guide

Thank you for contributing to CheeTaxi. This document covers how to propose changes, the standards we expect, and how releases work.

## 1. Code of Conduct

Be respectful. Be inclusive. Be excellent to each other.

We do not tolerate harassment of any kind. Report incidents to `conduct@cheetaxi.africa`.

## 2. Getting Started

1. Read [QUICK_START.md](./QUICK_START.md) to set up your development environment
2. Read [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for code style and conventions
3. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system

## 3. Issues

- Search existing issues before opening a new one
- Use the issue templates (bug report, feature request, security report)
- For security vulnerabilities, email `security@cheetaxi.africa` directly — do NOT open a public issue

## 4. Pull Requests

### 4.1 Branch naming
- `feat/<scope>` — new feature
- `fix/<scope>` — bug fix
- `chore/<scope>` — maintenance, dependency bumps
- `docs/<scope>` — documentation only
- `refactor/<scope>` — code refactoring without behavior change
- `test/<scope>` — adding tests

### 4.2 PR checklist

Before requesting review, verify:

- [ ] Code passes `pnpm lint`
- [ ] Code passes `pnpm typecheck`
- [ ] Code passes `pnpm test`
- [ ] New code has unit tests
- [ ] Public API changes are documented in the PR description
- [ ] Database schema changes include a Prisma migration
- [ ] No `console.log` left in production code
- [ ] No secrets, API keys, or credentials in the diff
- [ ] Commit messages follow Conventional Commits

### 4.3 Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add surge pricing engine

Implements a surge multiplier per geohash with TTL-based expiry.
Surge zones are stored in the SurgeZone table and queried by the
PricingService when computing fare quotes.

Closes #123
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, `build`

Use `!` for breaking changes: `feat!: change trip status enum values`

### 4.4 Review process

1. Open the PR against `develop` (or `main` for hotfixes)
2. Request review from at least one team member
3. Address review feedback — push new commits (do not force-push unless requested)
4. Once approved, a maintainer will squash-merge
5. Delete your branch after merge

### 4.5 Reviewer guidelines

When reviewing:
- Be kind. Critique the code, not the person.
- Be specific. "This is wrong" → "This will fail when X because Y. Consider doing Z."
- Be thorough. Read every line. Test the change locally if it's non-trivial.
- Be timely. Respond within 24 hours during business days.

Approve when:
- Code is correct and well-tested
- Code follows the conventions in DEVELOPER_GUIDE.md
- Public API changes are documented
- No security concerns

Request changes when:
- Bugs or potential bugs
- Missing tests
- Style/convention violations
- Documentation gaps for user-facing changes

## 5. Coding Standards

### 5.1 TypeScript
- Strict mode everywhere
- No `any` — use `unknown` and narrow
- Prefer interfaces over types for object shapes
- Use `as const` for literal arrays/objects
- Use `enum` sparingly — prefer union types when possible (but Prisma enums are fine)

### 5.2 React / Next.js
- Function components only
- Hooks for state and side effects
- Server components by default; client components only when needed (`'use client'`)
- No prop drilling beyond 2 levels — use context or state management

### 5.3 NestJS
- One module per domain
- Controllers are thin — only validation and delegation
- Services contain business logic
- Use DTOs with class-validator for all inputs
- Use guards for authz, interceptors for cross-cutting concerns

### 5.4 Flutter
- Riverpod for state management
- One file per screen
- Material 3 widgets with brand color overrides
- API client is a singleton

### 5.5 Database
- Every model has `createdAt` and `updatedAt`
- Every foreign key has an index
- Use enums for status fields
- Never store plaintext passwords or PII in logs

### 5.6 Tests
- Unit tests for all services (mock dependencies)
- Integration tests for critical paths (real DB)
- E2E tests for the trip lifecycle
- Aim for 80%+ line coverage on services
- Test names: `should <expected behavior> when <condition>`

## 6. Database Migrations

```bash
# Create a migration from schema changes
pnpm --filter @cheetaxi/database exec prisma migrate dev --name <descriptive_name>

# Apply pending migrations in production
pnpm --filter @cheetaxi/database exec prisma migrate deploy

# Never run prisma migrate reset in production — it destroys all data
```

Migrations are version-controlled in `packages/database/prisma/migrations/`. Never edit a migration that has been deployed — create a new one instead.

## 7. Releases

### 7.1 Versioning
We follow [Semantic Versioning](https://semver.org/):
- `MAJOR`: breaking changes (e.g. v1 → v2)
- `MINOR`: new features, backward-compatible
- `PATCH`: bug fixes, backward-compatible

### 7.2 Release process
1. Update `CHANGELOG.md` with all changes since the last release
2. Update version numbers in `package.json` files
3. Create a release PR against `main`
4. After merge, tag: `git tag v1.2.3 && git push --tags`
5. GitHub Actions builds and publishes Docker images to GHCR
6. Update the production deployment via `kubectl rollout restart`
7. Publish a GitHub Release with the changelog

### 7.3 Hotfixes
For urgent production fixes:
1. Branch from `main`: `hotfix/<description>`
2. Fix, test, open PR against `main`
3. Expedited review (1 reviewer, fast-track)
4. Merge → tag → deploy
5. Cherry-pick to `develop` if needed

## 8. License

By contributing, you agree that your contributions will be licensed under the CheeTaxi Proprietary License (see [LICENSE](./LICENSE)).

## 9. Recognition

All contributors are listed in `CONTRIBUTORS.md`. We appreciate every contribution, no matter how small.

## 10. Questions

- Engineering Slack: `#engineering`
- Email: `engineering@cheetaxi.africa`
- Office hours: Tuesdays 16:00 EAT (open to all contributors)
