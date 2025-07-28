#!/bin/bash

# Script de build personalizado para Render
# Este script maneja la instalación de CLIP y sus dependencias

echo "🚀 Iniciando build personalizado para Render..."

# Actualizar pip
echo "📦 Actualizando pip..."
pip install --upgrade pip

# Instalar PyTorch CPU primero (más rápido y estable)
echo "🧠 Instalando PyTorch CPU..."
pip install torch==2.1.1+cpu torchvision==0.16.1+cpu -f https://download.pytorch.org/whl/torch_stable.html

# Instalar dependencias básicas
echo "📋 Instalando dependencias básicas..."
pip install -r requirements.txt

# Instalar CLIP desde GitHub (esto puede tardar)
echo "🎯 Instalando CLIP..."
pip install git+https://github.com/openai/CLIP.git

# Verificar instalación
echo "✅ Verificando instalación..."
python -c "import torch; import clip; print('PyTorch version:', torch.__version__); print('CLIP instalado correctamente')"

echo "🎉 Build completado exitosamente!" 