// Configuración para la API del bot de WhatsApp

const config = {
  // URL base de la API del bot
  API_BASE: process.env.REACT_APP_BOT_API || 'https://4fc54c5b7810.ngrok-free.app',
  
  // Modo de demostración (cuando la API no está disponible)
  DEMO_MODE: process.env.REACT_APP_DEMO_MODE === 'true' || false,
  
  // Intervalo de actualización automática (en milisegundos)
  POLLING_INTERVAL: 30000, // 30 segundos
  
  // Timeout para las peticiones HTTP (en milisegundos)
  REQUEST_TIMEOUT: 30000, // 30 segundos
  
  // Configuración de reintentos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
  
  // Configuración de logs
  DEFAULT_LOG_LIMIT: 50,
  MAX_LOG_LIMIT: 200,
  
  // Configuración de eventos fallidos
  DEFAULT_FAILED_EVENTS_LIMIT: 20,
  MAX_FAILED_EVENTS_LIMIT: 100,
  
  // Configuración de debounce para campos de texto
  DEBOUNCE_DELAY: 1000, // 1 segundo
  
  // Endpoints de la API
  endpoints: {
    status: '/status',
    whatsappStatus: '/whatsapp/status',
    reconnect: '/whatsapp/reconnect',
    toggleBot: '/bot/toggle',
    configMessages: '/config/messages',
    updateMessage: (key) => `/config/messages/${key}`,
    logs: '/logs',
    failedEvents: '/events/failed',
    retryEvent: (eventId) => `/events/${eventId}/retry`
  },
  
  // Configuración de notificaciones
  notifications: {
    success: {
      messageUpdated: 'Mensaje actualizado correctamente',
      botToggled: (enabled) => `Bot ${enabled ? 'activado' : 'pausado'} correctamente`,
      reconnected: 'Reconexión iniciada. Revisa la consola del bot para el nuevo QR.',
      eventRetried: 'Evento reintentado correctamente',
      allRefreshed: 'Todos los datos actualizados correctamente'
    },
    error: {
      connectionFailed: 'Error de conexión con el bot',
      messageUpdateFailed: 'Error actualizando mensaje',
      botToggleFailed: 'Error cambiando estado del bot',
      reconnectFailed: 'Error reconectando WhatsApp',
      eventRetryFailed: 'Error reintentando evento',
      loadFailed: 'Error cargando datos'
    }
  },
  
  // Configuración de estados
  states: {
    bot: {
      ACTIVE: 'active',
      PAUSED: 'paused',
      ERROR: 'error'
    },
    whatsapp: {
      CONNECTED: 'connected',
      DISCONNECTED: 'disconnected',
      CONNECTING: 'connecting',
      ERROR: 'error'
    },
    logs: {
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error'
    }
  },
  
  // Configuración de colores para los estados
  colors: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    neutral: '#6b7280'
  },
  
  // Configuración de iconos
  icons: {
    bot: {
      active: '🟢',
      paused: '🔴',
      error: '⚠️'
    },
    whatsapp: {
      connected: '📱',
      disconnected: '📵',
      connecting: '⏳',
      error: '❌'
    }
  }
};

export default config; 