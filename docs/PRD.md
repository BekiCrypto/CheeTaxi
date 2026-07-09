# CheeTaxi — Product Requirements Document

**Version:** 1.0
**Status:** Active — under autonomous development per the Founder Executive Order
**Source of truth:** `docs/PRD.md` (this file). Supersedes all lower-level specifications.

---

## 1. Vision

Build the most modern mobility platform designed for Africa — exceeding the quality of Uber, Bolt, Yango, InDrive, Little, and Lyft — while remaining affordable for emerging markets.

## 2. Mission

Launch first in **Ethiopia (Addis Ababa)**, scale to all 54 African countries without architectural redesign.

## 3. Target Scale

| Metric              | 1-year target | 5-year target |
| ------------------- | ------------- | ------------- |
| Countries live      | 5             | 54            |
| Cities              | 50            | Unlimited     |
| Drivers             | 100,000       | 10,000,000    |
| Passengers          | 1,000,000     | 100,000,000   |
| Concurrent requests | 100,000       | Millions      |
| Trips completed     | 50,000,000    | Billions      |

## 4. Business Model

### 4.1 Passengers — free forever
- No subscription
- No platform charges
- Pay only the trip fare (cash, card, wallet, corporate account)

### 4.2 Drivers — subscription only
- Pay one flat subscription (daily / weekly / monthly / quarterly / yearly / corporate / enterprise / government)
- **Keep 100% of every fare** — zero commission, zero per-trip deduction
- Unlimited rides, unlimited earnings

### 4.3 Revenue streams
1. Driver subscriptions (primary)
2. Corporate / Enterprise / Government fleet contracts
3. Delivery commissions (B2B merchants — opt-in)
4. Premium placement (driver heat-map priority, optional)

## 5. Product Suite

| Product                  | Platform       | Audience             | Status |
| ------------------------ | -------------- | -------------------- | ------ |
| Passenger App            | Android, iOS   | Passengers           | Scaffold complete |
| Driver App               | Android, iOS   | Drivers              | Scaffold complete |
| Dispatcher Console       | Web            | Operations team      | MVP complete |
| Operations Dashboard     | Web            | Admins, ops, finance | MVP complete |
| Super Admin Platform     | Web            | Super admins         | Merged with Ops Dashboard |
| Landing Website          | Web            | Public               | Production-ready |
| Marketing Website        | Web            | Public               | Merged with Landing |
| Corporate Portal         | Web            | Fleet managers       | Roadmap |
| Fleet Portal             | Web            | Fleet managers       | Roadmap |
| Business API             | REST           | Partners             | Available |
| Developer Portal         | Web            | Developers           | Roadmap |
| Support Portal           | Web            | Support agents       | Merged with Ops Dashboard |
| Knowledge Base           | Web            | Public               | Roadmap |
| Help Center              | Web            | Public               | Roadmap |
| Status Page              | Web            | Public               | Roadmap |
| Public API Documentation | Web            | Developers           | Swagger at `/docs` |
| Partner Portal           | Web            | Partners             | Roadmap |
| Merchant Portal          | Web            | Merchants            | Roadmap |
| Delivery Platform        | API + App      | Merchants, drivers   | Architecture ready |
| Analytics Platform       | Web            | Executives           | Roadmap |

## 6. Transport Modes

| Mode                | Use case                              |
| ------------------- | ------------------------------------- |
| Taxi                | Standard metered point-to-point rides |
| Ride Sharing        | Carpool with same-direction passengers |
| Motorcycle          | Beat traffic, fast, cheap             |
| Three Wheeler       | Bajaj / tuk-tuk for short hops        |
| Courier             | Send documents & small packages       |
| Food Delivery       | Restaurant delivery                   |
| Parcel Delivery     | E-commerce parcels                    |
| Medical Delivery    | Pharmacy, urgent medical              |
| Business Logistics  | B2B deliveries                        |
| Truck Delivery      | Move furniture, appliances            |
| Scheduled Trips     | Pre-book rides                        |
| Airport Transfers   | Flat-rate airport runs                |
| Corporate Transport | Centralized employee billing          |
| School Transport    | Verified drivers, parent tracking     |
| Rental              | Hourly / daily car rental             |
| Intercity           | Long-distance between cities          |
| Emergency Transport | Medical emergency dispatch            |
| Autonomous Vehicle  | Future — architecture ready           |

## 7. Core Principles

Every feature must satisfy:

- **Fast** — sub-second API responses, < 3s app cold-start
- **Secure** — zero-trust, encryption everywhere, OWASP Top 10
- **Scalable** — horizontally, multi-region, no architectural redesign for new countries
- **Fault Tolerant** — graceful degradation, circuit breakers, retries with backoff
- **Offline Friendly** — apps queue actions when offline, sync when reconnected
- **Cloud Native** — containerized, K8s-orchestrated, IaC-managed
- **Multi Region** — active-active ready, read replicas per region
- **Highly Available** — 99.95% uptime SLA target
- **Production Ready** — no placeholders, no mock data, no TODOs in shipped code

