#!/bin/bash

# Railway to Vercel Database Migration Script
# This script exports data from Railway and prepares it for Vercel Postgres

set -e

echo "🚀 Starting Railway to Vercel database migration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required environment variables are set
if [ -z "$RAILWAY_DATABASE_URL" ]; then
    echo -e "${RED}❌ RAILWAY_DATABASE_URL environment variable is not set${NC}"
    echo -e "${YELLOW}Please set it with: export RAILWAY_DATABASE_URL=your_railway_postgres_url${NC}"
    exit 1
fi

if [ -z "$VERCEL_POSTGRES_URL" ]; then
    echo -e "${RED}❌ VERCEL_POSTGRES_URL environment variable is not set${NC}"
    echo -e "${YELLOW}Please set it with: export VERCEL_POSTGRES_URL=your_vercel_postgres_url${NC}"
    exit 1
fi

# Create backup directory
BACKUP_DIR="./database-migration-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}📁 Created backup directory: $BACKUP_DIR${NC}"

# Export schema from Railway
echo -e "${BLUE}📋 Exporting schema from Railway...${NC}"
pg_dump "$RAILWAY_DATABASE_URL" --schema-only --no-owner --no-privileges --clean --if-exists > "$BACKUP_DIR/schema.sql"

# Export data from Railway
echo -e "${BLUE}📊 Exporting data from Railway...${NC}"
pg_dump "$RAILWAY_DATABASE_URL" --data-only --no-owner --no-privileges --disable-triggers > "$BACKUP_DIR/data.sql"

# Export complete backup (schema + data)
echo -e "${BLUE}💾 Creating complete backup...${NC}"
pg_dump "$RAILWAY_DATABASE_URL" --no-owner --no-privileges --clean --if-exists > "$BACKUP_DIR/complete_backup.sql"

echo -e "${GREEN}✅ Export completed successfully!${NC}"
echo -e "${BLUE}📁 Files created in $BACKUP_DIR:${NC}"
echo -e "  - schema.sql     (database structure)"
echo -e "  - data.sql       (data only)"
echo -e "  - complete_backup.sql (schema + data)"

echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "1. Run the migration script to import to Vercel Postgres"
echo -e "2. Update your environment variables"
echo -e "3. Test the application"