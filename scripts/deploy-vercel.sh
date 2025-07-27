#!/bin/bash

# Vercel Deployment Script for AriNote
# This script helps automate the deployment process to Vercel

set -e

echo "🚀 Starting Vercel deployment for AriNote..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please login first:"
    echo "   vercel login"
    exit 1
fi

# Install dependencies first
echo "📦 Installing dependencies..."
npm install

# Type check
echo "🔍 Running type check..."
npm run check

# Build the application
echo "📦 Building application..."
npm run build:vercel

# Check if build was successful
if [ ! -d "dist/public" ]; then
    echo "❌ Build failed. dist/public directory not found."
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Check your Vercel dashboard for the deployment status"
echo "2. Configure environment variables in your Vercel project settings"
echo "3. Update your Cognito configuration with the new domain"
echo "4. Test your application functionality"
echo ""
echo "📖 For detailed instructions, see: VERCEL_DEPLOYMENT_GUIDE.md" 