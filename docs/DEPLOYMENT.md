# CheeTaxi — Deployment Guide

## 1. Local Development (5 minutes)

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- (Optional) Flutter 3+ for mobile development

### Steps

```bash
# 1. Clone & install
git clone https://github.com/BekiCrypto/CheeTaxi.git
cd CheeTaxi
pnpm install

# 2. Start infrastructure (PostgreSQL + Redis + OpenSearch + Mailhog)
docker compose up -d

# 3. Copy env and configure
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET to a strong random string

# 4. Generate Prisma client + run migrations + seed
pnpm db:generate
pnpm --filter @cheetaxi/database exec prisma migrate dev --name init
pnpm db:seed

# 5. Start all apps in dev mode (parallel)
pnpm dev
# → API:         http://localhost:4000
# → Landing:     http://localhost:3000
# → Admin:       http://localhost:3001
# → Dispatcher:  http://localhost:3002
# → Swagger:     http://localhost:4000/docs
# → Mailhog:     http://localhost:8025

# 6. Login to admin (from seed)
#    Phone: +251900000000
#    Password: ChangeMe!2025
```

## 2. Full Stack via Docker Compose

```bash
docker compose -f docker-compose.full.yml up -d --build
```

Brings up all 7 services (Postgres, Redis, OpenSearch, API, landing, admin, dispatcher) in containers.

## 3. Production Deployment

### 3.1 Infrastructure (Terraform)

```bash
cd infra/terraform
cp production.tfvars.example production.tfvars
# Edit production.tfvars — set AWS region, domain, instance sizes

# Initialize Terraform state
aws s3api create-bucket --bucket cheetaxi-terraform-state --region eu-central-1
aws dynamodb create-table \
  --table-name cheetaxi-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

terraform init
terraform plan -var-file=production.tfvars
terraform apply -var-file=production.tfvars
```

This provisions:
- VPC with 3 AZs
- Aurora PostgreSQL cluster (2 instances, multi-AZ, encrypted, 14-day backups)
- ElastiCache Redis cluster (3 nodes, multi-AZ, encryption in transit + at rest)
- EKS cluster (3+ nodes, autoscaling)
- All necessary security groups and IAM roles

### 3.2 Kubernetes

After Terraform completes:

```bash
aws eks update-kubeconfig --name cheetaxi-production --region eu-central-1

# Create secrets
kubectl create namespace cheetaxi
kubectl create secret generic cheetaxi-secrets -n cheetaxi \
  --from-literal=DATABASE_URL='postgresql://...' \
  --from-literal=JWT_SECRET='...' \
  --from-literal=REDIS_URL='redis://...' \
  --from-literal=GOOGLE_MAPS_API_KEY='...' \
  --from-literal=FIREBASE_PROJECT_ID='...' \
  --from-literal=STRIPE_SECRET_KEY='...' \
  --from-literal=CHAPA_SECRET_KEY='...' \
  --from-literal=SENTRY_DSN='...'

# Install cert-manager + nginx ingress + external-dns
helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set crds.enabled=true
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace

# Apply manifests
kubectl apply -f infra/kubernetes/production.yaml

# Run database migrations as a one-shot job
kubectl run cheetaxi-migrate --rm -it --restart=Never --image=ghcr.io/bekicrypto/cheetaxi-api:latest \
  --env="DATABASE_URL=..." --command -- pnpm --filter @cheetaxi/database exec prisma migrate deploy
```

### 3.3 CI/CD (GitHub Actions)

The pipeline in `.github/workflows/ci.yml` does the following on every push to `main`:

1. **Build & test** — installs pnpm, runs typecheck, lint, build, and tests against a real Postgres + Redis service container
2. **Docker build** — builds all 4 Docker images (API, landing, admin, dispatcher) with BuildKit caching
3. **Push to GHCR** — tags images with both `latest` and the commit SHA
4. **Deploy to Kubernetes** — applies manifests and triggers rolling restart

Required GitHub secrets:
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — for ECR/EKS access
- `KUBECONFIG` — base64-encoded kubeconfig for the production cluster

### 3.4 DNS & TLS

DNS is managed via Cloudflare. Point these records at the EKS ingress load balancer:

```
cheetaxi.africa          → ALIAS to ingress LB
api.cheetaxi.africa      → CNAME to ingress LB
admin.cheetaxi.africa    → CNAME to ingress LB
dispatch.cheetaxi.africa → CNAME to ingress LB
```

TLS certificates are auto-provisioned by `cert-manager` with Let's Encrypt.

## 4. Mobile Apps

### 4.1 Passenger App

```bash
cd apps/mobile-passenger

# Configure API URL for physical device testing
flutter run --dart-define=API_BASE_URL=http://<your-lan-ip>:4000

# Build APK
flutter build apk --release --dart-define=API_BASE_URL=https://api.cheetaxi.africa

# Build iOS (requires macOS + Xcode)
flutter build ios --release --dart-define=API_BASE_URL=https://api.cheetaxi.africa
```

### 4.2 Driver App

```bash
cd apps/mobile-driver
flutter build apk --release --dart-define=API_BASE_URL=https://api.cheetaxi.africa
```

## 5. Database Migrations

```bash
# Development — create + apply a new migration
pnpm --filter @cheetaxi/database exec prisma migrate dev --name <change_name>

# Production — apply pending migrations only (no creation)
pnpm --filter @cheetaxi/database exec prisma migrate deploy

# Reset (DEV ONLY — destroys all data)
pnpm --filter @cheetaxi/database exec prisma migrate reset
```

## 6. Backups

- **PostgreSQL**: Aurora automated backups — 14-day retention, point-in-time recovery up to 35 days
- **Daily snapshot to S3**: cross-region replicated for disaster recovery
- **Redis**: ElastiCache automatic snapshots — 7-day retention
- **Manual backup**:

```bash
pg_dump "$DATABASE_URL" | gzip > backup_$(date +%Y%m%d).sql.gz
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://cheetaxi-backups/postgres/
```

## 7. Monitoring

- **Grafana dashboard**: `https://grafana.cheetaxi.africa` — pre-built dashboards for:
  - API request rate, latency, error rate
  - Trip funnel (requested → assigned → completed)
  - Driver online count by city
  - Redis hit rate, memory usage
  - Postgres connections, slow queries
- **Sentry**: `https://sentry.io/cheetaxi/` — frontend + backend errors
- **Status page**: `https://status.cheetaxi.africa` — public uptime

## 8. Rollback

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/cheetaxi-api -n cheetaxi

# Rollback to specific revision
kubectl rollout undo deployment/cheetaxi-api -n cheetaxi --to-revision=3

# Rollback a database migration (manual — Prisma does not auto-rollback)
# 1. Inspect migration history
kubectl exec -it deploy/cheetaxi-api -n cheetaxi -- pnpm --filter @cheetaxi/database exec prisma migrate status
# 2. Manually revert schema + run a new "down" migration
```

## 9. Disaster Recovery

**RPO (Recovery Point Objective):** 5 minutes (Aurora PITR)
**RTO (Recovery Time Objective):** 30 minutes

Procedure:
1. Provision a new Aurora cluster from the latest snapshot + PITR
2. Update `DATABASE_URL` in Kubernetes secrets
3. Restart API pods
4. Verify health checks
5. Switch DNS if region failover is required

Test DR quarterly with a full failover exercise.
