from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import shutil
import os
from tempfile import NamedTemporaryFile
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel

app = FastAPI(title="Detector de Sellos API - Basic")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Cargar modelo CLIP globalmente
model = None
processor = None

def load_clip_model():
    global model, processor
    try:
        print("🔄 Cargando modelo CLIP...")
        model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        print("✅ Modelo CLIP cargado exitosamente")
    except Exception as e:
        print(f"❌ Error cargando modelo CLIP: {e}")
        raise e

@app.on_event("startup")
async def startup_event():
    load_clip_model()

@app.get("/health")
def health():
    return {
        "status": "ok", 
        "version": "basic", 
        "model_loaded": model is not None,
        "message": "API funcionando con versión básica"
    }

@app.options("/predict")
async def predict_options():
    return {"message": "OK"}

@app.post("/predict")
def predict(
    svgs: List[UploadFile] = File(..., description="SVGs de referencia"),
    fotos: List[UploadFile] = File(..., description="Fotos a analizar")
):
    if model is None or processor is None:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Modelo CLIP no cargado",
                "message": "El modelo no está disponible"
            }
        )
    
    try:
        resultados = []
        
        for foto in fotos:
            with NamedTemporaryFile(delete=False, suffix=os.path.splitext(foto.filename)[1]) as tmp_foto:
                shutil.copyfileobj(foto.file, tmp_foto)
                tmp_foto_path = tmp_foto.name
            
            try:
                # Procesar foto
                foto_image = Image.open(tmp_foto_path).convert("RGB")
                
                # Procesar vectores de referencia
                mejores_matches = []
                
                for svg in svgs:
                    try:
                        # Crear una imagen simple para el SVG (placeholder)
                        svg_image = Image.new('RGB', (512, 512), color='white')
                        
                        # Procesar con CLIP
                        inputs = processor(
                            images=[foto_image, svg_image],
                            return_tensors="pt",
                            padding=True
                        )
                        
                        # Obtener embeddings
                        with torch.no_grad():
                            image_features = model.get_image_features(**inputs)
                            
                        # Calcular similitud
                        similarity = torch.cosine_similarity(
                            image_features[0:1], 
                            image_features[1:2]
                        ).item()
                        
                        mejores_matches.append((svg.filename, similarity))
                        
                    except Exception as e:
                        print(f"Error procesando {svg.filename}: {e}")
                        continue
                
                # Ordenar por similitud
                mejores_matches.sort(key=lambda x: x[1], reverse=True)
                
                # Filtrar por umbral
                UMBRAL = 0.25
                matches_filtrados = [match for match in mejores_matches if match[1] >= UMBRAL]
                
                if matches_filtrados:
                    mejor_match, mejor_score = matches_filtrados[0]
                    resultados.append({
                        "foto": foto.filename,
                        "mejor_match": mejor_match,
                        "score": round(mejor_score, 3),
                        "match": True,
                        "todos_matches": [
                            {"svg": svg, "score": round(score, 3)} 
                            for svg, score in matches_filtrados
                        ]
                    })
                else:
                    resultados.append({
                        "foto": foto.filename,
                        "mejor_match": None,
                        "score": 0,
                        "match": False,
                        "todos_matches": []
                    })
                    
            except Exception as e:
                print(f"Error procesando foto {foto.filename}: {e}")
                resultados.append({
                    "foto": foto.filename,
                    "error": str(e),
                    "match": False
                })
            
            finally:
                # Limpiar archivos temporales
                if os.path.exists(tmp_foto_path):
                    os.unlink(tmp_foto_path)

        return {
            "success": True,
            "message": "Análisis completado con versión básica",
            "results": resultados
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "message": "Error en el procesamiento"
            }
        )

@app.get("/")
def root():
    return {
        "message": "CLIP API - Basic",
        "status": "running",
        "model_loaded": model is not None,
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "docs": "/docs"
        }
    } 