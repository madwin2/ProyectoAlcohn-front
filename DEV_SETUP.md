# 🚀 Configuración de Desarrollo - Proyecto Alcohn

## 📋 Resumen

Ahora el sistema está configurado para iniciar **automáticamente** tanto el frontend React como la API CLIP con un solo comando.

## ⚡ Inicio Rápido

### **Un Solo Comando**
```bash
cd frontend
npm run dev
```

Esto iniciará automáticamente:
- 🔵 **Frontend React** (puerto 5173)
- 🟣 **CLIP API** (puerto 8000)

### **Comandos Disponibles**

```bash
# Inicia frontend + API automáticamente
npm run dev

# Solo frontend (si no necesitas IA)
npm run dev:frontend-only

# Verificar dependencias de Python/CLIP
npm run check-clip

# Solo API CLIP
npm run dev:api
```

## 🔧 **Configuración Automática**

### **Lo que se configuró:**

#### 1. **package.json actualizado**
```json
{
  "scripts": {
    "dev": "concurrently --names \"FRONTEND,CLIP-API\" --prefix-colors \"cyan,magenta\" \"npm run dev:frontend\" \"npm run dev:api\"",
    "dev:frontend": "vite",
    "dev:api": "node ../scripts/start-clip-api.js",
    "check-clip": "node ../scripts/check-clip-dependencies.js"
  }
}
```

#### 2. **Scripts automatizados**
- **`start-clip-api.js`**: Encuentra y inicia la API CLIP automáticamente
- **`check-clip-dependencies.js`**: Verifica dependencias de Python

#### 3. **Dependencia agregada**
- **`concurrently`**: Ejecuta múltiples comandos simultáneamente

## 🖥️ **Salida en Consola**

Cuando ejecutes `npm run dev` verás algo así:

```
[FRONTEND] VITE v6.3.5  ready in 1234 ms
[FRONTEND] ➜  Local:   http://localhost:5173/
[FRONTEND] ➜  Network: use --host to expose

[CLIP-API] 🚀 Iniciando CLIP API desde: C:\Users\julia\Documents\Alcohn Ai Nuevo\ProyectoAlcohn\Detector de Sellos
[CLIP-API] INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
[CLIP-API] INFO:     Started reloader process [12345] using WatchFiles
```

## ✅ **Verificación de Dependencias**

### **Antes de usar por primera vez:**
```bash
npm run check-clip
```

Esto verificará:
- ✅ Python está instalado
- ✅ pip está disponible
- ✅ uvicorn está instalado
- ✅ Dependencias de CLIP están disponibles

### **Si faltan dependencias:**
```bash
cd "C:\Users\julia\Documents\Alcohn Ai Nuevo\ProyectoAlcohn\Detector de Sellos"
pip install -r requirements.txt
```

## 🛠️ **Resolución de Problemas**

### **Error: "No se pudo encontrar el directorio de CLIP API"**
El script busca automáticamente en estas rutas:
1. `../../../Alcohn Ai Nuevo/ProyectoAlcohn/Detector de Sellos`
2. `../../Alcohn Ai Nuevo/ProyectoAlcohn/Detector de Sellos`
3. `C:\Users\julia\Documents\Alcohn Ai Nuevo\ProyectoAlcohn\Detector de Sellos`

**Solución**: Asegúrate de que el directorio `Detector de Sellos` existe en una de estas rutas.

### **Error: "uvicorn no está instalado"**
```bash
pip install uvicorn
```

### **Error: "Python no está en PATH"**
Asegúrate de que Python está instalado y agregado al PATH del sistema.

### **Solo quiero el frontend (sin IA)**
```bash
npm run dev:frontend-only
```

## 🎯 **URLs del Sistema**

Una vez iniciado tendrás acceso a:

- **Frontend React**: http://localhost:5173
- **CLIP API**: http://localhost:8000
- **API Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs

## 🔄 **Cierre del Sistema**

Para cerrar todo:
- **Ctrl+C** en la terminal donde ejecutaste `npm run dev`
- Esto cerrará automáticamente tanto el frontend como la API

## 🚀 **Workflow de Desarrollo**

### **Desarrollo Normal**
1. `cd frontend`
2. `npm run dev`
3. Ve a http://localhost:5173
4. Usa todas las funcionalidades de verificación

### **Solo Frontend (sin IA)**
1. `cd frontend`
2. `npm run dev:frontend-only`
3. Las funciones de verificación funcionarán pero sin matching automático

### **Solo para probar API**
1. `npm run dev:api`
2. Ve a http://localhost:8000/docs para probar endpoints

## 🎉 **¡Listo para Usar!**

Ahora con un solo comando tienes:
- ✅ Frontend React corriendo
- ✅ API CLIP corriendo
- ✅ Sistema de verificación masiva funcional
- ✅ Mapeo automático de fotos
- ✅ Cola de fotos pendientes

**Comando único para todo:**
```bash
cd frontend && npm run dev
```

¡Ya no necesitas recordar múltiples comandos o rutas complicadas!