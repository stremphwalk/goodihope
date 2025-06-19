# Railway Quick Start for AriNote

## 🚀 One-Click Deploy

1. **Connect Repository**: Link your GitHub repo to Railway
2. **Add Database**: Create PostgreSQL service in Railway
3. **Set Environment Variables**:
   ```
   DATABASE_URL=<from_railway_postgres>
   ANTHROPIC_API_KEY=<your_claude_key>
   GEMINI_API_KEY=<your_gemini_key>
   GOOGLE_APPLICATION_CREDENTIALS=<your_gcp_credentials_json>
   NODE_ENV=production
   ```
4. **Deploy**: Railway auto-deploys on push to main branch

## ✅ Pre-configured Files

- `railway.json` - Railway deployment configuration
- `Dockerfile` - Container configuration with health checks
- `Procfile` - Process configuration
- `.env.example` - Environment variables template
- `.dockerignore` - Build optimization

## 🔧 Build Process

- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run start`
- **Health Check**: `/health` endpoint
- **Port**: Auto-assigned by Railway

## 📊 Features Ready for Production

- AI-powered medication extraction
- Medical note generation
- Multi-language support (English/French)
- PostgreSQL database with Drizzle ORM
- Professional medical UI
- Secure API key management

Railway deployment is now ready - just connect your repo and deploy!