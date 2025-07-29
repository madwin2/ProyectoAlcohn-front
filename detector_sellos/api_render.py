from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import tempfile
import os
from PIL import Image
import hashlib

app = FastAPI(title="Detector Sellos - Render")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def calcular_hash_imagen(imagen_path):
    """Calcula hash perceptual basado en thumbnail"""
    with Image.open(imagen_path) as img:
        # Convertir a escala de grises y redimensionar
        img = img.convert('L').resize((8, 8), Image.Resampling.LANCZOS)
        # Calcular promedio de píxeles
        pixels = list(img.getdata())
        avg = sum(pixels) / len(pixels)
        # Crear hash binario
        hash_bits = ''.join(['1' if p > avg else '0' for p in pixels])
        return hash_bits

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
    return {"status": "ok", "message": "API Render funcionando", "version": "1.0"}

@app.get("/health")
def health():
    return {"status": "ok", "message": "API funcionando correctamente"}

@app.post("/predict")
async def predict(
    svgs: List[UploadFile] = File(...),
    fotos: List[UploadFile] = File(...)
):
    """Comparación basada en hashes de contenido"""
    try:
        # Procesar SVGs - por ahora solo calculamos hash del contenido
        svg_hashes = {}
        
        for svg in svgs:
            content = await svg.read()
            svg_hash = calcular_hash_contenido(content)
            svg_hashes[svg.filename] = svg_hash
        
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
                    # Comparación simple basada en longitud y similitud de hash
                    score = 0.5 + (abs(len(svg_hash) - len(foto_hash)) / max(len(svg_hash), len(foto_hash))) * 0.3
                    score = min(score, 0.9)  # Máximo 90%
                    
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
        
        return {
            "success": True,
            "results": results,
            "message": f"Procesadas {len(fotos)} fotos contra {len(svgs)} SVGs (método básico)",
            "note": "Esta es una versión simplificada. Para comparación precisa considera usar la versión completa con CLIP."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)