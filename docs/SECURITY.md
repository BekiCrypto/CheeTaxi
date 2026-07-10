# CheeTaxi — Security Handbook

> Zero Trust. Encryption everywhere. Defense in depth.

## 1. Threat Model

CheeTaxi processes:
- Personal identifiable information (PII): names, phone numbers, emails, locations
- Financial data: payment tokens, wallet balances, transaction history
- Sensitive operational data: driver license numbers, vehicle registrations, background checks
- Real-time location data: live driver and passenger positions

Primary threat actors:
- **Account takeover (ATO)** — credential stuffing, SIM-swap, OTP interception
- **Payment fraud** — stolen cards, fake refunds, wallet abuse
- **Driver fraud** — fake trips, GPS spoofing, account sharing
- **Data exfiltration** — insider threat, SQL injection, API abuse
- **DDoS** — volumetric and application-layer
- **Regulatory** — GDPR, local data residency, tax compliance

## 2. Authentication

### 2.1 Password authentication
- bcrypt with cost factor 12
- Strong-password validation (min 8 chars, mixed case + number)
- Account lockout after 5 failed attempts (15-min cooldown)

### 2.2 OTP authentication (primary)
- 6-digit cryptographically-random code
- 5-minute TTL
- Max 5 verification attempts per code
- Rate limit: 10 OTP requests per phone per hour, 60s cooldown between requests
- Code is single-use — invalidated after success or expiry

### 2.3 Token rotation
- Access token: 15-minute TTL, JWT signed with HS256
- Refresh token: 30-day TTL, stored as bcrypt hash in `UserSession` table
- **Every refresh rotates the refresh token** — old token is revoked
- On logout, all sessions for the user can be revoked

### 2.4 MFA (admin accounts)
- TOTP-based MFA for SUPER_ADMIN, PLATFORM_ADMIN, FINANCE roles
- Stored as encrypted secret in `user.mfaSecret`

## 3. Authorization

### 3.1 RBAC + ABAC
- 19 roles defined in `UserRole` enum
- Roles are scoped (e.g. `OPERATIONS:city:addis_ababa`)
- Fine-grained permissions: `trips:read`, `drivers:approve`, `subscriptions:refund`
- Permissions can be resource-scoped (e.g. `fleet:manage:fleet_abc`)

### 3.2 Guards
- `JwtAuthGuard` — verifies access token on every request
- `RolesGuard` — checks role-based access via `@Roles()` decorator
- `PermissionsGuard` — checks permission-based access via `@Permissions()` decorator
- `ThrottlerGuard` — rate-limits every endpoint

### 3.3 Role/permission caching
- User access (roles + permissions) cached in Redis for 60 seconds
- Cache invalidated on role/permission change
- Sub-millisecond authorization checks

## 4. API Security

### 4.1 Rate limiting
- 600 requests/minute/IP (default)
- 30 requests/second/IP burst (sliding window)
- Stricter limits on auth endpoints (10/hour for OTP)

### 4.2 Input validation
- `ValidationPipe` with `whitelist: true` + `forbidNonWhitelisted: true` on every controller
- All DTOs use class-validator with explicit rules
- No `any` types in DTOs

