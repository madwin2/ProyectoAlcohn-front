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
console.log('*** PedidosPage importó useGuardarVistaUsuario ***', useGuardarVistaUsuario);

function PedidosPage() {
  const [verificarMedidaModal, setVerificarMedidaModal] = useState({ isOpen: false, pedido: null });
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [configCargada, setConfigCargada] = useState(false);
  const [sortAplicado, setSortAplicado] = useState(false);
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

  const { user, loading: authLoading } = useAuth();

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
    api.getPedidos();
  }, [debouncedSearchTerm, debouncedFilters, state.sortOrder, api.getPedidos]);

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
        if (e.key === 'Escape') api.cancelEdit();
        else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) api.saveEdit(editingId);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingId, api.cancelEdit, api.saveEdit]);

  useEffect(() => {
    if (!editingId) return () => {}; // Return empty cleanup function
    const handleDblClick = (e) => {
      const table = document.querySelector('.table-container');
      if (table && !table.contains(e.target)) api.saveEdit(editingId);
    };
    document.addEventListener('dblclick', handleDblClick);
    return () => document.removeEventListener('dblclick', handleDblClick);
  }, [editingId, api.saveEdit]);

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
    api.handlePedidoAdded();
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
    api.getPedidos();
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
    api.getPedidos();
    setSortAplicado(true);
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
      }
      setConfigCargada(true);
    }
    fetchVista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Guardar la vista solo cuando se aplican los filtros (debouncedFilters cambia, pero no en cada input)
  useEffect(() => {
    if (configCargada && user) {
      guardarVistaUsuario(user, 'pedidos', {
        filtros: debouncedFilters,
        orden: multiSort.sortCriteria
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters]);

  // Guardar la vista solo cuando se aplica el sort
  useEffect(() => {
    if (sortAplicado && configCargada && user) {
      guardarVistaUsuario(user, 'pedidos', {
        filtros: filters,
        orden: multiSort.sortCriteria
      });
      setSortAplicado(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortAplicado]);

  return (
    <div style={{
      background: 'black', minHeight: '100vh', color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <PageHeader
        pedidos={pedidos} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        showFilterPanel={showFilterPanel} setShowFilterPanel={setShowFilterPanel}
        filters={filters} setFilters={setFilters} filterOptions={filterOptions}
        onClearFilters={onClearFilters} setIsModalOpen={setIsModalOpen}
      />

      {/* Botón de ordenamiento en la cabecera */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 10, 
        background: 'rgba(9, 9, 11, 0.8)', 
        borderBottom: '1px solid rgba(39, 39, 42, 0.5)', 
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={() => setSortModalOpen(true)}
          style={{
            background: multiSort.sortCriteria.length > 0 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(39, 39, 42, 0.5)',
            border: multiSort.sortCriteria.length > 0 ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(63, 63, 70, 0.5)',
            color: multiSort.sortCriteria.length > 0 ? '#60a5fa' : '#a1a1aa',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(59, 130, 246, 0.3)';
            e.target.style.borderColor = 'rgba(59, 130, 246, 0.7)';
            e.target.style.color = '#93c5fd';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = multiSort.sortCriteria.length > 0 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(39, 39, 42, 0.5)';
            e.target.style.borderColor = multiSort.sortCriteria.length > 0 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(63, 63, 70, 0.5)';
            e.target.style.color = multiSort.sortCriteria.length > 0 ? '#60a5fa' : '#a1a1aa';
          }}
        >
          <ArrowUpDown style={{ width: '16px', height: '16px' }} />
          Ordenar
          {multiSort.sortCriteria.length > 0 && (
            <span style={{
              background: '#3b82f6',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              {multiSort.sortCriteria.length}
            </span>
          )}
        </button>
      </div>

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
        contextMenu={contextMenu} pedidos={pedidos} startEdit={api.startEdit}
        handleEliminar={api.handleEliminar}
      />

      <EditContextMenu
        editContextMenu={editContextMenu} saveEdit={api.saveEdit} cancelEdit={api.cancelEdit}
        editingId={editingId} setEditContextMenu={setEditContextMenu}
      />

      <SortModal
        isOpen={sortModalOpen}
        onClose={() => setSortModalOpen(false)}
        fields={sortFields}
        sortCriteria={multiSort.sortCriteria}
        addSortCriterion={multiSort.addSortCriterion}
        removeSortCriterion={multiSort.removeSortCriterion}
        updateSortCriterionField={multiSort.updateSortCriterionField}
        updateSortCriterionOrder={multiSort.updateSortCriterionOrder}
        moveCriterionUp={multiSort.moveCriterionUp}
        moveCriterionDown={multiSort.moveCriterionDown}
        clearSortCriteria={multiSort.clearSortCriteria}
        onApply={handleApplySort}
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
            ) : pedidos.length > 0 ? (
              pedidos.map((pedido) => (
                <PedidoRow
                  key={pedido.id_pedido} pedido={pedido} editing={editingId === pedido.id_pedido}
                  editForm={editForm} handleEditFormChange={api.handleEditFormChange}
                  handleEditRowRightClick={handleEditRowRightClick} handleRowRightClick={handleRowRightClick}
                  startEdit={api.startEdit} getEstadoStyle={getEstadoStyle} handlePedidoAdded={handlePedidoAdded}
                  handleEliminarArchivo={api.handleEliminarArchivo} supabase={supabase} getPedidos={api.getPedidos}
                  ESTADOS_FABRICACION={ESTADOS_FABRICACION} ESTADOS_VENTA={ESTADOS_VENTA}
                  ESTADOS_ENVIO={ESTADOS_ENVIO} setEditForm={state.setEditForm} editingId={editingId}
                />
              ))
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