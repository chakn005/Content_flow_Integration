#!/usr/bin/env python3
"""
Simple HTTP server for sharing the Content Integration Flow app locally.
Run this script and share the URL with your team.
"""

import http.server
import socketserver
import socket
import webbrowser
from pathlib import Path

def get_local_ip():
    """Get the local IP address"""
    try:
        # Connect to a remote server to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "localhost"

def main():
    PORT = 8000
    
    # Change to the directory containing this script
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    Handler = http.server.SimpleHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        local_ip = get_local_ip()
        
        print("=" * 60)
        print("🎬 Content Integration Flow App Server")
        print("=" * 60)
        print(f"Server running on port {PORT}")
        print()
        print("Share these URLs with your team:")
        print(f"  Local:    http://localhost:{PORT}")
        print(f"  Network:  http://{local_ip}:{PORT}")
        print()
        print("Press Ctrl+C to stop the server")
        print("=" * 60)
        
        # Open browser automatically
        webbrowser.open(f"http://localhost:{PORT}")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    import os
    main()