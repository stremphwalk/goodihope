# AriNote Database Migration to Neon

This guide helps you migrate from Railway to Neon Postgres through Vercel's marketplace.

## Why Neon for AriNote?

- **Serverless Postgres** - Perfect for Vercel functions
- **Instant scaling** - Auto-pause when inactive
- **Database branching** - Test changes safely
- **Connection pooling** - Built-in connection management
- **Free tier** - 0.5GB storage, 100 hours compute/month

## Step 1: Set Up Neon Database

### Via Vercel Marketplace (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `goodihope` project
3. Go to **Storage** tab
4. Click **Browse Marketplace**
5. Select **Neon**
6. Click **Add Integration**
7. Choose your project and click **Install**
8. Create a new database:
   - Name: `arinote-production`
   - Region: Choose closest to your users
   - Click **Create Database**

### Direct Neon Setup (Alternative)

1. Go to [Neon Console](https://neon.tech)
2. Sign up/login with your GitHub account
3. Create new project: "AriNote"
4. Choose region closest to your Vercel deployment
5. Note your connection string

## Step 2: Configure Database Connection

The Neon integration automatically adds environment variables to your Vercel project:
- `NEON_DATABASE_URL` - Main connection string
- `NEON_BRANCH_ID` - Current branch ID
- `NEON_PROJECT_ID` - Project identifier

## Step 3: Update Database Configuration

Update your database configuration to use Neon:

```typescript
// server/database.ts - Update connection string priority
const connectionString = process.env.NEON_DATABASE_URL || 
                         process.env.DATABASE_URL || 
                         process.env.POSTGRES_URL;
```

## Step 4: Export Data from Railway

```bash
# Set your Railway database URL
export RAILWAY_DATABASE_URL="your_railway_postgres_url"

# Export data (use the existing script)
./scripts/export-railway-to-vercel.sh
```

## Step 5: Import to Neon Database

```bash
# Set your Neon connection string
export NEON_DATABASE_URL="your_neon_connection_string"

# Create tables using Drizzle
npm run db:push

# Import your data
psql "$NEON_DATABASE_URL" -f "./database-migration-*/data.sql"
```

## Step 6: Update Environment Variables

In your Vercel project settings, ensure these are set:
```
NEON_DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/dbname
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/dbname
```

## Step 7: Deploy and Test

```bash
# Deploy with new database
vercel --prod

# Test your application
# - Login functionality
# - Create/edit dot phrases  
# - Generate medical notes
# - User preferences
```

## Neon-Specific Features

### Database Branching
Create branches for testing:
```bash
# Create a dev branch
neonctl branches create --name development

# Use branch-specific connection string for testing
```

### Connection Pooling
Neon includes built-in connection pooling - no additional setup needed.

### Monitoring
- View query performance in Neon console
- Monitor connection usage
- Set up alerts for usage limits

## Cost Optimization

### Free Tier Limits
- **Storage**: 0.5 GB
- **Compute**: 100 hours/month
- **Connections**: Up to 100 concurrent

### Usage Tips
- Database auto-pauses after 5 minutes of inactivity
- Only pay for active compute time
- Monitor usage in Neon dashboard

## Troubleshooting

### Connection Issues
```bash
# Test connection
psql "$NEON_DATABASE_URL" -c "SELECT version();"
```

### SSL Requirements
Neon requires SSL connections:
```typescript
// In your database config
const client = postgres(connectionString, {
  ssl: 'require', // Always require SSL for Neon
  // ... other options
});
```

### Migration Errors
- Check foreign key constraints
- Verify data types compatibility
- Review Neon console logs

## Advanced Features

### Point-in-Time Recovery
Neon provides automatic backups and point-in-time recovery.

### Read Replicas
For high-traffic applications, consider adding read replicas.

### Database Sharing
Share database access with team members through Neon console.

## Migration Verification

After migration, verify:

1. **Table Structure**:
   ```sql
   \dt  -- List all tables
   ```

2. **Data Integrity**:
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM dot_phrases;
   SELECT COUNT(*) FROM ros_notes;
   ```

3. **Application Testing**:
   - User authentication
   - Medical note generation
   - Dot phrase management
   - Data persistence

## Rollback Plan

Keep Railway database active until migration is verified:
1. Switch environment variables back to Railway
2. Redeploy application
3. Verify functionality

## Next Steps

After successful migration:
1. **Monitor Performance** - Check query times and connection usage
2. **Set Up Alerts** - Get notified about usage limits
3. **Optimize Queries** - Use Neon's query insights
4. **Consider Branching** - Set up development/staging branches
5. **Backup Strategy** - Configure additional backup policies if needed

## Support Resources

- [Neon Documentation](https://neon.tech/docs)
- [Vercel + Neon Integration Guide](https://vercel.com/integrations/neon)
- [Neon Community Discord](https://discord.gg/92vNTzKDGp)