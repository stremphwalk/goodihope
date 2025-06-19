# Production Deployment Fix for Vite Dependency Issue

## Problem
The application fails in production with "Cannot find package 'vite'" because the server code imports Vite for middleware setup, but production builds typically remove dev dependencies.

## Solution Options

### Option 1: Use Updated Dockerfile (Recommended)
The updated Dockerfile keeps necessary build tools in production:

```dockerfile
# Install production dependencies and keep Vite/ESBuild for runtime
RUN npm ci --only=production && npm install vite@^5.4.14 esbuild@^0.25.0 @vitejs/plugin-react@^4.3.2 && npm cache clean --force
```

### Option 2: Use Nixpacks Configuration
The nixpacks.toml configuration handles dependencies properly:

```toml
[phases.postbuild]
cmds = ['npm prune --production', 'npm install vite esbuild @vitejs/plugin-react']
```

## Deployment Steps

1. **Push Updated Files**:
```bash
git add Dockerfile nixpacks.toml PRODUCTION_FIX.md
git commit -m "Fix production Vite dependency issue for Railway deployment"
git push origin main
```

2. **Railway Deployment**:
- Option A: Keep using Dockerfile (Railway will use the updated version)
- Option B: Switch to Nixpacks in Railway settings under "Build"

3. **Verify Environment Variables** in Railway:
```
DATABASE_URL=<from_railway_postgres>
ANTHROPIC_API_KEY=<your_key>
GEMINI_API_KEY=<your_key>
GOOGLE_APPLICATION_CREDENTIALS=<your_gcp_json>
NODE_ENV=production
```

## Why This Fix Works

The server architecture requires Vite for:
- Development middleware in development mode
- Static file serving configuration in production mode
- Module resolution for the Express server

By keeping Vite and ESBuild in production, we ensure the server can start properly while maintaining the build optimizations.