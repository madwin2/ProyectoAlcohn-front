import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Clock, Hash, AlertCircle, CheckCircle } from 'lucide-react';

const FailedEvents = ({ failedEvents, loading, updating, onRetryEvent }) => {
  const [expandedEvent, setExpandedEvent] = useState(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    if (status >= 500) return 'text-red-600';
    if (status >= 400) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = (status) => {
    if (status >= 500) return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (status >= 400) return <AlertCircle className="w-4 h-4 text-orange-600" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  };

  const handleRetry = async (eventId) => {
    if (window.confirm('¿Estás seguro de que quieres reintentar este evento?')) {
      await onRetryEvent(eventId);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded p-4 bg-red-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        Eventos Fallidos
        {updating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>}
        {failedEvents.length > 0 && (
          <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {failedEvents.length}
          </span>
        )}
      </h2>
      
      {failedEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
          <p className="text-lg font-medium">No hay eventos fallidos</p>
          <p className="text-sm">Todos los mensajes se han enviado correctamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {failedEvents.map(event => (
            <div key={event.event_id} className="border rounded-lg p-4 bg-red-50 hover:bg-red-100 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      Pedido #{event.pedido_id}
                    </span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(event.webhook_status)}
                      <span className={`text-sm font-medium ${getStatusColor(event.webhook_status)}`}>
                        Error {event.webhook_status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(event.created_at)}</span>
                    </div>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      ID: {event.event_id.slice(0, 8)}...
                    </span>
                  </div>
                  
                  {event.webhook_body && (
                    <div className="mt-2">
                      <button
                        onClick={() => setExpandedEvent(expandedEvent === event.event_id ? null : event.event_id)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {expandedEvent === event.event_id ? 'Ocultar' : 'Ver'} detalles del error
                      </button>
                      
                      {expandedEvent === event.event_id && (
                        <div className="mt-2 p-3 bg-white rounded border">
                          <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                            {event.webhook_body}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => handleRetry(event.event_id)}
                  disabled={updating}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-sm font-medium transition-colors"
                >
                  {updating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Reintentar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {failedEvents.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Los eventos fallidos pueden reintentarse. 
            Esto volverá a intentar enviar el mensaje de WhatsApp al cliente.
          </p>
        </div>
      )}
    </div>
  );
};

export default FailedEvents; 