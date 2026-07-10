# Contributing to CheeTaxi

See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for the full contribution guide.

Quick summary:
1. Fork & clone the repo
2. `pnpm install && docker compose up -d && pnpm db:generate && pnpm --filter @cheetaxi/database exec prisma migrate dev && pnpm db:seed`
3. Create a branch: `feat/<scope>` or `fix/<scope>`
4. Make your changes — follow code style in `docs/DEVELOPER_GUIDE.md`
5. Add tests for new code
6. Open a PR against `develop` (or `main` for hotfixes)

Email `engineering@cheetaxi.africa` with questions.
