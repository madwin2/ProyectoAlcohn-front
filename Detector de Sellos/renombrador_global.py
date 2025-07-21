# renombrador_global.py

import os
from clip_engine import cargar_vectores, comparar_muestra
from pathlib import Path

VECTORES_DIR = "vectores"
MUESTRAS_DIR = "muestras"
UMBRAL = 0.25

# Cargar los vectores de referencia
print("📦 Cargando vectores...")
base_embeddings = cargar_vectores(VECTORES_DIR)

# Armar candidatos
candidatos = []
for nombre_muestra in os.listdir(MUESTRAS_DIR):
    path = os.path.join(MUESTRAS_DIR, nombre_muestra)
    resultados = comparar_muestra(path, base_embeddings)
    if resultados and resultados[0][1] >= UMBRAL:
        candidatos.append({
            "muestra": nombre_muestra,
            "match": resultados[0][0],
            "score": resultados[0][1]
        })

# Ordenar por score descendente
candidatos.sort(key=lambda x: x["score"], reverse=True)

# Renombrar de forma óptima
usados = set()
for c in candidatos:
    nuevo_nombre = Path(c["match"]).stem + ".jpg"
    path_actual = os.path.join(MUESTRAS_DIR, c["muestra"])
    path_nuevo = os.path.join(MUESTRAS_DIR, nuevo_nombre)

    if nuevo_nombre in usados:
        print(f"⚠️ {c['muestra']} no se renombró: {nuevo_nombre} ya fue asignado")
    else:
        if path_actual != path_nuevo and not os.path.exists(path_nuevo):
            os.rename(path_actual, path_nuevo)
            print(f"✅ {c['muestra']} → {nuevo_nombre} (score: {c['score']:.4f})")
        else:
            print(f"⚠️ {c['muestra']} ya se llama {nuevo_nombre}")
        usados.add(nuevo_nombre)
