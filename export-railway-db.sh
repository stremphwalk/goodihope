#!/bin/bash

# Export Railway PostgreSQL database
# This script uses the Railway connection details we found

echo "🚂 Exporting Railway PostgreSQL database..."

# Create backups directory
mkdir -p backups

# Set the backup filename with timestamp
BACKUP_FILE="backups/arinote_railway_$(date +%Y%m%d_%H%M%S).sql"

# Export using the Railway DATABASE_PUBLIC_URL
echo "📊 Creating database dump..."

# Use the public URL for external access
RAILWAY_DB_URL="postgresql://postgres:jlRAynWKXmxOgJrobzLFrUuznwADCDWa@centerbeam.proxy.rlwy.net:20575/railway"

# Export the database using local PostgreSQL 16
echo "📦 Using local PostgreSQL 16 for export..."
pg_dump "$RAILWAY_DB_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database exported successfully!"
    echo "📁 Backup saved to: $BACKUP_FILE"
    echo "📊 File size: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # Show a preview of the backup file
    echo ""
    echo "📋 Backup file preview (first 10 lines):"
    head -10 "$BACKUP_FILE"
    
    echo ""
    echo "🎯 Next steps:"
    echo "1. Copy this backup file to your Supabase project"
    echo "2. Use the import script: ./import-to-supabase.sh $BACKUP_FILE"
    echo "3. Or import manually via Supabase dashboard"
else
    echo "❌ Export failed!"
    exit 1
fi 