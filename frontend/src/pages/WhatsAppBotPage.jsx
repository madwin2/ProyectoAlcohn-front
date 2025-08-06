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
    <div className="whatsapp-bot-page">
      <div className="page-container">
        <div className="page-header">
          <WhatsAppBotHeader
            title="Administración WhatsApp Bot"
            subtitle="Gestiona la automatización de mensajes de WhatsApp"
            icon={<MessageSquare className="w-6 h-6" />}
          />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <div className="error-banner-header">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="error-banner-title">
                {apiAvailable ? 'Error de conexión' : 'API no disponible'}
              </span>
            </div>
            <div className="error-banner-message">{error}</div>
            <div className="error-banner-tips">
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
                >
                  Verificar estado del servidor
                </a>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="tab-navigation">
          <div className="tab-list">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'errors' && failedEvents && failedEvents.length > 0 && (
                  <span className="badge">
                    {failedEvents.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {renderTabContent()}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <div className="quick-actions-header">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="quick-actions-title">Acciones Rápidas</h3>
          </div>
          <div className="quick-actions-grid">
            <button
              onClick={() => refreshAll()}
              disabled={updating || !apiAvailable}
              className={`action-button primary ${!apiAvailable ? 'disabled' : ''}`}
            >
              <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
              Actualizar Todo
            </button>
            
            <button
              onClick={() => setActiveTab('console')}
              className="action-button secondary"
            >
              <Terminal className="w-4 h-4" />
              Ver Consola (QR)
            </button>
            
            <button
              onClick={() => toggleBot(!status?.botEnabled)}
              disabled={updating || !apiAvailable}
              className={`action-button ${!apiAvailable ? 'secondary disabled' : status?.botEnabled ? 'danger' : 'success'}`}
            >
              {!apiAvailable ? 'API no disponible' : status?.botEnabled ? 'Pausar Bot' : 'Activar Bot'}
            </button>
            
            <button
              onClick={reconnectWhatsApp}
              disabled={updating || !apiAvailable}
              className={`action-button warning ${!apiAvailable ? 'disabled' : ''}`}
            >
              {!apiAvailable ? 'API no disponible' : 'Reconectar WhatsApp'}
            </button>
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="status-summary">
          <div className="summary-card">
            <div>
              <div className="summary-card-label">Estado del Bot</div>
              <div className={`summary-card-value ${status?.botEnabled ? 'active' : 'inactive'}`}>
                {status?.botEnabled ? 'Activo' : 'Pausado'}
              </div>
            </div>
            <div className={`status-indicator ${status?.botEnabled ? 'active' : 'inactive'}`}></div>
          </div>

          <div className="summary-card">
            <div>
              <div className="summary-card-label">WhatsApp</div>
              <div className={`summary-card-value ${status?.whatsappConnected ? 'active' : 'inactive'}`}>
                {status?.whatsappConnected ? 'Conectado' : 'Desconectado'}
              </div>
            </div>
            <div className={`status-indicator ${status?.whatsappConnected ? 'active' : 'inactive'}`}></div>
          </div>

          <div className="summary-card">
            <div>
              <div className="summary-card-label">Eventos Fallidos</div>
              <div className="summary-card-value inactive">
                {failedEvents ? failedEvents.length : 0}
              </div>
            </div>
            <div className="status-indicator inactive"></div>
          </div>

          <div className="summary-card">
            <div>
              <div className="summary-card-label">Tiempo Activo</div>
              <div className="summary-card-value info">
                {status?.uptime ? Math.round(status.uptime / 60) : 0}m
              </div>
            </div>
            <div className="status-indicator info"></div>
          </div>
        </div>

        {/* Help Section */}
        <div className="help-section">
          <div className="help-section-header">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <h3 className="help-section-title">¿Necesitas ayuda?</h3>
          </div>
          <div className="help-content">
            <div className="help-category">
              <h4 className="help-category-title bot-status">Estado del Bot</h4>
              <div className="help-item">
                <span className="help-item-dot success"></span>
                <div>
                  <strong>Activo:</strong> El bot está enviando mensajes automáticamente
                </div>
              </div>
              <div className="help-item">
                <span className="help-item-dot error"></span>
                <div>
                  <strong>Pausado:</strong> El bot está detenido, no envía mensajes
                </div>
              </div>
              <div className="help-item">
                <span className="help-item-dot warning"></span>
                <div>
                  <strong>WhatsApp Desconectado:</strong> Necesitas reconectar la sesión
                </div>
              </div>
            </div>
            <div className="help-category">
              <h4 className="help-category-title errors">Eventos Fallidos</h4>
              <div className="help-item">
                <span className="help-item-dot error"></span>
                <div>
                  <strong>Error 500:</strong> Problema interno del servidor
                </div>
              </div>
              <div className="help-item">
                <span className="help-item-dot warning"></span>
                <div>
                  <strong>Error 400:</strong> Datos incorrectos en la petición
                </div>
              </div>
              <div className="help-item">
                <span className="help-item-dot info"></span>
                <div>
                  <strong>Reintentar:</strong> Vuelve a intentar enviar el mensaje
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