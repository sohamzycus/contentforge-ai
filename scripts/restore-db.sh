#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage: $0 <backup_file.sql>"
    echo ""
    echo "Available backups:"
    ls -lh "$(dirname "$0")/../backups/"*.sql 2>/dev/null || echo "  No backups found."
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: File not found: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will REPLACE the current database with: $BACKUP_FILE"
read -p "Continue? [y/N] " confirm
[ "$confirm" = "y" ] || exit 1

echo "Restoring database..."
docker-compose exec -T db psql -U postgres -d contentforge < "$BACKUP_FILE"
echo "Database restored from: $BACKUP_FILE"
