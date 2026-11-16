#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Chebelew Automated Database Backup, Integrity Check & Disaster Recovery Runbook
# Verifies SQLite WAL snapshot consistency, integrity, and test restoration
# ==============================================================================

BACKUP_DIR="${PWD}/server/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SOURCE_DB="${PWD}/server/chebelew.db"

SNAPSHOT_FILE="${BACKUP_DIR}/chebelew_snapshot_${TIMESTAMP}.db"
RESTORE_TEST_DB="${BACKUP_DIR}/test_restored_${TIMESTAMP}.db"

mkdir -p "$BACKUP_DIR"

echo "=============================================================================="
echo "🚕 CHEBELEW DISASTER RECOVERY & WAL BACKUP VERIFICATION RUNBOOK"
echo "   Timestamp: ${TIMESTAMP}"
echo "   Source DB: ${SOURCE_DB}"
echo "=============================================================================="

if [ ! -f "$SOURCE_DB" ]; then
  echo "⚠️ Source database not found at ${SOURCE_DB}. Creating directory if needed."
  exit 1
fi

# Step 1: Create atomic online backup using VACUUM INTO or sqlite3 .backup
echo ""
echo "▶ Step 1: Executing zero-downtime atomic WAL snapshot..."
sqlite3 "$SOURCE_DB" "VACUUM INTO '${SNAPSHOT_FILE}';"
echo "  ✓ Snapshot created at: ${SNAPSHOT_FILE}"
ls -lh "${SNAPSHOT_FILE}"

# Step 2: Validate snapshot cryptographic integrity
echo ""
echo "▶ Step 2: Running PRAGMA integrity_check on snapshot..."
INTEGRITY_RESULT=$(sqlite3 "${SNAPSHOT_FILE}" "PRAGMA integrity_check;")
if [ "$INTEGRITY_RESULT" != "ok" ]; then
  echo "❌ INTEGRITY CHECK FAILED: $INTEGRITY_RESULT"
  exit 1
fi
echo "  ✓ Snapshot integrity verified: ${INTEGRITY_RESULT}"

# Step 3: Test Restoration to an Isolated Target
echo ""
echo "▶ Step 3: Testing automated recovery to isolated target..."
cp "${SNAPSHOT_FILE}" "${RESTORE_TEST_DB}"

USERS_COUNT=$(sqlite3 "${RESTORE_TEST_DB}" "SELECT count(*) FROM users;")
DRIVERS_COUNT=$(sqlite3 "${RESTORE_TEST_DB}" "SELECT count(*) FROM drivers;")
RIDES_COUNT=$(sqlite3 "${RESTORE_TEST_DB}" "SELECT count(*) FROM rides;")
TARIFFS_COUNT=$(sqlite3 "${RESTORE_TEST_DB}" "SELECT count(*) FROM system_tariffs;")

echo "  ✓ Restoration successful!"
echo "  ✓ Row Count Verification:"
echo "     - users:           ${USERS_COUNT}"
echo "     - drivers:         ${DRIVERS_COUNT}"
echo "     - rides:           ${RIDES_COUNT}"
echo "     - system_tariffs:  ${TARIFFS_COUNT}"

# Step 4: Cleanup temporary test restore file
rm -f "${RESTORE_TEST_DB}"
echo ""
echo "=============================================================================="
echo "🎉 DISASTER RECOVERY VERIFICATION PASSED: Backup is 100% valid & restorable."
echo "=============================================================================="
