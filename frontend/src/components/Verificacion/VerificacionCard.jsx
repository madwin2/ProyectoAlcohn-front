import React, { useState } from 'react';
import { 
  Calendar, 
  User, 
  Phone, 
  FileText, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Upload,
  Zap
} from 'lucide-react';

function VerificacionCard({ 
  pedido, 
  onOpenPhotoModal, 
  onMarcarCompleto, 
  getPublicUrl, 
  verificationResult 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const hasRequiredFiles = pedido.archivo_base || pedido.archivo_vector;
  const hasPhotos = pedido.foto_sello || verificationResult?.photos?.length > 0;
  const hasMatches = verificationResult?.matches?.length > 0;

  return (
    <div
      style={{
        background: 'rgba(9, 9, 11, 0.8)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isHovered ? 'rgba(6, 182, 212, 0.5)' : 'rgba(39, 39, 42, 0.5)',
        borderRadius: '12px',
        padding: '24px',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        boxShadow: isHovered ? '0 8px 32px rgba(6, 182, 212, 0.1)' : 'none'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h3 style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 8px 0'
          }}>
            {pedido.disenio || 'Diseño sin especificar'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar style={{ width: '14px', height: '14px', color: '#71717a' }} />
            <span style={{ color: '#71717a', fontSize: '14px' }}>
              {formatDate(pedido.fecha_compra)}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '20px'
        }}>
          <AlertCircle style={{ width: '14px', height: '14px', color: '#06b6d4' }} />
          <span style={{ color: '#06b6d4', fontSize: '12px', fontWeight: '500' }}>
            Para Verificar
          </span>
        </div>
      </div>

      {/* Cliente Info */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <User style={{ width: '16px', height: '16px', color: '#a1a1aa' }} />
          <span style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>
            {pedido.clientes?.nombre_cliente} {pedido.clientes?.apellido_cliente}
          </span>
        </div>
        
        {pedido.clientes?.telefono_cliente && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone style={{ width: '16px', height: '16px', color: '#a1a1aa' }} />
            <span style={{ color: '#a1a1aa', fontSize: '14px' }}>
              {pedido.clientes.telefono_cliente}
            </span>
          </div>
        )}
      </div>

      {/* Medida y Notas */}
      <div style={{ marginBottom: '20px' }}>
        {pedido.medida_pedida && (
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#71717a', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Medida
            </span>
            <div style={{ color: 'white', fontSize: '14px', marginTop: '4px' }}>
              {pedido.medida_pedida}
            </div>
          </div>
        )}
        
        {pedido.notas && (
          <div>
            <span style={{ color: '#71717a', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Notas
            </span>
            <div style={{ color: '#a1a1aa', fontSize: '14px', marginTop: '4px' }}>
              {pedido.notas}
            </div>
          </div>
        )}
      </div>

      {/* Archivos y Estado */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          {/* Archivo Base */}
          <div style={{ flex: 1 }}>
            <span style={{ color: '#71717a', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Archivo Base
            </span>
            <div style={{ marginTop: '6px' }}>
              {pedido.archivo_base ? (
                <button
                  onClick={() => window.open(getPublicUrl(pedido.archivo_base), '_blank')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '6px',
                    color: '#22c55e',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(34, 197, 94, 0.1)';
                  }}
                >
                  <Eye style={{ width: '12px', height: '12px' }} />
                  Ver archivo
                </button>
              ) : (
                <span style={{ color: '#71717a', fontSize: '12px' }}>No disponible</span>
              )}
            </div>
          </div>

          {/* Archivo Vector */}
          <div style={{ flex: 1 }}>
            <span style={{ color: '#71717a', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Archivo Vector
            </span>
            <div style={{ marginTop: '6px' }}>
              {pedido.archivo_vector ? (
                <button
                  onClick={() => window.open(getPublicUrl(pedido.archivo_vector), '_blank')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '6px',
                    color: '#22c55e',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(34, 197, 94, 0.1)';
                  }}
                >
                  <Eye style={{ width: '12px', height: '12px' }} />
                  Ver vector
                </button>
              ) : (
                <span style={{ color: '#71717a', fontSize: '12px' }}>No disponible</span>
              )}
            </div>
          </div>
        </div>

        {/* Verification Results */}
        {verificationResult && (
          <div style={{
            background: 'rgba(6, 182, 212, 0.05)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap style={{ width: '16px', height: '16px', color: '#06b6d4' }} />
              <span style={{ color: '#06b6d4', fontSize: '14px', fontWeight: '500' }}>
                Verificación automática
              </span>
            </div>
            
            {verificationResult.matches?.length > 0 ? (
              <div>
                <div style={{ color: '#22c55e', fontSize: '12px', marginBottom: '4px' }}>
                  ✓ Coincidencia encontrada
                </div>
                <div style={{ color: '#a1a1aa', fontSize: '12px' }}>
                  Mejor match: {verificationResult.matches[0].svg_match} 
                  ({Math.round(verificationResult.matches[0].score * 100)}% similitud)
                </div>
              </div>
            ) : (
              <div style={{ color: '#f59e0b', fontSize: '12px' }}>
                ⚠ No se encontraron coincidencias automáticas
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => onOpenPhotoModal(pedido)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: hasPhotos ? 'rgba(6, 182, 212, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            border: hasPhotos ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            color: hasPhotos ? '#06b6d4' : '#3b82f6',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = hasPhotos ? 'rgba(6, 182, 212, 0.2)' : 'rgba(59, 130, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = hasPhotos ? 'rgba(6, 182, 212, 0.1)' : 'rgba(59, 130, 246, 0.1)';
          }}
        >
          {hasPhotos ? <Camera style={{ width: '16px', height: '16px' }} /> : <Upload style={{ width: '16px', height: '16px' }} />}
          {hasPhotos ? 'Ver fotos' : 'Subir fotos'}
        </button>

        {hasPhotos && (
          <button
            onClick={() => onMarcarCompleto(pedido.id_pedido)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              color: '#22c55e',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(34, 197, 94, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(34, 197, 94, 0.1)';
            }}
          >
            <CheckCircle style={{ width: '16px', height: '16px' }} />
            Completar
          </button>
        )}
      </div>
    </div>
  );
}

export default VerificacionCard;