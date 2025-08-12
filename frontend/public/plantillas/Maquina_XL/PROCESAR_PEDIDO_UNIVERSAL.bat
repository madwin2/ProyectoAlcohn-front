@echo off
title Procesando Pedido - Aspire Automatico (Maquina XL)
color 0A
echo ==========================================
echo    PROCESANDO PEDIDO AUTOMATICAMENTE
echo ==========================================
echo.

REM Obtener la carpeta actual donde está el .bat
set "CURRENT_DIR=%~dp0"
echo Carpeta de trabajo: %CURRENT_DIR%

REM Buscar el archivo .lua para máquina XL
set "LUA_SCRIPT="
for %%f in ("%CURRENT_DIR%AUTOMATIZACION_CON_CAPAS.lua") do set "LUA_SCRIPT=%%f"

if "%LUA_SCRIPT%"=="" (
    echo ERROR: No se encontro el script para maquina XL
    echo Verifica que el archivo AUTOMATIZACION_CON_CAPAS.lua este en la misma carpeta
    goto :error_exit
)

echo Script encontrado: %LUA_SCRIPT%

REM Crear una copia temporal del script con la ruta modificada
echo Modificando ruta de vectores en el script...
set "TEMP_LUA=%TEMP%\AUTOMATIZACION_XL_TEMP.lua"
REM Convertir la ruta de Windows a formato Lua (con forward slashes)
set "LUA_PATH=%CURRENT_DIR%"
set "LUA_PATH=%LUA_PATH:\=/%"
set "LUA_PATH=%LUA_PATH:~0,-1%"
echo Ruta que se usara: %LUA_PATH%
REM Crear el archivo temporal con la ruta modificada
powershell -Command "Get-Content '%LUA_SCRIPT%' | ForEach-Object { $_ -replace 'local VECTOR_FOLDER = \".*\"', 'local VECTOR_FOLDER = \"%LUA_PATH%\"' } | Set-Content '%TEMP_LUA%'"
if not exist "%TEMP_LUA%" (
    echo ERROR: No se pudo crear el archivo temporal modificado
    goto :error_exit
)
echo Script modificado exitosamente con la nueva ruta

REM Buscar Aspire en diferentes ubicaciones posibles
set "ASPIRE_PATH="
set "ASPIRE_EXE="

REM Opción 1: Buscar en Program Files
if exist "C:\Program Files\Aspire 10.5\x64\Aspire.exe" (
    set "ASPIRE_PATH=Aspire 10.5"
    set "ASPIRE_EXE=C:\Program Files\Aspire 10.5\x64\Aspire.exe"
    goto :aspire_found
)

REM Opción 2: Buscar en Program Files (x86)
if exist "C:\Program Files (x86)\Aspire 10.5\x64\Aspire.exe" (
    set "ASPIRE_PATH=Aspire 10.5"
    set "ASPIRE_EXE=C:\Program Files (x86)\Aspire 10.5\x64\Aspire.exe"
    goto :aspire_found
)

REM Opción 3: Buscar versiones anteriores
if exist "C:\Program Files\Aspire 10.0\x64\Aspire.exe" (
    set "ASPIRE_PATH=Aspire 10.0"
    set "ASPIRE_EXE=C:\Program Files\Aspire 10.0\x64\Aspire.exe"
    goto :aspire_found
)

if exist "C:\Program Files (x86)\Aspire 10.0\x64\Aspire.exe" (
    set "ASPIRE_PATH=Aspire 10.0"
    set "ASPIRE_EXE=C:\Program Files (x86)\Aspire 10.0\x64\Aspire.exe"
    goto :aspire_found
)

REM Opción 4: Buscar en Program Files sin Vectric
if exist "C:\Program Files\Aspire 10.5\Aspire.exe" (
    set "ASPIRE_PATH=Aspire 10.5"
    set "ASPIRE_EXE=C:\Program Files\Aspire 10.5\Aspire.exe"
    goto :aspire_found
)

if exist "C:\Program Files\Aspire 10.0\Aspire.exe" (
    set "ASPIRE_PATH=Aspire 10.0"
    set "ASPIRE_EXE=C:\Program Files\Aspire 10.0\Aspire.exe"
    goto :aspire_found
)

echo ERROR: No se pudo encontrar Aspire en ninguna ubicación conocida
echo Buscando en otras ubicaciones...
goto :error_exit

