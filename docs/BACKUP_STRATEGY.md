# CheeTaxi — Backup & Recovery Strategy

> RPO (Recovery Point Objective): 5 minutes
> RTO (Recovery Time Objective): 30 minutes
> RTO (Region Failover): 4 hours

## 1. Backup Scope

| Data                        | Backup Type             | Frequency    | Retention        |
| --------------------------- | ----------------------- | ------------ | ---------------- |
| PostgreSQL (primary)        | Aurora automated backup | Continuous   | 35 days PITR     |
| PostgreSQL (daily snapshot) | S3 cross-region         | Daily 03:00  | 90 days          |
| PostgreSQL (weekly snapshot)| S3 cross-region         | Weekly Sun   | 7 years (compliance) |
| Redis (cache)               | ElastiCache snapshot    | Daily 04:00  | 7 days           |
| OpenSearch indices          | OpenSearch snapshot     | Daily 04:00  | 30 days          |
| S3 user uploads             | S3 versioning + cross-region replication | Continuous | Indefinite |
| Kubernetes manifests        | Git (this repo)         | Continuous   | Indefinite       |
| Terraform state             | S3 backend + versioning | Continuous   | Indefinite       |
| Secrets                     | AWS Secrets Manager     | Continuous   | Indefinite       |
| Configuration (.env)        | Not backed up — kept in secrets vault | — | — |

## 2. PostgreSQL Backups

### 2.1 Automated backups (Aurora)
- Continuous backup with point-in-time recovery (PITR) up to 35 days
- Retention period: 35 days (configured in Terraform)
- Backups are encrypted with KMS
- Stored in the same region as the cluster

### 2.2 Daily snapshots (manual + automated)
- AWS EventBridge rule triggers a Lambda function daily at 03:00 UTC
- Lambda creates a snapshot of the Aurora cluster
- Snapshot is copied to a different region (e.g. `eu-west-1` if primary is `eu-central-1`)
- Retention: 90 days for daily snapshots, 7 years for weekly (Sunday) snapshots (financial compliance)

### 2.3 Snapshot verification
- Weekly: restore the latest daily snapshot to a staging cluster
- Run smoke tests against the restored cluster
- Alert if restoration fails or smoke tests fail
- Document restoration time in `#ops-backups` Slack channel

## 3. Redis Backups

- ElastiCache automatic daily snapshots at 04:00 UTC
- Retention: 7 days
- Redis is a cache — data loss is tolerable, but snapshots speed up cold start

## 4. Object Storage (S3)

- User-uploaded files (driver license photos, vehicle photos, profile pictures) stored in S3
- Versioning enabled — every version retained
- Cross-region replication to a secondary region
- Lifecycle policy: transition to Glacier after 90 days for inactive files

## 5. Recovery Procedures

### 5.1 Point-in-time recovery (PITR) — single record recovery

Use case: a user accidentally deleted, need to recover data from 1 hour ago.

```bash
# 1. Restore to a new cluster (DO NOT overwrite the production cluster)
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier cheetaxi-production \
  --db-cluster-identifier cheetaxi-recovery-$(date +%Y%m%d%H%M) \
  --restore-type copy-on-write \
  --use-latest-restorable-time

# 2. Wait for cluster to become available (~10-15 min)

# 3. Connect and extract the missing record
psql "postgresql://cheetaxi:***@cheetaxi-recovery-xxx.cluster-xxx.eu-central-1.rds.amazonaws.com/cheetaxi" \
  -c "SELECT * FROM \"User\" WHERE id = 'user_xxx';"

# 4. Insert the record back into production (manual SQL or via API)

# 5. Delete the recovery cluster
aws rds delete-db-cluster \
  --db-cluster-identifier cheetaxi-recovery-xxx \
  --skip-final-snapshot
```

### 5.2 Cluster restore from snapshot — full database restore

Use case: catastrophic corruption requiring full restore.

```bash
# 1. Restore from snapshot to a new cluster
aws rds restore-db-cluster-from-snapshot \
  --db-cluster-identifier cheetaxi-restored \
  --snapshot-identifier cheetaxi-production-2026-07-09 \
  --engine aurora-postgresql

# 2. Add a writer instance
aws rds create-db-instance \
  --db-instance-identifier cheetaxi-restored-instance \
  --db-cluster-identifier cheetaxi-restored \
  --db-instance-class db.r6g.large \
  --engine aurora-postgresql

# 3. Wait for cluster + instance to be available
aws rds wait db-cluster-available --db-cluster-identifier cheetaxi-restored
aws rds wait db-instance-available --db-instance-identifier cheetaxi-restored-instance

# 4. Update the production app to point to the restored cluster
kubectl create secret generic cheetaxi-secrets -n cheetaxi \
  --from-literal=DATABASE_URL='postgresql://...@cheetaxi-restored.cluster-xxx.eu-central-1.rds.amazonaws.com/cheetaxi' \
  --dry-run=client -o yaml | kubectl apply -f -

# 5. Restart the API to pick up the new secret
kubectl rollout restart deployment/cheetaxi-api -n cheetaxi

# 6. Verify health
kubectl exec -it deploy/cheetaxi-api -n cheetaxi -- curl http://localhost:4000/health/ready
```

