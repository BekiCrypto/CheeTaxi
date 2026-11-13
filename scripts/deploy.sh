#!/usr/bin/env bash
# ========================================================
# Chebelew Enterprise Deployment Script
# Automates test verification, git push, remote Docker build, and live healthchecks
# ========================================================

set -euo pipefail

REMOTE_HOST="78.111.67.119"
REMOTE_USER="root"
REMOTE_DIR="/opt/chebelew"
SSH_KEY="/Users/beki/VPS-Restored/00_SYSTEM_AND_ENVIRONMENT_CREDENTIALS/ssh_keys/trustlotto-launch-deploy"
LIVE_DOMAIN="https://chebelew.trustlotto.app"

echo "======================================================="
echo "🚕 CHEBELEW ENTERPRISE MOBILITY PLATFORM DEPLOYMENT"
echo "======================================================="

# Step 1: Pre-deployment Local Automated Test Suite
echo "--> [1/4] Running local automated test suite (42 tests)..."
npm test --prefix server

# Step 2: Build Verification
echo "--> [2/4] Verifying clean client and server compilation..."
npm run build --prefix client
npm run build --prefix server

# Step 3: Git Status Check & Push
echo "--> [3/4] Checking git status and pushing to origin/chebelew..."
git push origin chebelew

# Step 4: Remote Pull & Container Rolling Restart
echo "--> [4/4] Triggering remote Docker Compose rebuild on ${REMOTE_HOST}..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "${REMOTE_USER}@${REMOTE_HOST}" \
  "cd ${REMOTE_DIR} && git pull origin chebelew && docker compose build && docker compose up -d"

# Step 5: Post-deploy Healthcheck Verification Loop
echo "--> Waiting for container health check on ${LIVE_DOMAIN}..."
MAX_ATTEMPTS=12
ATTEMPT=1
SUCCESS=0

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  STATUS_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "${LIVE_DOMAIN}/api/health" || true)
  if [ "$STATUS_CODE" = "200" ]; then
    echo "✅ Health check PASSED (HTTP 200 OK)!"
    SUCCESS=1
    break
  fi
  echo "Attempt $ATTEMPT/$MAX_ATTEMPTS: Status $STATUS_CODE. Waiting 3 seconds..."
  sleep 3
  ATTEMPT=$((ATTEMPT + 1))
done

if [ $SUCCESS -ne 1 ]; then
  echo "❌ Error: Production deployment healthcheck failed after $MAX_ATTEMPTS attempts."
  exit 1
fi

echo "======================================================="
echo "🚀 Deployment Successful! Platform is live at: ${LIVE_DOMAIN}"
echo "======================================================="
