# CheeTaxi — Incident Response Guide

> Be prepared. Be fast. Be blameless.

## 1. Severity Levels

| Severity | Definition                                                          | Response Time | Examples                                  |
| -------- | ------------------------------------------------------------------- | ------------- | ----------------------------------------- |
| **SEV-1**| Production outage, data breach, or active safety incident           | 5 min ack     | API down, SOS system failing, breach      |
| **SEV-2**| Major feature broken or significantly degraded                      | 1 hour ack    | Payments failing, dispatch broken         |
| **SEV-3**| Minor feature broken, workaround available                          | 1 business day| Slow query, broken admin filter           |
| **SEV-4**| Cosmetic issue, no user impact                                      | Next sprint   | Typo in email, misaligned button          |

## 2. Roles During an Incident

| Role                 | Responsibility                                          |
| -------------------- | ------------------------------------------------------- |
| **Incident Commander** | Owns the response. Coordinates all other roles. Makes go/no-go decisions. |
| **Communications Lead** | Internal + external comms. Updates status page. Notifies stakeholders. |
| **Operations Lead**  | Executes mitigations. Runs the actual fix.              |
| **Safety Lead** (SEV-1 only) | Coordinates SOS / user safety response.            |
| **Scribe**           | Documents timeline, decisions, actions in the incident channel. |

The Incident Commander role rotates — anyone can be IC, but they must explicitly hand off if they leave.

## 3. SEV-1 Response Procedure

### 3.1 Detect (T-0)
- Triggered by: PagerDuty alert, Sentry alert, user reports, SOS
- The first responder becomes the initial Incident Commander

### 3.2 Acknowledge (T+5 min)
- Acknowledge in PagerDuty
- Open Slack channel: `#incident-YYYY-MM-DD-NN`
- Announce: "🚨 SEV-1: [brief description] — IC: [name]"
- Assign scribe to start timeline

### 3.3 Assess (T+10 min)
- What is the scope? (which users, regions, features affected)
- What is the impact? (revenue, safety, data integrity)
- Is user data at risk? (If yes → escalate to Security Lead)
- Is user safety at risk? (If yes → escalate to Safety Lead)

### 3.4 Mitigate (T+15 min)
- Goal: stop the bleeding, not fix the root cause
- Options:
  - Roll back the last deployment (`kubectl rollout undo`)
  - Disable the affected feature via feature flag
  - Block traffic to the affected endpoint (rate limit)
  - Failover to standby (database, region)
  - Revoke compromised credentials
  - Take the affected service offline (display maintenance page)

### 3.5 Communicate (T+15 min, then every 30 min)
- Update status page (`status.cheetaxi.africa`) — "Investigating"
- Notify internal stakeholders in `#announcements`
- If safety-related: notify Safety Lead to contact affected users directly
- If data breach: notify Legal and Compliance immediately (legal may need to notify regulators within 72h per GDPR)

### 3.6 Resolve (when mitigation is verified)
- Confirm the system is healthy (monitoring green for 15 min)
- Update status page — "Resolved"
- Announce resolution in `#announcements`
- Close the incident channel after 24h (move follow-up to a regular ticket)

### 3.7 Postmortem (within 48 hours)
- Blameless — focus on systems, not individuals
- Template:
  ```
  # Incident: [title]
  Date: [date]
  Severity: SEV-X
  Duration: [start - end]
  IC: [name]
  
  ## Summary
  [1-paragraph executive summary]
  
  ## Timeline (all times UTC)
  - T+0: ...
  - T+5: ...
  
  ## Impact
  - Users affected: [count or %]
  - Revenue impact: [$ or "none"]
  - Data impact: [description or "none"]
  
  ## Root Cause
  [Technical root cause]
  
  ## Contributing Factors
  [What made this worse?]
  
  ## What Went Well
  [Things that worked]
  
  ## What Went Wrong
  [Things that didn't work]
  
  ## Action Items
  - [ ] [action] — owner — due date
  - [ ] [action] — owner — due date
  ```
- Action items are tracked in Linear / GitHub Issues with the `incident-followup` label

## 4. Specific Incident Runbooks

### 4.1 API is down (5xx error rate > 50%)

1. Check `/health/ready` — which component is failing?
2. If PostgreSQL: check Aurora cluster status in AWS Console. If failover in progress, wait (typically < 60s).
3. If Redis: check ElastiCache. If single-node failure, failover is automatic.
4. If app crash: check pod status (`kubectl get pods -n cheetaxi`). If CrashLoopBackOff, check logs (`kubectl logs <pod>`).
5. If bad deploy: roll back (`kubectl rollout undo deployment/cheetaxi-api -n cheetaxi`).
6. If overload: scale up (`kubectl scale deployment/cheetaxi-api --replicas=20 -n cheetaxi`).
7. If DDoS: enable Cloudflare "Under Attack" mode.

