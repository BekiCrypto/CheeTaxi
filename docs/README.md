# CheeTaxi — Documentation Index

> The most modern mobility platform designed for Africa.

## Documents

| Document | Purpose |
| -------- | ------- |
| [Founder Executive Order](../README.md) | The governing constitution — supersedes all specs |
| [Architecture](./ARCHITECTURE.md) | System design, module map, data model, dispatch engine |
| [PRD](./PRD.md) | Product requirements, business model, success criteria |
| [API Reference](./API.md) | Every endpoint, request/response shapes, error codes |
| [Deployment](./DEPLOYMENT.md) | Local dev, production, CI/CD, backups, DR |
| [Security](./SECURITY.md) | Threat model, auth, encryption, fraud, compliance |
| [Developer Guide](./DEVELOPER_GUIDE.md) | Setup, workflows, code style, testing, FAQ |
| [Roadmap](./ROADMAP.md) | What's done, what's in progress, what's planned |

## Quick Links

- **Live API (when deployed):** https://api.cheetaxi.africa
- **Swagger docs (dev):** http://localhost:4000/docs
- **Admin dashboard (when deployed):** https://admin.cheetaxi.africa
- **Status page (planned):** https://status.cheetaxi.africa
- **Security contact:** security@cheetaxi.africa

## Tech Stack Summary

- **Frontend:** Next.js 14 + React 18 + TypeScript + Tailwind
- **Mobile:** Flutter 3
- **Backend:** NestJS 10 + TypeScript
- **Database:** PostgreSQL 16 (Aurora)
- **Cache/Queue:** Redis 7 (ElastiCache)
- **Search:** OpenSearch 2
- **Realtime:** WebSockets (Socket.IO)
- **Push:** Firebase Cloud Messaging
- **Maps:** Google Maps + OpenStreetMap + Mapbox (modular)
- **Payments:** Stripe + Chapa + Telebirr (modular)
- **Infra:** Docker + Kubernetes (EKS) + Terraform + GitHub Actions
- **CDN/WAF:** Cloudflare

## Business Model

- **Passengers:** Free forever. No subscriptions. No platform charges.
- **Drivers:** Subscription only (Daily / Weekly / Monthly / Quarterly / Yearly / Corporate / Enterprise / Government). Unlimited rides. 100% of fares kept. Zero commission.

## Africa-First

- 9 languages at launch: English, Amharic, Oromo, Tigrinya, Somali, Arabic, French, Swahili, Portuguese
- All African currencies supported
- Timezone / country / tax / regulation aware
- Launches in Ethiopia, scales to all 54 African countries without architectural redesign
