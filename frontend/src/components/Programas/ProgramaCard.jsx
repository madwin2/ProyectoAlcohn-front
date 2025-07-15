import React, { useState, useEffect } from 'react';
import { 
  Computer, 
  Clock, 
  Package, 
  AlertCircle, 
  CheckCircle, 
  Play, 
  Pause,
  RotateCcw,
  Eye,
  Lock,
  Unlock,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Users
} from 'lucide-react';
import { useProgramas } from '../../hooks/useProgramas';
import { useNotification } from '../../hooks/useNotification';
import EditProgramaModal from './EditProgramaModal';
import AddPedidosModal from './AddPedidosModal';
import SVGPreview from '../ui/SVGPreview';

const ProgramaCard = ({ programa, onProgramaUpdated, publicUrl }) => {
  const { actualizarPrograma, actualizarEstadoProgramaConPedidos, eliminarPrograma, eliminarProgramaConPedidos, obtenerPedidosPrograma } = useProgramas();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPedidosModal, setShowPedidosModal] = useState(false);
  const [cantidadPedidos, setCantidadPedidos] = useState(0);
  const [pedidosVectorPreview, setPedidosVectorPreview] = useState([]);

  useEffect(() => {
    cargarCantidadPedidos();
  }, [programa.id_programa]);

  const cargarCantidadPedidos = async () => {
    try {
      const pedidos = await obtenerPedidosPrograma(programa.id_programa);
      setCantidadPedidos(pedidos.length);
      
      // Obtener hasta 3 pedidos con vectores para preview
      const pedidosConVector = pedidos
        .filter(p => p.archivo_vector)
        .slice(0, 3);
      setPedidosVectorPreview(pedidosConVector);
    } catch (error) {
      console.error('Error cargando cantidad de pedidos:', error);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Sin Hacer': return '#6b7280';
      case 'Haciendo': return '#3b82f6';
      case 'Verificar': return '#f59e0b';
      case 'Rehacer': return '#ef4444';
      case 'Hecho': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'Sin Hacer': return <Clock style={{ width: '16px', height: '16px' }} />;
      case 'Haciendo': return <Play style={{ width: '16px', height: '16px' }} />;
      case 'Verificar': return <Eye style={{ width: '16px', height: '16px' }} />;
      case 'Rehacer': return <RotateCcw style={{ width: '16px', height: '16px' }} />;
      case 'Hecho': return <CheckCircle style={{ width: '16px', height: '16px' }} />;
      default: return <Clock style={{ width: '16px', height: '16px' }} />;
    }
  };

  const handleEstadoChange = async (nuevoEstado) => {
    setLoading(true);
    try {
      // Usar la nueva función RPC que actualiza programa y pedidos
      const result = await actualizarEstadoProgramaConPedidos(programa.id_programa, nuevoEstado);
      
      // Mostrar notificación de éxito con información sobre pedidos actualizados
      if (result.pedidos_actualizados > 0) {
        addNotification(
          `Estado actualizado: ${result.pedidos_actualizados} pedidos también actualizados`,
          'success'
        );
      } else {
        addNotification('Estado del programa actualizado', 'success');
      }
      
      onProgramaUpdated();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado del programa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBloqueo = async () => {
    setLoading(true);
    try {
      await actualizarPrograma(programa.id_programa, { 
        programa_bloqueado: !programa.programa_bloqueado 
      });
      onProgramaUpdated();
    } catch (error) {
      console.error('Error actualizando bloqueo:', error);
      alert('Error al actualizar el bloqueo del programa');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerificado = async () => {
    setLoading(true);
    try {
      await actualizarPrograma(programa.id_programa, { 
        verificado: !programa.verificado 
      });
      onProgramaUpdated();
    } catch (error) {
      console.error('Error actualizando verificación:', error);
      alert('Error al actualizar la verificación del programa');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    const mensaje = cantidadPedidos > 0 
      ? `¿Estás seguro de eliminar este programa? Se desasociarán ${cantidadPedidos} pedidos.`
      : '¿Estás seguro de eliminar este programa?';
      
    if (window.confirm(mensaje)) {
      setLoading(true);
      try {
        // Usar la nueva función RPC que desasocia pedidos automáticamente
        const result = await eliminarProgramaConPedidos(programa.id_programa);
        
        // Mostrar notificación de éxito con información sobre pedidos desasociados
        if (result.pedidos_desasociados > 0) {
          addNotification(
            `Programa eliminado: ${result.pedidos_desasociados} pedidos desasociados`,
            'success'
          );
        } else {
          addNotification('Programa eliminado exitosamente', 'success');
        }
        
        onProgramaUpdated();
      } catch (error) {
        console.error('Error eliminando programa:', error);
        alert('Error al eliminar el programa: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePedidosUpdated = () => {
    cargarCantidadPedidos();
    onProgramaUpdated();
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const porcentajeCompletado = programa.limite_tiempo > 0 
    ? Math.min((programa.tiempo_usado / programa.limite_tiempo) * 100, 100)
    : 0;

  return (
    <div style={{
      background: 'rgba(24, 24, 27, 0.5)',
      border: `1px solid ${programa.programa_bloqueado ? '#ef4444' : 'rgba(39, 39, 42, 0.5)'}`,
      borderRadius: '12px',
      padding: '20px',
      position: 'relative',
      transition: 'all 0.3s ease',
      opacity: loading ? 0.7 : 1,
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      if (!loading) {
        e.currentTarget.style.border = `1px solid ${programa.programa_bloqueado ? '#ef4444' : 'rgba(63, 63, 70, 0.8)'}`;
      }
    }}
    onMouseLeave={(e) => {
      if (!loading) {
        e.currentTarget.style.border = `1px solid ${programa.programa_bloqueado ? '#ef4444' : 'rgba(39, 39, 42, 0.5)'}`;
      }
    }}>
      {/* Header con ID y máquina */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: programa.maquina === 'C' ? '#3b82f6' : 
                         programa.maquina === 'G' ? '#10b981' : '#f59e0b',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {programa.maquina}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>
                {/* Mostrar solo el nombre_archivo como título principal */}
                {programa.nombre_archivo}
              </div>
              <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                {formatearFecha(programa.fecha_programa)}
              </div>
            </div>
          </div>
        </div>

        {/* Menú de opciones */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <MoreVertical style={{ width: '16px', height: '16px' }} />
          </button>
          
          {showMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: 'rgba(9, 9, 11, 0.95)',
              border: '1px solid rgba(39, 39, 42, 0.5)',
              borderRadius: '8px',
              padding: '8px',
              zIndex: 10,
              minWidth: '150px'
            }}>
              <button
                onClick={() => {
                  setShowEditModal(true);
                  setShowMenu(false);
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  padding: '8px 12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Edit style={{ width: '14px', height: '14px' }} />
                Editar
              </button>
              <button
                onClick={() => {
                  setShowPedidosModal(true);
                  setShowMenu(false);
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  padding: '8px 12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Users style={{ width: '14px', height: '14px' }} />
                Gestionar Pedidos
              </button>
              <button
                onClick={handleToggleBloqueo}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  padding: '8px 12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {programa.programa_bloqueado ? 
                  <><Unlock style={{ width: '14px', height: '14px' }} /> Desbloquear</> :
                  <><Lock style={{ width: '14px', height: '14px' }} /> Bloquear</>
                }
              </button>
              <button
                onClick={handleEliminar}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  padding: '8px 12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Trash2 style={{ width: '14px', height: '14px' }} />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Información del archivo */}
      {false && programa.nombre_archivo && (
        <div style={{
          background: 'rgba(39, 39, 42, 0.5)',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '14px', color: 'white', fontWeight: '500' }}>
            {programa.nombre_archivo}
          </div>
        </div>
      )}

      {/* Estado actual */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: `${getEstadoColor(programa.estado_programa)}20`,
          color: getEstadoColor(programa.estado_programa),
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {getEstadoIcon(programa.estado_programa)}
          {programa.estado_programa}
        </div>

        {programa.verificado && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#10b98120',
            color: '#10b981',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '500'
          }}>
            <CheckCircle style={{ width: '12px', height: '12px' }} />
            Verificado
          </div>
        )}

        {programa.programa_bloqueado && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#ef444420',
            color: '#ef4444',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '500'
          }}>
            <Lock style={{ width: '12px', height: '12px' }} />
            Bloqueado
          </div>
        )}
        {/* Eliminada la etiqueta azul de cantidad de pedidos aquí */}
      </div>

      {/* Preview de vectores */}
      {pedidosVectorPreview.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#a1a1aa', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Package style={{ width: '10px', height: '10px' }} />
            Vectores en este programa
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '10px', // Aumenta el espacio entre previews
            overflowX: 'auto',
            paddingBottom: '4px'
          }}>
            {pedidosVectorPreview.map(pedido => (
              <div
                key={pedido.id_pedido}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: 'fit-content'
                }}
              >
                <SVGPreview
                  vectorUrl={pedido.archivo_vector ? publicUrl(pedido.archivo_vector) : null}
                  size={56} // Aumentado el tamaño de 32 a 56
                  backgroundColor="rgba(24, 24, 27, 0.8)"
                  borderRadius="4px"
                />
                <span style={{ 
                  fontSize: '10px', // Un poco más grande
                  color: '#a1a1aa',
                  whiteSpace: 'nowrap'
                }}>
                  #{pedido.id_pedido}
                </span>
              </div>
            ))}
            {cantidadPedidos > 3 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '56px', // Aumentado el tamaño
                  height: '56px',
                  background: 'rgba(39, 39, 42, 0.5)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a1a1aa',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  +{cantidadPedidos - 3}
                </div>
                <span style={{ 
                  fontSize: '10px', 
                  color: '#a1a1aa',
                  whiteSpace: 'nowrap'
                }}>
                  más
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información de producción */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
            Cantidad Sellos
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <Package style={{ width: '14px', height: '14px' }} />
            {programa.cantidad_sellos || 0}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
            Tiempo Límite
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <Clock style={{ width: '14px', height: '14px' }} />
            {programa.limite_tiempo} min
          </div>
        </div>
      </div>

      {/* Barra de progreso de tiempo */}
      {programa.limite_tiempo > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          }}>
            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
              Tiempo Usado
            </span>
            <span style={{ fontSize: '12px', color: 'white' }}>
              {programa.tiempo_usado} min / {programa.limite_tiempo} min
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(39, 39, 42, 0.5)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${porcentajeCompletado}%`,
              height: '100%',
              background: porcentajeCompletado > 90 ? '#ef4444' : 
                         porcentajeCompletado > 75 ? '#f59e0b' : '#10b981',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: 'auto'
      }}>
        {/* Cambiar estado */}
        <select
          value={programa.estado_programa}
          onChange={(e) => handleEstadoChange(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            background: 'rgba(39, 39, 42, 0.5)',
            border: '1px solid rgba(63, 63, 70, 0.5)',
            borderRadius: '6px',
            padding: '8px',
            color: 'white',
            fontSize: '12px',
            outline: 'none'
          }}
        >
          <option value="Sin Hacer">Sin Hacer</option>
          <option value="Haciendo">Haciendo</option>
          <option value="Verificar">Verificar</option>
          <option value="Rehacer">Rehacer</option>
        </select>

        {/* Gestionar pedidos */}
        <button
          onClick={() => setShowPedidosModal(true)}
          disabled={loading}
          style={{
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            borderRadius: '6px',
            padding: '8px',
            color: '#3b82f6',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.background = 'rgba(59, 130, 246, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.background = 'rgba(59, 130, 246, 0.2)';
            }
          }}
        >
          <Plus style={{ width: '14px', height: '14px' }} />
        </button>

        {/* Toggle verificado */}
        <button
          onClick={handleToggleVerificado}
          disabled={loading}
          style={{
            background: programa.verificado ? '#10b981' : 'rgba(39, 39, 42, 0.5)',
            border: 'none',
            borderRadius: '6px',
            padding: '8px',
            color: programa.verificado ? 'white' : '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <CheckCircle style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {/* Click away para cerrar menú */}
      {showMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5
          }}
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Modales */}
      <EditProgramaModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        programa={programa}
        onProgramaUpdated={onProgramaUpdated}
      />

      <AddPedidosModal
        isOpen={showPedidosModal}
        onClose={() => setShowPedidosModal(false)}
        programa={programa}
        onPedidosUpdated={handlePedidosUpdated}
        publicUrl={publicUrl}
      />
    </div>
  );
};

export default ProgramaCard;