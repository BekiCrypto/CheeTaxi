# CheeTaxi — Launch Checklist

> Every item must be ✅ before production launch. No exceptions.

This checklist is the final gate. The platform is NOT launch-ready until every box is checked.

## 1. Infrastructure (15 items)

- [ ] AWS account provisioned with billing alerts
- [ ] Terraform state bucket created (`cheetaxi-terraform-state`) with versioning + encryption
- [ ] Terraform locks DynamoDB table created (`cheetaxi-terraform-locks`)
- [ ] `terraform apply` succeeds for production environment
- [ ] Aurora PostgreSQL cluster healthy (2 instances, multi-AZ)
- [ ] ElastiCache Redis cluster healthy (3 nodes, multi-AZ)
- [ ] EKS cluster healthy (3+ nodes)
- [ ] VPC peering / transit gateway configured if needed
- [ ] Cloudflare DNS configured (cheetaxi.africa, api., admin., dispatch.)
- [ ] Cloudflare WAF rules enabled (OWASP core rule set)
- [ ] Cloudflare "Under Attack" mode available (not enabled by default)
- [ ] SSL certificates issued by cert-manager (Let's Encrypt)
- [ ] K8s secrets created (`cheetaxi-secrets` with all env vars)
- [ ] K8s ConfigMap created (`cheetaxi-config`)
- [ ] Ingress controller (nginx-ingress) deployed and healthy

## 2. Database (8 items)

- [ ] `prisma migrate deploy` succeeds in production
- [ ] Seed script run (`pnpm db:seed`)
- [ ] Super admin password changed from default (`ChangeMe!2025`)
- [ ] All pricing tiers verified for launch city
- [ ] All subscription plans verified
- [ ] All feature flags in correct state (food_delivery, parcel_delivery, intercity = true; rental, autonomous_vehicles, new_pricing_v2 = false)
- [ ] Geofence for launch city created and verified
- [ ] Backups: Aurora automated backups enabled (14-day retention minimum)

## 3. API (12 items)

- [ ] `GET /health` returns 200
- [ ] `GET /health/ready` returns 200 with all checks `ok`
- [ ] Swagger docs accessible at `https://api.cheetaxi.africa/docs` (or disabled in prod)
- [ ] Authentication works: phone OTP → access token → API call
- [ ] Rate limiting enforced (test with rapid requests)
- [ ] CORS configured (only allowed origins)
- [ ] Helmet headers present (`Strict-Transport-Security`, `X-Frame-Options`, etc.)
- [ ] All endpoints return the standard response envelope
- [ ] Error responses include proper HTTP status + error code
- [ ] Audit log records privileged actions
- [ ] WebSocket endpoint (when implemented) requires auth
- [ ] API uptime monitored (Synthetic check every 30s)

## 4. Web Applications (12 items)

### Landing
- [ ] Loads in < 3 seconds (LCP)
- [ ] SEO metadata present (title, description, OG tags)
- [ ] sitemap.xml accessible
- [ ] robots.txt accessible
- [ ] All sections render correctly (hero, pricing, FAQ, footer)
- [ ] Mobile responsive verified on iOS Safari + Android Chrome
- [ ] No broken links
- [ ] No Lorem Ipsum
- [ ] No placeholder images
- [ ] Favicon displays correctly
- [ ] OpenGraph image displays when shared on social media
- [ ] Lighthouse score > 90 (Performance, Accessibility, Best Practices, SEO)

### Admin Dashboard
- [ ] Login works with super admin credentials
- [ ] All 10 sections render with real data
- [ ] Driver approval flow works end-to-end
- [ ] SOS alert monitoring works
- [ ] Audit log viewer works
- [ ] Role-based access enforced (test with non-admin user)
- [ ] Logout clears tokens and redirects to login

### Dispatcher Console
- [ ] Auth-required screen displays when not logged in
- [ ] Live driver map renders
- [ ] Driver roster populates from `/drivers/nearby`
- [ ] Online / on-trip / searching counters update

## 5. Mobile Apps (16 items)

### Passenger App
- [ ] App builds for Android (`flutter build apk --release`)
- [ ] App builds for iOS (`flutter build ios --release`) — requires macOS
- [ ] Splash screen displays correctly
- [ ] Phone OTP login works
- [ ] Map renders with current location
- [ ] Ride mode selection works
- [ ] Trip request creates a trip in the database
- [ ] Fare estimate displays correctly
- [ ] Trip sharing via link works
- [ ] Push notifications received (when FCM configured)
- [ ] Deep links work (`cheetaxi://trip/{id}`)
- [ ] App icon displays correctly on home screen
- [ ] No crash on startup (verified on 3+ physical devices)
- [ ] Offline behavior graceful (no white screen)

### Driver App
- [ ] All passenger app checks
- [ ] Onboarding flow completes
- [ ] Online/offline toggle updates server
- [ ] Background location broadcasting works (every 5s)
- [ ] Battery impact reasonable (< 5% per hour when online)
- [ ] Driver receives trip offers (when dispatched)

## 6. End-to-End Workflow Validation (15 items)

- [ ] Passenger registers via phone OTP
- [ ] Driver onboards and is approved by admin
- [ ] Driver purchases a subscription
- [ ] Driver goes online
- [ ] Passenger requests a ride
- [ ] Driver receives and accepts the offer
- [ ] Driver arrives at pickup
- [ ] Driver starts the trip
- [ ] Driver completes the trip
- [ ] Passenger rates the driver
- [ ] Driver rates the passenger
- [ ] Passenger receives an invoice
- [ ] Driver's wallet is credited
- [ ] Driver requests a withdrawal
- [ ] Finance officer processes the withdrawal

## 7. Security (12 items)

- [ ] All secrets in AWS Secrets Manager (not in env files or git)
- [ ] JWT_SECRET is a strong 256-bit random value
- [ ] No test accounts with default passwords
- [ ] No debug endpoints exposed (Swagger disabled in prod or auth-protected)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] HSTS header present
- [ ] CSP header present
- [ ] SQL injection prevention verified (Prisma parameterized queries)
- [ ] XSS prevention verified (React escapes by default, no dangerouslySetInnerHTML)
- [ ] CSRF protection for cookie-based flows (if any)
- [ ] Rate limiting tested (block IPs that exceed limits)
- [ ] Dependency scan passed (`pnpm audit` shows no high-severity vulnerabilities)

