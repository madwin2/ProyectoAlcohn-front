import React from 'react';
import { 
  Upload, 
  Download, 
  Clock, 
  Ruler, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  FileImage, 
  Shapes, 
  ArrowRight, 
  Package, 
  Loader2, 
  Sparkles, 
  Eye, 
  Settings 
} from 'lucide-react';

const VectorizacionCard = ({ 
  pedido, 
  tipo, 
  publicUrl, 
  dimensionesSVG, 
  opcionesEscalado, 
  procesando, 
  handleVectorizar, 
  handlePrevisualizar, 
  handleDimensionar, 
  handleDescargar 
}) => {
  const isProcessing = procesando[pedido.id_pedido];
  const prioridadColor = {
    'Muy Baja': '#71717a',
    'Baja': '#a1a1aa',
    'Media': '#f59e0b',
    'Alta': '#ef4444',
    'Muy Alta': '#dc2626'
  };

  const getImageUrl = () => {
    switch(tipo) {
      case 'base':
        return publicUrl(Array.isArray(pedido.archivo_base) ? pedido.archivo_base[0] : pedido.archivo_base);
      case 'vector':
        return publicUrl(pedido.archivo_vector);
      case 'verificado':
        return publicUrl(pedido.archivo_vector);
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch(tipo) {
      case 'base':
        return 'Para vectorizar';
      case 'vector':
        return 'Verificar medidas';
      case 'verificado':
        return 'Completado';
      default:
        return '';
    }
  };

  const getTitleColor = () => {
    switch(tipo) {
      case 'base':
        return '#60a5fa';
      case 'vector':
        return '#f59e0b';
      case 'verificado':
        return '#22c55e';
      default:
        return '#71717a';
    }
  };

  const imageUrl = getImageUrl();

  return (
    <div style={{
      background: 'rgba(9, 9, 11, 0.8)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(39, 39, 42, 0.5)',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Image Preview */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '200px',
        background: 'rgba(24, 24, 27, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={pedido.disenio}
            style={{
              width: '100%',
              height: '100%',
              objectFit: tipo === 'base' ? 'cover' : 'contain',
              transition: 'transform 0.3s ease'
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            color: '#71717a'
          }}>
            <FileImage style={{ width: '32px', height: '32px' }} />
            <span style={{ fontSize: '12px' }}>Sin imagen</span>
          </div>
        )}

        {/* Overlays */}
        {pedido.prioridad && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            color: prioridadColor[pedido.prioridad] || '#71717a',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            border: `1px solid ${prioridadColor[pedido.prioridad] || '#71717a'}40`
          }}>
            {pedido.prioridad}
          </div>
        )}

        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          color: getTitleColor(),
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500',
          border: `1px solid ${getTitleColor()}40`
        }}>
          {getTitle()}
        </div>

        {pedido.medida_pedida && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            color: '#d4d4d8',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Ruler style={{ width: '12px', height: '12px' }} />
            {pedido.medida_pedida} cm
          </div>
        )}

        {pedido.medida_real && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'rgba(34, 197, 94, 0.2)',
            backdropFilter: 'blur(8px)',
            color: '#86efac',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <CheckCircle style={{ width: '12px', height: '12px' }} />
            {pedido.medida_real} cm
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '500',
            color: 'white',
            margin: '0 0 4px 0',
            lineHeight: '1.2'
          }}>
            {pedido.disenio}
          </h3>
          <p style={{
            fontSize: '12px',
            color: '#71717a',
            margin: '0 0 8px 0'
          }}>
            ID: {pedido.id_pedido}
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#a1a1aa'
          }}>
            <Package style={{ width: '12px', height: '12px' }} />
            {pedido.cliente || 'Sin cliente'}
          </div>
        </div>

        {/* Actions based on type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tipo === 'base' && (
            <button
              onClick={() => handleVectorizar(pedido)}
              disabled={isProcessing}
              style={{
                width: '100%',
                background: isProcessing ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                color: isProcessing ? '#93c5fd' : '#60a5fa',
                height: '36px',
                fontWeight: '500',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: isProcessing ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.target.style.background = 'rgba(59, 130, 246, 0.3)';
                  e.target.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing) {
                  e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                  e.target.style.color = '#60a5fa';
                }
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  Vectorizando...
                </>
              ) : (
                <>
                  <Sparkles style={{ width: '16px', height: '16px' }} />
                  Vectorizar con IA
                </>
              )}
            </button>
          )}

          {tipo === 'vector' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => handlePrevisualizar(pedido)}
                style={{
                  width: '100%',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  color: '#c4b5fd',
                  height: '32px',
                  fontWeight: '500',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(139, 92, 246, 0.3)';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(139, 92, 246, 0.2)';
                  e.target.style.color = '#c4b5fd';
                }}
              >
                <Eye style={{ width: '12px', height: '12px' }} />
                Previsualizar
              </button>
              
              {opcionesEscalado && opcionesEscalado[pedido.id_pedido] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleDimensionar(pedido, opcionesEscalado[pedido.id_pedido].normal)}
                      disabled={isProcessing}
                      style={{
                        flex: 1,
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid rgba(34, 197, 94, 0.5)',
                        color: '#86efac',
                        height: '28px',
                        fontWeight: '500',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.3s ease',
                        opacity: isProcessing ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(34, 197, 94, 0.3)';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                        e.target.style.color = '#86efac';
                      }}
                    >
                      {isProcessing ? <Loader2 style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} /> : <Settings style={{ width: '12px', height: '12px' }} />}
                      X: {opcionesEscalado[pedido.id_pedido].normal}
                    </button>
                    <button
                      onClick={() => handleDimensionar(pedido, opcionesEscalado[pedido.id_pedido].invertido)}
                      disabled={isProcessing}
                      style={{
                        flex: 1,
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid rgba(34, 197, 94, 0.5)',
                        color: '#86efac',
                        height: '28px',
                        fontWeight: '500',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.3s ease',
                        opacity: isProcessing ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(34, 197, 94, 0.3)';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                        e.target.style.color = '#86efac';
                      }}
                    >
                      {isProcessing ? <Loader2 style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} /> : <Settings style={{ width: '12px', height: '12px' }} />}
                      Y: {opcionesEscalado[pedido.id_pedido].invertido}
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#71717a', textAlign: 'center' }}>
                    Medida SVG: {opcionesEscalado[pedido.id_pedido].original} mm
                  </div>
                </div>
              )}
            </div>
          )}

          {tipo === 'verificado' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleDescargar(publicUrl(pedido.archivo_vector), `vector-${pedido.id_pedido}.svg`)}
                style={{
                  width: '100%',
                  background: 'rgba(39, 39, 42, 0.5)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  color: '#d4d4d8',
                  height: '32px',
                  fontWeight: '500',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(63, 63, 70, 0.5)';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                  e.target.style.color = '#d4d4d8';
                }}
              >
                <Download style={{ width: '12px', height: '12px' }} />
                Descargar
              </button>
              {pedido.tiempo_estimado && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div style={{
                    textAlign: 'center',
                    padding: '8px',
                    background: 'rgba(39, 39, 42, 0.3)',
                    borderRadius: '8px',
                    border: '1px solid rgba(63, 63, 70, 0.5)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      color: '#71717a',
                      marginBottom: '4px'
                    }}>
                      <Clock style={{ width: '12px', height: '12px' }} />
                      <span>CNC</span>
                    </div>
                    <div style={{ color: 'white', fontWeight: '500' }}>{pedido.tiempo_estimado}min</div>
                  </div>
                  {pedido.tiempo_estimado_ultrafino && (
                    <div style={{
                      textAlign: 'center',
                      padding: '8px',
                      background: 'rgba(39, 39, 42, 0.3)',
                      borderRadius: '8px',
                      border: '1px solid rgba(63, 63, 70, 0.5)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        color: '#71717a',
                        marginBottom: '4px'
                      }}>
                        <Zap style={{ width: '12px', height: '12px' }} />
                        <span>Ultra</span>
                      </div>
                      <div style={{ color: 'white', fontWeight: '500' }}>{pedido.tiempo_estimado_ultrafino}min</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VectorizacionCard;