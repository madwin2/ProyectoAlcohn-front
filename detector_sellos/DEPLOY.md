# Deploy de la CLIP API

## Opción 1: Railway (Recomendado)

### Pasos para deployar en Railway:

1. **Crear cuenta en Railway**
   - Ve a [railway.app](https://railway.app)
   - Crea una cuenta con GitHub

2. **Conectar el repositorio**
   - Haz click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Conecta tu repositorio de GitHub
   - Selecciona la carpeta `detector_sellos`

3. **Configurar variables de entorno (opcional)**
   - En Railway, ve a la pestaña "Variables"
   - Agrega si necesitas variables específicas

4. **Deploy automático**
   - Railway detectará automáticamente que es una app Python
   - Usará el `Procfile` para ejecutar la app
   - El deploy comenzará automáticamente

5. **Obtener la URL**
   - Una vez completado el deploy, Railway te dará una URL
   - Ejemplo: `https://tu-app.railway.app`
   - La API estará disponible en: `https://tu-app.railway.app/predict`

## Opción 2: Render

### Pasos para deployar en Render:

1. **Crear cuenta en Render**
   - Ve a [render.com](https://render.com)
   - Crea una cuenta

2. **Crear nuevo Web Service**
   - Haz click en "New +" → "Web Service"
   - Conecta tu repositorio de GitHub
   - Selecciona la carpeta `detector_sellos`

3. **Configuración del servicio**
   - **Name**: `clip-api` (o el nombre que prefieras)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api:app --host 0.0.0.0 --port $PORT`

4. **Deploy**
   - Haz click en "Create Web Service"
   - Render comenzará el deploy automáticamente

## Opción 3: Heroku

### Pasos para deployar en Heroku:

1. **Instalar Heroku CLI**
   ```bash
   # Windows
   winget install --id=Heroku.HerokuCLI
   ```

2. **Login y crear app**
   ```bash
   heroku login
   heroku create tu-app-name
   ```

3. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy CLIP API"
   git push heroku main
   ```

## Verificación del Deploy

Una vez desplegado, puedes verificar que funciona:

1. **Health check**: `GET https://tu-url.railway.app/health`
2. **Documentación**: `https://tu-url.railway.app/docs`

## Actualizar el Frontend

Después del deploy, actualiza la URL de la API en tu frontend:

```javascript
// En tu archivo de configuración del frontend
const CLIP_API_URL = 'https://tu-url.railway.app';
```

## Troubleshooting

### Problemas comunes:

1. **Error de memoria**: Railway y Render tienen límites de memoria. Si tienes problemas, considera usar un plan pago.

2. **Timeout en build**: CLIP es pesado, el build puede tardar varios minutos.

3. **Error de dependencias**: Asegúrate de que todas las dependencias estén en `requirements.txt`.

### Logs útiles:
- Railway: Ve a la pestaña "Deployments" → "View Logs"
- Render: Ve a la pestaña "Logs"
- Heroku: `heroku logs --tail` 