### 5.3 Region failover — disaster recovery

Use case: primary region (eu-central-1) is unavailable.

```bash
# 1. Promote the read replica in the standby region (eu-west-1)
aws rds promote-db-cluster \
  --db-cluster-identifier cheetaxi-production-replica

# 2. Update DNS to point to the standby region's API endpoint
# (Cloudflare handles this — update origin in Cloudflare dashboard)

# 3. Switch S3 to the replicated bucket
# (already replicated — just update the app config)

# 4. Verify everything works
curl https://api.cheetaxi.africa/health/ready

# 5. Once primary region is back, set up replication in reverse
# (this is a multi-hour operation — only do it during a maintenance window)
```

### 5.4 Redis failover

- ElastiCache Multi-AZ with automatic failover
- Failover is automatic (typically 30-60 seconds)
- No data loss for writes that were replicated
- Up to 1 minute of cache data may be lost — acceptable for a cache

### 5.5 Application-level recovery

If the application is broken (bad deploy, config error):
```bash
# Roll back to the previous deployment
kubectl rollout undo deployment/cheetaxi-api -n cheetaxi

# Or roll back to a specific revision
kubectl rollout history deployment/cheetaxi-api -n cheetaxi
kubectl rollout undo deployment/cheetaxi-api -n cheetaxi --to-revision=N
```

## 6. Testing Backups

### 6.1 Weekly restore test (automated)
- Sunday 06:00 UTC: automated restore of the latest daily snapshot to a staging cluster
- Run smoke tests against the staging cluster
- If any test fails: page the on-call SRE
- Tear down the staging cluster after tests pass

### 6.2 Monthly DR drill
- First Saturday of each month
- Simulate full region failure
- Practice the failover procedure end-to-end
- Document: time-to-recover, issues encountered, improvements
- Share findings in `#ops-dr-drill`

### 6.3 Annual DR exercise
- Full simulation with the operations team
- Includes communication drills (status page, customer notifications)
- Includes legal/compliance if data breach scenario

## 7. Data Retention Policy

| Data Type                  | Retention              | Reason                         |
| -------------------------- | ---------------------- | ------------------------------ |
| User account data          | 30 days after deletion | GDPR Article 17 erasure        |
| Trip records               | 7 years                | Tax / financial compliance     |
| Payment records            | 7 years                | Tax / financial compliance     |
| Audit logs                 | 7 years                | SOC2 / compliance              |
| Driver license documents   | Until driver leaves + 90 days | Verification              |
| Background check reports   | 2 years                | Compliance                     |
| Vehicle registration docs  | Until vehicle removed + 90 days | Verification            |
| CCTV / dashcam footage    | 30 days                | Safety + privacy balance       |
| SOS recordings             | 90 days                | Safety investigation window    |
| Email / SMS logs           | 90 days                | Delivery audit                 |
| Web server access logs     | 30 days                | Security investigation         |
| Application logs           | 30 days hot, 1 year cold | Debugging + security         |

## 8. Compliance

- **GDPR**: Right to erasure honored within 30 days. Backups containing deleted user data are not actively restored for that user.
- **SOC 2**: Backup testing documented quarterly. Restore procedures reviewed annually.
- **Ethiopian NBE regulations**: Financial records retained 7 years per National Bank of Ethiopia requirements.
- **Local tax regulations**: Per-country tax retention rules applied automatically.

## 9. Backup Monitoring

- CloudWatch alarm: alert if Aurora backup not completed in 24 hours
- CloudWatch alarm: alert if snapshot copy to standby region fails
- Daily 08:00 UTC: automated check that all backups exist as expected
- Weekly backup report sent to `#ops-backups` Slack channel

## 10. Restoration Time Targets

| Scenario                       | Target Time | Procedure            |
| ------------------------------ | ----------- | -------------------- |
| Single record recovery         | 30 minutes  | PITR to new cluster  |
| Full database restore (same region) | 1 hour | Snapshot restore     |
| Region failover                | 4 hours     | Promote read replica |
| Application rollback           | 5 minutes   | `kubectl rollout undo` |
| Complete rebuild from scratch  | 8 hours     | Terraform apply + restore snapshot |

If we miss these targets, the postmortem identifies why and we adjust procedures.
