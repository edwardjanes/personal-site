#!/usr/bin/env python3
import http.server
import socketserver
import json
import urllib.request
import urllib.error
import os
import sys

GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbznODbFe6_FMad_Y_NG7Zseq9kGxCzN0-6VFkHAHd6MCjKkHV2A2BwmOa6bLcQN50hY/exec'
DASHBOARD_PATH = '/Users/edwardjanes/Documents/personal/dashboard.html'

class RelayHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?')[0]
        print(f"\n>>> GET {path}", file=sys.stderr)

        if path in ['/', '/dashboard.html']:
            print(f"    Serving dashboard", file=sys.stderr)
            try:
                with open(DASHBOARD_PATH, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                print(f"    ERROR: {e}", file=sys.stderr)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())

        elif path == '/api/get':
            print(f"    Forwarding to Google Apps Script", file=sys.stderr)
            try:
                response = urllib.request.urlopen(GOOGLE_APPS_SCRIPT_URL, timeout=10)
                data = response.read()
                print(f"    Got {len(data)} bytes from Apps Script", file=sys.stderr)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:
                print(f"    ERROR: {e}", file=sys.stderr)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            print(f"    404 - not found", file=sys.stderr)
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Not found'}).encode())

    def do_POST(self):
        path = self.path.split('?')[0]
        content_length = int(self.headers.get('Content-Length', 0))
        print(f"\n>>> POST {path} ({content_length} bytes)", file=sys.stderr)

        if path == '/api/post':
            print(f"    Reading {content_length} bytes from request body", file=sys.stderr)
            body = self.rfile.read(content_length)
            print(f"    Forwarding to Google Apps Script", file=sys.stderr)

            try:
                req = urllib.request.Request(
                    GOOGLE_APPS_SCRIPT_URL,
                    data=body,
                    headers={'Content-Type': 'application/json'}
                )
                response = urllib.request.urlopen(req, timeout=10)
                data = response.read()
                print(f"    Got {len(data)} bytes from Apps Script", file=sys.stderr)
                print(f"    First 200 chars: {data[:200]}", file=sys.stderr)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
                print(f"    Response sent successfully", file=sys.stderr)

            except urllib.error.HTTPError as e:
                error_data = e.read()
                print(f"    HTTP ERROR {e.code}: {error_data[:200]}", file=sys.stderr)
                self.send_response(e.code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())
            except Exception as e:
                print(f"    ERROR: {e}", file=sys.stderr)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())
        else:
            print(f"    404 - path not handled", file=sys.stderr)
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Not found'}).encode())

    def do_OPTIONS(self):
        print(f"\n>>> OPTIONS {self.path}", file=sys.stderr)
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    PORT = 8080
    print("Stopping any existing server on port 8080...", file=sys.stderr)
    os.system('lsof -ti :8080 | xargs kill -9 2>/dev/null')
    import time
    time.sleep(0.5)

    with socketserver.TCPServer(("", PORT), RelayHandler) as httpd:
        print(f"\n✓ Relay server running at http://localhost:{PORT}/", file=sys.stderr)
        print(f"✓ GET  / → serves dashboard", file=sys.stderr)
        print(f"✓ GET  /api/get → forwards to Google Apps Script", file=sys.stderr)
        print(f"✓ POST /api/post → forwards to Google Apps Script\n", file=sys.stderr)
        httpd.serve_forever()
