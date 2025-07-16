import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import AddPedidoModal from '../components/Pedidos/AddPedidoModal';
import VerificarMedidaModal from '../components/Pedidos/VerificarMedidaModal';
import PedidoRow from '../components/Pedidos/PedidoRow';
import PageHeader from '../components/PageHeader';
import { PedidoContextMenu, EditContextMenu } from '../components/PedidoContextMenus';
import { Table, TableHeader, TableHeaderCell } from '../components/ui/Table';
import { usePedidosState } from '../hooks/usePedidosState';
import { usePedidosApi } from '../hooks/usePedidosApi';
import { getEstadoStyle } from '../utils/pedidosUtils';
import { ESTADOS_FABRICACION, ESTADOS_VENTA, ESTADOS_ENVIO } from '../constants/estadosConstants';
import './PedidosPage.css';
import { useVerificacionMedidas } from '../hooks/useVerificacionMedidas';
import { useMultiSort } from '../hooks/useMultiSort';
import SortModal from '../components/ui/SortModal';
import { ArrowUpDown } from 'lucide-react';
import { useGuardarVistaUsuario, cargarVistaUsuario, guardarVistaUsuario } from '../hooks/useGuardarVistaUsuario';
import { useAuth } from '../hooks/useAuth';
import SortPopover from '../components/ui/SortPopover';
import { useTareasPendientes } from '../hooks/useTareasPendientes';
console.log('*** PedidosPage importó useGuardarVistaUsuario ***', useGuardarVistaUsuario);

const ESTADOS_FABRICACION_DEFAULT = [
  'Sin Hacer', 'Haciendo', 'Rehacer', 'Retocar', 'Prioridad', 'Verificar', 'Hecho'
];

function PedidosPage() {
  const [verificarMedidaModal, setVerificarMedidaModal] = useState({ isOpen: false, pedido: null });
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [configCargada, setConfigCargada] = useState(false);
  const [sortAplicado, setSortAplicado] = useState(false);
  const [ordenEstadosFabricacion, setOrdenEstadosFabricacion] = useState(ESTADOS_FABRICACION_DEFAULT);
  const verificacionMedidas = useVerificacionMedidas();
  const multiSort = useMultiSort([]);
  const state = usePedidosState();
  const {
    pedidos, loading, error, searchTerm, setSearchTerm, debouncedSearchTerm, setDebouncedSearchTerm,
    showFilterPanel, setShowFilterPanel, filters, setFilters, debouncedFilters, setDebouncedFilters,
    filterOptions, isModalOpen, setIsModalOpen, editingId, editForm, contextMenu, setContextMenu,
    editContextMenu, setEditContextMenu, onClearFilters
  } = state;

  const api = usePedidosApi({
    sortOrder: state.sortOrder, debouncedSearchTerm, debouncedFilters, editForm, editingId,
    setPedidos: state.setPedidos, setLoading: state.setLoading, setError: state.setError,
    setFilterOptions: state.setFilterOptions, setEditingId: state.setEditingId,
    setEditForm: state.setEditForm, setContextMenu, sortCriteria: multiSort.sortCriteria
  });

  // API optimista que envuelve las funciones originales
  const apiOptimistic = {
    ...api,
    saveEdit: async (id) => {
      await handleSaveEditOptimistic(id, editForm);
      state.setEditingId(null);
      state.setEditForm({});
    }
  };

  const { user, loading: authLoading } = useAuth();
  const [showSortPopover, setShowSortPopover] = useState(false);
  const sortButtonRef = useRef();
  
  // Hook para tareas pendientes
  const tareasPendientes = useTareasPendientes();

  // Effects
  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timerId);
  }, [searchTerm, setDebouncedSearchTerm]);

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timerId);
  }, [filters, setDebouncedFilters]);

  useEffect(() => {
    api.getPedidos();
    // Return cleanup function
    return () => {};
  }, []); // Solo ejecutar al montar el componente

  // Actualizar pedidos cuando cambien los filtros o búsqueda
  useEffect(() => {
    apiOptimistic.getPedidos();
  }, [debouncedSearchTerm, debouncedFilters, state.sortOrder, apiOptimistic.getPedidos]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0, pedidoId: null });
      setEditContextMenu({ visible: false, x: 0, y: 0 });
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [setContextMenu, setEditContextMenu]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingId) {
        if (e.key === 'Escape') apiOptimistic.cancelEdit();
        else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) apiOptimistic.saveEdit(editingId);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingId, apiOptimistic.cancelEdit, apiOptimistic.saveEdit]);

  useEffect(() => {
    if (!editingId) return () => {}; // Return empty cleanup function
    const handleDblClick = (e) => {
      const table = document.querySelector('.table-container');
      if (table && !table.contains(e.target)) apiOptimistic.saveEdit(editingId);
    };
    document.addEventListener('dblclick', handleDblClick);
    return () => document.removeEventListener('dblclick', handleDblClick);
  }, [editingId, apiOptimistic.saveEdit]);

  // Handlers
  const handleRowRightClick = (e, pedidoId) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, pedidoId });
  };

  const handleEditRowRightClick = (e) => {
    e.preventDefault();
    setEditContextMenu({ visible: true, x: e.pageX, y: e.pageY });
  };

  const handlePedidoAdded = (pedidoCreado) => {
    apiOptimistic.handlePedidoAdded();
    setIsModalOpen(false);
    
    // Si el pedido tiene vector y medida, abrir modal de verificación automáticamente
    if (pedidoCreado && pedidoCreado.archivo_vector && pedidoCreado.medida_pedida) {
      setTimeout(() => {
        setVerificarMedidaModal({ isOpen: true, pedido: pedidoCreado });
      }, 500); // Pequeño delay para que se cierre el modal anterior
    }
  };

  const handleVerificarMedida = (pedido) => {
    setVerificarMedidaModal({ isOpen: true, pedido });
  };

  const handleCloseVerificarMedida = () => {
    setVerificarMedidaModal({ isOpen: false, pedido: null });
  };

  const handleMedidaVerificada = (pedido) => {
    // Actualizar la lista de pedidos
    apiOptimistic.getPedidos();
    handleCloseVerificarMedida();
  };

  // Campos disponibles para ordenamiento en pedidos
  const sortFields = [
    { value: 'fecha_compra', label: 'Fecha de compra' },
    { value: 'estado_fabricacion', label: 'Estado de fabricación' },
    { value: 'estado_venta', label: 'Estado de venta' },
    { value: 'estado_envio', label: 'Estado de envío' }
  ];

  const handleApplySort = () => {
    apiOptimistic.getPedidos();
    setSortAplicado(true);
  };

  // Función para actualizaciones optimistas de estados
  const handleEstadoChangeOptimistic = async (pedido, campo, valor) => {
    try {
      // Actualización optimista: cambiar inmediatamente en la UI
      state.setPedidos(prevPedidos => {
        const updatedPedidos = prevPedidos.map(p => 
          p.id_pedido === pedido.id_pedido 
            ? { ...p, [campo]: valor }
            : p
        );
        
        // Re-aplicar ordenamiento local
        return aplicarOrdenamientoLocal(updatedPedidos);
      });
      
      // Actualizar en BD en segundo plano
      const pedidoFields = {
        p_id: pedido.id_pedido,
        p_estado_fabricacion: campo === 'estado_fabricacion' ? valor : pedido.estado_fabricacion,
        p_estado_venta: campo === 'estado_venta' ? valor : pedido.estado_venta,
        p_estado_envio: campo === 'estado_envio' ? valor : pedido.estado_envio,
      };
      await supabase.rpc('editar_pedido', pedidoFields);
      
    } catch (error) {
      // Si hay error, revertir el cambio optimista
      console.error('Error al actualizar el estado:', error);
      alert('Error al actualizar el estado');
      // Refrescar para asegurar consistencia
      apiOptimistic.getPedidos();
    }
  };

  // Función optimista para guardar ediciones
  const handleSaveEditOptimistic = async (id, editForm) => {
    try {
      // Actualización optimista: cambiar inmediatamente en la UI
      state.setPedidos(prevPedidos => {
        const updatedPedidos = prevPedidos.map(p => {
          if (p.id_pedido === id) {
            return {
              ...p,
              fecha_compra: editForm.fecha_compra,
              valor_sello: editForm.valor_sello ? parseFloat(editForm.valor_sello) : null,
              valor_envio: editForm.valor_envio ? parseFloat(editForm.valor_envio) : null,
              valor_senia: editForm.valor_senia ? parseFloat(editForm.valor_senia) : 0,
              estado_fabricacion: editForm.estado_fabricacion,
              estado_venta: editForm.estado_venta,
              estado_envio: editForm.estado_envio,
              notas: editForm.notas,
              disenio: editForm.disenio,
              archivo_base: editForm.archivo_base,
              archivo_vector: editForm.archivo_vector,
              foto_sello: editForm.foto_sello,
              medida_pedida: editForm.medida_pedida || null,
              numero_seguimiento: editForm.numero_seguimiento,
              clientes: {
                ...p.clientes,
                nombre_cliente: editForm.nombre_cliente,
                apellido_cliente: editForm.apellido_cliente,
                telefono_cliente: editForm.telefono_cliente,
                medio_contacto: editForm.medio_contacto,
              }
            };
          }
          return p;
        });
        
        // Re-aplicar ordenamiento local
        return aplicarOrdenamientoLocal(updatedPedidos);
      });
      
      // Actualizar en BD en segundo plano
      const clienteFields = {
        p_id_pedido: id,
        p_nombre_cliente: editForm.nombre_cliente,
        p_apellido_cliente: editForm.apellido_cliente,
        p_telefono_cliente: editForm.telefono_cliente,
        p_medio_contacto: editForm.medio_contacto,
      };

      const pedidoFields = {
        p_id: id,
        p_fecha_compra: editForm.fecha_compra,
        p_valor_sello: editForm.valor_sello ? parseFloat(editForm.valor_sello) : null,
        p_valor_envio: editForm.valor_envio ? parseFloat(editForm.valor_envio) : null,
        p_valor_senia: editForm.valor_senia ? parseFloat(editForm.valor_senia) : 0,
        p_estado_fabricacion: editForm.estado_fabricacion,
        p_estado_venta: editForm.estado_venta,
        p_estado_envio: editForm.estado_envio,
        p_notas: editForm.notas,
        p_disenio: editForm.disenio,
        p_archivo_base: editForm.archivo_base,
        p_archivo_vector: editForm.archivo_vector,
        p_foto_sello: editForm.foto_sello,
        p_medida_pedida: editForm.medida_pedida || null,
        p_numero_seguimiento: editForm.numero_seguimiento,
      };

      const [clienteResult, pedidoResult] = await Promise.all([
        supabase.rpc('editar_cliente', clienteFields),
        supabase.rpc('editar_pedido', pedidoFields)
      ]);

      if (clienteResult.error) {
        throw new Error('Error al actualizar cliente: ' + clienteResult.error.message);
      }

      if (pedidoResult.error) {
        throw new Error('Error al actualizar pedido: ' + pedidoResult.error.message);
      }
      
    } catch (error) {
      // Si hay error, revertir el cambio optimista
      console.error('Error al guardar edición:', error);
      alert('Error al guardar los cambios: ' + error.message);
      // Refrescar para asegurar consistencia
      apiOptimistic.getPedidos();
    }
  };

  const publicUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;
    return `${supabase.supabaseUrl}/storage/v1/object/public/archivos-ventas/${filePath}`;
  };

  // Cargar configuración de vista al montar
  useEffect(() => {
    if (!user || authLoading) return;
    async function fetchVista() {
      const config = await cargarVistaUsuario('pedidos', user);
      if (config) {
        setFilters(config.filtros || {});
        if (config.orden && Array.isArray(config.orden) && multiSort && multiSort.setSortCriteria) {
          multiSort.setSortCriteria(config.orden);
        }
        if (config.ordenEstadosFabricacion && Array.isArray(config.ordenEstadosFabricacion)) {
          setOrdenEstadosFabricacion(config.ordenEstadosFabricacion);
        }
      }
      setConfigCargada(true);
    }
    fetchVista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Guardar la vista solo cuando se aplican los filtros (debouncedFilters cambia, pero no en cada input)
  useEffect(() => {
    if (configCargada && user) {
      // Limpiar sortCriteria para evitar referencias circulares
      const ordenLimpio = Array.isArray(multiSort.sortCriteria) 
        ? multiSort.sortCriteria.map(c => ({ field: c.field, order: c.order }))
        : [];
        
      guardarVistaUsuario(user, 'pedidos', {
        filtros: debouncedFilters,
        orden: ordenLimpio,
        ordenEstadosFabricacion
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters, ordenEstadosFabricacion]);

  // Guardar la vista solo cuando se aplica el sort
  useEffect(() => {
    if (sortAplicado && configCargada && user) {
      // Limpiar sortCriteria para evitar referencias circulares
      const ordenLimpio = Array.isArray(multiSort.sortCriteria) 
        ? multiSort.sortCriteria.map(c => ({ field: c.field, order: c.order }))
        : [];
        
      guardarVistaUsuario(user, 'pedidos', {
        filtros: filters,
        orden: ordenLimpio,
        ordenEstadosFabricacion
      });
      setSortAplicado(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortAplicado, ordenEstadosFabricacion]);

  // Función helper para aplicar ordenamiento local
  const aplicarOrdenamientoLocal = (pedidos) => {
    if (multiSort.sortCriteria.length === 0) return pedidos;
    
    return [...pedidos].sort((a, b) => {
      // Aplicar todos los criterios de ordenamiento en orden de prioridad
      for (const criterio of multiSort.sortCriteria) {
        let comparison = 0;
        
        switch (criterio.field) {
          case 'fecha_compra':
            const dateA = new Date(a.fecha_compra);
            const dateB = new Date(b.fecha_compra);
            comparison = dateA - dateB;
            break;
            
          case 'estado_fabricacion':
            const idxA = ordenEstadosFabricacion.indexOf(a.estado_fabricacion);
            const idxB = ordenEstadosFabricacion.indexOf(b.estado_fabricacion);
            comparison = (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
            break;
            
          case 'estado_venta':
            const valA = a.estado_venta || '';
            const valB = b.estado_venta || '';
            comparison = valA.localeCompare(valB);
            break;
            
          case 'estado_envio':
            const envA = a.estado_envio || '';
            const envB = b.estado_envio || '';
            comparison = envA.localeCompare(envB);
            break;
            
          default:
            const fieldA = a[criterio.field] || '';
            const fieldB = b[criterio.field] || '';
            comparison = fieldA.localeCompare(fieldB);
            break;
        }
        
        // Si hay diferencia, aplicar la dirección del ordenamiento y retornar
        if (comparison !== 0) {
          return criterio.order === 'asc' ? comparison : -comparison;
        }
      }
      
      // Si todos los criterios son iguales, mantener el orden original
      return 0;
    });
  };

  // Ordenar los pedidos según los criterios seleccionados
  const pedidosOrdenados = aplicarOrdenamientoLocal(pedidos);

  return (
    <div style={{
      background: 'black', minHeight: '100vh', color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <PageHeader
        pedidos={pedidos} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        showFilterPanel={showFilterPanel} setShowFilterPanel={setShowFilterPanel}
        filters={filters} setFilters={setFilters} filterOptions={{ ...filterOptions, estado_fabricacion: ordenEstadosFabricacion }}
        onClearFilters={onClearFilters} setIsModalOpen={setIsModalOpen}
        showSortPopover={showSortPopover}
        setShowSortPopover={setShowSortPopover}
        sortCriteria={multiSort.sortCriteria}
        ordenPopover={showSortPopover && (
          <SortPopover
            anchorRef={sortButtonRef}
            onClose={() => setShowSortPopover(false)}
            fields={sortFields}
            sortCriteria={multiSort.sortCriteria}
            addSortCriterion={multiSort.addSortCriterion}
            removeSortCriterion={multiSort.removeSortCriterion}
            updateSortCriterionField={multiSort.updateSortCriterionField}
            updateSortCriterionOrder={multiSort.updateSortCriterionOrder}
            moveCriterionUp={multiSort.moveCriterionUp}
            moveCriterionDown={multiSort.moveCriterionDown}
            clearSortCriteria={multiSort.clearSortCriteria}
            onApply={() => { handleApplySort(); setShowSortPopover(false); }}
            ordenEstadosFabricacion={ordenEstadosFabricacion}
            setOrdenEstadosFabricacion={setOrdenEstadosFabricacion}
          />
        )}
      />

      <AddPedidoModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        onPedidoAdded={handlePedidoAdded} filterOptions={filterOptions}
      />

      <VerificarMedidaModal
        pedido={verificarMedidaModal.pedido}
        isOpen={verificarMedidaModal.isOpen}
        onClose={handleCloseVerificarMedida}
        onVerified={handleMedidaVerificada}
        publicUrl={publicUrl}
        // Pasar los métodos y estados del hook como props
        loading={verificacionMedidas.loading}
        error={verificacionMedidas.error}
        dimensionesSVG={verificacionMedidas.dimensionesSVG}
        opcionesEscalado={verificacionMedidas.opcionesEscalado}
        medirVector={verificacionMedidas.medirVector}
        aplicarMedida={verificacionMedidas.aplicarMedida}
        limpiarEstado={verificacionMedidas.limpiarEstado}
        setError={verificacionMedidas.setError}
      />

      <PedidoContextMenu
        contextMenu={contextMenu} pedidos={pedidos} startEdit={apiOptimistic.startEdit}
        handleEliminar={apiOptimistic.handleEliminar}
      />

      <EditContextMenu
        editContextMenu={editContextMenu} saveEdit={apiOptimistic.saveEdit} cancelEdit={apiOptimistic.cancelEdit}
        editingId={editingId} setEditContextMenu={setEditContextMenu}
      />

      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '32px' }}>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Fecha</TableHeaderCell>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>Diseño</TableHeaderCell>
              <TableHeaderCell>Contacto</TableHeaderCell>
              <TableHeaderCell>Seña/Envío</TableHeaderCell>
              <TableHeaderCell>Valor</TableHeaderCell>
              <TableHeaderCell style={{ minWidth: '220px' }}>Estado</TableHeaderCell>
              <TableHeaderCell align="center">Base</TableHeaderCell>
              <TableHeaderCell align="center">Vector</TableHeaderCell>
              <TableHeaderCell align="center">F Sello</TableHeaderCell>
              <TableHeaderCell>Seguimiento</TableHeaderCell>
            </tr>
          </TableHeader>
          <tbody>
            {loading ? (
              <tr><td colSpan="11" className="table-loading">Cargando...</td></tr>
            ) : error ? (
              <tr><td colSpan="11" className="table-error">Error: {error}</td></tr>
            ) : pedidosOrdenados.length > 0 ? (
              pedidosOrdenados.map((pedido) => {
                // Crear una ref para el modal de agregar tarea
                if (!pedido.addTareaModalRef) {
                  pedido.addTareaModalRef = React.createRef();
                }
                return (
                  <PedidoRow
                    key={pedido.id_pedido} pedido={pedido} editing={editingId === pedido.id_pedido}
                    editForm={editForm} handleEditFormChange={apiOptimistic.handleEditFormChange}
                    handleEditRowRightClick={handleEditRowRightClick} handleRowRightClick={handleRowRightClick}
                    startEdit={apiOptimistic.startEdit} getEstadoStyle={getEstadoStyle} handlePedidoAdded={handlePedidoAdded}
                    handleEliminarArchivo={apiOptimistic.handleEliminarArchivo} supabase={supabase} getPedidos={apiOptimistic.getPedidos}
                    ESTADOS_FABRICACION={ordenEstadosFabricacion} ESTADOS_VENTA={ESTADOS_VENTA}
                    ESTADOS_ENVIO={ESTADOS_ENVIO} setEditForm={state.setEditForm} editingId={editingId}
                    tareasPendientes={tareasPendientes.tareas}
                    onCreateTarea={tareasPendientes.crearTarea}
                    onUpdateTareaPosition={tareasPendientes.actualizarPosicionTarea}
                    onCompleteTarea={tareasPendientes.completarTarea}
                    onDeleteTarea={tareasPendientes.eliminarTarea}
                    addTareaModalRef={pedido.addTareaModalRef}
                    handleEstadoChangeOptimistic={handleEstadoChangeOptimistic}
                  />
                );
              })
            ) : (
              <tr><td colSpan="11" className="table-empty">No se encontraron pedidos.</td></tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default PedidosPage;

// TODO: ✅ Hook useMultiSort creado
// TODO: ✅ Componente SortModal creado  
// TODO: ✅ Integrado en PedidosPage.jsx
// TODO: ✅ Integrado en ProduccionPage.jsx
// TODO: ✅ Función RPC modificada para ordenamiento múltiple