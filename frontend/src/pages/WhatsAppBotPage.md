# 📱 Página de Administración WhatsApp Bot

## Descripción

Esta página permite administrar completamente el bot de WhatsApp que automatiza el envío de mensajes a los clientes cuando ocurren cambios en los pedidos.

## Funcionalidades

### 🔄 Estado General
- **Estado del Bot**: Ver si está activo/pausado y poder cambiarlo
- **Conexión WhatsApp**: Ver si está conectado y poder reconectar
- **Métricas**: Eventos fallidos, tiempo activo, última actualización
- **Actualización automática**: Cada 10 segundos

### 📝 Configuración de Mensajes
- **Editar mensajes**: Cambiar cualquier mensaje del bot en tiempo real
- **Historial**: Ver quién y cuándo cambió cada mensaje
- **Validación**: Los cambios se aplican automáticamente con debounce
- **Mensajes configurables**: `mensaje_haciendo`, `mensaje_rehacer`, `mensaje_hecho`, etc.

### ⚠️ Gestión de Errores
- **Ver eventos fallidos**: Lista de mensajes que no se pudieron enviar
- **Reintentar**: Volver a intentar enviar mensajes fallidos
- **Detalles del error**: Ver información específica de cada fallo
- **Filtros por tipo de error**: 400, 500, etc.

### 📊 Logs del Sistema
- **Logs recientes**: Ver historial completo de actividad
- **Filtros por nivel**: Info, Warning, Error
- **Paginación**: Configurar cantidad de logs a mostrar
- **Detalles expandibles**: Ver información adicional de cada log

## Configuración

### Variables de Entorno

```bash
# .env
REACT_APP_BOT_API=http://localhost:3000  # URL del bot en desarrollo
# REACT_APP_BOT_API=https://tu-servidor.com  # URL del bot en producción
```

### Configuración del Bot

El archivo `src/config/whatsappBot.js` contiene toda la configuración:

```javascript
const config = {
  API_BASE: process.env.REACT_APP_BOT_API || 'http://localhost:3000',
  POLLING_INTERVAL: 10000, // 10 segundos
  REQUEST_TIMEOUT: 30000, // 30 segundos
  // ... más configuración
};
```

## API Endpoints Utilizados

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/status` | GET | Estado general del bot |
| `/whatsapp/status` | GET | Estado de conexión WhatsApp |
| `/whatsapp/reconnect` | POST | Reconectar WhatsApp |
| `/bot/toggle` | POST | Activar/pausar bot |
| `/config/messages` | GET | Obtener configuración de mensajes |
| `/config/messages/:key` | PUT | Actualizar mensaje |
| `/logs` | GET | Obtener logs del sistema |
| `/events/failed` | GET | Obtener eventos que fallaron |
| `/events/:eventId/retry` | POST | Reintentar evento fallido |

## Estructura de Archivos

```
src/
├── pages/
│   ├── WhatsAppBotPage.jsx          # Página principal
│   └── WhatsAppBotPage.css          # Estilos específicos
├── components/
│   ├── WhatsAppStatus.jsx           # Componente de estado
│   ├── MessageConfig.jsx            # Configuración de mensajes
│   ├── FailedEvents.jsx             # Eventos fallidos
│   └── SystemLogs.jsx               # Logs del sistema
├── hooks/
│   └── useWhatsAppBot.js            # Hook personalizado
├── config/
│   └── whatsappBot.js               # Configuración
└── types/
    └── whatsapp-bot.js              # Tipos y esquemas
```

## Uso

### Navegación
1. Accede a la página desde el sidebar: "WhatsApp Bot"
2. La página se carga automáticamente con el estado actual
3. Usa las pestañas para navegar entre las diferentes secciones

### Control del Bot
1. **Activar/Pausar**: Usa el botón en la sección "Estado" o "Acciones Rápidas"
2. **Reconectar WhatsApp**: Si WhatsApp se desconecta, usa el botón "Reconectar"
3. **Actualizar**: Usa "Actualizar Todo" para refrescar todos los datos

### Configurar Mensajes
1. Ve a la pestaña "Mensajes"
2. Haz clic en el icono de edición o escribe directamente en el campo
3. Los cambios se guardan automáticamente al salir del campo
4. También puedes usar los botones de guardar/cancelar

### Gestionar Errores
1. Ve a la pestaña "Errores"
2. Revisa los eventos fallidos
3. Haz clic en "Ver detalles del error" para más información
4. Usa "Reintentar" para volver a intentar enviar el mensaje

### Ver Logs
1. Ve a la pestaña "Logs"
2. Usa los filtros para ver logs específicos
3. Configura la cantidad de logs a mostrar
4. Expande los detalles para ver información adicional

## Características Técnicas

### Polling Automático
- El estado se actualiza automáticamente cada 10 segundos
- Se puede configurar en `config.POLLING_INTERVAL`

### Debounce en Campos
- Los campos de texto tienen debounce de 1 segundo
- Evita spam de requests al escribir

### Manejo de Errores
- Notificaciones toast para confirmaciones
- Manejo de errores de red con retry automático
- Estados de carga para todas las operaciones

### Responsive Design
- Diseño adaptativo para móviles y tablets
- Navegación optimizada para diferentes tamaños de pantalla

## Troubleshooting

### El bot no responde
1. Verifica que el servidor del bot esté corriendo
2. Revisa la URL en `REACT_APP_BOT_API`
3. Verifica los logs del servidor

### WhatsApp desconectado
1. Usa el botón "Reconectar"
2. Revisa la consola del servidor para el nuevo QR
3. Escanea el QR con tu WhatsApp

### Mensajes no se actualizan
1. Verifica la conexión a internet
2. Revisa los logs del sistema
3. Intenta "Actualizar Todo"

### Errores de permisos
1. Verifica que tengas permisos de administrador
2. Revisa la configuración de CORS en el servidor
3. Verifica las credenciales de la API

## Desarrollo

### Agregar Nuevas Funcionalidades
1. Actualiza `config/whatsappBot.js` con nuevos endpoints
2. Agrega métodos en `useWhatsAppBot.js`
3. Crea componentes en `components/`
4. Actualiza la página principal

### Personalizar Estilos
1. Modifica `WhatsAppBotPage.css`
2. Usa las clases CSS existentes
3. Agrega nuevas animaciones si es necesario

### Testing
1. Prueba en diferentes navegadores
2. Verifica el responsive design
3. Prueba con diferentes estados del bot
4. Verifica el manejo de errores 