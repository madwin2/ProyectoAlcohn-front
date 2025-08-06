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
  XCircle
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
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
        <CheckCircle className="w-6 h-6 text-green-600" />
      ) : (
        <XCircle className="w-6 h-6 text-red-600" />
      );
    }
    
    return status.whatsappConnected ? (
      <Wifi className="w-6 h-6 text-green-600" />
    ) : (
      <WifiOff className="w-6 h-6 text-red-600" />
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

  const getStatusColor = (connected, type) => {
    if (!status || typeof status !== 'object') {
      return 'text-gray-400';
    }
    
    if (type === 'bot') {
      return status.botEnabled ? 'text-green-600' : 'text-red-600';
    }
    
    return status.whatsappConnected ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <RefreshCw className={`w-5 h-5 ${updating ? 'animate-spin' : ''}`} />
        Estado General
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Estado del Bot */}
        <div className="text-center p-4 border rounded-lg bg-gray-50">
          <div className="flex justify-center mb-2">
            {getStatusIcon(status?.whatsappConnected, 'bot')}
          </div>
          <div className={`text-lg font-bold ${getStatusColor(status?.whatsappConnected, 'bot')}`}>
            {getStatusText(status?.whatsappConnected, 'bot')}
          </div>
          <div className="text-sm text-gray-600 mb-3">Bot</div>
          <button 
            onClick={() => onToggleBot(!status?.botEnabled)}
            disabled={updating || !status}
            className={`px-4 py-2 rounded text-white text-sm font-medium transition-colors ${
              !status ? 'bg-gray-400 cursor-not-allowed' :
              status.botEnabled 
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400' 
                : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
            }`}
          >
            {updating ? (
              <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
            ) : !status ? (
              'Cargando...'
            ) : status.botEnabled ? (
              <>
                <Pause className="w-4 h-4 inline mr-1" />
                Pausar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 inline mr-1" />
                Activar
              </>
            )}
          </button>
        </div>
        
        {/* Estado de WhatsApp */}
        <div className="text-center p-4 border rounded-lg bg-gray-50">
          <div className="flex justify-center mb-2">
            {getStatusIcon(status?.whatsappConnected, 'whatsapp')}
          </div>
          <div className={`text-lg font-bold ${getStatusColor(status?.whatsappConnected, 'whatsapp')}`}>
            {getStatusText(status?.whatsappConnected, 'whatsapp')}
          </div>
          <div className="text-sm text-gray-600 mb-3">WhatsApp</div>
          <button 
            onClick={onReconnectWhatsApp}
            disabled={updating || !status}
            className={`px-4 py-2 text-white rounded text-sm font-medium transition-colors ${
              !status ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
            }`}
          >
            {updating ? (
              <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Reconectar
              </>
            )}
          </button>
        </div>
        
        {/* Tiempo Activo */}
        <div className="text-center p-4 border rounded-lg bg-gray-50">
          <div className="flex justify-center mb-2">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-600">
            {formatUptime(status?.uptime || 0)}
          </div>
          <div className="text-sm text-gray-600">Tiempo Activo</div>
        </div>
        
        {/* Última Actualización */}
        <div className="text-center p-4 border rounded-lg bg-gray-50">
          <div className="flex justify-center mb-2">
            <AlertTriangle className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-purple-600">
            {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Última Actualización</div>
        </div>
      </div>
      
      {/* QR Code Display */}
      {status?.whatsappStatus?.currentQR && (
        <div className="mt-6">
          <QRDisplay 
            qrData={status.whatsappStatus.currentQR}
            onRefresh={onReconnectWhatsApp}
          />
        </div>
      )}
      
      {/* Información adicional */}
      {status?.whatsappStatus && typeof status.whatsappStatus === 'object' && Object.keys(status.whatsappStatus).length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Estado Detallado de WhatsApp:</h3>
          <pre className="text-xs text-blue-700 overflow-x-auto">
            {JSON.stringify(status.whatsappStatus, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default WhatsAppStatus; 