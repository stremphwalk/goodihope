# Vercel Deployment Guide for AriNote

This guide will help you deploy your AriNote application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Environment Variables**: You'll need to configure your environment variables in Vercel

## Step 1: Prepare Your Repository

The following files have been created/updated for Vercel deployment:

- `vercel.json` - Vercel configuration
- `api/index.ts` - Serverless API handler
- `package.json` - Updated with Vercel build script
- `vite.config.ts` - Updated for Vercel compatibility
- `client/src/main.tsx` - Updated with API base URL handling

## Step 2: Environment Variables

You'll need to set up the following environment variables in your Vercel project:

### Required Environment Variables

```bash
# Database
DATABASE_URL=your_database_connection_string

# Authentication (AWS Cognito)
COGNITO_CLIENT_ID=your_cognito_client_id
COGNITO_CLIENT_SECRET=your_cognito_client_secret
COGNITO_DOMAIN=your_cognito_domain

# API Keys
GOOGLE_AI_API_KEY=your_google_ai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Other
NODE_ENV=production
```

### How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the appropriate value
5. Make sure to set them for "Production" environment

## Step 3: Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the following settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (root of your project)
   - **Build Command**: `npm run build:vercel`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project root:
   ```bash
   vercel
   ```

4. Follow the prompts to configure your deployment

## Step 4: Configure Custom Domain (Optional)

1. In your Vercel dashboard, go to Settings → Domains
2. Add your custom domain
3. Configure DNS settings as instructed by Vercel

## Step 5: Update Authentication Configuration

Update your Cognito configuration to include your Vercel domain:

1. Go to AWS Cognito Console
2. Update your app client settings
3. Add your Vercel domain to the allowed callback URLs:
   ```
   https://your-app.vercel.app
   https://your-custom-domain.com
   ```

## Step 6: Database Configuration

### If using Supabase/PostgreSQL:

1. Ensure your database is accessible from Vercel's servers
2. Update your `DATABASE_URL` to use the production database
3. Run migrations if needed:
   ```bash
   npm run db:push
   ```

### If using other databases:

1. Ensure your database connection string is correct
2. Test the connection from Vercel's environment

## Step 7: Test Your Deployment

1. Visit your deployed application
2. Test the following functionality:
   - User authentication
   - API endpoints
   - Database operations
   - File uploads (if applicable)

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check the build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation

2. **API Errors**:
   - Check environment variables are set correctly
   - Verify database connectivity
   - Check function timeout settings

3. **Authentication Issues**:
   - Verify Cognito configuration
   - Check callback URLs
   - Ensure environment variables are correct

### Debugging

1. **Function Logs**: Check Vercel function logs in the dashboard
2. **Environment Variables**: Verify all required variables are set
3. **Database**: Test database connectivity
4. **API Endpoints**: Test individual API endpoints

## Performance Optimization

1. **Function Optimization**:
   - Keep functions lightweight
   - Use connection pooling for database
   - Implement caching where appropriate

2. **Frontend Optimization**:
   - Enable compression
   - Use CDN for static assets
   - Implement lazy loading

## Monitoring

1. **Vercel Analytics**: Enable in your project settings
2. **Error Tracking**: Consider adding error tracking (Sentry, etc.)
3. **Performance Monitoring**: Monitor function execution times

## Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **CORS**: Configure CORS properly for your domain
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Input Validation**: Validate all user inputs

## Support

If you encounter issues:

1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Review function logs in Vercel dashboard
3. Test locally with `vercel dev` command
4. Check GitHub issues for similar problems

## Next Steps

After successful deployment:

1. Set up monitoring and alerting
2. Configure CI/CD for automatic deployments
3. Set up staging environment
4. Implement backup strategies
5. Plan for scaling as your application grows 