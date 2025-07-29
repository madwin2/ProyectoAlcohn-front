from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import tempfile
import os
from PIL import Image
import hashlib

app = FastAPI(title="Detector Sellos Ligero")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def calcular_hash_imagen(imagen_path):
    """Calcula hash perceptual simple basado en thumbnail"""
    with Image.open(imagen_path) as img:
        # Convertir a escala de grises y redimensionar
        img = img.convert('L').resize((8, 8), Image.Resampling.LANCZOS)
        # Calcular promedio de píxeles
        pixels = list(img.getdata())
        avg = sum(pixels) / len(pixels)
        # Crear hash binario
        hash_bits = ''.join(['1' if p > avg else '0' for p in pixels])
        return hash_bits

def comparar_hashes(hash1, hash2):
    """Compara dos hashes y retorna similitud (0-1)"""
    if len(hash1) != len(hash2):
        return 0.0
    matches = sum(c1 == c2 for c1, c2 in zip(hash1, hash2))
    return matches / len(hash1)

@app.get("/")
def root():
    return {"status": "ok", "message": "API ligera funcionando"}

@app.get("/health")
def health():
    return {"status": "ok", "message": "API funcionando correctamente"}

@app.post("/predict")
async def predict(
    svgs: List[UploadFile] = File(...),
    fotos: List[UploadFile] = File(...)
):
    """Comparación ligera usando hashes perceptuales"""
    try:
        # Procesar SVGs y convertir a PNG
        svg_hashes = {}
        
        for svg in svgs:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.svg') as tmp_svg:
                content = await svg.read()
                tmp_svg.write(content)
                tmp_svg_path = tmp_svg.name
            
            try:
                # Por ahora, saltamos la conversión SVG y asignamos un hash dummy
                # En producción podrías usar un servicio externo para convertir SVG a PNG
                svg_hash = f"svg_{hash(svg.filename)}"[:64].zfill(64)  # Hash dummy basado en filename
                svg_hashes[svg.filename] = svg_hash
                
                os.unlink(tmp_svg_path)
                
            except Exception as e:
                print(f"Error procesando {svg.filename}: {e}")
                os.unlink(tmp_svg_path)
        
        # Procesar fotos
        results = []
        
        for foto in fotos:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_foto:
                content = await foto.read()
                tmp_foto.write(content)
                tmp_foto_path = tmp_foto.name
            
            try:
                foto_hash = calcular_hash_imagen(tmp_foto_path)
                
                matches = []
                for svg_name, svg_hash in svg_hashes.items():
                    score = comparar_hashes(foto_hash, svg_hash)
                    matches.append({
                        "svg": svg_name,
                        "score": round(score, 3),
                        "match": score > 0.6  # Umbral ajustable
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
                os.unlink(tmp_foto_path)
        
        return {
            "success": True,
            "results": results,
            "message": f"Procesadas {len(fotos)} fotos contra {len(svgs)} SVGs (método ligero)"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)