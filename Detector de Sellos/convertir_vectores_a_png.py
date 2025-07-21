# convertir_vectores_a_png.py

import os
import shutil
from pathlib import Path
import cairosvg
from pdf2image import convert_from_path
from PIL import Image

INPUT_DIR = "vectores"
OUTPUT_SIZE = (512, 512)  # Resolución estándar de salida

# Tipos admitidos
VECTOR_FORMATS = ['.eps', '.pdf', '.svg']
IMAGE_FORMATS = ['.jpg', '.jpeg', '.png']

def convertir_a_png(archivo):
    nombre_salida = Path(archivo).stem + ".png"
    ruta_salida = os.path.join(INPUT_DIR, nombre_salida)

    ext = Path(archivo).suffix.lower()

    try:
        if ext == '.eps' or ext == '.svg':
            cairosvg.svg2png(url=archivo, write_to=ruta_salida, output_width=OUTPUT_SIZE[0], output_height=OUTPUT_SIZE[1])
            print(f"✅ Convertido: {archivo}")
        elif ext == '.pdf':
            imgs = convert_from_path(archivo, size=OUTPUT_SIZE)
            imgs[0].save(ruta_salida, 'PNG')
            print(f"✅ Convertido PDF: {archivo}")
        else:
            print(f"⚠️ Tipo no compatible aún: {archivo}")
            return

        # Eliminar el archivo original solo si se convirtió
        os.remove(archivo)
        print(f"🗑️ Eliminado vector original: {archivo}")

    except Exception as e:
        print(f"❌ Error al convertir {archivo}: {e}")


def estandarizar_imagenes_existentes():
    for archivo in os.listdir(INPUT_DIR):
        path_archivo = os.path.join(INPUT_DIR, archivo)
        ext = Path(archivo).suffix.lower()

        if ext in IMAGE_FORMATS:
            try:
                img = Image.open(path_archivo).convert("L")  # Escala de grises
                img = img.resize(OUTPUT_SIZE)
                img.save(path_archivo)
                print(f"🖼️ Reescalado: {archivo}")
            except Exception as e:
                print(f"❌ Error reescalando {archivo}: {e}")


if __name__ == "__main__":
    for archivo in os.listdir(INPUT_DIR):
        path = os.path.join(INPUT_DIR, archivo)
        ext = Path(archivo).suffix.lower()
        if ext in VECTOR_FORMATS:
            convertir_a_png(path)

    estandarizar_imagenes_existentes()
