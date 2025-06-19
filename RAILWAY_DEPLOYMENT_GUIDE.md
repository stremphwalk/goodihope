# AriNote - Railway Deployment Guide

## Prerequisites

1. **Railway Account**: Create an account at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to the "goodihope" repository
3. **Environment Variables**: Prepare your API keys and database credentials

## Required Environment Variables

Set these in your Railway project dashboard:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# AI Services
ANTHROPIC_API_KEY=your_anthropic_key_here
GEMINI_API_KEY=your_gemini_key_here
GOOGLE_APPLICATION_CREDENTIALS=your_google_credentials_json_here

# Production Environment
NODE_ENV=production
```

## Deployment Steps

### 1. Create Railway Project
- Go to Railway dashboard
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your "goodihope" repository

### 2. Configure Build Settings
Railway will automatically detect the configuration from `railway.json`:

```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 60,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### 3. Set Environment Variables
In Railway dashboard:
- Go to your project → Variables tab
- Add all required environment variables listed above
- Ensure `NODE_ENV` is set to `production`

### 4. Deploy
- Railway will automatically build and deploy
- Monitor the build logs for any issues
- Health check will verify deployment at `/health` endpoint

## Production Optimizations

### Medication Data
- Production uses embedded medication data instead of CSV files
- Fallback system ensures functionality without external file dependencies

### Health Monitoring
- Comprehensive health check at `/health` endpoint
- Returns server status, uptime, memory usage, and environment info
- 60-second timeout for Railway health checks

### Google Cloud Vision
- Supports both JSON credentials and service account authentication
- Automatic fallback for different credential formats
- Production-ready error handling

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Verify build command completes successfully locally

2. **Health Check Timeouts**
   - Ensure server starts within 60 seconds
   - Check `/health` endpoint responds quickly

3. **Environment Variables**
   - Verify all required secrets are set
   - Check `NODE_ENV=production` is configured

4. **Database Connection**
   - Ensure `DATABASE_URL` is correctly formatted
   - Test connection string locally if possible

### Debugging Commands

```bash
# Test health check locally
curl http://localhost:5000/health

# Check production build
npm run build
npm run start

# Verify environment variables
echo $NODE_ENV
```

## Post-Deployment Verification

1. **Health Check**: Visit `https://your-app.railway.app/health`
2. **Application**: Test core functionality
3. **AI Services**: Verify medication extraction works
4. **Database**: Check data persistence

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Project Health: Monitor via Railway dashboard

## Security Notes

- All API keys are securely stored in Railway environment variables
- Production environment automatically enabled via `NODE_ENV=production`
- Health checks exclude sensitive information from responses