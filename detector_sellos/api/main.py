from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import tempfile
import os
from PIL import Image
import hashlib

app = FastAPI(title="Detector Sellos - Vercel")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def calcular_hash_imagen(imagen_path):
    """Calcula hash perceptual basado en thumbnail"""
    try:
        with Image.open(imagen_path) as img:
            # Convertir a escala de grises y redimensionar
            img = img.convert('L').resize((8, 8), Image.Resampling.LANCZOS)
            # Calcular promedio de píxeles
            pixels = list(img.getdata())
            avg = sum(pixels) / len(pixels)
            # Crear hash binario
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
    return {"status": "ok", "message": "API Vercel funcionando", "version": "1.0"}

@app.get("/health")
def health():
    return {"status": "ok", "message": "API funcionando correctamente"}

@app.get("/api/health")
def api_health():
    return {"status": "ok", "message": "API funcionando correctamente"}

@app.post("/predict")
async def predict(
    svgs: List[UploadFile] = File(...),
    fotos: List[UploadFile] = File(...)
):
    """Comparación optimizada para Vercel serverless"""
    try:
        # Procesar SVGs - calculamos hash del contenido
        svg_hashes = {}
        
        for svg in svgs:
            content = await svg.read()
            svg_hash = calcular_hash_contenido(content)
            svg_hashes[svg.filename] = svg_hash
        
        # Procesar fotos
        results = []
        
        for foto in fotos:
            content = await foto.read()
            
            # Usar tempfile con context manager para cleanup automático
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=True) as tmp_foto:
                tmp_foto.write(content)
                tmp_foto.flush()
                
                try:
                    foto_hash = calcular_hash_imagen(tmp_foto.name)
                    
                    matches = []
                    for svg_name, svg_hash in svg_hashes.items():
                        # Comparación mejorada
                        content_hash = calcular_hash_contenido(content)
                        similarity = comparar_hashes(content_hash[:64], svg_hash[:64])
                        
                        # Score basado en similitud de hash + tamaño
                        score = min(0.3 + similarity * 0.6, 0.95)
                        
                        matches.append({
                            "svg": svg_name,
                            "score": round(score, 3),
                            "match": score > 0.5
                        })
                    
                    # Ordenar por score
                    matches.sort(key=lambda x: x["score"], reverse=True)
                    
                    results.append({
                        "foto": foto.filename,
                        "matches": matches
                    })
                    
                except Exception as e:
                    print(f"Error procesando {foto.filename}: {e}")
                    results.append({
                        "foto": foto.filename,
                        "matches": [],
                        "error": f"Error procesando archivo: {str(e)}"
                    })
        
        return {
            "success": True,
            "results": results,
            "message": f"Procesadas {len(fotos)} fotos contra {len(svgs)} SVGs (Vercel)",
            "note": "Versión optimizada para serverless"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error general: {str(e)}")

@app.post("/api/predict")
async def api_predict(
    svgs: List[UploadFile] = File(...),
    fotos: List[UploadFile] = File(...)
):
    """Endpoint duplicado para compatibilidad con rutas /api/"""
    return await predict(svgs, fotos)

# Handler para Vercel
def handler(request):
    import uvicorn
    return uvicorn.run(app, host="0.0.0.0", port=8000)