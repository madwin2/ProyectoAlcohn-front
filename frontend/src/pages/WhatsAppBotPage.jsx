import React, { useState } from 'react';
import { MessageSquare, RefreshCw, Settings, Activity, Terminal, Zap, AlertCircle } from 'lucide-react';
import WhatsAppStatus from '../components/WhatsAppStatus';
import MessageConfig from '../components/MessageConfig';
import FailedEvents from '../components/FailedEvents';
import SystemLogs from '../components/SystemLogs';
import ConsoleViewer from '../components/ConsoleViewer';
import { useWhatsAppBot } from '../hooks/useWhatsAppBot';
import WhatsAppBotHeader from '../components/WhatsAppBotHeader';
import './WhatsAppBotPage.css';

const WhatsAppBotPage = () => {
  const [activeTab, setActiveTab] = useState('status');
  const {
    status,
    config,
    failedEvents,
    logs,
    loading,
    error,
    updating,
    apiAvailable,
    updateMessage,
    toggleBot,
    reconnectWhatsApp,
    retryEvent,
    loadLogs,
    refreshAll
  } = useWhatsAppBot();

  const tabs = [
    {
      id: 'status',
      label: 'Estado',
      icon: <Activity className="w-4 h-4" />,
      description: 'Estado del bot y WhatsApp'
    },
    {
      id: 'messages',
      label: 'Mensajes',
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'Configuración de mensajes'
    },
    {
      id: 'errors',
      label: 'Errores',
      icon: <Settings className="w-4 h-4" />,
      description: 'Eventos fallidos y reintentos'
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: <RefreshCw className="w-4 h-4" />,
      description: 'Logs del sistema'
    },
    {
      id: 'console',
      label: 'Consola',
      icon: <Terminal className="w-4 h-4" />,
      description: 'Consola en tiempo real'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'status':
        return (
          <WhatsAppStatus
            status={status}
            loading={loading}
            updating={updating}
            onToggleBot={toggleBot}
            onReconnectWhatsApp={reconnectWhatsApp}
          />
        );
      case 'messages':
        return (
          <MessageConfig
            config={config}
            loading={loading}
            updating={updating}
            onUpdateMessage={updateMessage}
          />
        );
      case 'errors':
        return (
          <FailedEvents
            failedEvents={failedEvents}
            loading={loading}
            updating={updating}
            onRetryEvent={retryEvent}
          />
        );
      case 'logs':
        return (
          <SystemLogs
            logs={logs}
            loading={loading}
            onLoadLogs={loadLogs}
          />
        );
      case 'console':
        return (
          <ConsoleViewer
            isConnected={apiAvailable}
            onReconnect={reconnectWhatsApp}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="p-6 space-y-6">
        <WhatsAppBotHeader
          title="Administración WhatsApp Bot"
          subtitle="Gestiona la automatización de mensajes de WhatsApp"
          icon={<MessageSquare className="w-6 h-6" />}
        />

        {/* Error Banner */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-red-300 font-medium">
                    {apiAvailable ? 'Error de conexión' : 'API no disponible'}
                  </span>
                </div>
                <p className="text-red-200 text-sm mb-3">{error}</p>
                <div className="text-red-300 text-xs space-y-1">
                  <p>
                    💡 <strong>Consejo:</strong> La API puede estar temporalmente no disponible. 
                    El sistema reintentará automáticamente en 30 segundos.
                  </p>
                  {!apiAvailable && (
                    <p>
                    🔧 <strong>Acciones:</strong> 
                    <a 
                      href="https://webhook.alcohncnc.com/status" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline ml-1"
                    >
                      Verificar estado del servidor
                    </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-1 p-1" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.id === 'errors' && failedEvents && failedEvents.length > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] flex items-center justify-center">
                      {failedEvents.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Acciones Rápidas</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => refreshAll()}
              disabled={updating || !apiAvailable}
              className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg text-sm font-medium transition-all duration-200 ${
                !apiAvailable 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25 hover:scale-105'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
              Actualizar Todo
            </button>
            
            <button
              onClick={() => setActiveTab('console')}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              <Terminal className="w-4 h-4" />
              Ver Consola (QR)
            </button>
            
            <button
              onClick={() => toggleBot(!status?.botEnabled)}
              disabled={updating || !apiAvailable}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                !apiAvailable
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : status?.botEnabled
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/25 hover:scale-105'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/25 hover:scale-105'
              }`}
            >
              {!apiAvailable ? 'API no disponible' : status?.botEnabled ? 'Pausar Bot' : 'Activar Bot'}
            </button>
            
            <button
              onClick={reconnectWhatsApp}
              disabled={updating || !apiAvailable}
              className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg text-sm font-medium transition-all duration-200 ${
                !apiAvailable 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700 shadow-lg hover:shadow-orange-500/25 hover:scale-105'
              }`}
            >
              {!apiAvailable ? 'API no disponible' : 'Reconectar WhatsApp'}
            </button>
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Estado del Bot</p>
                <p className={`text-lg font-bold ${status?.botEnabled ? 'text-green-400' : 'text-red-400'}`}>
                  {status?.botEnabled ? 'Activo' : 'Pausado'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${status?.botEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">WhatsApp</p>
                <p className={`text-lg font-bold ${status?.whatsappConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {status?.whatsappConnected ? 'Conectado' : 'Desconectado'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${status?.whatsappConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Eventos Fallidos</p>
                <p className="text-lg font-bold text-red-400">
                  {failedEvents ? failedEvents.length : 0}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Tiempo Activo</p>
                <p className="text-lg font-bold text-blue-400">
                  {status?.uptime ? Math.round(status.uptime / 60) : 0}m
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            ¿Necesitas ayuda?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <h4 className="font-medium text-blue-400 mb-3">Estado del Bot</h4>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <strong className="text-white">Activo:</strong> El bot está enviando mensajes automáticamente
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <strong className="text-white">Pausado:</strong> El bot está detenido, no envía mensajes
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <strong className="text-white">WhatsApp Desconectado:</strong> Necesitas reconectar la sesión
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-red-400 mb-3">Eventos Fallidos</h4>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <strong className="text-white">Error 500:</strong> Problema interno del servidor
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <strong className="text-white">Error 400:</strong> Datos incorrectos en la petición
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <strong className="text-white">Reintentar:</strong> Vuelve a intentar enviar el mensaje
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppBotPage; 