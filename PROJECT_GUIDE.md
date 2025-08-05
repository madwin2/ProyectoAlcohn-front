# 📱 WhatsApp Bot - Guía Completa del Proyecto

## 🎯 ¿Qué hace este proyecto?

Este bot automatiza el envío de mensajes de WhatsApp cuando ocurren cambios en tu base de datos de pedidos. Los usuarios de tu aplicación pueden:

- ✅ Configurar los mensajes que se envían
- ✅ Ver el estado de conexión de WhatsApp
- ✅ Reconectar WhatsApp si se desconecta
- ✅ Ver logs y errores del sistema
- ✅ Reintentar mensajes que fallaron
- ✅ Pausar/reanudar el bot completo

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Tu App Web    │───▶│  WhatsApp Bot    │───▶│    WhatsApp     │
│  (Frontend)     │    │   (Node.js)      │    │   Web Client    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Database                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │   pedidos   │ │ pedido_events│ │ bot_config  │              │
│  │             │ │             │ │             │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de funcionamiento:

1. **Cambio en pedido** → Trigger SQL → Inserta en `pedido_events`
2. **Webhook a bot** → Bot procesa evento → Consulta `bot_config`
3. **Envía WhatsApp** → Actualiza `pedido_events` con resultado
4. **Tu app consulta** → API del bot para ver estado/configurar

## 📁 Estructura de Archivos

```
whatsapp_hetzner_final/
├── index.js                 # Servidor principal + endpoints API
├── webhook-handler.js       # Procesamiento de webhooks
├── config-manager.js        # Gestión de configuración y logs
├── supabase_setup.sql       # Script para crear tablas DB
├── package.json            # Dependencias Node.js
├── .env                    # Variables de entorno
├── PROJECT_GUIDE.md        # Esta guía
└── API_DOCUMENTATION.md    # Documentación de endpoints
```

## 🚀 Configuración Inicial

### 1. Configurar Supabase

Ejecuta este SQL en tu proyecto Supabase:

```sql
-- Copia y pega el contenido de supabase_setup.sql
-- Esto crea las tablas bot_config y bot_logs
```

### 2. Variables de Entorno

```bash
# .env
SUPABASE_URL=https://sacwoixhoedrxjwvxftl.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_KEY=tu_service_key  # ¡IMPORTANTE!
PORT=3000
SUPABASE_STORAGE_URL=https://sacwoixhoedrxjwvxftl.supabase.co/storage/v1/object/public/tu_bucket/
```

### 3. Iniciar el Bot

```bash
npm install
npm run dev  # Desarrollo
# o
npm start    # Producción
```

## 🖥️ Crear Página de Administración en tu App

### Opción A: React/Next.js

Crea `pages/admin/whatsapp-bot.jsx`:

```jsx
import { useState, useEffect } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_BOT_API || 'http://localhost:3000'

export default function WhatsAppBotAdmin() {
  const [status, setStatus] = useState(null)
  const [config, setConfig] = useState([])
  const [logs, setLogs] = useState([])
  const [failedEvents, setFailedEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Cargar datos iniciales
  useEffect(() => {
    loadAllData()
    const interval = setInterval(loadStatus, 10000) // Actualizar cada 10s
    return () => clearInterval(interval)
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadStatus(),
        loadConfig(),
        loadLogs(),
        loadFailedEvents()
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadStatus = async () => {
    const res = await fetch(`${API_BASE}/status`)
    const data = await res.json()
    setStatus(data)
  }

  const loadConfig = async () => {
    const res = await fetch(`${API_BASE}/config/messages`)
    const data = await res.json()
    setConfig(data)
  }

  const loadLogs = async () => {
    const res = await fetch(`${API_BASE}/logs?limit=50`)
    const data = await res.json()
    setLogs(data)
  }

  const loadFailedEvents = async () => {
    const res = await fetch(`${API_BASE}/events/failed?limit=20`)
    const data = await res.json()
    setFailedEvents(data)
  }

  const updateMessage = async (key, newValue) => {
    try {
      await fetch(`${API_BASE}/config/messages/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: newValue,
          updated_by: 'admin'
        })
      })
      loadConfig() // Recargar configuración
      alert('Mensaje actualizado correctamente')
    } catch (error) {
      alert('Error actualizando mensaje: ' + error.message)
    }
  }

  const toggleBot = async () => {
    try {
      await fetch(`${API_BASE}/bot/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !status.botEnabled,
          updated_by: 'admin'
        })
      })
      loadStatus()
    } catch (error) {
      alert('Error cambiando estado del bot: ' + error.message)
    }
  }

  const reconnectWhatsApp = async () => {
    try {
      await fetch(`${API_BASE}/whatsapp/reconnect`, { method: 'POST' })
      alert('Reconexión iniciada. Revisa la consola del bot para el nuevo QR.')
      setTimeout(loadStatus, 2000)
    } catch (error) {
      alert('Error reconectando WhatsApp: ' + error.message)
    }
  }

  const retryEvent = async (eventId) => {
    try {
      await fetch(`${API_BASE}/events/${eventId}/retry`, { method: 'POST' })
      alert('Evento reintentado correctamente')
      loadFailedEvents()
    } catch (error) {
      alert('Error reintentando evento: ' + error.message)
    }
  }

  if (loading) return <div className="p-4">Cargando...</div>

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Administración WhatsApp Bot</h1>

      {/* Estado General */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Estado General</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${status?.botEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {status?.botEnabled ? '✅ Activo' : '❌ Pausado'}
            </div>
            <div className="text-sm text-gray-600">Bot</div>
            <button 
              onClick={toggleBot}
              className={`mt-2 px-4 py-2 rounded text-white ${
                status?.botEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {status?.botEnabled ? 'Pausar' : 'Activar'}
            </button>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${status?.whatsappConnected ? 'text-green-600' : 'text-red-600'}`}>
              {status?.whatsappConnected ? '📱 Conectado' : '❌ Desconectado'}
            </div>
            <div className="text-sm text-gray-600">WhatsApp</div>
            <button 
              onClick={reconnectWhatsApp}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Reconectar
            </button>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{failedEvents.length}</div>
            <div className="text-sm text-gray-600">Eventos Fallidos</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(status?.uptime / 60)}m
            </div>
            <div className="text-sm text-gray-600">Tiempo Activo</div>
          </div>
        </div>
      </div>

      {/* Configuración de Mensajes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Configuración de Mensajes</h2>
        <div className="space-y-4">
          {config.filter(c => c.config_key.startsWith('mensaje_')).map(item => (
            <div key={item.config_key} className="border rounded p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {item.description}
              </label>
              <textarea
                defaultValue={item.config_value}
                className="w-full p-3 border rounded-md"
                rows={3}
                onBlur={(e) => {
                  if (e.target.value !== item.config_value) {
                    updateMessage(item.config_key, e.target.value)
                  }
                }}
              />
              <div className="text-xs text-gray-500 mt-1">
                Último cambio: {new Date(item.updated_at).toLocaleString()} por {item.updated_by}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Eventos Fallidos */}
      {failedEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Eventos Fallidos</h2>
          <div className="space-y-3">
            {failedEvents.map(event => (
              <div key={event.event_id} className="border rounded p-4 bg-red-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Pedido #{event.pedido_id}</div>
                    <div className="text-sm text-gray-600">
                      Estado: {event.webhook_status} | {new Date(event.created_at).toLocaleString()}
                    </div>
                    <div className="text-sm text-red-600">{event.webhook_body}</div>
                  </div>
                  <button 
                    onClick={() => retryEvent(event.event_id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Recientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Logs Recientes</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map(log => (
            <div key={log.id} className={`p-3 rounded text-sm ${
              log.level === 'error' ? 'bg-red-100 text-red-800' :
              log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              <div className="flex justify-between">
                <span className="font-medium">{log.message}</span>
                <span className="text-xs opacity-70">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
              {log.details && (
                <pre className="text-xs mt-1 opacity-70">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Opción B: Vue.js

Crea `components/WhatsAppBotAdmin.vue`:

```vue
<template>
  <div class="max-w-6xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">Administración WhatsApp Bot</h1>
    
    <!-- Estado General -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Estado General</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div :class="`text-2xl font-bold ${status?.botEnabled ? 'text-green-600' : 'text-red-600'}`">
            {{ status?.botEnabled ? '✅ Activo' : '❌ Pausado' }}
          </div>
          <div class="text-sm text-gray-600">Bot</div>
          <button @click="toggleBot" 
                  :class="`mt-2 px-4 py-2 rounded text-white ${
                    status?.botEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`">
            {{ status?.botEnabled ? 'Pausar' : 'Activar' }}
          </button>
        </div>
        
        <div class="text-center">
          <div :class="`text-2xl font-bold ${status?.whatsappConnected ? 'text-green-600' : 'text-red-600'}`">
            {{ status?.whatsappConnected ? '📱 Conectado' : '❌ Desconectado' }}
          </div>
          <div class="text-sm text-gray-600">WhatsApp</div>
          <button @click="reconnectWhatsApp" 
                  class="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
            Reconectar
          </button>
        </div>
      </div>
    </div>

    <!-- Configuración de Mensajes -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Configuración de Mensajes</h2>
      <div class="space-y-4">
        <div v-for="item in messageConfig" :key="item.config_key" class="border rounded p-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ item.description }}
          </label>
          <textarea
            v-model="item.config_value"
            @blur="updateMessage(item.config_key, item.config_value)"
            class="w-full p-3 border rounded-md"
            rows="3"
          />
        </div>
      </div>
    </div>

    <!-- Eventos Fallidos -->
    <div v-if="failedEvents.length > 0" class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Eventos Fallidos</h2>
      <div class="space-y-3">
        <div v-for="event in failedEvents" :key="event.event_id" 
             class="border rounded p-4 bg-red-50">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-medium">Pedido #{{ event.pedido_id }}</div>
              <div class="text-sm text-gray-600">
                Estado: {{ event.webhook_status }} | {{ formatDate(event.created_at) }}
              </div>
            </div>
            <button @click="retryEvent(event.event_id)"
                    class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WhatsAppBotAdmin',
  data() {
    return {
      status: null,
      config: [],
      failedEvents: [],
      API_BASE: process.env.VUE_APP_BOT_API || 'http://localhost:3000'
    }
  },
  computed: {
    messageConfig() {
      return this.config.filter(c => c.config_key.startsWith('mensaje_'))
    }
  },
  async mounted() {
    await this.loadAllData()
    setInterval(this.loadStatus, 10000) // Actualizar cada 10s
  },
  methods: {
    async loadAllData() {
      await Promise.all([
        this.loadStatus(),
        this.loadConfig(),
        this.loadFailedEvents()
      ])
    },
    
    async loadStatus() {
      const res = await fetch(`${this.API_BASE}/status`)
      this.status = await res.json()
    },
    
    async loadConfig() {
      const res = await fetch(`${this.API_BASE}/config/messages`)
      this.config = await res.json()
    },
    
    async loadFailedEvents() {
      const res = await fetch(`${this.API_BASE}/events/failed?limit=20`)
      this.failedEvents = await res.json()
    },
    
    async updateMessage(key, newValue) {
      try {
        await fetch(`${this.API_BASE}/config/messages/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value: newValue,
            updated_by: 'admin'
          })
        })
        alert('Mensaje actualizado correctamente')
      } catch (error) {
        alert('Error: ' + error.message)
      }
    },
    
    async toggleBot() {
      try {
        await fetch(`${this.API_BASE}/bot/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enabled: !this.status.botEnabled,
            updated_by: 'admin'
          })
        })
        this.loadStatus()
      } catch (error) {
        alert('Error: ' + error.message)
      }
    },
    
    async reconnectWhatsApp() {
      try {
        await fetch(`${this.API_BASE}/whatsapp/reconnect`, { method: 'POST' })
        alert('Reconexión iniciada. Revisa la consola del bot.')
        setTimeout(this.loadStatus, 2000)
      } catch (error) {
        alert('Error: ' + error.message)
      }
    },
    
    async retryEvent(eventId) {
      try {
        await fetch(`${this.API_BASE}/events/${eventId}/retry`, { method: 'POST' })
        alert('Evento reintentado correctamente')
        this.loadFailedEvents()
      } catch (error) {
        alert('Error: ' + error.message)
      }
    },
    
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleString()
    }
  }
}
</script>
```

### Opción C: HTML + JavaScript Vanilla

Crea `admin.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Bot Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="max-w-6xl mx-auto p-6">
        <h1 class="text-3xl font-bold mb-6">Administración WhatsApp Bot</h1>
        
        <!-- Estado General -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Estado General</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center">
                    <div id="bot-status" class="text-2xl font-bold">...</div>
                    <div class="text-sm text-gray-600">Bot</div>
                    <button id="toggle-bot" class="mt-2 px-4 py-2 rounded text-white">
                        Cambiar Estado
                    </button>
                </div>
                
                <div class="text-center">
                    <div id="whatsapp-status" class="text-2xl font-bold">...</div>
                    <div class="text-sm text-gray-600">WhatsApp</div>
                    <button id="reconnect-whatsapp" 
                            class="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
                        Reconectar
                    </button>
                </div>
            </div>
        </div>

        <!-- Configuración de Mensajes -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Configuración de Mensajes</h2>
            <div id="message-config" class="space-y-4">
                <!-- Los mensajes se cargan dinámicamente -->
            </div>
        </div>

        <!-- Eventos Fallidos -->
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Eventos Fallidos</h2>
            <div id="failed-events" class="space-y-3">
                <!-- Los eventos se cargan dinámicamente -->
            </div>
        </div>
    </div>

    <script>
        const API_BASE = 'http://localhost:3000'; // Cambia por tu URL
        
        let currentStatus = null;
        
        // Cargar datos iniciales
        async function loadAllData() {
            await Promise.all([
                loadStatus(),
                loadConfig(),
                loadFailedEvents()
            ]);
        }
        
        async function loadStatus() {
            try {
                const res = await fetch(`${API_BASE}/status`);
                currentStatus = await res.json();
                updateStatusUI();
            } catch (error) {
                console.error('Error cargando estado:', error);
            }
        }
        
        async function loadConfig() {
            try {
                const res = await fetch(`${API_BASE}/config/messages`);
                const config = await res.json();
                updateConfigUI(config);
            } catch (error) {
                console.error('Error cargando configuración:', error);
            }
        }
        
        async function loadFailedEvents() {
            try {
                const res = await fetch(`${API_BASE}/events/failed?limit=20`);
                const events = await res.json();
                updateFailedEventsUI(events);
            } catch (error) {
                console.error('Error cargando eventos fallidos:', error);
            }
        }
        
        function updateStatusUI() {
            const botStatusEl = document.getElementById('bot-status');
            const whatsappStatusEl = document.getElementById('whatsapp-status');
            const toggleBotEl = document.getElementById('toggle-bot');
            
            botStatusEl.textContent = currentStatus.botEnabled ? '✅ Activo' : '❌ Pausado';
            botStatusEl.className = `text-2xl font-bold ${currentStatus.botEnabled ? 'text-green-600' : 'text-red-600'}`;
            
            whatsappStatusEl.textContent = currentStatus.whatsappConnected ? '📱 Conectado' : '❌ Desconectado';
            whatsappStatusEl.className = `text-2xl font-bold ${currentStatus.whatsappConnected ? 'text-green-600' : 'text-red-600'}`;
            
            toggleBotEl.textContent = currentStatus.botEnabled ? 'Pausar' : 'Activar';
            toggleBotEl.className = `mt-2 px-4 py-2 rounded text-white ${
                currentStatus.botEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`;
        }
        
        function updateConfigUI(config) {
            const container = document.getElementById('message-config');
            container.innerHTML = '';
            
            config.filter(c => c.config_key.startsWith('mensaje_')).forEach(item => {
                const div = document.createElement('div');
                div.className = 'border rounded p-4';
                div.innerHTML = `
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        ${item.description}
                    </label>
                    <textarea
                        data-key="${item.config_key}"
                        class="w-full p-3 border rounded-md"
                        rows="3"
                    >${item.config_value}</textarea>
                    <div class="text-xs text-gray-500 mt-1">
                        Último cambio: ${new Date(item.updated_at).toLocaleString()} por ${item.updated_by}
                    </div>
                `;
                
                const textarea = div.querySelector('textarea');
                textarea.addEventListener('blur', () => {
                    if (textarea.value !== item.config_value) {
                        updateMessage(item.config_key, textarea.value);
                    }
                });
                
                container.appendChild(div);
            });
        }
        
        function updateFailedEventsUI(events) {
            const container = document.getElementById('failed-events');
            container.innerHTML = '';
            
            if (events.length === 0) {
                container.innerHTML = '<p class="text-gray-500">No hay eventos fallidos</p>';
                return;
            }
            
            events.forEach(event => {
                const div = document.createElement('div');
                div.className = 'border rounded p-4 bg-red-50';
                div.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-medium">Pedido #${event.pedido_id}</div>
                            <div class="text-sm text-gray-600">
                                Estado: ${event.webhook_status} | ${new Date(event.created_at).toLocaleString()}
                            </div>
                            <div class="text-sm text-red-600">${event.webhook_body || ''}</div>
                        </div>
                        <button 
                            onclick="retryEvent('${event.event_id}')"
                            class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded">
                            Reintentar
                        </button>
                    </div>
                `;
                container.appendChild(div);
            });
        }
        
        async function updateMessage(key, newValue) {
            try {
                await fetch(`${API_BASE}/config/messages/${key}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        value: newValue,
                        updated_by: 'admin'
                    })
                });
                alert('Mensaje actualizado correctamente');
                loadConfig();
            } catch (error) {
                alert('Error actualizando mensaje: ' + error.message);
            }
        }
        
        async function toggleBot() {
            try {
                await fetch(`${API_BASE}/bot/toggle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        enabled: !currentStatus.botEnabled,
                        updated_by: 'admin'
                    })
                });
                loadStatus();
            } catch (error) {
                alert('Error cambiando estado del bot: ' + error.message);
            }
        }
        
        async function reconnectWhatsApp() {
            try {
                await fetch(`${API_BASE}/whatsapp/reconnect`, { method: 'POST' });
                alert('Reconexión iniciada. Revisa la consola del bot para el nuevo QR.');
                setTimeout(loadStatus, 2000);
            } catch (error) {
                alert('Error reconectando WhatsApp: ' + error.message);
            }
        }
        
        async function retryEvent(eventId) {
            try {
                await fetch(`${API_BASE}/events/${eventId}/retry`, { method: 'POST' });
                alert('Evento reintentado correctamente');
                loadFailedEvents();
            } catch (error) {
                alert('Error reintentando evento: ' + error.message);
            }
        }
        
        // Event listeners
        document.getElementById('toggle-bot').addEventListener('click', toggleBot);
        document.getElementById('reconnect-whatsapp').addEventListener('click', reconnectWhatsApp);
        
        // Cargar datos iniciales y configurar actualización automática
        loadAllData();
        setInterval(loadStatus, 10000); // Actualizar estado cada 10 segundos
    </script>
