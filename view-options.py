#!/usr/bin/env python3
"""
Simple HTTP server to view all QA connection options locally.
Run this script and visit the URLs shown to compare all connection styles.
"""

import http.server
import socketserver
import webbrowser
import threading
import time

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def start_server():
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        print("\n🎯 QA Connection Options - Compare all 8 connection styles:")
        print(f"📋 Option A (Curves):     http://localhost:{PORT}/option-a-curves.html")
        print(f"📋 Option B (Nodes):      http://localhost:{PORT}/option-b-nodes.html") 
        print(f"📋 Option C (Zones):      http://localhost:{PORT}/option-c-zones.html")
        print(f"📋 Option D (Pipes):      http://localhost:{PORT}/option-d-pipes.html")
        print(f"📋 Option E (Glow):       http://localhost:{PORT}/option-e-glow.html")
        print(f"📋 Option F (Bridges):    http://localhost:{PORT}/option-f-bridges.html")
        print(f"📋 Option G (Minimal):    http://localhost:{PORT}/option-g-minimal.html")
        print(f"📋 Option H (Hub):        http://localhost:{PORT}/option-h-hub.html")
        print(f"📋 Original:              http://localhost:{PORT}/index.html")
        print("\n💡 Press Ctrl+C to stop the server")
        
        # Auto-open the first option
        def open_browser():
            time.sleep(1)
            webbrowser.open(f'http://localhost:{PORT}/option-a-curves.html')
        
        threading.Thread(target=open_browser, daemon=True).start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")

if __name__ == "__main__":
    start_server()