### 4.3 HTTP headers
- `helmet` middleware sets:
  - `Content-Security-Policy`
  - `Strict-Transport-Security` (max-age=1 year, includeSubDomains, preload)
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`

### 4.4 CORS
- Whitelisted origins only (landing, admin, dispatcher, mobile via capacitor scheme)
- Credentials allowed for cookie-based flows
- Preflight cached for 1 hour

## 5. Data Security

### 5.1 Encryption in transit
- TLS 1.3 everywhere (Cloudflare → origin, origin → DB, origin → Redis)
- HSTS preload list

### 5.2 Encryption at rest
- PostgreSQL: Aurora encryption with AWS KMS-managed keys
- Redis: ElastiCache at-rest encryption
- S3: SSE-KMS
- Backups: encrypted

### 5.3 PII handling
- Phone numbers: indexed but truncated in audit logs (`+251***...`)
- Emails: hashed in indexes
- Passwords: bcrypt, never logged, never returned in API responses
- Deleted accounts: PII wiped within 30 days (GDPR Article 17)

### 5.4 Secrets management
- All secrets stored in AWS Secrets Manager
- Injected into pods via Kubernetes secrets (encrypted at rest with KMS)
- Rotated quarterly for DB credentials, JWT signing keys, payment provider keys
- No secrets in code, git, or CI logs

## 6. Fraud Detection

### 6.1 Driver fraud
- GPS spoofing detection — cross-check device GPS with cell tower triangulation
- Unrealistic trip completion times flagged for review
- Multiple accounts on same device → block + manual review
- Acceptance rate anomalies → investigate

### 6.2 Payment fraud
- Velocity checks — max N transactions per user per hour
- Geographic anomalies — IP geolocation vs. billing address
- Stolen card database cross-reference (Stripe Radar)
- Refund abuse pattern detection

### 6.3 Account takeover
- New device login → require OTP re-verification
- Impossible travel detection (login from Ethiopia, then 5 min later from Nigeria)
- Failed login rate per account triggers lockout

## 7. SOS / Safety

- One-tap SOS button in passenger and driver apps
- Triggers immediate notification to:
  - All users with `SAFETY` or `SUPER_ADMIN` role
  - Local emergency services integration (per country)
- Captures: live location, trip details (if any), driver/passenger info
- Safety team SLA: acknowledge within 60 seconds
- Audio recording upload (opt-in by user)

## 8. Audit & Compliance

### 8.1 Audit log
- Every privileged action is recorded: `AuditAction`, `resource`, `resourceId`, `before`, `after`, `ipAddress`, `userAgent`
- Audit logs are **append-only** — no UPDATE or DELETE operations allowed
- Retained for 7 years (financial regulation compliance)

### 8.2 GDPR
- Data subject rights implemented:
  - **Access**: `GET /users/me` returns all stored data
  - **Portability**: `GET /users/me/export` returns JSON dump
  - **Rectification**: `PATCH /users/me`
  - **Erasure**: `DELETE /users/me` schedules deletion within 30 days
  - **Objection**: opt-out of marketing in settings
- Data Processing Agreements (DPAs) with all sub-processors

### 8.3 SOC 2 readiness
- Access controls: RBAC + MFA + audit logs
- Change management: PR review required, CI gates, no direct production deploys
- Incident response: runbook + on-call rotation + postmortems
- Vulnerability management: automated dependency scanning (Dependabot) + monthly manual review

## 9. Infrastructure Security

### 9.1 Network
- VPC with private subnets for all data stores
- NAT gateways for outbound traffic
- Security groups: deny by default, allow by least privilege
- No public IPs on databases or Redis

### 9.2 Kubernetes
- IRSA (IAM Roles for Service Accounts) — no static AWS credentials in pods
- Network policies restrict pod-to-pod communication
- Pod Security Standards: `restricted` profile enforced
- Read-only root filesystem on all containers
- Non-root user (UID 1001)

### 9.3 CI/CD
- `GITHUB_TOKEN` used for GHCR pushes — no long-lived PATs
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` stored as GitHub secrets, rotated quarterly
- Branch protection on `main`: required reviews, required status checks, no force pushes

## 10. Incident Response

### Severity levels
- **SEV-1**: Production outage, data breach, or active safety incident — page on-call, all-hands response
- **SEV-2**: Major feature broken, performance degraded — on-call responds within 1 hour
- **SEV-3**: Minor bug, workaround available — fix in next release

### Runbook (SEV-1)
1. Acknowledge alert in PagerDuty (5 min)
2. Open incident channel in Slack
3. Assign Incident Commander + Communications Lead
4. Assess scope: which users, which regions, which features
5. Mitigate: rollback, scale up, block traffic, revoke tokens
6. Communicate: status page update within 15 min
7. Resolve: confirm recovery, close incident channel
8. Postmortem within 48 hours — blameless, action items tracked

## 11. Vulnerability Disclosure

- Security contact: `security@cheetaxi.africa`
- PGP key published on `/security` page
- Bug bounty program (planned)
- Response SLA: 24 hours to acknowledge, 7 days to fix critical issues
