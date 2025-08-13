import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Search, 
  Package, 
  User, 
  Calendar,
  Ruler,
  Clock,
  ArrowRight,
  Check,
  Trash2
} from 'lucide-react';
import { useProgramas } from '../../hooks/useProgramas';
import SVGPreview from '../ui/SVGPreview';
import './AddPedidosModal.css';

const AddPedidosModal = ({ isOpen, onClose, programa, onPedidosUpdated, publicUrl }) => {
  const { 
    obtenerPedidosDisponibles, 
    obtenerPedidosPrograma,
    agregarPedidoAPrograma, 
    removerPedidoDePrograma 
  } = useProgramas();
  
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [pedidosEnPrograma, setPedidosEnPrograma] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [selectedPedidos, setSelectedPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && programa) {
      cargarPedidos();
    }
  }, [isOpen, programa]);

  const cargarPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [disponibles, enPrograma] = await Promise.all([
        obtenerPedidosDisponibles(programa.maquina),
        obtenerPedidosPrograma(programa.id_programa)
      ]);
      setPedidosDisponibles(disponibles);
      setPedidosEnPrograma(enPrograma);
    } catch (err) {
      console.error('Error cargando pedidos:', err);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const pedidosFiltrados = pedidosDisponibles.filter(pedido =>
    pedido.disenio?.toLowerCase().includes(busqueda.toLowerCase()) ||
    pedido.clientes?.nombre_cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
    pedido.clientes?.apellido_cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
    pedido.id_pedido.toString().includes(busqueda)
  );

  const handleSelectPedido = (pedido) => {
    setSelectedPedidos(prev => {
      const isSelected = prev.find(p => p.id_pedido === pedido.id_pedido);
      if (isSelected) {
        return prev.filter(p => p.id_pedido !== pedido.id_pedido);
      } else {
        return [...prev, pedido];
      }
    });
  };

  const handleAgregarSeleccionados = async () => {
    setLoading(true);
    try {
      await Promise.all(
        selectedPedidos.map(pedido => 
          agregarPedidoAPrograma(pedido.id_pedido, programa.id_programa)
        )
      );
      
      setSelectedPedidos([]);
      await cargarPedidos();
      
      // Solo llamar onPedidosUpdated cuando el usuario cierre el modal
      // No llamarlo aquí para evitar que se cierre automáticamente
    } catch (err) {
      console.error('Error agregando pedidos:', err);
      setError('Error al agregar pedidos al programa');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverPedido = async (pedidoId) => {
    setLoading(true);
    try {
      await removerPedidoDePrograma(pedidoId);
      await cargarPedidos();
      
      // Solo llamar onPedidosUpdated cuando el usuario cierre el modal
      // No llamarlo aquí para evitar que se cierre automáticamente
    } catch (err) {
      console.error('Error removiendo pedido:', err);
      setError('Error al remover pedido del programa');
    } finally {
      setLoading(false);
    }
  };

  const calcularTiempoTotal = () => {
    return pedidosEnPrograma.reduce((total, pedido) => total + (pedido.tiempo_estimado || 0), 0);
  };

  const calcularLargosPlanchuelas = () => {
    const largos = {
      63: 0,
      38: 0,
      25: 0,
      19: 0,
      12: 0
    };
    
    pedidosEnPrograma.forEach(pedido => {
      if (pedido.tipo_planchuela && pedido.largo_planchuela) {
        const tipo = pedido.tipo_planchuela;
        if (largos.hasOwnProperty(tipo)) {
          largos[tipo] += pedido.largo_planchuela;
        }
      }
    });
    
    return largos;
  };

  const formatearTiempo = (minutos) => {
    if (!minutos) return '0 min';
    return `${minutos} min`;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };



  if (!isOpen || !programa) return null;

  // Nuevo bloque reutilizable para datos del pedido, con mejor jerarquía visual
  const DatosPedido = ({ pedido }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: 2 }}>
      {pedido.fecha_compra && (
        <div style={{ color: '#a1a1aa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar style={{ width: 15, height: 15 }} />
          <span><b>Fecha:</b> {formatearFecha(pedido.fecha_compra)}</span>
        </div>
      )}
      {pedido.tipo_planchuela && (
        <div style={{ color: '#a1a1aa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Package style={{ width: 15, height: 15 }} />
          <span><b>Tipo Planchuela:</b> {pedido.tipo_planchuela}</span>
        </div>
      )}
      {pedido.medida_real && (
        <div style={{ color: '#a1a1aa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Ruler style={{ width: 15, height: 15 }} />
          <span><b>Medida Real:</b> {pedido.medida_real} cm</span>
        </div>
      )}
      {pedido.largo_planchuela && (
        <div style={{ color: '#a1a1aa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span><b>Largo Planchuela:</b> {pedido.largo_planchuela} cm</span>
        </div>
      )}
      {pedido.estado_fabricacion && (
        <div style={{ color: pedido.estado_fabricacion === 'prioridad' ? '#f59e0b' : pedido.estado_fabricacion === 'rehacer' ? '#ef4444' : '#a1a1aa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: pedido.estado_fabricacion === 'prioridad' ? 'bold' : 'normal', textTransform: 'capitalize' }}>
          <span><b>Estado:</b> {pedido.estado_fabricacion === 'prioridad' ? '★ ' : pedido.estado_fabricacion === 'rehacer' ? '⟳ ' : pedido.estado_fabricacion === 'sin hacer' ? '● ' : ''}{pedido.estado_fabricacion}</span>
        </div>
      )}
    </div>
  );

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
        maxWidth: '1200px', 
        width: '100%', 
        height: '90vh',
        margin: '0 16px', 
        background: 'rgba(9, 9, 11, 0.95)', 
        backdropFilter: 'blur(24px)', 
        border: '1px solid rgba(39, 39, 42, 0.5)', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', 
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '600px'
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
              <Plus style={{ width: '20px', height: '20px', color: 'black' }} />
            </div>
            <div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '300', 
                letterSpacing: '-0.025em', 
                color: 'white', 
                margin: 0 
              }}>
                Gestionar Pedidos
              </h2>
              <p style={{ 
                fontSize: '14px', 
                color: '#a1a1aa', 
                margin: '4px 0 0 0' 
              }}>
                Programa #{programa.id_programa} - Máquina {programa.maquina}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              // Llamar onPedidosUpdated cuando el usuario cierre el modal
              if (onPedidosUpdated) {
                onPedidosUpdated();
              }
              onClose();
            }}
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
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Pedidos disponibles */}
          <div 
            className="pedidos-column"
            style={{
              padding: '24px',
              borderRight: '1px solid rgba(39, 39, 42, 0.5)'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '500', 
                color: 'white', 
                margin: '0 0 12px 0' 
              }}>
                Pedidos Disponibles
              </h3>
              <div style={{ position: 'relative' }}>
                <Search style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#a1a1aa'
                }} />
                <input
                  type="text"
                  placeholder="Buscar pedidos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(39, 39, 42, 0.5)',
                    border: '1px solid rgba(63, 63, 70, 0.5)',
                    borderRadius: '8px',
                    padding: '8px 12px 8px 40px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {selectedPedidos.length > 0 && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#60a5fa', fontSize: '14px' }}>
                  {selectedPedidos.length} pedido{selectedPedidos.length > 1 ? 's' : ''} seleccionado{selectedPedidos.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={handleAgregarSeleccionados}
                  disabled={loading}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <ArrowRight style={{ width: '12px', height: '12px' }} />
                  Agregar
                </button>
              </div>
            )}

            <div className="pedidos-scroll-container">
              {loading ? (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  padding: '40px',
                  color: '#a1a1aa' 
                }}>
                  Cargando...
                </div>
              ) : pedidosFiltrados.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#a1a1aa' 
                }}>
                  {busqueda ? 'No se encontraron pedidos' : 'No hay pedidos disponibles'}
                </div>
              ) : (
                pedidosFiltrados.map(pedido => {
                  const isSelected = selectedPedidos.find(p => p.id_pedido === pedido.id_pedido);
                  return (
                    <div
                      key={pedido.id_pedido}
                      onClick={() => handleSelectPedido(pedido)}
                      style={{
                        background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(39, 39, 42, 0.5)',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(63, 63, 70, 0.5)',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.target.style.background = 'rgba(63, 63, 70, 0.5)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                        }
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px',
                        marginBottom: '8px'
                      }}>
                        {/* Preview del vector */}
                        <SVGPreview
                          vectorUrl={pedido.archivo_vector ? publicUrl(pedido.archivo_vector) : null}
                          size={90}
                          backgroundColor="white"
                        />
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            marginBottom: '6px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '3px',
                                border: isSelected ? '2px solid #3b82f6' : '2px solid rgba(63, 63, 70, 0.5)',
                                background: isSelected ? '#3b82f6' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {isSelected && <Check style={{ width: '10px', height: '10px', color: 'white' }} />}
                              </div>
                              <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                                #{pedido.id_pedido}
                              </span>
                            </div>
                            {pedido.tiempo_estimado && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#a1a1aa',
                                fontSize: '11px',
                                flexShrink: 0
                              }}>
                                <Clock style={{ width: '10px', height: '10px' }} />
                                {formatearTiempo(pedido.tiempo_estimado)}
                              </div>
                            )}
                          </div>
                          
                          <div style={{ marginBottom: '4px' }}>
                            <div style={{ 
                              color: 'white', 
                              fontSize: '12px', 
                              marginBottom: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              <b>{pedido.disenio}</b>
                            </div>
                            <DatosPedido pedido={pedido} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pedidos en el programa */}
          <div 
            className="pedidos-column"
            style={{
              padding: '24px'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px' 
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '500', 
                  color: 'white', 
                  margin: 0
                }}>
                  En este Programa
                </h3>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: '#a1a1aa',
                  fontSize: '12px'
                }}>
                  <Package style={{ width: '12px', height: '12px' }} />
                  {pedidosEnPrograma.length} pedidos
                </div>
              </div>
              
              {pedidosEnPrograma.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Tiempo total */}
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Clock style={{ width: '12px', height: '12px', color: '#10b981' }} />
                    <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '500' }}>
                      Tiempo total: {formatearTiempo(calcularTiempoTotal())}
                    </span>
                  </div>
                  
                  {/* Largos de planchuelas */}
                  {(() => {
                    const largos = calcularLargosPlanchuelas();
                    const largosConValor = Object.entries(largos).filter(([tipo, largo]) => largo > 0);
                    
                    if (largosConValor.length > 0) {
                      return (
                        <div style={{
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '6px',
                          padding: '8px 12px'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            marginBottom: '4px'
                          }}>
                            <Package style={{ width: '12px', height: '12px', color: '#3b82f6' }} />
                            <span style={{ color: '#3b82f6', fontSize: '12px', fontWeight: '500' }}>
                              Planchuelas utilizadas:
                            </span>
                          </div>
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}>
                            {largosConValor.map(([tipo, largo]) => (
                              <div key={tipo} style={{
                                background: 'rgba(59, 130, 246, 0.2)',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                color: '#3b82f6',
                                fontWeight: '500'
                              }}>
                                {tipo}mm: {largo.toFixed(1)} cm
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>

            <div className="pedidos-scroll-container">
              {pedidosEnPrograma.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#a1a1aa',
                  border: '2px dashed rgba(63, 63, 70, 0.5)',
                  borderRadius: '8px'
                }}>
                  <Package style={{ width: '24px', height: '24px', margin: '0 auto 8px' }} />
                  <div>No hay pedidos en este programa</div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                    Selecciona pedidos de la izquierda para agregarlos
                  </div>
                </div>
              ) : (
                pedidosEnPrograma.map(pedido => (
                  <div
                    key={pedido.id_pedido}
                    style={{
                      background: 'rgba(39, 39, 42, 0.5)',
                      border: '1px solid rgba(63, 63, 70, 0.5)',
                      borderRadius: '8px',
                      padding: '12px',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      {/* Preview del vector */}
                      <SVGPreview
                        vectorUrl={pedido.archivo_vector ? publicUrl(pedido.archivo_vector) : null}
                        size={90}
                        backgroundColor="white"
                      />
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          marginBottom: '6px'
                        }}>
                          <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                            #{pedido.id_pedido}
                          </span>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {pedido.tiempo_estimado && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#a1a1aa',
                                fontSize: '11px'
                              }}>
                                <Clock style={{ width: '10px', height: '10px' }} />
                                {formatearTiempo(pedido.tiempo_estimado)}
                              </div>
                            )}
                            <button
                              onClick={() => handleRemoverPedido(pedido.id_pedido)}
                              disabled={loading}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                padding: '2px',
                                borderRadius: '4px',
                                opacity: loading ? 0.5 : 1,
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!loading) {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!loading) {
                                  e.target.style.background = 'transparent';
                                }
                              }}
                            >
                              <Trash2 style={{ width: '12px', height: '12px' }} />
                            </button>
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '4px' }}>
                          <div style={{ 
                            color: 'white', 
                            fontSize: '12px', 
                            marginBottom: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {pedido.disenio}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            color: '#a1a1aa', 
                            fontSize: '11px' 
                          }}>
                            <User style={{ width: '9px', height: '9px' }} />
                            <span style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {pedido.clientes?.nombre_cliente} {pedido.clientes?.apellido_cliente}
                            </span>
                          </div>
                        </div>

                        {/* Reemplazar el bloque de datos en ambas tarjetas por <DatosPedido pedido={pedido} /> */}
                        <DatosPedido pedido={pedido} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            padding: '12px 24px',
            color: '#fca5a5',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Footer con botón de cerrar */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(39, 39, 42, 0.5)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => {
              // Llamar onPedidosUpdated cuando el usuario cierre el modal
              if (onPedidosUpdated) {
                onPedidosUpdated();
              }
              onClose();
            }}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#3b82f6';
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};



export default AddPedidosModal;