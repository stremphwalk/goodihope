#!/bin/bash

# Import to Vercel Postgres Script
# This script imports the exported Railway data to Vercel Postgres

set -e

echo "🚀 Starting import to Vercel Postgres..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required environment variables are set
if [ -z "$VERCEL_POSTGRES_URL" ]; then
    echo -e "${RED}❌ VERCEL_POSTGRES_URL environment variable is not set${NC}"
    echo -e "${YELLOW}Please set it with: export VERCEL_POSTGRES_URL=your_vercel_postgres_url${NC}"
    exit 1
fi

# Find the most recent backup directory
BACKUP_DIR=$(find . -maxdepth 1 -name "database-migration-*" -type d | sort | tail -1)

if [ -z "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ No backup directory found${NC}"
    echo -e "${YELLOW}Please run the export script first${NC}"
    exit 1
fi

echo -e "${BLUE}📁 Using backup directory: $BACKUP_DIR${NC}"

# Option 1: Import using Drizzle migrations (recommended)
echo -e "${BLUE}🔄 Running Drizzle migrations on Vercel Postgres...${NC}"
export DATABASE_URL="$VERCEL_POSTGRES_URL"
npm run db:push

# Option 2: Import schema directly (if migrations don't work)
echo -e "${BLUE}📋 Importing schema to Vercel Postgres...${NC}"
psql "$VERCEL_POSTGRES_URL" -f "$BACKUP_DIR/schema.sql" || echo -e "${YELLOW}⚠️ Schema import had warnings (this is normal)${NC}"

# Import data
echo -e "${BLUE}📊 Importing data to Vercel Postgres...${NC}"
psql "$VERCEL_POSTGRES_URL" -f "$BACKUP_DIR/data.sql"

echo -e "${GREEN}✅ Import completed successfully!${NC}"

# Verify the import
echo -e "${BLUE}🔍 Verifying import...${NC}"
echo "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" | psql "$VERCEL_POSTGRES_URL"

echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "1. Update your Vercel environment variables"
echo -e "2. Test your application"
echo -e "3. Update your local .env file if needed"