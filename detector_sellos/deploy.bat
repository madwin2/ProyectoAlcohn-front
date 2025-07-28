@echo off
REM Script para deployar la CLIP API en Windows
REM Uso: deploy.bat [railway|render|heroku]

echo 🚀 Iniciando deploy de la CLIP API...

REM Verificar que estamos en el directorio correcto
if not exist "api.py" (
    echo ❌ Error: No se encontró api.py. Asegúrate de estar en el directorio detector_sellos
    pause
    exit /b 1
)

REM Verificar que requirements.txt existe
if not exist "requirements.txt" (
    echo ❌ Error: No se encontró requirements.txt
    pause
    exit /b 1
)

echo ✅ Archivos de configuración encontrados

REM Procesar argumentos
if "%1"=="railway" goto :railway
if "%1"=="render" goto :render
if "%1"=="heroku" goto :heroku
if "%1"=="" goto :railway

echo ❌ Opción no válida. Usa: railway, render, o heroku
echo Uso: deploy.bat [railway^|render^|heroku]
pause
exit /b 1

:railway
echo 📦 Deployando en Railway...
echo.
echo 1. Asegúrate de tener Railway CLI instalado
echo    npm install -g @railway/cli
echo.
echo 2. Ejecuta: railway login
echo 3. Ejecuta: railway init
echo 4. Ejecuta: railway up
echo.
echo O ve a https://railway.app y conecta tu repositorio de GitHub
goto :end

:render
echo 📦 Deployando en Render...
echo.
echo 1. Ve a https://render.com
echo 2. Crea un nuevo Web Service
echo 3. Conecta tu repositorio de GitHub
echo 4. Selecciona la carpeta detector_sellos
echo 5. Configura:
echo    - Build Command: pip install -r requirements.txt
echo    - Start Command: uvicorn api:app --host 0.0.0.0 --port %%PORT%%
goto :end

:heroku
echo 📦 Deployando en Heroku...
echo.

REM Verificar si Heroku CLI está instalado
heroku --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Heroku CLI no está instalado
    echo Instala Heroku CLI desde: https://devcenter.heroku.com/articles/heroku-cli
    echo O ejecuta: winget install --id=Heroku.HerokuCLI
    pause
    exit /b 1
)

echo 🔐 Iniciando sesión en Heroku...
heroku login

echo 🏗️ Creando aplicación Heroku...
heroku create

echo 📤 Haciendo deploy...
git add .
git commit -m "Deploy CLIP API"
git push heroku main

echo ✅ Deploy completado!
echo 🌐 URL de tu API: 
heroku info -s | findstr web_url
goto :end

:end
echo.
echo 📋 Pasos adicionales después del deploy:
echo 1. Obtén la URL de tu API desplegada
echo 2. Actualiza la URL en frontend/src/config/api.js
echo 3. Haz deploy del frontend
echo 4. Prueba la API en: [URL]/health
echo 5. Revisa la documentación en: [URL]/docs
pause 