import os
import cv2
from utils import preprocess_image, compare_images

MUESTRAS_DIR = "muestras"
VECTORES_DIR = "vectores"

# Obtener lista de vectores ya procesados
vectores = []
for nombre_vector in os.listdir(VECTORES_DIR):
    path_vector = os.path.join(VECTORES_DIR, nombre_vector)
    try:
        img_vector = preprocess_image(path_vector)
        vectores.append((nombre_vector, img_vector))
    except Exception as e:
        print(f"❌ Error cargando vector {nombre_vector}: {e}")

# Procesar cada muestra
for nombre_muestra in os.listdir(MUESTRAS_DIR):
    path_muestra = os.path.join(MUESTRAS_DIR, nombre_muestra)
    try:
        img_muestra = preprocess_image(path_muestra)
    except Exception as e:
        print(f"❌ Error leyendo muestra {nombre_muestra}: {e}")
        continue

    mejor_match = None
    mejor_score = 0

    for nombre_vector, img_vector in vectores:
        try:
            score = compare_images(img_muestra, img_vector)
            if score > mejor_score:
                mejor_score = score
                mejor_match = nombre_vector
        except Exception as e:
            print(f"⚠️ Falló comparación con {nombre_vector}: {e}")

    UMBRAL_SCORE_MIN = 0.15  # o 0.10 si querés menos estricto

    if mejor_score < UMBRAL_SCORE_MIN:
        print(f"🚫 {nombre_muestra} no se renombró (score muy bajo: {mejor_score:.4f})")
        continue

    if mejor_match:
        nuevo_nombre = os.path.splitext(mejor_match)[0] + ".jpg"
        path_nuevo = os.path.join(MUESTRAS_DIR, nuevo_nombre)

        # Evita sobrescribir si ya existe
        if path_nuevo != path_muestra:
            if not os.path.exists(path_nuevo):
                os.rename(path_muestra, path_nuevo)
                print(f"✅ {nombre_muestra} → {nuevo_nombre} (score: {mejor_score:.4f})")
            else:
                print(f"⚠️ No se renombró {nombre_muestra}, ya existe {nuevo_nombre}")
        else:
            print(f"🔁 {nombre_muestra} ya tiene nombre correcto")
    else:
        print(f"❌ No se encontró coincidencia para {nombre_muestra}")
