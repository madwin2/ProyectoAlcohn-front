import React, { useState } from 'react';
import { MessageSquare, RefreshCw, Settings, Activity } from 'lucide-react';
import WhatsAppStatus from '../components/WhatsAppStatus';
import MessageConfig from '../components/MessageConfig';
import FailedEvents from '../components/FailedEvents';
import SystemLogs from '../components/SystemLogs';
import { useWhatsAppBot } from '../hooks/useWhatsAppBot';
import PageHeader from '../components/PageHeader';
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
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Administración WhatsApp Bot"
        subtitle="Gestiona la automatización de mensajes de WhatsApp"
        icon={<MessageSquare className="w-6 h-6" />}
      />

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-800 font-medium">Error de conexión</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'errors' && failedEvents.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
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
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => refreshAll()}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
            Actualizar Todo
          </button>
          
          <button
            onClick={() => toggleBot(!status?.botEnabled)}
            disabled={updating}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              status?.botEnabled
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white'
                : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white'
            }`}
          >
            {status?.botEnabled ? 'Pausar Bot' : 'Activar Bot'}
          </button>
          
          <button
            onClick={reconnectWhatsApp}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-md text-sm font-medium transition-colors"
          >
            Reconectar WhatsApp
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Estado del Bot</p>
              <p className={`text-lg font-semibold ${status?.botEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {status?.botEnabled ? 'Activo' : 'Pausado'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${status?.botEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">WhatsApp</p>
              <p className={`text-lg font-semibold ${status?.whatsappConnected ? 'text-green-600' : 'text-red-600'}`}>
                {status?.whatsappConnected ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${status?.whatsappConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Eventos Fallidos</p>
              <p className="text-lg font-semibold text-red-600">
                {failedEvents.length}
              </p>
            </div>
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tiempo Activo</p>
              <p className="text-lg font-semibold text-blue-600">
                {status?.uptime ? Math.round(status.uptime / 60) : 0}m
              </p>
            </div>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">¿Necesitas ayuda?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Estado del Bot</h4>
            <ul className="space-y-1">
              <li>• <strong>Activo:</strong> El bot está enviando mensajes automáticamente</li>
              <li>• <strong>Pausado:</strong> El bot está detenido, no envía mensajes</li>
              <li>• <strong>WhatsApp Desconectado:</strong> Necesitas reconectar la sesión</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Eventos Fallidos</h4>
            <ul className="space-y-1">
              <li>• <strong>Error 500:</strong> Problema interno del servidor</li>
              <li>• <strong>Error 400:</strong> Datos incorrectos en la petición</li>
              <li>• <strong>Reintentar:</strong> Vuelve a intentar enviar el mensaje</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppBotPage; 