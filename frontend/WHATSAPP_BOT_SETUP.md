# Configuración del Bot de WhatsApp

## Variables de Entorno

Para que la página de administración del bot funcione correctamente, necesitas configurar la siguiente variable de entorno:

### 1. Crear archivo `.env`

En la carpeta `frontend/`, crea un archivo llamado `.env` con el siguiente contenido:

```bash
# URL del bot de WhatsApp
REACT_APP_BOT_API=https://4fc54c5b7810.ngrok-free.app
```

### 2. URLs de ejemplo

- **Para desarrollo local**: `http://localhost:3000`
- **Para ngrok**: `https://tu-url-ngrok.ngrok-free.app`
- **Para servidor de producción**: `https://tu-servidor.com`

### 3. Reiniciar la aplicación

Después de crear/modificar el archivo `.env`, reinicia la aplicación frontend:

```bash
npm run dev
# o
yarn dev
```

## Verificación

1. Navega a la página "WhatsApp Bot" en el sidebar
2. Verifica que no aparezcan errores en la consola
3. Los datos deberían cargar automáticamente desde tu bot

## Solución de Problemas

### Error: "Cannot convert undefined or null to object"

Este error ya ha sido solucionado en el código. Si persiste:

1. Verifica que la URL del bot sea correcta
2. Asegúrate de que el bot esté ejecutándose
3. Revisa que no haya problemas de CORS

### Error de conexión

1. Verifica que la URL sea accesible desde el navegador
2. Asegúrate de que el bot esté respondiendo en los endpoints correctos
3. Revisa los logs del bot para errores 