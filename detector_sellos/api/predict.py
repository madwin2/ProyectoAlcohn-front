from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response = {
            "success": True,
            "results": [],
            "message": "API funcionando - datos mock"
        }
        self.wfile.write(json.dumps(response).encode())