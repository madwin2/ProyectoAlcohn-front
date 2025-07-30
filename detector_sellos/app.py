from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import tempfile
import os
from PIL import Image
import hashlib
import shutil
import cairosvg

app = FastAPI(title="Detector de Sellos - Servidor Hetzner", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

def calcular_hash_imagen(imagen_path):
    """Calcula hash perceptual basado en thumbnail"""
    try:
        with Image.open(imagen_path) as img:
            img = img.convert('L').resize((8, 8), Image.Resampling.LANCZOS)
            pixels = list(img.getdata())
            avg = sum(pixels) / len(pixels)
            hash_bits = ''.join(['1' if p > avg else '0' for p in pixels])
            return hash_bits
    except Exception as e:
        print(f"Error calculando hash: {e}")
        return "0" * 64

def calcular_hash_contenido(content):
    """Calcula hash MD5 del contenido del archivo"""
    return hashlib.md5(content).hexdigest()

def comparar_hashes(hash1, hash2):
    """Compara dos hashes y retorna similitud (0-1)"""
    if len(hash1) != len(hash2):
        return 0.0
    matches = sum(c1 == c2 for c1, c2 in zip(hash1, hash2))
    return matches / len(hash1)

@app.get("/")
def root():
    return {
        "status": "ok", 
        "message": "Detector de Sellos API - Servidor Hetzner",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "docs": "/docs"
        }
    }

@app.get("/health")
def health():
    return {"status": "ok", "message": "API funcionando correctamente"}

@app.post("/predict")
async def predict(
    svgs: List[UploadFile] = File(..., description="SVGs de referencia"),
    fotos: List[UploadFile] = File(..., description="Fotos a analizar")
):
    """
    Procesa fotos contra SVGs de referencia y retorna matches
    """
    try:
        # Procesar SVGs
        svg_hashes = {}
        
        for svg in svgs:
            content = await svg.read()
            
            # Guardar SVG temporalmente
            with tempfile.NamedTemporaryFile(delete=False, suffix='.svg') as tmp_svg:
                tmp_svg.write(content)
                tmp_svg_path = tmp_svg.name
            
            try:
                # Convertir SVG a PNG
                png_path = tmp_svg_path + '.png'
                cairosvg.svg2png(url=tmp_svg_path, write_to=png_path, output_width=256, output_height=256)
                
                # Calcular hash del PNG
                svg_hash = calcular_hash_imagen(png_path)
                svg_hashes[svg.filename] = svg_hash
                
                # Limpiar archivos temporales
                os.unlink(tmp_svg_path)
                os.unlink(png_path)
                
            except Exception as e:
                print(f"Error procesando {svg.filename}: {e}")
                # Fallback: usar hash del contenido
                svg_hash = calcular_hash_contenido(content)
                svg_hashes[svg.filename] = svg_hash
                if os.path.exists(tmp_svg_path):
                    os.unlink(tmp_svg_path)
        
        # Procesar fotos
        results = []
        
        for foto in fotos:
            content = await foto.read()
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_foto:
                tmp_foto.write(content)
                tmp_foto_path = tmp_foto.name
            
            try:
                foto_hash = calcular_hash_imagen(tmp_foto_path)
                
                matches = []
                for svg_name, svg_hash in svg_hashes.items():
                    # Comparación de hashes
                    similarity = comparar_hashes(foto_hash[:32], svg_hash[:32])
                    score = max(0.1, similarity * 0.9)  # Score entre 0.1 y 0.9
                    
                    matches.append({
                        "svg": svg_name,
                        "score": round(score, 3),
                        "match": score > 0.6
                    })
                
                # Ordenar por score
                matches.sort(key=lambda x: x["score"], reverse=True)
                
                results.append({
                    "foto": foto.filename,
                    "matches": matches
                })
                
                os.unlink(tmp_foto_path)
                
            except Exception as e:
                print(f"Error procesando {foto.filename}: {e}")
                if os.path.exists(tmp_foto_path):
                    os.unlink(tmp_foto_path)
                results.append({
                    "foto": foto.filename,
                    "matches": [],
                    "error": f"Error procesando archivo: {str(e)}"
                })
        
        return {
            "success": True,
            "results": results,
            "message": f"Procesadas {len(fotos)} fotos contra {len(svgs)} SVGs",
            "server": "Hetzner Ubuntu 24.04"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error general: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)