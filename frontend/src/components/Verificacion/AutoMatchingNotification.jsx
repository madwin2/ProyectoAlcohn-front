import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  ThumbsUp, 
  ThumbsDown,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

function AutoMatchingNotification({ matches, onAccept, onReject, onClose }) {
  const [processingIndex, setProcessingIndex] = useState(null);

  if (!matches || matches.length === 0) return null;

  const handleAcceptMatch = async (matchIndex) => {
    setProcessingIndex(matchIndex);
    try {
      await onAccept(matchIndex);
    } finally {
      setProcessingIndex(null);
    }
  };

  const handleRejectMatch = async (matchIndex) => {
    setProcessingIndex(matchIndex);
    try {
      await onReject(matchIndex);
    } finally {
      setProcessingIndex(null);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      background: 'rgba(9, 9, 11, 0.95)',
      border: '1px solid rgba(6, 182, 212, 0.5)',
      borderRadius: '12px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      backdropFilter: 'blur(16px)',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(39, 39, 42, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Zap style={{ width: '20px', height: '20px', color: '#06b6d4' }} />
          <div>
            <div style={{
              color: '#06b6d4',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Coincidencias Automáticas
            </div>
            <div style={{
              color: '#71717a',
              fontSize: '12px'
            }}>
              {matches.length} foto{matches.length > 1 ? 's' : ''} encontr{matches.length > 1 ? 'adas' : 'ada'}
            </div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#71717a',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(39, 39, 42, 0.5)';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#71717a';
          }}
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* Matches */}
      <div style={{ padding: '16px 20px' }}>
        {matches.map((match, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '8px',
              marginBottom: index < matches.length - 1 ? '12px' : 0
            }}
          >
            {/* Photo Preview */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid rgba(63, 63, 70, 0.5)',
              flexShrink: 0
            }}>
              <img
                src={match.photo.url}
                alt={match.photo.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            
            {/* Match Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px'
              }}>
                <CheckCircle style={{ width: '14px', height: '14px', color: '#22c55e' }} />
                <span style={{
                  color: '#22c55e',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {Math.round(match.confidence * 100)}% similitud
                </span>
              </div>
              
              <div style={{
                color: 'white',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {match.photo.name}
              </div>
              
              <div style={{
                color: '#06b6d4',
                fontSize: '12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                → {match.pedido.disenio}
              </div>
              
              <div style={{
                color: '#71717a',
                fontSize: '11px',
                marginTop: '2px'
              }}>
                {match.pedido.clientes?.nombre_cliente} {match.pedido.clientes?.apellido_cliente}
              </div>
            </div>
            
            {/* Actions */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <button
                onClick={() => handleAcceptMatch(index)}
                disabled={processingIndex === index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: processingIndex === index ? 'not-allowed' : 'pointer',
                  opacity: processingIndex === index ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (processingIndex !== index) {
                    e.target.style.background = '#16a34a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (processingIndex !== index) {
                    e.target.style.background = '#22c55e';
                  }
                }}
              >
                <ThumbsUp style={{ width: '12px', height: '12px' }} />
              </button>
              
              <button
                onClick={() => handleRejectMatch(index)}
                disabled={processingIndex === index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: processingIndex === index ? 'not-allowed' : 'pointer',
                  opacity: processingIndex === index ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (processingIndex !== index) {
                    e.target.style.background = '#dc2626';
                  }
                }}
                onMouseLeave={(e) => {
                  if (processingIndex !== index) {
                    e.target.style.background = '#ef4444';
                  }
                }}
              >
                <ThumbsDown style={{ width: '12px', height: '12px' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px',
        borderTop: '1px solid rgba(39, 39, 42, 0.5)'
      }}>
        <div style={{
          color: '#71717a',
          fontSize: '11px'
        }}>
          Las coincidencias se procesaron automáticamente
        </div>
        
        <button
          onClick={onClose}
          style={{
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid rgba(63, 63, 70, 0.5)',
            borderRadius: '6px',
            color: '#a1a1aa',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(39, 39, 42, 0.5)';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#a1a1aa';
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default AutoMatchingNotification;