## 8. Performance (8 items)

- [ ] API p99 latency < 200ms for read endpoints
- [ ] API p99 latency < 500ms for write endpoints
- [ ] Database queries use indexes (no sequential scans on hot paths)
- [ ] Redis hit rate > 90% for cached keys
- [ ] Web landing Lighthouse Performance > 90
- [ ] Mobile app cold start < 3 seconds
- [ ] Load test: 10K concurrent users with < 1% error rate
- [ ] Load test: 1K RPS sustained for 30 minutes with < 500ms p99

## 9. Observability (8 items)

- [ ] Prometheus scraping API metrics
- [ ] Grafana dashboard for API (RPS, latency, error rate)
- [ ] Grafana dashboard for trips (funnel, completion rate)
- [ ] Grafana dashboard for drivers (online count, utilization)
- [ ] Sentry capturing frontend + backend errors
- [ ] OpenTelemetry tracing exported
- [ ] Log aggregation (OpenSearch / ELK) receiving structured logs
- [ ] Alerting rules configured (PagerDuty for SEV-1, Slack for SEV-2/3)

## 10. Backups & DR (6 items)

- [ ] Aurora automated backups verified (restore test passed)
- [ ] Daily snapshot to standby region verified
- [ ] Redis snapshot verified
- [ ] S3 cross-region replication verified
- [ ] DR drill completed (simulate region failure, verify RTO < 4 hours)
- [ ] Restore procedures documented and tested

## 11. Documentation (10 items)

- [ ] All 22 docs in `docs/` reviewed and current
- [ ] API documentation matches actual API
- [ ] Quick Start guide tested by a new team member
- [ ] Operations Manual reviewed by ops team
- [ ] Incident Response guide reviewed by on-call engineers
- [ ] Backup Strategy reviewed by SRE
- [ ] Security Handbook reviewed by security team
- [ ] Brand Guidelines reviewed by marketing
- [ ] Launch Checklist (this document) signed off by Founder
- [ ] Public-facing docs (Privacy Policy, Terms of Service) reviewed by Legal

## 12. Legal & Compliance (8 items)

- [ ] Privacy Policy published at `cheetaxi.africa/privacy`
- [ ] Terms of Service published at `cheetaxi.africa/terms`
- [ ] Cookie Policy published at `cheetaxi.africa/cookies`
- [ ] Data Processing Agreements signed with all sub-processors (Stripe, Twilio, Firebase, AWS)
- [ ] Driver agreements template approved by Legal
- [ ] Corporate / Fleet contract template approved by Legal
- [ ] Insurance coverage confirmed (general liability, cyber, D&O)
- [ ] Ethiopian transport regulator approval (if required)

## 13. Marketing & Launch (10 items)

- [ ] Landing page live at `cheetaxi.africa`
- [ ] Press release drafted and approved
- [ ] Social media accounts created (Twitter/X, LinkedIn, Instagram, Telegram)
- [ ] First 10 social posts scheduled
- [ ] Driver recruitment campaign ready (Facebook + Instagram ads)
- [ ] Passenger referral program configured (free first ride)
- [ ] Driver referral program configured
- [ ] Influencer partnerships confirmed (3+ Ethiopian creators)
- [ ] App Store + Play Store listings approved and published
- [ ] Status page live at `status.cheetaxi.africa`

## 14. Team & Operations (8 items)

- [ ] 24/7 safety operations team staffed (minimum 2 per shift)
- [ ] Support team trained on the platform
- [ ] On-call rotation configured in PagerDuty
- [ ] All engineers have AWS + K8s access
- [ ] All ops staff have admin dashboard access with appropriate roles
- [ ] Daily operations report automated
- [ ] Weekly executive report automated
- [ ] First incident response drill completed

## 15. Go-Live Readiness (5 items)

- [ ] All sections above signed off
- [ ] Soft launch with 50 drivers + 500 passengers for 1 week
- [ ] Soft launch metrics reviewed (no SEV-1 incidents, < 5% crash rate)
- [ ] Founder signs the Launch Authorization document
- [ ] Public launch announced

---

## Sign-off

| Role                  | Name                | Date       | Signature |
| --------------------- | ------------------- | ---------- | --------- |
| Founder / CEO         |                     |            |           |
| Engineering Lead      |                     |            |           |
| Operations Lead       |                     |            |           |
| Security Lead         |                     |            |           |
| Legal Counsel         |                     |            |           |

Once all 5 signatures are obtained, the platform is authorized for public launch.

---

**Total items: 153**

Every box must be checked. No exceptions. No "we'll fix it after launch." If an item cannot be checked, the launch is delayed until it can be.
