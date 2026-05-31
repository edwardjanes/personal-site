#!/usr/bin/env python3
import http.server
import socketserver
import json
import urllib.request
import urllib.error
import os
import sys

GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbTmjcl1Lgw3EPcCDi4dhqyQCIUMbOo6cyL1irgl6l7cDnPiEz_eFcng9xYsWXeKoW/exec'

class RelayServer(socketserver.TCPServer):
    allow_reuse_address = True

class RelayHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?')[0]

        try:
            if path == '/api/get':
                try:
                    response = urllib.request.urlopen(GOOGLE_APPS_SCRIPT_URL, timeout=10)
                    data = response.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(data)
                except Exception as e:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': str(e)}).encode())
            elif path == '/health':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok'}).encode())
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Not found'}).encode())
        except Exception as e:
            sys.stderr.write(f"Error in do_GET: {e}\n")
            sys.stderr.flush()

    def do_POST(self):
        path = self.path.split('?')[0]
        content_length = int(self.headers.get('Content-Length', 0))

        try:
            if path == '/api/post':
                body = self.rfile.read(content_length)
                try:
                    req = urllib.request.Request(
                        GOOGLE_APPS_SCRIPT_URL,
                        data=body,
                        headers={'Content-Type': 'application/json'}
                    )
                    response = urllib.request.urlopen(req, timeout=10)
                    data = response.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(data)
                except urllib.error.HTTPError as e:
                    error_data = e.read()
                    self.send_response(e.code)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())
                except Exception as e:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Not found'}).encode())
        except Exception as e:
            sys.stderr.write(f"Error in do_POST: {e}\n")
            sys.stderr.flush()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        sys.stderr.write(f"[{self.client_address[0]}] {format % args}\n")
        sys.stderr.flush()

if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 8080))

    sys.stderr.write(f"Starting relay server on port {PORT}...\n")
    sys.stderr.flush()

    try:
        with RelayServer(('0.0.0.0', PORT), RelayHandler) as httpd:
            sys.stderr.write(f"Relay server listening on 0.0.0.0:{PORT}\n")
            sys.stderr.write("Endpoints:\n")
            sys.stderr.write("  GET  /api/get → forwards to Google Apps Script\n")
            sys.stderr.write("  POST /api/post → forwards to Google Apps Script\n")
            sys.stderr.write("  GET  /health → health check\n")
            sys.stderr.flush()
            httpd.serve_forever()
    except Exception as e:
        sys.stderr.write(f"CRITICAL ERROR: {e}\n")
        sys.stderr.flush()
        sys.exit(1)