## 8. Tech Stack

| Layer       | Choice                                            |
| ----------- | ------------------------------------------------- |
| Frontend    | Next.js 14, React 18, TypeScript, Tailwind        |
| Mobile      | Flutter 3                                         |
| Backend     | NestJS 10, TypeScript                             |
| Database    | PostgreSQL 16 (Aurora)                            |
| Cache/Queue | Redis 7 (ElastiCache)                             |
| Search      | OpenSearch 2                                      |
| Realtime    | WebSockets (Socket.IO)                            |
| Push        | Firebase Cloud Messaging                          |
| Maps        | Google Maps + OpenStreetMap + Mapbox (modular)    |
| Payments    | Stripe + Chapa + Telebirr (modular)               |
| Identity    | JWT + Refresh tokens, OTP, OAuth/OIDC ready       |
| RBAC/ABAC   | Custom — fine-grained per-resource permissions    |
| Infra       | Docker, Kubernetes (EKS), Terraform, GitHub Actions |
| CDN/WAF     | Cloudflare                                        |
| Object Storage | S3                                             |
| Monitoring  | Prometheus + Grafana + OpenTelemetry + Sentry    |
| Logging     | ELK (OpenSearch + Fluent Bit)                     |

## 9. Africa-First Requirements

### 9.1 Languages (9 at launch)
English, Amharic (አማርኛ), Oromo (Afaan Oromoo), Tigrinya (ትግርኛ), Somali (Soomaali), Arabic (العربية), French (Français), Swahili (Kiswahili), Portuguese (Português)

### 9.2 Currencies
Every African currency supported — ETB, KES, NGN, GHS, ZAR, EGP, MAD, RWF, TZS, UGX, XOF, and USD as fallback.

### 9.3 Localization dimensions
- **Timezone aware** — every API call accepts timezone, every timestamp is stored in UTC and rendered in user timezone
- **Country aware** — pricing, regulations, payment providers vary per country
- **Tax aware** — VAT, withholding tax, and per-country tax rules in the Pricing Engine
- **Regulation aware** — driver license requirements, vehicle inspections, data residency per country

## 10. Security & Compliance

- Zero Trust architecture
- Encryption in transit (TLS 1.3) and at rest (AES-256)
- OWASP Top 10 compliance
- SOC2 readiness
- GDPR readiness (data subject rights: access, portability, deletion, rectification)
- Audit logs for every privileged action
- Rate limiting (per-IP and per-user)
- Secrets vault (AWS Secrets Manager)
- MFA for admin accounts
- Device trust scoring
- Fraud detection — anomaly detection on payments, login patterns, trip behavior
- Bot detection
- DDoS protection (Cloudflare)
- Data privacy — PII encrypted, access logged

## 11. User Experience

- Modern, minimal, accessible (WCAG 2.1 AA target)
- Responsive (web) and native-performant (mobile)
- Beautiful — premium feel without being heavy
- Dark mode + light mode
- Offline support — apps queue actions when offline
- Fast loading — Core Web Vitals "Good" on landing

## 12. Design System

- Complete design tokens (color, typography, spacing, motion, radius, shadow)
- Component library (buttons, inputs, cards, modals, sheets, toasts, skeletons)
- Typography — Plus Jakarta Sans (display) + Inter (body)
- Spacing — 4px base grid
- Motion — 200ms ease-out default
- Brand assets — logo, mascot, marketing graphics, social templates, pitch deck
- Brand guidelines — separate document

## 13. Success Criteria

The project shall not be considered complete until:

- [ ] Every application builds successfully
- [ ] Every automated test passes
- [ ] Every API is documented (Swagger)
- [ ] No placeholder exists
- [ ] No demo code exists
- [ ] No TODO remains
- [ ] Security review passes
- [ ] Performance targets pass (load test: 100K concurrent users)
- [ ] Accessibility passes (WCAG 2.1 AA)
- [ ] Production deployment succeeds
- [ ] Monitoring is operational
- [ ] Backups are configured and verified
- [ ] Recovery procedures are tested
- [ ] All applications are launch-ready

## 14. AI Autonomy

The AI Engineering Organization is authorized to make all engineering, architectural, UX, branding, infrastructure, deployment, testing, documentation, marketing, optimization, and operational decisions required to fulfill this PRD.

When multiple valid solutions exist, the AI shall select the option that maximizes: scalability, maintainability, performance, developer experience, security, business value, and long-term competitiveness.

This PRD supersedes all lower-level specifications and serves as the governing constitution for the CheeTaxi platform.
