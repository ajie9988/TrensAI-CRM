#!/bin/bash

# Backup database and volumes

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "💾 Starting backup..."

# Backup MySQL
echo "  Backing up MySQL database..."
docker-compose exec mysql mysqldump -u root -ppassword123 wa_crm | gzip > "$BACKUP_DIR/wa_crm_db_$TIMESTAMP.sql.gz"

# Backup WhatsApp sessions
echo "  Backing up WhatsApp sessions..."
docker-compose exec wa-engine tar czf sessions.tar.gz sessions/
docker cp wa_crm_wa_engine:/app/sessions.tar.gz "$BACKUP_DIR/wa_sessions_$TIMESTAMP.tar.gz"
docker-compose exec wa-engine rm sessions.tar.gz

echo "✅ Backup complete!"
echo "   Files saved to: $BACKUP_DIR/"
