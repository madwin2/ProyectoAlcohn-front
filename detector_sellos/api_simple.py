from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import shutil
import os
from tempfile import NamedTemporaryFile
from PIL import Image
import io

app = FastAPI(title="Detector de Sellos API - Versión Simple")

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

@app.get("/health")
def health():
    return {"status": "ok", "version": "simple", "message": "API funcionando sin CLIP"}

@app.options("/predict")
async def predict_options():
    return {"message": "OK"}

@app.post("/predict")
def predict(
    svgs: List[UploadFile] = File(..., description="SVGs de referencia"),
    fotos: List[UploadFile] = File(..., description="Fotos a analizar")
):
    """
    Versión simplificada que simula el comportamiento de CLIP
    Retorna resultados simulados para testing
    """
    try:
        resultados = []
        
        for i, foto in enumerate(fotos):
            # Simular análisis
            foto_resultado = {
                "foto": foto.filename,
                "matches": []
            }
            
            for j, svg in enumerate(svgs):
                # Simular score basado en el índice
                score = 0.8 - (j * 0.1)  # Score decreciente
                if score > 0.3:  # Umbral mínimo
                    foto_resultado["matches"].append({
                        "svg": svg.filename,
                        "score": round(score, 3),
                        "match": score > 0.5
                    })
            
            # Ordenar por score
            foto_resultado["matches"].sort(key=lambda x: x["score"], reverse=True)
            resultados.append(foto_resultado)
        
        return {
            "success": True,
            "message": "Análisis completado (versión simulada)",
            "results": resultados,
            "warning": "Esta es una versión simulada. CLIP no está disponible."
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
        "message": "CLIP API - Versión Simple",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "docs": "/docs"
        }
    } 