#!/bin/bash

# Export PostgreSQL database from Railway to Supabase
# Usage: ./export-database.sh

# Get Railway database URL from environment or prompt user
if [ -z "$RAILWAY_DATABASE_URL" ]; then
    echo "Please enter your Railway PostgreSQL connection string:"
    read -s RAILWAY_DATABASE_URL
fi

# Create backup directory
mkdir -p backups
BACKUP_FILE="backups/arinote_$(date +%Y%m%d_%H%M%S).sql"

echo "Exporting database to $BACKUP_FILE..."

# Use Docker to run pg_dump
docker run --rm \
    -e PGPASSWORD=$(echo $RAILWAY_DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p') \
    postgres:15 \
    pg_dump \
    -h $(echo $RAILWAY_DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p') \
    -p $(echo $RAILWAY_DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p') \
    -U $(echo $RAILWAY_DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p') \
    -d $(echo $RAILWAY_DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p') \
    --clean --if-exists --no-owner --no-privileges \
    > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Database exported successfully to $BACKUP_FILE"
    echo "📊 File size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "❌ Export failed"
    exit 1
fi 