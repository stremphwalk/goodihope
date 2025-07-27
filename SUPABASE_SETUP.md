# Supabase Migration Setup Guide

## Overview
This guide will help you migrate from your current authentication and database setup to Supabase. We've already prepared all the code changes - you just need to set up the Supabase project and configure environment variables.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a name for your project (e.g., "goodihope" or "arinote")
3. Create a strong database password (save this!)
4. Select a region (choose closest to your users)

## Step 2: Get Your Credentials

After project creation, go to Settings > API and copy:

- **Project URL**: `https://[your-project-id].supabase.co`
- **Anon/Public Key**: `eyJ...` (starts with eyJ)
- **Service Role Key**: `eyJ...` (starts with eyJ, used for admin operations)

## Step 3: Run Database Migration

1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase-migration.sql`
3. Run the SQL script to create all tables and security policies

## Step 4: Environment Variables

Create/update your `.env` file with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...

# Keep existing API keys
ANTHROPIC_API_KEY=your-existing-key
GEMINI_API_KEY=your-existing-key
GOOGLE_APPLICATION_CREDENTIALS=your-existing-credentials
```

## Step 5: Update Vercel Environment Variables

1. Go to your Vercel dashboard
2. Add the same Supabase environment variables
3. Redeploy your application

## What's Been Migrated

✅ **Pure Supabase Authentication**
- Completely removed custom auth API endpoints
- AuthContext follows Supabase React quickstart pattern
- All authentication handled client-side by Supabase
- No more custom /api/auth routes

✅ **Database Connection**
- Created Supabase database client
- UUID-based user system
- Row Level Security with Supabase auth integration

✅ **Security**
- Row Level Security (RLS) enabled
- Policies use auth.uid() for user isolation
- JWT tokens managed by Supabase
- Data stored in Canada Central

## Features You Get with Supabase

- ✅ Reliable email/password authentication
- ✅ Social login options (Google, GitHub, etc.)
- ✅ Magic link authentication
- ✅ Automatic email verification
- ✅ Password reset functionality
- ✅ Row Level Security (RLS)
- ✅ Real-time database subscriptions
- ✅ Built-in user management dashboard
- ✅ Automatic backups
- ✅ Edge functions support

## Testing Locally

After setting up environment variables:

```bash
npm run dev
```

The app will now use Supabase for authentication and database operations.

## Deployment

The existing Vercel configuration will work with Supabase. Just make sure to:

1. Set the Supabase environment variables in Vercel
2. Remove old database environment variables
3. Deploy

## Data Migration (if needed)

If you have existing data to migrate:

1. Export data from your current database
2. Use Supabase's data import tools
3. Or write a migration script using the new Supabase client

## Troubleshooting

- Check environment variables are correctly set
- Verify Supabase project is active
- Check RLS policies if having permission issues
- Review Supabase logs in dashboard