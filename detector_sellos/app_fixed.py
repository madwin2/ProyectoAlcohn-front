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
import mimetypes

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

def detectar_tipo_archivo(filename, content):
    """Detecta si el archivo es SVG, PNG, JPG, etc."""
    # Primero intentar por extensión
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    
    if ext in ['svg']:
        return 'svg'
    elif ext in ['png', 'jpg', 'jpeg', 'gif', 'bmp']:
        return 'image'
    else:
        # Intentar detectar por contenido
        try:
            # Verificar si es SVG por contenido
            if content.startswith(b'<?xml') or content.startswith(b'<svg'):
                return 'svg'
            # Verificar si es imagen
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            
            try:
                with Image.open(tmp_path) as img:
                    os.unlink(tmp_path)
                    return 'image'
            except:
                os.unlink(tmp_path)
                return 'unknown'
        except:
            return 'unknown'

def procesar_archivo_referencia(file: UploadFile):
    """Procesa un archivo de referencia (SVG o imagen) y retorna su hash"""
    content = file.file.read()
    file.file.seek(0)  # Resetear posición del archivo
    
    tipo = detectar_tipo_archivo(file.filename, content)
    print(f"Procesando {file.filename} como tipo: {tipo}")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file.filename.split(".")[-1]}') as tmp_file:
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        if tipo == 'svg':
            # Convertir SVG a PNG para análisis
            png_path = tmp_path + '.png'
            cairosvg.svg2png(url=tmp_path, write_to=png_path, output_width=256, output_height=256)
            hash_result = calcular_hash_imagen(png_path)
            os.unlink(png_path)
        elif tipo == 'image':
            # Procesar imagen directamente
            hash_result = calcular_hash_imagen(tmp_path)
        else:
            # Fallback: hash del contenido
            hash_result = calcular_hash_contenido(content)
        
        os.unlink(tmp_path)
        return hash_result
        
    except Exception as e:
        print(f"Error procesando {file.filename}: {e}")
        os.unlink(tmp_path)
        return calcular_hash_contenido(content)

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
    svgs: List[UploadFile] = File(..., description="Archivos de referencia (SVG o imágenes)"),
    fotos: List[UploadFile] = File(..., description="Fotos a analizar")
):
    """
    Procesa fotos contra archivos de referencia y retorna matches
    """
    try:
        print(f"Recibidos {len(svgs)} archivos de referencia y {len(fotos)} fotos")
        
        # Procesar archivos de referencia
        referencia_hashes = {}
        
        for archivo in svgs:
            print(f"Procesando archivo de referencia: {archivo.filename}")
            hash_result = procesar_archivo_referencia(archivo)
            referencia_hashes[archivo.filename] = hash_result
            print(f"Hash para {archivo.filename}: {hash_result[:20]}...")
        
        # Procesar fotos
        results = []
        
        for foto in fotos:
            print(f"Procesando foto: {foto.filename}")
            content = await foto.read()
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_foto:
                tmp_foto.write(content)
                tmp_foto_path = tmp_foto.name
            
            try:
                # Calcular hash de la foto
                foto_hash = calcular_hash_imagen(tmp_foto_path)
                print(f"Hash de foto {foto.filename}: {foto_hash[:20]}...")
                
                # Comparar con cada archivo de referencia
                matches = []
                for ref_name, ref_hash in referencia_hashes.items():
                    similarity = comparar_hashes(foto_hash[:32], ref_hash[:32])
                    print(f"Similitud entre {foto.filename} y {ref_name}: {similarity}")
                    matches.append({
                        "svg": ref_name,
                        "score": similarity,
                        "match": similarity > 0.5  # Umbral de similitud
                    })
                
                # Ordenar por score descendente
                matches.sort(key=lambda x: x["score"], reverse=True)
                
                results.append({
                    "foto": foto.filename,
                    "matches": matches
                })
                
                os.unlink(tmp_foto_path)
                
            except Exception as e:
                print(f"Error procesando foto {foto.filename}: {e}")
                results.append({
                    "foto": foto.filename,
                    "error": str(e)
                })
                if os.path.exists(tmp_foto_path):
                    os.unlink(tmp_foto_path)
        
        print(f"Resultados finales: {results}")
        return {
            "success": True,
            "results": results,
            "message": f"Procesadas {len(fotos)} fotos contra {len(svgs)} archivos de referencia",
            "server": "Hetzner"
        }
        
    except Exception as e:
        print(f"Error general en predict: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 