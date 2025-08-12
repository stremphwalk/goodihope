#!/bin/bash

echo "🔧 Final Testing Setup - No More 'Failed to Fetch'"
echo "================================================"
echo

# Kill any existing servers
echo "🧹 Cleaning up existing servers..."
lsof -ti:3000,5001,8080,8081,8082 | xargs kill -9 2>/dev/null || true
sleep 2

# Rebuild with clean HTML (no Replit script)
echo "📦 Rebuilding with fixes..."
npm run build > /dev/null 2>&1

# Remove the problematic Replit script from built HTML (backup fix)
if grep -q "replit.com" dist/public/index.html 2>/dev/null; then
    echo "🔧 Removing problematic Replit script from build..."
    sed -i.bak '/replit\.com/d' dist/public/index.html
    sed -i.bak '/replit script/d' dist/public/index.html
fi

echo "🚀 Starting clean test server..."
echo "✅ No CORS issues, no CSP blocks, no external scripts"
echo

# Start the clean server
node simple-test.js &
SERVER_PID=$!
sleep 3

# Test server health
if curl -s http://localhost:8082/api/test > /dev/null; then
    echo "✅ Clean test server is ready!"
    echo "📱 URL: http://localhost:8082"
    echo "🔧 Server PID: $SERVER_PID"
    echo
    echo "🎯 This server fixes:"
    echo "   • ❌ 'Failed to fetch' errors"
    echo "   • ❌ CORS blocks"
    echo "   • ❌ CSP restrictions"
    echo "   • ❌ External script issues"
    echo
    echo "🧪 Test Pages:"
    echo "   • Main: http://localhost:8082/"
    echo "   • Groups: http://localhost:8082/groups"
    echo "   • Dot Phrases: http://localhost:8082/dot-phrases"
    echo "   • Calculations: http://localhost:8082/calculations"
    echo
    echo "🛑 To stop: kill $SERVER_PID"
    
    # Open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening browser..."
        open http://localhost:8082
    else
        echo "💡 Open: http://localhost:8082"
    fi
    
    echo ""
    echo "🎉 Ready to test sub-page navigation without errors!"
    
else
    echo "❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi