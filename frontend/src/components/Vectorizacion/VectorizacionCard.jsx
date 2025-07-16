import React, { useRef } from 'react';
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
  removerFondo,
  setRemoverFondo,
  handleVectorizar, 
  handlePrevisualizar, 
  handleDimensionar, 
  handleDescargar,
  handleCargarVector
}) => {
  const fileInputRef = useRef(null);
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
        aspectRatio: '1',
        background: 'rgba(24, 24, 27, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {imageUrl ? (
          <div style={{
            width: '100%',
            height: '100%',
            background: tipo === 'base' ? 'transparent' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 240, 240, 0.2) 50%, rgba(255, 255, 255, 0.3) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: tipo === 'base' ? '0' : '8px',
            margin: tipo === 'base' ? '0' : '8px',
            transition: 'all 0.3s ease',
            backdropFilter: tipo === 'base' ? 'none' : 'blur(4px)'
          }}
          onMouseEnter={(e) => {
            if (tipo !== 'base') {
              e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.7) 100%)';
            }
          }}
          onMouseLeave={(e) => {
            if (tipo !== 'base') {
              e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 240, 240, 0.2) 50%, rgba(255, 255, 255, 0.3) 100%)';
            }
          }}
          >
            <img 
              src={imageUrl} 
              alt={pedido.disenio}
              style={{
                width: '100%',
                height: '100%',
                objectFit: tipo === 'base' ? 'cover' : 'contain',
                transition: 'transform 0.3s ease',
                borderRadius: tipo === 'base' ? '0' : '6px'
              }}
            />
          </div>
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


      </div>

              {/* Content */}
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '500',
                color: 'white',
                margin: 0,
                lineHeight: '1.2'
              }}>
                {pedido.disenio}
              </h3>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {tipo === 'vector' && pedido.medida_pedida && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#f59e0b',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontWeight: '500'
                  }}>
                    <Ruler style={{ width: '12px', height: '12px' }} />
                    {pedido.medida_pedida} cm
                  </div>
                )}
                
                {pedido.medida_real && (
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#22c55e',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    fontWeight: '500'
                  }}>
                    <CheckCircle style={{ width: '12px', height: '12px' }} />
                    {pedido.medida_real} cm
                  </div>
                )}
                
                {pedido.tiempo_estimado && (
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    fontWeight: '500'
                  }}>
                    <Clock style={{ width: '12px', height: '12px' }} />
                    {pedido.tiempo_estimado}min
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Actions based on type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tipo === 'base' && (
            <>
              {/* Checkbox Remover Fondo */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'rgba(39, 39, 42, 0.3)',
                borderRadius: '6px',
                border: '1px solid rgba(63, 63, 70, 0.5)'
              }}>
                <input
                  type="checkbox"
                  id={`remover-fondo-${pedido.id_pedido}`}
                  checked={removerFondo}
                  onChange={(e) => setRemoverFondo(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#60a5fa',
                    cursor: 'pointer'
                  }}
                />
                <label
                  htmlFor={`remover-fondo-${pedido.id_pedido}`}
                  style={{
                    fontSize: '12px',
                    color: '#d4d4d8',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  Remover fondo
                </label>
              </div>
              
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

              {/* Botón para cargar vector manualmente */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  background: isProcessing ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.5)',
                  color: isProcessing ? '#86efac' : '#22c55e',
                  height: '32px',
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
                    e.target.style.background = 'rgba(34, 197, 94, 0.3)';
                    e.target.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isProcessing) {
                    e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                    e.target.style.color = '#22c55e';
                  }
                }}
              >
                <Upload style={{ width: '14px', height: '14px' }} />
                Cargar Vector
              </button>

              {/* Input file oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && handleCargarVector) {
                    handleCargarVector(pedido, file);
                  }
                  // Limpiar el input
                  e.target.value = '';
                }}
              />
            </>
          )}

          {tipo === 'vector' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => handlePrevisualizar(pedido)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  border: 'none',
                  color: 'black',
                  height: '32px',
                  fontWeight: '500',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 100%)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  e.target.style.transform = 'translateY(0)';
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
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  border: 'none',
                  color: 'black',
                  height: '32px',
                  fontWeight: '500',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 100%)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <Download style={{ width: '12px', height: '12px' }} />
                Descargar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VectorizacionCard;