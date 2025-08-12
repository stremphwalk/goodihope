#!/bin/bash

echo "🔐 Testing Setup WITH Authentication"
echo "==================================="
echo

# Kill any existing servers
echo "🧹 Cleaning up existing servers..."
lsof -ti:3000,5001,8080,8081 | xargs kill -9 2>/dev/null || true
sleep 2

# Build production if needed
if [ ! -d "dist" ]; then
    echo "📦 Building production version..."
    npm run build
    echo
fi

echo "🚀 Starting production server with auth..."
echo "⚡ This includes backend APIs for authentication"
echo

# Start the production server
NODE_ENV=production node dist/index.js &
SERVER_PID=$!
sleep 3

# Test if server is responding
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Production server with auth is ready!"
    echo "📱 URL: http://localhost:5001"
    echo "🔧 Server PID: $SERVER_PID"
    echo
    echo "🔐 This server includes:"
    echo "   • Full authentication flow"
    echo "   • Database connections"
    echo "   • All API endpoints"
    echo "   • Session management"
    echo
    echo "🧪 Test URLs:"
    echo "   • Landing/Auth: http://localhost:5001/"
    echo "   • After login: http://localhost:5001/ (will redirect to app)"
    echo
    echo "🛑 To stop server: kill $SERVER_PID"
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening browser..."
        open http://localhost:5001
    else
        echo "💡 Manually open: http://localhost:5001"
    fi
else
    echo "❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi