import React from 'react';
import { 
  Play, 
  Pause, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Smartphone
} from 'lucide-react';
import QRDisplay from './QRDisplay';

const WhatsAppStatus = ({ 
  status, 
  loading, 
  updating, 
  onToggleBot, 
  onReconnectWhatsApp 
}) => {
  if (loading) {
    return (
      <div className="status-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="status-card animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusIcon = (connected, type) => {
    if (!status || typeof status !== 'object') {
      return <AlertTriangle className="w-6 h-6 text-gray-400" />;
    }
    
    if (type === 'bot') {
      return status.botEnabled ? (
        <CheckCircle className="w-6 h-6 text-green-500" />
      ) : (
        <XCircle className="w-6 h-6 text-red-500" />
      );
    }
    
    return status.whatsappConnected ? (
      <Wifi className="w-6 h-6 text-green-500" />
    ) : (
      <WifiOff className="w-6 h-6 text-red-500" />
    );
  };

  const getStatusText = (connected, type) => {
    if (!status || typeof status !== 'object') {
      return 'Cargando...';
    }
    
    if (type === 'bot') {
      return status.botEnabled ? 'Activo' : 'Pausado';
    }
    
    return status.whatsappConnected ? 'Conectado' : 'Desconectado';
  };

  const getStatusClass = (connected, type) => {
    if (!status || typeof status !== 'object') {
      return 'inactive';
    }
    
    if (type === 'bot') {
      return status.botEnabled ? 'active' : 'inactive';
    }
    
    return status.whatsappConnected ? 'active' : 'inactive';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="status-card">
        <div className="status-card-header">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Estado del Sistema</h2>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 text-gray-400 ${updating ? 'animate-spin' : ''}`} />
            <span className="text-sm text-gray-400">
              {updating ? 'Actualizando...' : 'Actualizado'}
            </span>
          </div>
        </div>
        
        {/* Status Cards Grid */}
        <div className="status-grid">
          {/* Estado del Bot */}
          <div className={`status-card ${getStatusClass(status?.whatsappConnected, 'bot')}`}>
            <div className="status-card-header">
              <div className="flex items-center gap-2">
                {getStatusIcon(status?.whatsappConnected, 'bot')}
                <div>
                  <div className={`status-card-value ${getStatusClass(status?.whatsappConnected, 'bot')}`}>
                    {getStatusText(status?.whatsappConnected, 'bot')}
                  </div>
                  <div className="status-card-title">Bot de Mensajes</div>
                </div>
              </div>
              <div className={`status-indicator ${getStatusClass(status?.whatsappConnected, 'bot')}`}></div>
            </div>
            <button 
              onClick={() => onToggleBot(!status?.botEnabled)}
              disabled={updating || !status}
              className={`action-button ${status?.botEnabled ? 'danger' : 'success'}`}
            >
              {updating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : !status ? (
                'Cargando...'
              ) : status.botEnabled ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Activar
                </>
              )}
            </button>
          </div>
          
          {/* Estado de WhatsApp */}
          <div className={`status-card ${getStatusClass(status?.whatsappConnected, 'whatsapp')}`}>
            <div className="status-card-header">
              <div className="flex items-center gap-2">
                {getStatusIcon(status?.whatsappConnected, 'whatsapp')}
                <div>
                  <div className={`status-card-value ${getStatusClass(status?.whatsappConnected, 'whatsapp')}`}>
                    {getStatusText(status?.whatsappConnected, 'whatsapp')}
                  </div>
                  <div className="status-card-title">Conexión WhatsApp</div>
                </div>
              </div>
              <div className={`status-indicator ${getStatusClass(status?.whatsappConnected, 'whatsapp')}`}></div>
            </div>
            <button 
              onClick={onReconnectWhatsApp}
              disabled={updating || !status}
              className="action-button primary"
            >
              {updating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Reconectar
                </>
              )}
            </button>
          </div>
          
          {/* Tiempo Activo */}
          <div className="status-card">
            <div className="status-card-header">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-400" />
                <div>
                  <div className="status-card-value info">
                    {formatUptime(status?.uptime || 0)}
                  </div>
                  <div className="status-card-title">Tiempo Activo</div>
                </div>
              </div>
              <div className="status-indicator info"></div>
            </div>
          </div>
          
          {/* Última Actualización */}
          <div className="status-card">
            <div className="status-card-header">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-purple-400" />
                <div>
                  <div className="status-card-value warning">
                    {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : 'N/A'}
                  </div>
                  <div className="status-card-title">Última Actualización</div>
                </div>
              </div>
              <div className="status-indicator warning"></div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      {status?.whatsappStatus?.currentQR && (
        <div className="status-card">
          <QRDisplay 
            qrData={status.whatsappStatus.currentQR}
            onRefresh={onReconnectWhatsApp}
          />
        </div>
      )}
      
      {/* Detailed Status Section */}
      {status?.whatsappStatus && typeof status.whatsappStatus === 'object' && Object.keys(status.whatsappStatus).length > 0 && (
        <div className="status-card">
          <div className="status-card-header">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Estado Detallado de WhatsApp</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Connection Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">Estado de Conexión</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  status.whatsappStatus.connected 
                    ? 'bg-green-900/50 text-green-400 border border-green-500/30' 
                    : 'bg-red-900/50 text-red-400 border border-red-500/30'
                }`}>
                  {status.whatsappStatus.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">QR Requerido</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  status.whatsappStatus.qrNeeded 
                    ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/30' 
                    : 'bg-gray-900/50 text-gray-400 border border-gray-500/30'
                }`}>
                  {status.whatsappStatus.qrNeeded ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
            
            {/* Last Connection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">Última Conexión</span>
                <span className="text-sm text-gray-400">
                  {status.whatsappStatus.lastConnection 
                    ? new Date(status.whatsappStatus.lastConnection).toLocaleString('es-ES')
                    : 'Nunca'
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">QR Disponible</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  status.whatsappStatus.currentQR 
                    ? 'bg-green-900/50 text-green-400 border border-green-500/30' 
                    : 'bg-gray-900/50 text-gray-400 border border-gray-500/30'
                }`}>
                  {status.whatsappStatus.currentQR ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Raw Data (Collapsible) */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 transition-colors">
              Ver datos técnicos (JSON)
            </summary>
            <pre className="mt-3 p-3 bg-gray-800 rounded text-xs text-gray-300 overflow-x-auto border border-gray-700">
              {JSON.stringify(status.whatsappStatus, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default WhatsAppStatus; 