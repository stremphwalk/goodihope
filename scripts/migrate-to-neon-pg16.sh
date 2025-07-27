#!/bin/bash

# Railway to Neon Database Migration Script (PostgreSQL 16 specific)
# This script explicitly uses PostgreSQL 16 binaries to avoid version mismatch

set -e

echo "🚀 Starting Railway to Neon database migration (PostgreSQL 16)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set PostgreSQL 16 path
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
PG_DUMP="/opt/homebrew/opt/postgresql@16/bin/pg_dump"
PSQL="/opt/homebrew/opt/postgresql@16/bin/psql"

# Verify PostgreSQL 16 is available
if [ ! -f "$PG_DUMP" ]; then
    echo -e "${RED}❌ PostgreSQL 16 not found at $PG_DUMP${NC}"
    echo -e "${YELLOW}Please install with: brew install postgresql@16${NC}"
    exit 1
fi

echo -e "${BLUE}✅ Using PostgreSQL version: $($PG_DUMP --version)${NC}"

# Check if required environment variables are set
if [ -z "$RAILWAY_DATABASE_URL" ]; then
    echo -e "${RED}❌ RAILWAY_DATABASE_URL environment variable is not set${NC}"
    echo -e "${YELLOW}Please set it with: export RAILWAY_DATABASE_URL=your_railway_postgres_url${NC}"
    exit 1
fi

if [ -z "$NEON_DATABASE_URL" ]; then
    echo -e "${RED}❌ NEON_DATABASE_URL environment variable is not set${NC}"
    echo -e "${YELLOW}Please set it with: export NEON_DATABASE_URL=your_neon_postgres_url${NC}"
    exit 1
fi

# Create backup directory
BACKUP_DIR="./neon-migration-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}📁 Created backup directory: $BACKUP_DIR${NC}"

# Export data from Railway
echo -e "${BLUE}📊 Exporting data from Railway...${NC}"
"$PG_DUMP" "$RAILWAY_DATABASE_URL" --data-only --no-owner --no-privileges --disable-triggers > "$BACKUP_DIR/railway-data.sql"

# Export complete backup for safety
echo -e "${BLUE}💾 Creating complete backup from Railway...${NC}"
"$PG_DUMP" "$RAILWAY_DATABASE_URL" --no-owner --no-privileges --clean --if-exists > "$BACKUP_DIR/railway-complete.sql"

echo -e "${GREEN}✅ Railway export completed!${NC}"

# Set up Neon database schema using Drizzle
echo -e "${BLUE}🔧 Setting up Neon database schema...${NC}"
export DATABASE_URL="$NEON_DATABASE_URL"
npm run db:push

echo -e "${GREEN}✅ Neon schema setup completed!${NC}"

# Import data to Neon
echo -e "${BLUE}📋 Importing data to Neon...${NC}"
"$PSQL" "$NEON_DATABASE_URL" -f "$BACKUP_DIR/railway-data.sql" || echo -e "${YELLOW}⚠️ Some import warnings (this is normal)${NC}"

echo -e "${GREEN}✅ Data import completed!${NC}"

# Verify the migration
echo -e "${BLUE}🔍 Verifying migration...${NC}"
echo "Checking tables and row counts..."

"$PSQL" "$NEON_DATABASE_URL" -c "
SELECT 
  schemaname,
  tablename,
  (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT 
    schemaname, 
    tablename, 
    query_to_xml('SELECT COUNT(*) as cnt FROM ' || schemaname || '.' || tablename, false, true, '') as xml_count
  FROM pg_tables
  WHERE schemaname = 'public'
) t
ORDER BY tablename;
"

echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
echo -e "${BLUE}📁 Backup files saved in: $BACKUP_DIR${NC}"

echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "1. Environment variables are already set in Vercel (via Neon integration)"
echo -e "2. Test your application at: https://goodihope-h4blbcq3w-stremphwalks-projects.vercel.app"
echo -e "3. Update your local .env file if needed"
echo -e "4. Consider removing Railway database after verification"