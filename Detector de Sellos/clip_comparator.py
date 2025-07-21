import os
import torch
import clip
from PIL import Image
from sklearn.metrics.pairwise import cosine_similarity

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

VECTORES_DIR = "vectores"
MUESTRAS_DIR = "muestras"

# Cargar el modelo CLIP
model, preprocess = clip.load("ViT-B/32", device=DEVICE)

# Embeddings de los vectores (base)
vector_embeddings = {}
for archivo in os.listdir(VECTORES_DIR):
    path = os.path.join(VECTORES_DIR, archivo)
    try:
        image = preprocess(Image.open(path)).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            embedding = model.encode_image(image)
        vector_embeddings[archivo] = embedding
    except Exception as e:
        print(f"❌ Error con {archivo}: {e}")

# Procesar muestras
for muestra_nombre in os.listdir(MUESTRAS_DIR):
    path_muestra = os.path.join(MUESTRAS_DIR, muestra_nombre)
    try:
        image = preprocess(Image.open(path_muestra)).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            emb_muestra = model.encode_image(image)

        # Comparar con todos los vectores
        best_score = -1
        best_match = None

        for nombre_vector, emb_vector in vector_embeddings.items():
            score = cosine_similarity(emb_muestra.cpu().numpy(), emb_vector.cpu().numpy())[0][0]
            if score > best_score:
                best_score = score
                best_match = nombre_vector

        # Renombrar si el score supera cierto valor
        UMBRAL = 0.25  # con CLIP podés usar 0.2-0.3 como umbral mínimo
        if best_score >= UMBRAL:
            nuevo_nombre = os.path.splitext(best_match)[0] + ".jpg"
            nuevo_path = os.path.join(MUESTRAS_DIR, nuevo_nombre)
            if not os.path.exists(nuevo_path):
                os.rename(path_muestra, nuevo_path)
                print(f"✅ {muestra_nombre} → {nuevo_nombre} (score: {best_score:.4f})")
            else:
                print(f"⚠️ No se renombró {muestra_nombre}, ya existe {nuevo_nombre}")
        else:
            print(f"🚫 {muestra_nombre} score bajo: {best_score:.4f}")

    except Exception as e:
        print(f"❌ Error con muestra {muestra_nombre}: {e}")