### 4.2 Database performance degraded

1. Check Aurora Performance Insights in AWS Console.
2. Identify top queries by CPU/time.
3. If missing index: add it via Prisma migration (urgent hotfix).
4. If lock contention: identify blocking queries, kill them via `pg_terminate_backend(pid)`.
5. If connection pool exhausted: increase Prisma connection limit (config change).
6. If disk full: increase Aurora storage (automatic scaling up to 64TB).

### 4.3 Payment webhook failures

1. Check Sentry for webhook handler errors.
2. Verify Stripe / Chapa / Telebirr status pages.
3. If our handler is crashing: roll back the API deployment.
4. If the provider is down: disable that provider via feature flag, surface alternative methods to users.
5. Reconcile pending payments once provider recovers — re-process the queue.

### 4.4 SOS system failure

1. **CRITICAL** — this is a safety incident, escalate to Safety Lead immediately.
2. If push notifications failing (FCM down): fall back to SMS via Twilio for SOS acknowledgments.
3. If safety officers can't see alerts: roll back the admin dashboard deploy.
4. If the SOS API endpoint is failing: roll back the API deploy.
5. Notify all safety officers via direct phone call — they must manually monitor the SOS mailbox until the system is restored.
6. Status page update: "CheeTaxi is experiencing issues with our safety alert system. If you have an emergency, please call 991 (Ethiopia emergency services)."

### 4.5 Data breach suspected

1. **CRITICAL** — engage Legal, Compliance, and Security Lead within 15 minutes.
2. Preserve evidence — do NOT delete logs or restore from backup yet.
3. Identify scope: what data, which users, how accessed.
4. Contain: revoke compromised credentials, block offending IPs, rotate secrets.
5. Notify regulators within 72 hours per GDPR Article 33 (if EU users affected).
6. Notify affected users with: what happened, what data, what we're doing, what they should do.
7. Forensic investigation by third-party security firm.
8. Postmortem with security hardening plan.

### 4.6 Driver fraud detected

1. Compliance officer places driver on hold (status: `SUSPENDED`).
2. Investigate: review trip history, GPS data, payment patterns.
3. If confirmed fraud: ban the driver (`BANNED` status), reverse fraudulent transactions.
4. If criminal activity: report to authorities.
5. Improve fraud detection rules to catch this pattern earlier.

## 5. Communication Templates

### 5.1 Status page — Investigating
> We are investigating reports of [issue]. Some users may experience [impact]. We will update this page within 30 minutes.

### 5.2 Status page — Identified
> We have identified the cause of [issue] and are working on a fix. Estimated resolution: [time or "unknown"]. Affected users: [scope].

### 5.3 Status page — Resolved
> [Issue] has been resolved. We will publish a postmortem within 48 hours. We apologize for the inconvenience.

### 5.4 Customer email — SEV-1 resolution
> Subject: Incident on [date] — what happened and what we're doing
>
> Dear [Name],
>
> On [date], CheeTaxi experienced [issue] that affected [scope]. The incident lasted [duration].
>
> What happened: [plain-English explanation]
>
> What we did: [actions taken]
>
> What we're doing to prevent this: [action items]
>
> If you have any questions, please reply to this email or contact our support team at support@cheetaxi.africa.
>
> We apologize for the inconvenience.
>
> — CheeTaxi Team

## 6. Postmortem Review

Every SEV-1 and SEV-2 incident has a postmortem review meeting within 1 week:
- Attendees: IC, Operations Lead, Engineering Lead, Safety Lead (if safety-related)
- Walk through the postmortem document
- Confirm action items have owners and due dates
- Identify systemic improvements (not just the immediate fix)

Postmortems are stored in `docs/postmortems/` (private repo).

## 7. On-Call Compensation

- On-call rotation: 7 days primary, 7 days secondary
- Compensation: [per company policy — typically 1 day extra PTO per week on-call + flat on-call pay]
- SEV-1 page outside business hours: time-and-a-half comp time
- No on-call during PTO — coverage is arranged beforehand

## 8. Drills

Quarterly disaster recovery drill:
- Simulate region failure
- Failover to standby region
- Verify application health
- Failback
- Document results and improve procedures

Annual security incident simulation:
- Simulated phishing attack
- Simulated data breach
- Tabletop exercise with full incident response team
