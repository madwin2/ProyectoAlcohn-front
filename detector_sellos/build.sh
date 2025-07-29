#!/bin/bash
echo "🚀 Build para Render..."
pip install --upgrade pip

echo "📦 Instalando dependencias..."
pip install -r requirements.txt

echo "🔍 Verificando uvicorn..."
which uvicorn || echo "uvicorn no encontrado"

echo "📋 Dependencias instaladas:"
pip list | grep -E "(fastapi|uvicorn|pillow|cairosvg)"

echo "✅ Build completado!" 