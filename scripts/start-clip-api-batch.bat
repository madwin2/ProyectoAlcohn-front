@echo off
setlocal EnableDelayedExpansion

echo 🚀 Iniciando CLIP API...
echo.

cd /d "C:\Users\julia\Documents\Alcohn Ai Nuevo\ProyectoAlcohn\Detector de Sellos"

if not exist "api.py" (
    echo ❌ No se encontró api.py en el directorio
    echo Directorio actual: %CD%
    pause
    exit /b 1
)

echo 📍 Directorio: %CD%
echo 📝 Iniciando servidor uvicorn...
echo ⚠️  Nota: Los warnings de Python son normales y no afectan el funcionamiento
echo.

REM Usar python -m uvicorn para evitar el error de "Failed to find real location"
python -m uvicorn api:app --reload --host 0.0.0.0 --port 8000 --log-level info

echo.
echo ✅ CLIP API finalizada
pause