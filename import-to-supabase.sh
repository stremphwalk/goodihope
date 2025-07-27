#!/bin/bash

# Import PostgreSQL database to Supabase
# Usage: ./import-to-supabase.sh [backup_file]

BACKUP_FILE=${1:-"backups/arinote_$(ls -t backups/*.sql 2>/dev/null | head -1 | xargs basename 2>/dev/null)"}

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    echo "Usage: ./import-to-supabase.sh [backup_file]"
    exit 1
fi

# Get Supabase database URL from environment or prompt user
if [ -z "$SUPABASE_DATABASE_URL" ]; then
    echo "Please enter your Supabase PostgreSQL connection string:"
    read -s SUPABASE_DATABASE_URL
fi

echo "Importing database from $BACKUP_FILE to Supabase..."

# Use Docker to run psql
docker run --rm \
    -e PGPASSWORD=$(echo $SUPABASE_DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p') \
    -v "$(pwd)/$BACKUP_FILE:/backup.sql" \
    postgres:15 \
    psql \
    -h $(echo $SUPABASE_DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p') \
    -p $(echo $SUPABASE_DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p') \
    -U $(echo $SUPABASE_DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p') \
    -d $(echo $SUPABASE_DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p') \
    -f /backup.sql

if [ $? -eq 0 ]; then
    echo "✅ Database imported successfully to Supabase"
else
    echo "❌ Import failed"
    exit 1
fi 