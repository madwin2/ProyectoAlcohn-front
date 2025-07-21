from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from clip_engine import cargar_vectores, comparar_muestra, cargar_vectores_desde_archivos
import shutil
import os
from tempfile import NamedTemporaryFile
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import cairosvg
from PIL import Image

VECTORES_DIR = "vectores"
UMBRAL = 0.25

app = FastAPI(title="Detector de Sellos API")

# Configurar CORS para permitir solicitudes desde http://localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporalmente permitir todos los orígenes para debugging
    allow_credentials=False,  # Cambiado a False cuando usamos allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Agregar headers CORS manualmente para asegurar compatibilidad
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Cargar los vectores de referencia al iniciar
base_embeddings = cargar_vectores(VECTORES_DIR)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.options("/predict")
async def predict_options():
    """Handle CORS preflight requests for /predict endpoint"""
    return {"message": "OK"}

@app.post("/predict")
def predict(
    svgs: List[UploadFile] = File(..., description="SVGs de referencia"),
    fotos: List[UploadFile] = File(..., description="Fotos a analizar")
):
    # Guardar SVGs temporales y convertir a PNG
    svg_temp_paths = []
    png_temp_paths = []
    png_to_svg_name = {}  # Relaciona PNG temporal con nombre original SVG
    for svg in svgs:
        with NamedTemporaryFile(delete=False, suffix=os.path.splitext(svg.filename)[1]) as tmp_svg:
            shutil.copyfileobj(svg.file, tmp_svg)
            svg_temp_paths.append(tmp_svg.name)
            print(f"SVG recibido: {svg.filename}, guardado en: {tmp_svg.name}, tamaño: {os.path.getsize(tmp_svg.name)} bytes")
        # Convertir SVG a PNG
        png_path = tmp_svg.name + ".png"
        try:
            cairosvg.svg2png(url=tmp_svg.name, write_to=png_path, output_width=512, output_height=512)
            # Si el PNG tiene transparencia, agregar fondo blanco
            with Image.open(png_path) as im:
                if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
                    fondo = Image.new("RGBA", im.size, (255, 255, 255, 255))
                    fondo.paste(im, (0, 0), im if im.mode == "RGBA" else None)
                    im_blanco = fondo.convert("RGB")
                    im_blanco.save(png_path)
                    print(f"Fondo blanco agregado a {png_path}")
            png_temp_paths.append(png_path)
            png_to_svg_name[os.path.basename(png_path)] = svg.filename  # Relaciona el PNG temporal con el nombre original
            print(f"SVG convertido a PNG: {png_path}, tamaño: {os.path.getsize(png_path)} bytes")
        except Exception as e:
            print(f"Error convirtiendo SVG a PNG: {svg.filename} - {e}")
    try:
        # Generar vectores temporales a partir de los PNGs convertidos
        vectores_temporales = cargar_vectores_desde_archivos(png_temp_paths)
        resultados = []
        for foto in fotos:
            with NamedTemporaryFile(delete=False, suffix=os.path.splitext(foto.filename)[1]) as tmp_foto:
                shutil.copyfileobj(foto.file, tmp_foto)
                tmp_foto_path = tmp_foto.name
            try:
                res = comparar_muestra(tmp_foto_path, vectores_temporales)
                print(f"\nAnálisis para la foto: {foto.filename}")
                if res:
                    for nombre_svg_temp, score in res:
                        nombre_svg = png_to_svg_name.get(nombre_svg_temp, nombre_svg_temp)
                        print(f"  - Score con {nombre_svg}: {score}")
                    match, score = res[0]
                    nombre_svg = png_to_svg_name.get(match, match)
                    print(f"  => Mejor match: {nombre_svg} (score: {score})")
                else:
                    print("  No se encontraron matches para esta foto.")
                if res and res[0][1] >= UMBRAL:
                    match, score = res[0]
                    nombre_svg = png_to_svg_name.get(match, match)
                    resultados.append({
                        "foto": foto.filename,
                        "svg_match": nombre_svg,
                        "score": float(score)
                    })
                else:
                    resultados.append({
                        "foto": foto.filename,
                        "error": "No se encontró coincidencia con score suficiente"
                    })
            finally:
                os.remove(tmp_foto_path)
        return resultados
    finally:
        for path in svg_temp_paths:
            os.remove(path)
        # No borramos los PNGs para inspección manual 