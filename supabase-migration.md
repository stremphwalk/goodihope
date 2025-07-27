# Supabase Migration Guide

## Using Supabase CLI

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link Your Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 4: Export from Railway
```bash
# Get your Railway database URL
pg_dump $RAILWAY_DATABASE_URL > backup.sql
```

### Step 5: Import to Supabase
```bash
# Import the backup
supabase db reset
psql $SUPABASE_DATABASE_URL < backup.sql
```

## Manual Migration Steps

### 1. Export Schema Only
```bash
pg_dump $RAILWAY_DATABASE_URL --schema-only > schema.sql
```

### 2. Export Data Only
```bash
pg_dump $RAILWAY_DATABASE_URL --data-only > data.sql
```

### 3. Import to Supabase
```bash
# Import schema first
psql $SUPABASE_DATABASE_URL < schema.sql

# Then import data
psql $SUPABASE_DATABASE_URL < data.sql
```

## Troubleshooting

### Common Issues:
1. **Permission Errors**: Make sure your Supabase user has proper permissions
2. **SSL Issues**: Add `?sslmode=require` to your connection string
3. **Extension Conflicts**: Some PostgreSQL extensions might not be available in Supabase

### Supabase Limitations:
- Row Level Security (RLS) policies need to be recreated
- Some PostgreSQL extensions are not available
- Connection limits and query timeouts apply 