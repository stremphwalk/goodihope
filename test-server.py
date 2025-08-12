#!/usr/bin/env python3

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# Change to the dist/public directory
os.chdir('dist/public')

PORT = 8081
Handler = http.server.SimpleHTTPServer if hasattr(http.server, 'SimpleHTTPServer') else http.server.SimpleHTTPRequestHandler

# Custom handler to serve index.html for all routes (SPA routing)
class SPAHandler(Handler):
    def do_GET(self):
        # If the path doesn't exist and it's not asking for a specific file extension,
        # serve index.html (for client-side routing)
        if not os.path.exists(self.path[1:]) and '.' not in os.path.basename(self.path):
            self.path = '/index.html'
        return Handler.do_GET(self)

print(f"🚀 Fast Testing Server Starting...")
print(f"📁 Serving from: {os.getcwd()}")

try:
    with socketserver.TCPServer(("", PORT), SPAHandler) as httpd:
        print(f"✅ Server ready at: http://localhost:{PORT}")
        print(f"⚡ This is MUCH faster than the dev server!")
        print(f"🛑 Press Ctrl+C to stop")
        print()
        
        # Try to open browser automatically
        try:
            webbrowser.open(f'http://localhost:{PORT}')
            print("🌐 Opening browser...")
        except:
            print("💡 Manually open: http://localhost:8081")
        
        httpd.serve_forever()
        
except KeyboardInterrupt:
    print("\n🛑 Server stopped")
except Exception as e:
    print(f"❌ Error: {e}")