:aspire_found
echo Aspire encontrado: %ASPIRE_EXE%
echo Version: %ASPIRE_PATH%

REM Buscar carpeta de gadgets en la ubicación correcta
set "GADGETS_FOLDER="
REM Opción 1: Carpeta principal de gadgets en Public Documents
if exist "C:\Users\Public\Documents\Vectric Files\Gadgets\Aspire 10.5\MyGadget\" (
    set "GADGETS_FOLDER=C:\Users\Public\Documents\Vectric Files\Gadgets\Aspire V10.5\MyGadget\"
    goto :gadgets_found
)
REM Opción 2: Crear carpeta basada en la versión encontrada
set "GADGETS_FOLDER=C:\Users\Public\Documents\Vectric Files\Gadgets\%ASPIRE_PATH%\MyGadget\"
echo Creando carpeta de gadgets: %GADGETS_FOLDER%
mkdir "%GADGETS_FOLDER%" 2>nul

:gadgets_found
echo Carpeta de gadgets: %GADGETS_FOLDER%

REM Copiar el script modificado a la carpeta de gadgets de Aspire con nombre único
echo Copiando script modificado a Aspire...
copy "%TEMP_LUA%" "%GADGETS_FOLDER%AUTOMATIZACION_CON_CAPAS.lua" >nul 2>nul

if %errorlevel% neq 0 (
    echo ERROR: No se pudo copiar el script a Aspire
    echo Verifica los permisos de la carpeta de gadgets
    goto :error_exit
)

echo Script copiado exitosamente

REM Limpiar archivo temporal
del "%TEMP_LUA%" 2>nul

REM Verificar vectores en la carpeta
set "VECTOR_COUNT=0"
for %%f in ("%CURRENT_DIR%*.dxf") do set /a VECTOR_COUNT+=1
for %%f in ("%CURRENT_DIR%*.dwg") do set /a VECTOR_COUNT+=1
for %%f in ("%CURRENT_DIR%*.svg") do set /a VECTOR_COUNT+=1

echo Vectores encontrados: %VECTOR_COUNT%

REM Buscar el archivo .crv3d en la carpeta actual
set "ASPIRE_PROJECT="
for %%f in ("%CURRENT_DIR%*.crv3d") do set "ASPIRE_PROJECT=%%f"

if "%ASPIRE_PROJECT%"=="" (
    echo ADVERTENCIA: No se encontro archivo de proyecto .crv3d en la carpeta
    echo Abriendo Aspire sin proyecto...
    start "" "%ASPIRE_EXE%"
) else (
    echo Proyecto encontrado: %ASPIRE_PROJECT%
    echo Abriendo Aspire con el proyecto...
    start "" "%ASPIRE_EXE%" "%ASPIRE_PROJECT%"
)

echo.
echo Esperando que Aspire cargue completamente...
timeout /t 15 /nobreak >nul

echo Ejecutando automatizacion para MAQUINA XL...
powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^{F8}')" 2>nul

REM Esperar un poco más para que se abra el diálogo
timeout /t 3 /nobreak >nul

REM Escribir el nombre del script y presionar Enter
echo Escribiendo nombre del script...
powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('AUTOMATIZACION_CON_CAPAS{ENTER}')" 2>nul

echo.
echo ==========================================
echo    AUTOMATIZACION EN PROGRESO
echo ==========================================
echo.
echo El script se esta ejecutando en Aspire
echo Revisa la ventana de Aspire para ver el progreso
echo.
echo Cuando aparezca el mensaje:
echo "¡Automatizacion completa exitosa!"
echo el pedido habra sido procesado completamente
echo.
echo ==========================================
echo    INFORMACION DE LA MAQUINA XL
echo ==========================================
echo.
echo Configuracion optimizada para Maquina XL:
echo - Columna UNICA en X = 31.5mm
echo - Ancho maximo de columna = 63mm
echo - Optimizacion automatica de material
echo - Lado mas largo ocupa los 63mm
echo.
echo El script se configuro para buscar vectores en:
echo %CURRENT_DIR%
echo.
echo Si cambias de carpeta, ejecuta este .bat nuevamente
echo.
goto :success_exit

:error_exit
echo.
echo PROCESO TERMINADO CON ERRORES
echo Revisa los mensajes de error anteriores
echo.
pause
exit /b 1

:success_exit
echo Proceso iniciado correctamente
echo Revisa Aspire para ver el progreso
echo.
pause
exit /b 0
