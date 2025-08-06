import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Pause, RotateCcw, Search, Filter } from 'lucide-react';
import botConfig from '../config/whatsappBot';

const ConsoleViewer = ({ isConnected, onReconnect }) => {
  const [logs, setLogs] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, QR, ERROR, INFO
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Auto-scroll al final
  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Conectar al stream de logs
  useEffect(() => {
    if (isConnected) {
      startStreaming();
    } else {
      stopStreaming();
    }

    return () => {
      stopStreaming();
    };
  }, [isConnected]);

  const startStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(`${botConfig.API_BASE}${botConfig.endpoints.consoleStream}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsStreaming(true);
        addLog('INFO', 'Conectado a la consola del servidor');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addLog(data.level || 'INFO', data.message, data.timestamp);
        } catch (error) {
          addLog('INFO', event.data);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Error en stream de consola:', error);
        setIsStreaming(false);
        addLog('ERROR', 'Error de conexión con la consola del servidor');
      };
    } catch (error) {
      console.error('Error iniciando stream:', error);
      addLog('ERROR', 'No se pudo conectar a la consola del servidor');
    }
  };

  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  };

  const addLog = (level, message, timestamp = new Date()) => {
    const newLog = {
      id: Date.now() + Math.random(),
      level: level.toUpperCase(),
      message,
      timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp)
    };

    setLogs(prev => [...prev, newLog].slice(-1000)); // Mantener solo los últimos 1000 logs
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const filteredLogs = logs.filter(log => {
    // Filtrar por nivel
    if (filter !== 'ALL' && log.level !== filter) {
      return false;
    }
    
    // Filtrar por búsqueda
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR': return 'text-red-500';
      case 'WARN': return 'text-yellow-500';
      case 'QR': return 'text-blue-500 font-mono';
      case 'INFO': return 'text-green-500';
      default: return 'text-gray-300';
    }
  };

  const getLevelBg = (level) => {
    switch (level) {
      case 'ERROR': return 'bg-red-900/20';
      case 'WARN': return 'bg-yellow-900/20';
      case 'QR': return 'bg-blue-900/20';
      case 'INFO': return 'bg-green-900/20';
      default: return 'bg-gray-900/20';
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Consola en Tiempo Real</h3>
          <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filtros */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
          >
            <option value="ALL">Todos</option>
            <option value="QR">QR</option>
            <option value="ERROR">Errores</option>
            <option value="INFO">Info</option>
            <option value="WARN">Advertencias</option>
          </select>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm w-32"
            />
          </div>

          {/* Controles */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded ${autoScroll ? 'bg-blue-600' : 'bg-gray-600'}`}
            title={autoScroll ? 'Auto-scroll activado' : 'Auto-scroll desactivado'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={clearLogs}
            className="p-1 bg-gray-600 hover:bg-gray-500 rounded"
            title="Limpiar logs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onReconnect}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm"
          >
            Reconectar
          </button>
        </div>
      </div>

      {/* Consola */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div
          ref={consoleRef}
          className="h-96 overflow-y-auto p-4 font-mono text-sm"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              {isStreaming ? 'Esperando logs...' : 'No hay logs disponibles'}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`mb-1 p-2 rounded ${getLevelBg(log.level)}`}
              >
                <span className="text-gray-400">[{formatTime(log.timestamp)}]</span>
                <span className={`ml-2 ${getLevelColor(log.level)}`}>
                  {log.level}:
                </span>
                <span className="ml-2 text-gray-300">
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer con estadísticas */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <div>
          Mostrando {filteredLogs.length} de {logs.length} logs
          {filter !== 'ALL' && ` (filtrado por ${filter})`}
        </div>
        <div className="flex items-center gap-4">
          <span>Streaming: {isStreaming ? 'Activo' : 'Inactivo'}</span>
          <span>Auto-scroll: {autoScroll ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </div>
  );
};

export default ConsoleViewer; 