# CheeTaxi — Operations Manual

> Day-to-day operations procedures for the CheeTaxi platform team.

## 1. Roles & On-Call

### 1.1 Operations team composition
- **Operations Lead** — owns the runbook, schedules on-call rotation
- **Dispatchers** (24/7) — monitor live trips, intervene on no-driver-found, escalate SOS
- **Safety Officers** (24/7) — acknowledge and resolve SOS alerts
- **Support Agents** (16/7, escalates to on-call after hours) — handle support tickets
- **Finance Officer** — approves driver withdrawals, reconciles payments
- **Compliance Officer** — approves driver KYC, handles regulator requests
- **SRE / On-Call Engineer** — paged for SEV-1 incidents

### 1.2 On-call rotation
- 7-day rotation, primary + secondary
- Primary is paged for all SEV-1 and SEV-2 incidents
- Secondary is paged if primary does not acknowledge within 5 minutes
- Schedule managed in PagerDuty
- Handoff: Monday 09:00 EAT — current on-call writes handoff note in `#ops-handoff` Slack channel

## 2. Daily Operations Checklist

### 2.1 Morning (08:00 EAT)
- [ ] Check Grafana dashboard for overnight anomalies
- [ ] Review Sentry for any new errors
- [ ] Check `#ops-alerts` Slack channel for SEV-2/3 incidents
- [ ] Verify database backup completed (check S3 `cheetaxi-backups/postgres/`)
- [ ] Review support ticket queue — escalate any SLA breaches
- [ ] Review driver onboarding queue — approve/reject pending drivers within 24h

### 2.2 Throughout the day
- [ ] Monitor dispatcher console for SOS alerts (acknowledge within 60s)
- [ ] Monitor trip funnel — if `noDriverFound` rate > 10%, investigate
- [ ] Monitor payment failure rate — if > 2%, investigate provider status
- [ ] Respond to support tickets within SLA (urgent: 1h, normal: 8h, low: 24h)

### 2.3 Evening (18:00 EAT)
- [ ] Generate daily operations report (sent to `#ops-daily`)
- [ ] Hand off to evening/night dispatcher
- [ ] Verify evening peak (17:00-20:00) performance was acceptable

## 3. Standard Operating Procedures

### 3.1 Driver Onboarding Approval

1. Open Admin → Drivers → Pending approval
2. For each pending driver, verify:
   - [ ] License number matches the uploaded license photo
   - [ ] License expiry is in the future
   - [ ] Vehicle registration matches the uploaded registration
   - [ ] Insurance is valid (not expired)
   - [ ] Background check returned clean (integrated provider)
   - [ ] Phone number is verified
3. If all checks pass: click **Approve**
4. If any check fails: click **Reject** with a clear reason — driver receives a notification with next steps

### 3.2 Driver Suspension

Triggers for immediate suspension:
- Fraudulent trip activity (GPS spoofing, fake trips)
- Passenger complaint with safety concerns
- Document expiry (license, insurance, registration)
- Payment fraud indicators

Procedure:
1. Admin → Users → search driver → Set status to `SUSPENDED` with reason
2. If the driver is on an active trip, call the passenger to verify safety
3. If the suspension is safety-related, also activate the SOS protocol
4. File a compliance report in the Audit Log

### 3.3 Refund Processing

1. Support agent creates a refund request in the support ticket
2. Finance officer reviews and approves/rejects
3. If approved, refund is processed via the original payment provider
4. Refund is recorded in the `Payment` table with `refundedAt` and `refundAmount`
5. Passenger receives a notification with refund confirmation

### 3.4 Withdrawal Processing

Drivers request withdrawals to bank or mobile money. Finance officer must:
1. Review the withdrawal queue (Admin → Finance → Withdrawals)
2. Verify the driver's wallet balance covers the request
3. Approve the withdrawal → funds dispatched via bank/mobile money API
4. Mark the withdrawal as `SUCCESS` or `FAILED` in the system
5. Driver receives notification of completion

### 3.5 Promo Code Creation

1. Marketing team submits promo code request with: code, type, value, valid period, max redemptions, per-user limit
2. Super admin or platform admin creates the promo code via `POST /promotions`
3. Promo code is tracked in the `PromoCode` table
4. Redemption limits are enforced automatically

## 4. Emergency Procedures

### 4.1 SOS Alert Response (SLA: 60 seconds)

1. SOS alert appears in Admin → Safety & SOS
2. Safety officer acknowledges the alert (status → `ACKNOWLEDGED`)
3. Safety officer calls the passenger/driver via the in-app masked phone number
4. If the situation is dangerous, contact local emergency services (911 in Ethiopia → 991)
5. If possible, share live location of the trip with emergency services
6. Resolve the alert with a written resolution note
7. If the SOS was a false alarm, mark it as `FALSE_ALARM`
8. Every SOS generates an automatic incident report

### 4.2 Trip Stuck / Driver Unresponsive

