import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotification } from './useNotification';
import config from '../config/whatsappBot';

export const useWhatsAppBot = () => {
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [failedEvents, setFailedEvents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  const statusIntervalRef = useRef(null);
  const { showNotification } = useNotification();

  // Función para manejar errores de API
  const handleApiError = useCallback((error, message = 'Error en la operación') => {
    console.error('API Error:', error);
    setError(error.message || message);
    showNotification({
      type: 'error',
      title: 'Error',
      message: error.message || message
    });
  }, [showNotification]);

  // Función para manejar respuestas exitosas
  const handleApiSuccess = useCallback((message = 'Operación exitosa') => {
    setError(null);
    showNotification({
      type: 'success',
      title: 'Éxito',
      message
    });
  }, [showNotification]);

  // Cargar estado del bot
  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch(`${config.API_BASE}${config.endpoints.status}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStatus(data);
      return data;
    } catch (error) {
      handleApiError(error, config.notifications.error.loadFailed);
      return null;
    }
  }, [handleApiError]);

  // Cargar configuración de mensajes
  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch(`${config.API_BASE}${config.endpoints.configMessages}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setConfig(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      handleApiError(error, config.notifications.error.loadFailed);
      return [];
    }
  }, [handleApiError]);

  // Cargar eventos fallidos
  const loadFailedEvents = useCallback(async (limit = config.DEFAULT_FAILED_EVENTS_LIMIT) => {
    try {
      const response = await fetch(`${config.API_BASE}${config.endpoints.failedEvents}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFailedEvents(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      handleApiError(error, config.notifications.error.loadFailed);
      return [];
    }
  }, [handleApiError]);

  // Cargar logs del sistema
  const loadLogs = useCallback(async (limit = config.DEFAULT_LOG_LIMIT, level = null) => {
    try {
      let url = `${config.API_BASE}${config.endpoints.logs}?limit=${limit}`;
      if (level) {
        url += `&level=${level}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      handleApiError(error, config.notifications.error.loadFailed);
      return [];
    }
  }, [handleApiError]);

  // Actualizar mensaje
  const updateMessage = useCallback(async (key, newValue, updatedBy = 'admin') => {
    try {
      setUpdating(true);
      const response = await fetch(`${config.API_BASE}${config.endpoints.updateMessage(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: newValue,
          updated_by: updatedBy
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await loadConfig(); // Recargar configuración
      handleApiSuccess(config.notifications.success.messageUpdated);
      return true;
    } catch (error) {
      handleApiError(error, config.notifications.error.messageUpdateFailed);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [loadConfig, handleApiSuccess, handleApiError]);

  // Cambiar estado del bot
  const toggleBot = useCallback(async (enabled, updatedBy = 'admin') => {
    try {
      setUpdating(true);
      const response = await fetch(`${config.API_BASE}${config.endpoints.toggleBot}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          updated_by: updatedBy
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await loadStatus();
      handleApiSuccess(config.notifications.success.botToggled(enabled));
      return true;
    } catch (error) {
      handleApiError(error, config.notifications.error.botToggleFailed);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [loadStatus, handleApiSuccess, handleApiError]);

  // Reconectar WhatsApp
  const reconnectWhatsApp = useCallback(async () => {
    try {
      setUpdating(true);
      const response = await fetch(`${config.API_BASE}${config.endpoints.reconnect}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      handleApiSuccess(config.notifications.success.reconnected);
      
      // Esperar un poco y recargar estado
      setTimeout(() => {
        loadStatus();
      }, 2000);
      
      return true;
    } catch (error) {
      handleApiError(error, config.notifications.error.reconnectFailed);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [loadStatus, handleApiSuccess, handleApiError]);

  // Reintentar evento fallido
  const retryEvent = useCallback(async (eventId) => {
    try {
      setUpdating(true);
      const response = await fetch(`${config.API_BASE}${config.endpoints.retryEvent(eventId)}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await loadFailedEvents();
      handleApiSuccess(config.notifications.success.eventRetried);
      return true;
    } catch (error) {
      handleApiError(error, config.notifications.error.eventRetryFailed);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [loadFailedEvents, handleApiSuccess, handleApiError]);

  // Cargar todos los datos iniciales
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStatus(),
        loadConfig(),
        loadFailedEvents(),
        loadLogs()
      ]);
    } catch (error) {
      handleApiError(error, 'Error cargando datos iniciales');
    } finally {
      setLoading(false);
    }
  }, [loadStatus, loadConfig, loadFailedEvents, loadLogs, handleApiError]);

  // Configurar polling automático del estado
  useEffect(() => {
    // Cargar datos iniciales
    loadAllData();

    // Configurar intervalo para actualizar estado automáticamente
    statusIntervalRef.current = setInterval(() => {
      loadStatus();
    }, config.POLLING_INTERVAL);

    // Cleanup al desmontar
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [loadAllData, loadStatus]);

  // Función para refrescar todos los datos
  const refreshAll = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  return {
    // Estado
    status,
    config,
    failedEvents,
    logs,
    loading,
    error,
    updating,
    
    // Funciones
    loadStatus,
    loadConfig,
    loadFailedEvents,
    loadLogs,
    updateMessage,
    toggleBot,
    reconnectWhatsApp,
    retryEvent,
    refreshAll,
    
    // Utilidades
    isConnected: status?.whatsappConnected || false,
    isBotEnabled: status?.botEnabled || false,
    uptime: status?.uptime || 0,
    failedEventsCount: failedEvents.length
  };
}; 