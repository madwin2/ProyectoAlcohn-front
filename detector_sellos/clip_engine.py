# clip_engine.py

import os
import torch
import clip
from PIL import Image
from sklearn.metrics.pairwise import cosine_similarity

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=DEVICE)

def cargar_vectores(vectores_dir):
    embeddings = {}
    for archivo in os.listdir(vectores_dir):
        path = os.path.join(vectores_dir, archivo)
        try:
            image = preprocess(Image.open(path)).unsqueeze(0).to(DEVICE)
            with torch.no_grad():
                emb = model.encode_image(image)
            embeddings[archivo] = emb
        except Exception as e:
            print(f"❌ Error con {archivo}: {e}")
    return embeddings

def cargar_vectores_desde_archivos(lista_archivos):
    embeddings = {}
    for path in lista_archivos:
        nombre = os.path.basename(path)
        try:
            image = preprocess(Image.open(path)).unsqueeze(0).to(DEVICE)
            with torch.no_grad():
                emb = model.encode_image(image)
            embeddings[nombre] = emb
        except Exception as e:
            print(f"❌ Error con {nombre}: {e}")
    return embeddings

def comparar_muestra(path_muestra, embeddings_base):
    try:
        image = preprocess(Image.open(path_muestra)).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            emb_muestra = model.encode_image(image)
        resultados = []
        for nombre_vector, emb_vector in embeddings_base.items():
            score = cosine_similarity(emb_muestra.cpu().numpy(), emb_vector.cpu().numpy())[0][0]
            resultados.append((nombre_vector, score))
        resultados.sort(key=lambda x: x[1], reverse=True)
        return resultados  # lista de (nombre_vector, score)
    except Exception as e:
        print(f"❌ Error comparando {path_muestra}: {e}")
        return []
