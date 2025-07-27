# Vercel Database Migration Guide

This guide will help you migrate your AriNote database from Railway to Vercel Postgres.

## Prerequisites

1. **Vercel Account**: Ensure you have access to Vercel
2. **Railway Database**: Your current Railway Postgres database
3. **pgAdmin or psql**: For database operations
4. **Vercel CLI**: Install with `npm i -g vercel`

## Step-by-Step Migration

### 1. Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** → **Create Database**
3. Select **Postgres**
4. Name it `arinote-db` (or your preferred name)
5. Choose the same region as your deployment
6. Click **Create**

### 2. Get Database Connection Strings

**From Vercel:**
1. Go to your new database in Vercel dashboard
2. Go to **Settings** tab
3. Copy the connection strings:
   - `POSTGRES_URL` (for pooled connections)
   - `POSTGRES_URL_NON_POOLED` (for migrations)

**From Railway:**
1. Go to your Railway project
2. Go to your Postgres service
3. Click **Variables** tab
4. Copy the `DATABASE_URL`

### 3. Export Data from Railway

```bash
# Set your Railway database URL
export RAILWAY_DATABASE_URL="your_railway_postgres_url"

# Set your Vercel database URL (use NON_POOLED for migrations)
export VERCEL_POSTGRES_URL="your_vercel_postgres_non_pooled_url"

# Run the export script
./scripts/export-railway-to-vercel.sh
```

This creates a backup directory with:
- `schema.sql` - Database structure
- `data.sql` - Your data
- `complete_backup.sql` - Complete backup

### 4. Set Up Vercel Database Schema

**Option A: Using the setup script (Recommended)**
```bash
# Make sure you're in your project directory
export POSTGRES_URL="your_vercel_postgres_url"
node scripts/setup-vercel-database.js
```

**Option B: Using Drizzle migrations**
```bash
export DATABASE_URL="your_vercel_postgres_non_pooled_url"
npm run db:push
```

### 5. Import Data to Vercel Postgres

```bash
# Run the import script
./scripts/import-to-vercel-postgres.sh
```

### 6. Update Environment Variables

**In Vercel Dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Update or add:
   ```
   POSTGRES_URL=your_vercel_postgres_pooled_url
   POSTGRES_URL_NON_POOLED=your_vercel_postgres_non_pooled_url
   DATABASE_URL=your_vercel_postgres_pooled_url
   ```

**For local development (.env):**
```bash
DATABASE_URL=your_vercel_postgres_non_pooled_url
```

### 7. Switch Database Configuration (Optional)

If you want to use the optimized Vercel Postgres configuration:

1. Update your imports in `server/routes.ts`:
   ```typescript
   // Change from:
   import { db, userQueries, dotPhraseQueries, rosNoteQueries, userPresetQueries } from './database';
   
   // To:
   import { db, userQueries, dotPhraseQueries, rosNoteQueries, userPresetQueries } from './database-vercel';
   ```

### 8. Deploy and Test

```bash
# Deploy the updated configuration
vercel --prod

# Test your application
# - Check if login works
# - Create a test note
# - Verify all features work
```

## Verification Steps

1. **Check Tables:**
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   ```

2. **Check Data:**
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM dot_phrases;
   SELECT COUNT(*) FROM ros_notes;
   SELECT COUNT(*) FROM user_presets;
   ```

3. **Test Application:**
   - Login functionality
   - Create/edit dot phrases
   - Generate medical notes
   - User preferences

## Troubleshooting

### Connection Issues
- Use `POSTGRES_URL_NON_POOLED` for migrations and setup
- Use `POSTGRES_URL` (pooled) for application connections

### Permission Errors
- Ensure the Vercel database user has proper permissions
- Check that tables were created successfully

### Data Import Errors
- Check for foreign key constraint violations
- Verify data types match between databases
- Review the import logs for specific errors

### Application Errors
- Check Vercel function logs
- Verify environment variables are set correctly
- Test database connectivity

## Rollback Plan

If issues occur, you can rollback:

1. **Keep Railway database running** until migration is confirmed successful
2. **Switch back environment variables** to Railway URLs
3. **Redeploy** with original configuration

## Performance Optimization

After migration:

1. **Connection Pooling**: Vercel Postgres uses connection pooling by default
2. **Query Optimization**: Monitor slow queries in Vercel dashboard
3. **Indexes**: Ensure all necessary indexes are created

## Cost Considerations

- **Vercel Postgres Pricing**: Check current pricing tiers
- **Connection Limits**: Be aware of concurrent connection limits
- **Storage Limits**: Monitor database size against plan limits

## Support

If you encounter issues:
1. Check Vercel Postgres documentation
2. Review Vercel function logs
3. Test database connections directly
4. Contact Vercel support if needed