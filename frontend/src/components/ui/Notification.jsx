import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const Notification = ({ notification, onRemove }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle style={{ width: '16px', height: '16px' }} />;
      case 'error':
        return <XCircle style={{ width: '16px', height: '16px' }} />;
      case 'warning':
        return <AlertTriangle style={{ width: '16px', height: '16px' }} />;
      default:
        return <Info style={{ width: '16px', height: '16px' }} />;
    }
  };

  const getStyles = (type) => {
    const baseStyles = {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: '1px solid',
      maxWidth: '400px',
      animation: 'slideIn 0.3s ease-out'
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          background: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
          color: '#10b981'
        };
      case 'error':
        return {
          ...baseStyles,
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          color: '#ef4444'
        };
      case 'warning':
        return {
          ...baseStyles,
          background: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          color: '#f59e0b'
        };
      default:
        return {
          ...baseStyles,
          background: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          color: '#3b82f6'
        };
    }
  };

  return (
    <div style={getStyles(notification.type)}>
      {getIcon(notification.type)}
      <span style={{ flex: 1 }}>{notification.message}</span>
      <button
        onClick={() => onRemove(notification.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.opacity = 1}
        onMouseLeave={(e) => e.target.style.opacity = 0.7}
      >
        <X style={{ width: '14px', height: '14px' }} />
      </button>
    </div>
  );
};

export default Notification; 