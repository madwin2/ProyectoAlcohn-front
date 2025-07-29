# clip_engine.py

import os
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
from sklearn.metrics.pairwise import cosine_similarity

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
model.to(DEVICE)

def cargar_vectores(vectores_dir):
    embeddings = {}
    for archivo in os.listdir(vectores_dir):
        path = os.path.join(vectores_dir, archivo)
        try:
            image = Image.open(path)
            inputs = processor(images=image, return_tensors="pt").to(DEVICE)
            with torch.no_grad():
                emb = model.get_image_features(**inputs)
            embeddings[archivo] = emb
        except Exception as e:
            print(f"❌ Error con {archivo}: {e}")
    return embeddings

def cargar_vectores_desde_archivos(lista_archivos):
    embeddings = {}
    for path in lista_archivos:
        nombre = os.path.basename(path)
        try:
            image = Image.open(path)
            inputs = processor(images=image, return_tensors="pt").to(DEVICE)
            with torch.no_grad():
                emb = model.get_image_features(**inputs)
            embeddings[nombre] = emb
        except Exception as e:
            print(f"❌ Error con {nombre}: {e}")
    return embeddings

def comparar_muestra(path_muestra, embeddings_base):
    try:
        image = Image.open(path_muestra)
        inputs = processor(images=image, return_tensors="pt").to(DEVICE)
        with torch.no_grad():
            emb_muestra = model.get_image_features(**inputs)
        resultados = []
        for nombre_vector, emb_vector in embeddings_base.items():
            score = cosine_similarity(emb_muestra.cpu().numpy(), emb_vector.cpu().numpy())[0][0]
            resultados.append((nombre_vector, score))
        resultados.sort(key=lambda x: x[1], reverse=True)
        return resultados  # lista de (nombre_vector, score)
    except Exception as e:
        print(f"❌ Error comparando {path_muestra}: {e}")
        return []
