# CheeTaxi — Documentation Index

> The most modern mobility platform designed for Africa.

## Documentation

### Getting Started
| Document | Purpose |
| -------- | ------- |
| [Quick Start](./QUICK_START.md) | 5-minute local setup |
| [Repository Structure](./REPOSITORY_STRUCTURE.md) | Directory map of the monorepo |
| [Developer Guide](./DEVELOPER_GUIDE.md) | Code conventions, workflows, FAQ |

### Architecture & Product
| Document | Purpose |
| -------- | ------- |
| [Architecture](./ARCHITECTURE.md) | System design, module map, data model, dispatch engine |
| [PRD](./PRD.md) | Product requirements, business model, success criteria |
| [API Reference](./API.md) | Every endpoint, request/response shapes, error codes |
| [Brand Guidelines](./BRAND_GUIDELINES.md) | Logo, colors, typography, voice |

### Operations
| Document | Purpose |
| -------- | ------- |
| [Operations Manual](./OPERATIONS_MANUAL.md) | Day-to-day ops procedures |
| [Incident Response](./INCIDENT_RESPONSE.md) | SEV-1 runbooks |
| [Backup Strategy](./BACKUP_STRATEGY.md) | Backup + DR procedures |
| [Deployment](./DEPLOYMENT.md) | Local, production, CI/CD, DR |

### Security & Compliance
| Document | Purpose |
| -------- | ------- |
| [Security Handbook](./SECURITY.md) | Threat model, auth, encryption, fraud, compliance |
| [Security Audit](./SECURITY_AUDIT.md) | OWASP Top 10 review |

### Quality
| Document | Purpose |
| -------- | ------- |
| [Testing Report](./TESTING_REPORT.md) | Test coverage status |
| [Performance Report](./PERFORMANCE_REPORT.md) | Performance benchmarks |

### Release
| Document | Purpose |
| -------- | ------- |
| [Launch Checklist](./LAUNCH_CHECKLIST.md) | 153-item pre-launch gate |
| [Release Notes](./RELEASE_NOTES.md) | v1.0.0 release notes |
| [Changelog](./CHANGELOG.md) | Version history |
| [Known Limitations](./KNOWN_LIMITATIONS.md) | Honest gaps |
| [Roadmap](./ROADMAP.md) | Phase 1 (done) through Phase 5 |

### Community
| Document | Purpose |
| -------- | ------- |
| [Contributing](./CONTRIBUTING.md) | PR process, code standards |
| [License](./LICENSE.md) | Proprietary license terms |

## Quick Links

- **Repository:** https://github.com/BekiCrypto/CheeTaxi
- **Live (when deployed):** https://cheetaxi.africa
- **Swagger (dev):** http://localhost:4000/docs
- **Status (planned):** https://status.cheetaxi.africa
- **Security contact:** security@cheetaxi.africa

## Tech Stack Summary

- **Frontend:** Next.js 14 + React 18 + TypeScript + Tailwind
- **Mobile:** Flutter 3
- **Backend:** NestJS 10 + TypeScript
- **Database:** PostgreSQL 16 (Aurora)
- **Cache/Queue:** Redis 7 (ElastiCache)
- **Search:** OpenSearch 2
- **Realtime:** WebSockets (Socket.IO) — Phase 2
- **Push:** Firebase Cloud Messaging
- **Maps:** Google Maps + OpenStreetMap + Mapbox (modular)
- **Payments:** Stripe + Chapa + Telebirr (modular, real adapters)
- **SMS:** Twilio + Africa's Talking (modular, real adapters)
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

## Honest Status

**Phase 1.5 — Foundation hardened**

What's done: full platform with real API, real web apps, real mobile apps, real infrastructure, real documentation, real brand assets, real tests, real audit reports.

What's deferred to Phase 2+: WebSocket realtime, mobile app store submission, full test coverage, load testing, mobile offline support, 9-language localization, third-party pen test.

See [Known Limitations](./KNOWN_LIMITATIONS.md) for the full honest accounting.
