from http.server import BaseHTTPRequestHandler
import json
import cgi
import tempfile
from PIL import Image
import hashlib
import io

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()
    
    def do_POST(self):
        try:
            # Parse multipart form data
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST'}
            )
            
            results = []
            svg_hashes = {}
            
            # Process SVGs
            if 'svgs' in form:
                svgs = form['svgs'] if isinstance(form['svgs'], list) else [form['svgs']]
                for svg in svgs:
                    if hasattr(svg, 'file'):
                        content = svg.file.read()
                        svg_hash = hashlib.md5(content).hexdigest()
                        svg_hashes[svg.filename] = svg_hash
            
            # Process photos
            if 'fotos' in form:
                fotos = form['fotos'] if isinstance(form['fotos'], list) else [form['fotos']]
                for foto in fotos:
                    if hasattr(foto, 'file'):
                        content = foto.file.read()
                        
                        # Simple hash comparison
                        matches = []
                        for svg_name, svg_hash in svg_hashes.items():
                            foto_hash = hashlib.md5(content).hexdigest()
                            # Simple similarity based on hash prefix
                            similarity = sum(a == b for a, b in zip(foto_hash[:8], svg_hash[:8])) / 8
                            score = 0.3 + similarity * 0.6
                            
                            matches.append({
                                "svg": svg_name,
                                "score": round(score, 3),
                                "match": score > 0.5
                            })
                        
                        matches.sort(key=lambda x: x["score"], reverse=True)
                        results.append({
                            "foto": foto.filename,
                            "matches": matches
                        })
            
            response = {
                "success": True,
                "results": results,
                "message": f"Procesadas {len(results)} fotos contra {len(svg_hashes)} SVGs"
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', '*')
            self.end_headers()
            error_response = {"success": False, "error": str(e)}
            self.wfile.write(json.dumps(error_response).encode())