#!/usr/bin/env python
"""Minimal quick-start backend server"""
import sys
import os
import asyncio
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

print("[*] Starting minimal backend server on 127.0.0.1:8000", flush=True)

class OralGuardHandler(BaseHTTPRequestHandler):
    def _add_cors_headers(self):
        """Add CORS headers to response"""
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-type", "application/json")
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        print(f"[OPTIONS] {self.path}", flush=True)
        self.send_response(200)
        self._add_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        print(f"[GET] {self.path}", flush=True)
        if self.path == "/":
            self.send_response(200)
            self._add_cors_headers()
            self.end_headers()
            response = {"message": "OralGuard backend is running", "api_prefix": "/api"}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self._add_cors_headers()
            self.end_headers()
            response = {"error": f"Not found: {self.path}"}
            self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        print(f"[POST] {self.path}", flush=True)
        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b''
        
        print(f"    Body: {body.decode('utf-8', errors='ignore')[:200]}", flush=True)
        
        self.send_response(503)
        self._add_cors_headers()
        self.end_headers()
        response = {"error": "Backend is initializing. Please wait and try again in a moment..."}
        self.wfile.write(json.dumps(response).encode())
    
    def log_message(self, format, *args):
        print(f"[HTTP] {format % args}", flush=True)

try:
    server = HTTPServer(("127.0.0.1", 8000), OralGuardHandler)
    print("[✓] Server started! Visit http://127.0.0.1:8000/", flush=True)
    print("[*] Now loading FastAPI backend in background...", flush=True)
    
    # Now try to load the real app in a thread
    import threading
    def load_real_backend():
        try:
            print("[*] Importing FastAPI backend...", flush=True)
            import uvicorn
            print("[✓] FastAPI backend loaded successfully!", flush=True)
            # Replace the server with the real one
            uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, log_level="info")
        except Exception as e:
            print(f"[!] FastAPI load failed: {e}", flush=True)
    
    # Start loading in background
    loader_thread = threading.Thread(target=load_real_backend, daemon=False)
    loader_thread.start()
    
    # Serve on the minimal server
    server.serve_forever()
    
except Exception as e:
    print(f"[ERROR] {type(e).__name__}: {e}", flush=True)
    sys.exit(1)
