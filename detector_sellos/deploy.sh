#!/bin/bash

# Script para deployar la CLIP API
# Uso: ./deploy.sh [railway|render|heroku]

echo "🚀 Iniciando deploy de la CLIP API..."

# Verificar que estamos en el directorio correcto
if [ ! -f "api.py" ]; then
    echo "❌ Error: No se encontró api.py. Asegúrate de estar en el directorio detector_sellos"
    exit 1
fi

# Verificar que requirements.txt existe
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: No se encontró requirements.txt"
    exit 1
fi

echo "✅ Archivos de configuración encontrados"

# Función para deploy en Railway
deploy_railway() {
    echo "📦 Deployando en Railway..."
    echo "1. Asegúrate de tener Railway CLI instalado"
    echo "2. Ejecuta: railway login"
    echo "3. Ejecuta: railway init"
    echo "4. Ejecuta: railway up"
    echo ""
    echo "O ve a https://railway.app y conecta tu repositorio de GitHub"
}

# Función para deploy en Render
deploy_render() {
    echo "📦 Deployando en Render..."
    echo "1. Ve a https://render.com"
    echo "2. Crea un nuevo Web Service"
    echo "3. Conecta tu repositorio de GitHub"
    echo "4. Selecciona la carpeta detector_sellos"
    echo "5. Configura:"
    echo "   - Build Command: pip install -r requirements.txt"
    echo "   - Start Command: uvicorn api:app --host 0.0.0.0 --port \$PORT"
}

# Función para deploy en Heroku
deploy_heroku() {
    echo "📦 Deployando en Heroku..."
    
    # Verificar si Heroku CLI está instalado
    if ! command -v heroku &> /dev/null; then
        echo "❌ Heroku CLI no está instalado"
        echo "Instala Heroku CLI desde: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    echo "🔐 Iniciando sesión en Heroku..."
    heroku login
    
    echo "🏗️ Creando aplicación Heroku..."
    heroku create
    
    echo "📤 Haciendo deploy..."
    git add .
    git commit -m "Deploy CLIP API"
    git push heroku main
    
    echo "✅ Deploy completado!"
    echo "🌐 URL de tu API: $(heroku info -s | grep web_url | cut -d= -f2)"
}

# Procesar argumentos
case "${1:-railway}" in
    "railway")
        deploy_railway
        ;;
    "render")
        deploy_render
        ;;
    "heroku")
        deploy_heroku
        ;;
    *)
        echo "❌ Opción no válida. Usa: railway, render, o heroku"
        echo "Uso: ./deploy.sh [railway|render|heroku]"
        exit 1
        ;;
esac

echo ""
echo "📋 Pasos adicionales después del deploy:"
echo "1. Obtén la URL de tu API desplegada"
echo "2. Actualiza la URL en frontend/src/config/api.js"
echo "3. Haz deploy del frontend"
echo "4. Prueba la API en: [URL]/health"
echo "5. Revisa la documentación en: [URL]/docs" 