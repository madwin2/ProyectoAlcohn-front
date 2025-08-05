// Tipos para el bot de WhatsApp

export const BOT_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ERROR: 'error'
};

export const WHATSAPP_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  ERROR: 'error'
};

export const LOG_LEVELS = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

// Respuesta del estado del bot
export const botStatusSchema = {
  botEnabled: Boolean,
  whatsappConnected: Boolean,
  whatsappStatus: Object,
  uptime: Number,
  timestamp: String
};

// Configuración de mensajes
export const messageConfigSchema = {
  id: Number,
  config_key: String,
  config_value: String,
  description: String,
  updated_at: String,
  updated_by: String
};

// Eventos fallidos
export const failedEventSchema = {
  event_id: String,
  pedido_id: Number,
  webhook_status: Number,
  webhook_body: String,
  created_at: String
};

// Logs del sistema
export const systemLogSchema = {
  id: Number,
  level: String,
  message: String,
  details: Object,
  created_at: String
};

// Estado del bot
export const BotStatus = {
  botEnabled: false,
  whatsappConnected: false,
  whatsappStatus: {},
  uptime: 0,
  timestamp: new Date().toISOString()
};

// Configuración de mensajes
export const MessageConfig = {
  id: 0,
  config_key: '',
  config_value: '',
  description: '',
  updated_at: new Date().toISOString(),
  updated_by: ''
};

// Evento fallido
export const FailedEvent = {
  event_id: '',
  pedido_id: 0,
  webhook_status: 0,
  webhook_body: '',
  created_at: new Date().toISOString()
};

// Log del sistema
export const SystemLog = {
  id: 0,
  level: 'info',
  message: '',
  details: {},
  created_at: new Date().toISOString()
}; 