1. Passenger reports driver unresponsive via support or SOS
2. Dispatcher checks driver's last known location and last update timestamp
3. If no update for > 5 minutes, attempt to contact driver
4. If unreachable, cancel the trip from the dispatcher console with reason `driver_unresponsive`
5. Issue a refund or offer a free ride credit to the passenger
6. Flag the driver for review — may indicate GPS spoofing or emergency

### 4.3 Payment Provider Outage

1. Monitoring alerts that payment provider X is failing
2. SRE disables provider X via feature flag (`payments.provider.X.enabled = false`)
3. Passengers see alternative payment methods only
4. Pending payments in `PROCESSING` state are queued for retry
5. Once provider X recovers, SRE re-enables and processes the retry queue

### 4.4 Database Failover

1. Aurora detects primary failure and promotes a read replica automatically
2. Applications retry connections (configured in Prisma client)
3. SRE verifies the new primary is accepting writes
4. Update DNS if region failover is required
5. Run `pnpm --filter @cheetaxi/database exec prisma migrate deploy` to ensure schema is current

See `docs/DEPLOYMENT.md` § 9 for the full DR procedure.

## 5. Communication

### 5.1 Internal
- Slack workspace: `cheetaxi-team`
- Channels: `#ops-alerts`, `#ops-daily`, `#ops-handoff`, `#incidents`, `#support`, `#engineering`
- Incidents get a dedicated channel: `#incident-YYYY-MM-DD-NN`

### 5.2 External
- Status page: `https://status.cheetaxi.africa`
- Customer comms: email + in-app banner + push notification
- Press inquiries: `press@cheetaxi.africa`

### 5.3 Regulator
- Compliance officer is the single point of contact for regulator requests
- All regulator requests are logged in the Audit Log
- Data subject access requests: process within 30 days (GDPR Article 12)

## 6. Metrics & SLAs

### 6.1 Operational SLAs

| Metric                          | Target    |
| ------------------------------- | --------- |
| API uptime                      | 99.95%    |
| SOS acknowledgment time         | < 60 sec  |
| SOS resolution time             | < 30 min  |
| Support response (urgent)       | < 1 hour  |
| Support response (normal)       | < 8 hours |
| Driver approval turnaround      | < 24 hours |
| Withdrawal processing           | < 1 hour  |
| Refund processing               | < 48 hours |

### 6.2 Business KPIs

| KPI                              | Target                |
| -------------------------------- | --------------------- |
| Driver acceptance rate           | > 80%                 |
| Trip completion rate             | > 90%                 |
| Cancelled-by-driver rate         | < 5%                  |
| Cancelled-by-passenger rate      | < 10%                 |
| No-driver-found rate             | < 10%                 |
| Average passenger rating         | > 4.7                 |
| Average driver rating            | > 4.7                 |
| Daily active drivers             | Growing 5%+ MoM       |
| Daily active passengers          | Growing 10%+ MoM      |

## 7. Reports

### 7.1 Daily Operations Report (auto-generated)
Sent to `#ops-daily` at 08:00 EAT. Contains:
- Trips completed yesterday
- Revenue yesterday
- Active drivers / passengers
- SOS alerts triggered and resolved
- Support tickets opened / closed
- Top 5 issues by frequency

### 7.2 Weekly Executive Report
Sent to executives every Monday 09:00 EAT. Contains:
- WoW growth (drivers, passengers, trips, revenue)
- Top-performing cities
- Driver retention
- Customer satisfaction trend
- Key risks and mitigation plans

### 7.3 Monthly Compliance Report
Generated for regulators on request. Contains:
- Total trips per city
- Driver verification status
- Incident reports (anonymized)
- Data subject access requests processed

## 8. Tools

| Tool                  | Purpose                                    |
| --------------------- | ------------------------------------------ |
| Admin dashboard       | All operational tasks                      |
| Dispatcher console    | Live trip monitoring                       |
| PagerDuty             | On-call alerting                           |
| Slack                 | Internal communication                     |
| Grafana               | Metrics & dashboards                       |
| Sentry                | Error tracking                             |
| OpenSearch Dashboards | Log search                                 |
| Stripe Dashboard      | Payment reconciliation                     |
| Chapa Dashboard       | Ethiopian payment reconciliation           |
| AWS Console           | Infrastructure management                  |
| GitHub                | Source code + CI/CD                        |
| Vercel / Cloudflare   | Web deployments (optional alternative)     |

## 9. Runbooks

See `docs/INCIDENT_RESPONSE.md` for incident-specific runbooks.

## 10. Training

New operations team members must complete:
1. Read `docs/PRD.md`, `docs/SECURITY.md`, this document
2. Shadow a dispatcher for 2 shifts
3. Shadow a support agent for 2 shifts
4. Complete the SOS simulation drill
5. Pass the operations quiz (admin-only access)

Refresher training quarterly.
