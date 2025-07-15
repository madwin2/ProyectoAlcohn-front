import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';
import { checkApiHealth } from '../../services/apiHealthCheck';

function ApiStatusIndicator({ onStatusChange }) {
  const [status, setStatus] = useState({
    checking: true,
    available: false,
    message: 'Verificando API...',
    lastCheck: null
  });
  const [showDetails, setShowDetails] = useState(false);

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, checking: true }));
    
    try {
      const health = await checkApiHealth();
      const newStatus = {
        checking: false,
        available: health.available,
        message: health.message,
        error: health.error,
        lastCheck: new Date().toLocaleTimeString(),
        url: health.url
      };
      
      setStatus(newStatus);
      onStatusChange && onStatusChange(newStatus);
      
    } catch (error) {
      const newStatus = {
        checking: false,
        available: false,
        message: 'Error verificando API',
        error: error.message,
        lastCheck: new Date().toLocaleTimeString()
      };
      
      setStatus(newStatus);
      onStatusChange && onStatusChange(newStatus);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (status.checking) return '#71717a';
    return status.available ? '#22c55e' : '#ef4444';
  };

  const getStatusIcon = () => {
    if (status.checking) {
      return <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />;
    }
    
    if (status.available) {
      return <CheckCircle style={{ width: '16px', height: '16px' }} />;
    }
    
    return <AlertCircle style={{ width: '16px', height: '16px' }} />;
  };

  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <div
        onClick={() => setShowDetails(!showDetails)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: status.available ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${status.available ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: '6px',
          color: getStatusColor(),
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = status.available ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = status.available ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        }}
      >
        {getStatusIcon()}
        <span>CLIP API</span>
        <Info style={{ width: '12px', height: '12px', opacity: 0.6 }} />
      </div>

      <button
        onClick={checkStatus}
        disabled={status.checking}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          background: 'transparent',
          border: '1px solid rgba(63, 63, 70, 0.5)',
          borderRadius: '4px',
          color: '#a1a1aa',
          cursor: status.checking ? 'not-allowed' : 'pointer',
          opacity: status.checking ? 0.5 : 1,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!status.checking) {
            e.target.style.background = 'rgba(39, 39, 42, 0.5)';
            e.target.style.color = 'white';
          }
        }}
        onMouseLeave={(e) => {
          if (!status.checking) {
            e.target.style.background = 'transparent';
            e.target.style.color = '#a1a1aa';
          }
        }}
      >
        <RefreshCw style={{ 
          width: '12px', 
          height: '12px',
          ...(status.checking && { animation: 'spin 1s linear infinite' })
        }} />
      </button>

      {/* Details Tooltip */}
      {showDetails && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '8px',
          width: '280px',
          background: 'rgba(9, 9, 11, 0.95)',
          border: '1px solid rgba(39, 39, 42, 0.5)',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '8px'
          }}>
            <Zap style={{ width: '14px', height: '14px', color: '#06b6d4' }} />
            <span style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>
              Estado de la API
            </span>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <div style={{ color: '#a1a1aa', fontSize: '11px', marginBottom: '2px' }}>
              Estado:
            </div>
            <div style={{ color: getStatusColor(), fontSize: '12px' }}>
              {status.message}
            </div>
          </div>
          
          {status.url && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#a1a1aa', fontSize: '11px', marginBottom: '2px' }}>
                URL:
              </div>
              <div style={{ color: '#71717a', fontSize: '11px', fontFamily: 'monospace' }}>
                {status.url}
              </div>
            </div>
          )}
          
          {status.error && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#a1a1aa', fontSize: '11px', marginBottom: '2px' }}>
                Error:
              </div>
              <div style={{ color: '#ef4444', fontSize: '11px' }}>
                {status.error}
              </div>
            </div>
          )}
          
          {status.lastCheck && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#a1a1aa', fontSize: '11px', marginBottom: '2px' }}>
                Última verificación:
              </div>
              <div style={{ color: '#71717a', fontSize: '11px' }}>
                {status.lastCheck}
              </div>
            </div>
          )}
          
          {!status.available && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '4px'
            }}>
              <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500', marginBottom: '4px' }}>
                💡 Soluciones:
              </div>
              <div style={{ color: '#ef4444', fontSize: '10px', lineHeight: '1.4' }}>
                • Ejecutar: npm run dev<br />
                • Verificar puerto 8000<br />
                • Revisar dependencias Python
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ApiStatusIndicator;