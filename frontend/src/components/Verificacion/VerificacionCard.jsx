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
import SVGPreview from '../ui/SVGPreview';

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

  // Determinar qué archivo mostrar (priorizar vector, luego base)
  const vectorFile = pedido.archivo_vector || pedido.archivo_base;

  return (
    <div
      style={{
        background: 'rgba(9, 9, 11, 0.8)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isHovered ? 'rgba(6, 182, 212, 0.5)' : 'rgba(39, 39, 42, 0.5)',
        borderRadius: '8px',
        padding: '12px',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        boxShadow: isHovered ? '0 8px 32px rgba(6, 182, 212, 0.1)' : 'none'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <h3 style={{
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            margin: '0 0 4px 0'
          }}>
            {pedido.disenio || 'Diseño sin especificar'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar style={{ width: '10px', height: '10px', color: '#71717a' }} />
            <span style={{ color: '#71717a', fontSize: '10px' }}>
              {formatDate(pedido.fecha_compra)}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          padding: '2px 6px',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '12px'
        }}>
          <AlertCircle style={{ width: '10px', height: '10px', color: '#06b6d4' }} />
          <span style={{ color: '#06b6d4', fontSize: '9px', fontWeight: '500' }}>
            Para Verificar
          </span>
        </div>
      </div>

      {/* Cliente Info */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <User style={{ width: '12px', height: '12px', color: '#a1a1aa' }} />
          <span style={{ color: 'white', fontSize: '12px', fontWeight: '500' }}>
            {pedido.clientes?.nombre_cliente} {pedido.clientes?.apellido_cliente}
          </span>
        </div>
        
        {pedido.clientes?.telefono_cliente && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Phone style={{ width: '12px', height: '12px', color: '#a1a1aa' }} />
            <span style={{ color: '#a1a1aa', fontSize: '10px' }}>
              {pedido.clientes.telefono_cliente}
            </span>
          </div>
        )}
      </div>

      {/* Medida */}
      {pedido.medida_pedida && (
        <div style={{ marginBottom: '12px' }}>
          <span style={{ color: '#71717a', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Medida
          </span>
          <div style={{ color: 'white', fontSize: '11px', marginTop: '2px' }}>
            {pedido.medida_pedida}
          </div>
        </div>
      )}

      {/* Previsualización del Vector */}
      <div style={{ marginBottom: '12px' }}>
        <span style={{ color: '#71717a', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Previsualización
        </span>
        <div style={{ 
          marginTop: '4px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <SVGPreview
            vectorUrl={vectorFile ? getPublicUrl(vectorFile) : null}
            size={72}
            backgroundColor="white"
            borderRadius="6px"
          />
        </div>
      </div>

      {/* Verification Results - Solo si hay resultados */}
      {verificationResult && (
        <div style={{
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '4px',
          padding: '6px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <Zap style={{ width: '12px', height: '12px', color: '#06b6d4' }} />
            <span style={{ color: '#06b6d4', fontSize: '10px', fontWeight: '500' }}>
              Verificación automática
            </span>
          </div>
          
          {verificationResult.matches?.length > 0 ? (
            <div>
              <div style={{ color: '#22c55e', fontSize: '9px', marginBottom: '1px' }}>
                ✓ Coincidencia encontrada
              </div>
              <div style={{ color: '#a1a1aa', fontSize: '9px' }}>
                {Math.round(verificationResult.matches[0].score * 100)}% similitud
              </div>
            </div>
          ) : (
            <div style={{ color: '#f59e0b', fontSize: '9px' }}>
              ⚠ Sin coincidencias
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => onOpenPhotoModal(pedido)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '8px 10px',
            background: hasPhotos ? 'rgba(6, 182, 212, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            border: hasPhotos ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '4px',
            color: hasPhotos ? '#06b6d4' : '#3b82f6',
            fontSize: '11px',
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
          {hasPhotos ? <Camera style={{ width: '12px', height: '12px' }} /> : <Upload style={{ width: '12px', height: '12px' }} />}
          {hasPhotos ? 'Ver fotos' : 'Subir fotos'}
        </button>

        {hasPhotos && (
          <button
            onClick={() => onMarcarCompleto(pedido.id_pedido)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 10px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '4px',
              color: '#22c55e',
              fontSize: '11px',
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
            <CheckCircle style={{ width: '12px', height: '12px' }} />
            Completar
          </button>
        )}
      </div>
    </div>
  );
}

export default VerificacionCard;