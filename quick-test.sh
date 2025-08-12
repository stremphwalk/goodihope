#!/bin/bash

echo "🏗️  Quick Testing Setup for GOODIHOPE"
echo "=================================="
echo

# Kill any existing servers on these ports
echo "🧹 Cleaning up existing servers..."
lsof -ti:8080,8081 | xargs kill -9 2>/dev/null || true
sleep 1

# Check if build exists
if [ ! -d "dist/public" ]; then
    echo "📦 Building production version..."
    npm run build
    echo
fi

echo "🚀 Starting Fast Test Server..."
echo "⚡ This production build is 10x faster than dev server!"
echo

# Start Python server in background
python3 test-server.py &
SERVER_PID=$!
sleep 2

# Test if server is responding
if curl -s http://localhost:8081 > /dev/null; then
    echo "✅ Test server is ready!"
    echo "📱 URL: http://localhost:8081"
    echo "🔧 Server PID: $SERVER_PID"
    echo
    echo "🧪 Quick Tests:"
    echo "   • Main page: http://localhost:8081/"
    echo "   • Groups: http://localhost:8081/groups"
    echo "   • Dot Phrases: http://localhost:8081/dot-phrases"
    echo "   • Calculations: http://localhost:8081/calculations"
    echo "   • Live Translation: http://localhost:8081/live-translation"
    echo
    echo "🛑 To stop server: kill $SERVER_PID"
    echo "   Or just press Ctrl+C when testing is done"
else
    echo "❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi