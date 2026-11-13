#!/bin/sh
# ========================================================
# Chebelew Mobility Platform - Online Database Backup Script
# Performs safe online SQLite snapshot without locking writes
# ========================================================

set -e

BACKUP_DIR="/app/data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_FILE="/app/data/chebelew.db"
BACKUP_FILE="${BACKUP_DIR}/chebelew_backup_${TIMESTAMP}.db"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_FILE" ]; then
  echo "Error: Database file $DB_FILE not found."
  exit 1
fi

echo "Starting online SQLite snapshot at $(date)..."

# Use better-sqlite3 or sqlite3 online backup via Node CLI
node -e "
const Database = require('better-sqlite3');
const db = new Database('$DB_FILE');
db.backup('$BACKUP_FILE')
  .then(() => {
    console.log('Online snapshot completed: $BACKUP_FILE');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Backup error:', err);
    process.exit(1);
  });
"

# Compress backup snapshot to save disk space
gzip -f "$BACKUP_FILE"
echo "Backup compressed: ${BACKUP_FILE}.gz"

# Retain only the last 7 backups, delete older ones
find "$BACKUP_DIR" -type f -name "chebelew_backup_*.db.gz" -mtime +7 -delete || true
echo "Retention policy executed. Backup process finished cleanly."
