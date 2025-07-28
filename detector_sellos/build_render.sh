#!/bin/bash

# Script de build optimizado para Render
set -e  # Salir si hay algún error

echo "🚀 Iniciando build optimizado para Render..."

# Configurar variables de entorno para el build
export PYTHONUNBUFFERED=1
export PIP_NO_CACHE_DIR=1
export PIP_DISABLE_PIP_VERSION_CHECK=1

# Actualizar pip
echo "📦 Actualizando pip..."
python -m pip install --upgrade pip

# Instalar dependencias del sistema necesarias
echo "🔧 Instalando dependencias del sistema..."
apt-get update -qq && apt-get install -y -qq \
    build-essential \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Instalar PyTorch CPU primero (más estable)
echo "🧠 Instalando PyTorch CPU..."
pip install torch==2.1.1+cpu torchvision==0.16.1+cpu -f https://download.pytorch.org/whl/torch_stable.html

# Instalar dependencias básicas
echo "📋 Instalando dependencias básicas..."
pip install -r requirements.txt

# Instalar CLIP con configuración específica
echo "🎯 Instalando CLIP..."
export TORCH_HOME=/tmp/torch
export HF_HOME=/tmp/huggingface
pip install git+https://github.com/openai/CLIP.git --no-deps

# Verificar instalación
echo "✅ Verificando instalación..."
python -c "
import torch
import clip
print('PyTorch version:', torch.__version__)
print('CLIP instalado correctamente')
print('CUDA disponible:', torch.cuda.is_available())
"

# Limpiar cache
echo "🧹 Limpiando cache..."
pip cache purge
rm -rf /tmp/torch /tmp/huggingface

echo "🎉 Build completado exitosamente!" 