</body>
</html>
```

## 🎛️ Funcionalidades de la Página de Administración

### ✅ Estado General
- **Estado del Bot**: Ver si está activo/pausado y poder cambiarlo
- **Conexión WhatsApp**: Ver si está conectado y poder reconectar
- **Métricas**: Eventos fallidos, tiempo activo

### ✅ Configuración de Mensajes
- **Editar mensajes**: Cambiar cualquier mensaje del bot en tiempo real
- **Historial**: Ver quién y cuándo cambió cada mensaje
- **Validación**: Los cambios se aplican automáticamente

### ✅ Gestión de Errores
- **Ver eventos fallidos**: Lista de mensajes que no se pudieron enviar
- **Reintentar**: Volver a intentar enviar mensajes fallidos
- **Logs**: Ver historial completo de actividad

### ✅ Control de Sesión
- **Reconectar WhatsApp**: Generar nuevo QR si se desconecta
- **Cerrar sesión**: Forzar logout de WhatsApp
- **Estado en tiempo real**: Actualización automática cada 10 segundos

## 🚀 Deployment en Producción

### Para Hetzner:

1. **Subir archivos al servidor**
2. **Instalar Node.js y PM2**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

3. **Configurar variables de entorno**
```bash
nano .env  # Configurar con datos reales
```

4. **Iniciar con PM2**
```bash
npm install
pm2 start index.js --name whatsapp-bot
pm2 startup
pm2 save
```

5. **Configurar nginx (opcional)**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔧 Configuración Avanzada

### Variables de Entorno adicionales:
```bash
# .env
NODE_ENV=production
LOG_LEVEL=info
MAX_RETRIES=3
WEBHOOK_TIMEOUT=30000
```

### Monitoreo:
- **Logs**: `pm2 logs whatsapp-bot`
- **Estado**: `pm2 status`
- **Restart**: `pm2 restart whatsapp-bot`

¡Y listo! Con esto tendrás control completo del bot desde tu aplicación web.