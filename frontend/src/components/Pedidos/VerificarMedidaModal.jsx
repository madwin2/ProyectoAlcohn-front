import React, { useEffect } from 'react';
import { Ruler, X, AlertCircle } from 'lucide-react';

const VerificarMedidaModal = ({ 
  pedido, 
  isOpen, 
  onClose, 
  onVerified,
  publicUrl,
  loading,
  error,
  dimensionesSVG,
  opcionesEscalado,
  medirVector,
  aplicarMedida,
  limpiarEstado,
  setError
}) => {

  useEffect(() => {
    if (isOpen && pedido?.archivo_vector) {
      const vectorUrl = publicUrl(pedido.archivo_vector);
      medirVector(vectorUrl, pedido.medida_pedida);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pedido?.archivo_vector, pedido?.medida_pedida]);

  useEffect(() => {
    if (!isOpen) {
      limpiarEstado();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSeleccionarMedida = async (medidaReal) => {
    try {
      const vectorUrl = publicUrl(pedido.archivo_vector);
      const resultado = await aplicarMedida(vectorUrl, medidaReal, pedido.id_pedido);
      
      if (onVerified) {
        onVerified({
          ...pedido,
          archivo_vector: resultado.nuevaUrl,
          medida_real: resultado.medidaReal
        });
      }
      
      onClose();
    } catch (err) {
      // El error ya se maneja en el hook
      console.error('Error en handleSeleccionarMedida:', err);
    }
  };

  if (!isOpen || !pedido) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0, 0, 0, 0.8)', 
      backdropFilter: 'blur(8px)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 50 
    }}>
      <div style={{ 
        maxWidth: '1024px', 
        width: '100%', 
        margin: '0 16px', 
        background: 'rgba(9, 9, 11, 0.98)', 
        backdropFilter: 'blur(24px)', 
        border: '1px solid rgba(39, 39, 42, 0.5)', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', 
        borderRadius: '12px',
        maxHeight: '90vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px', 
          borderBottom: '1px solid rgba(39, 39, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'white', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Ruler style={{ width: '20px', height: '20px', color: 'black' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '300', letterSpacing: '-0.025em', color: 'white' }}>
                Verificar Medida
              </div>
              <div style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: '400' }}>
                {pedido.disenio} - Medida pedida: {pedido.medida_pedida}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.3s ease'
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
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          padding: '24px', 
          maxHeight: 'calc(90vh - 140px)', 
          overflowY: 'auto' 
        }}>
          {error && (
            <div style={{
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle style={{ width: '16px', height: '16px' }} />
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '200px',
              color: '#a1a1aa' 
            }}>
              Cargando...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Información del SVG */}
              {dimensionesSVG && (
                <div style={{
                  background: 'rgba(24, 24, 27, 0.5)',
                  border: '1px solid rgba(39, 39, 42, 0.5)',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <h3 style={{ color: 'white', fontSize: '16px', margin: '0 0 12px 0' }}>
                    Información del Vector
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: '#a1a1aa' }}>Dimensiones originales: </span>
                      <span style={{ color: 'white' }}>
                        {Math.round(dimensionesSVG.width)}×{Math.round(dimensionesSVG.height)} mm
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#a1a1aa' }}>Medida pedida: </span>
                      <span style={{ color: 'white' }}>{pedido.medida_pedida}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Opciones de escalado */}
              {opcionesEscalado.length > 0 && (
                <div>
                  <h3 style={{ color: 'white', fontSize: '18px', margin: '0 0 16px 0' }}>
                    Selecciona la medida correcta
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {opcionesEscalado.map((opcion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSeleccionarMedida(opcion.medida)}
                        disabled={loading}
                        style={{
                          background: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '24px',
                          color: 'black',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'center',
                          opacity: loading ? 0.6 : 1,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.target.style.background = '#f3f4f6';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading) {
                            e.target.style.background = 'white';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                          }
                        }}
                      >
                        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                          {opcion.medida} cm
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                          {opcion.label}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '16px', 
                    fontSize: '14px', 
                    color: '#a1a1aa' 
                  }}>
                    Haz clic en la medida que deseas aplicar al vector
                  </div>
                </div>
              )}

              {!pedido.medida_pedida && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle style={{ width: '16px', height: '16px' }} />
                  Este pedido no tiene medida especificada
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificarMedidaModal;