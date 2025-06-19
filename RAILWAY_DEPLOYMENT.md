# Railway Deployment Guide for AriNote

This guide walks you through deploying your AriNote medical documentation platform to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Environment Variables**: Have your API keys ready

## Required Environment Variables

Set these environment variables in your Railway project:

```
DATABASE_URL=your_postgresql_connection_string
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_google_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=your_google_cloud_credentials_json
NODE_ENV=production
```

## Deployment Steps

### 1. Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your AriNote repository

### 2. Configure Database

1. In your Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will create a PostgreSQL database and provide a `DATABASE_URL`
4. Copy the `DATABASE_URL` from the PostgreSQL service

### 3. Set Environment Variables

In your Railway project settings, add these variables:

- `DATABASE_URL`: Use the URL from your Railway PostgreSQL service
- `ANTHROPIC_API_KEY`: Your Claude API key
- `GEMINI_API_KEY`: Your Google Gemini API key  
- `GOOGLE_APPLICATION_CREDENTIALS`: Your Google Cloud credentials JSON (as a string)
- `NODE_ENV`: Set to `production`

### 4. Configure Build Settings

Railway will automatically detect your Node.js app. The deployment uses:

- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Port**: Railway assigns automatically via `PORT` environment variable

### 5. Deploy

1. Railway will automatically deploy when you push to your main branch
2. You can also trigger manual deployments from the Railway dashboard
3. Monitor the build logs for any issues

## Database Setup

After your first deployment:

1. Connect to your Railway PostgreSQL database
2. Run database migrations: `npm run db:push`
3. Your Drizzle schema will be automatically applied

## Health Checks

The application includes a health check endpoint at `/health` that Railway uses to monitor your deployment.

## Custom Domain (Optional)

1. In Railway project settings, go to "Domains"
2. Add your custom domain
3. Configure DNS records as instructed by Railway

## Troubleshooting

### Common Issues

1. **Build Failures**: Check that all dependencies are in `package.json`
2. **Database Connection**: Verify `DATABASE_URL` is correctly set
3. **API Key Issues**: Ensure all API keys are valid and properly formatted
4. **Port Issues**: Railway automatically assigns ports - don't hardcode port numbers

### Logs

Monitor your deployment logs in the Railway dashboard:
- Build logs show compilation issues
- Runtime logs show application errors
- Database logs show connection issues

### Performance

- Railway automatically scales based on traffic
- Monitor memory and CPU usage in the Railway dashboard
- Consider upgrading your plan for higher traffic applications

## Environment-Specific Notes

- **Production Mode**: The app runs in production mode with optimized builds
- **Static Assets**: Frontend assets are served efficiently by the Express server
- **Database**: PostgreSQL is recommended for production use
- **Monitoring**: Railway provides built-in monitoring and alerting

## Support

If you encounter issues:
1. Check Railway documentation
2. Review build and runtime logs
3. Verify all environment variables are set correctly
4. Test your API keys independently

Your AriNote platform should now be successfully deployed on Railway!