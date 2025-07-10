import React, { useEffect } from 'react';
import { supabase } from '../supabaseClient';
<<<<<<< HEAD
import AddPedidoModal from '../components/AddPedidoModal';
import PedidoRow from '../components/Pedidos/PedidoRow';
import PageHeader from '../components/PageHeader';
import { PedidoContextMenu, EditContextMenu } from '../components/PedidoContextMenus';
import { Table, TableHeader, TableHeaderCell } from '../components/ui/Table';
import { usePedidosState } from '../hooks/usePedidosState';
import { usePedidosApi } from '../hooks/usePedidosApi';
import { getEstadoStyle } from '../utils/pedidosUtils';
import { ESTADOS_FABRICACION, ESTADOS_VENTA, ESTADOS_ENVIO } from '../constants/estadosConstants';
=======
import FilterPanel from '../components/FilterPanel';
import AddPedidoModal from '../components/Pedidos/AddPedidoModal';
import ChipSelect from '../components/ChipSelect';
import EstadoSelect from '../components/EstadoSelect';
import {
  Search,
  Plus,
  Upload,
  Phone,
  User,
  FileText,
  DollarSign,
  Package,
  Filter,
  Calendar,
  Settings,
  Truck,
  X
} from 'lucide-react';
>>>>>>> 21b6a60503fa18b27a9e636f16ebda6a5f2cc8f5
import './PedidosPage.css';

function PedidosPage() {
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
    setEditForm: state.setEditForm, setContextMenu
  });

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
  }, [api.getPedidos]);

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
  }, [editingId, api.saveEdit, api.cancelEdit]);

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

  const handlePedidoAdded = () => {
    api.handlePedidoAdded();
    setIsModalOpen(false);
  };

  return (
    <div style={{
      background: '#000000', minHeight: '100vh', color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <PageHeader
        pedidos={pedidos} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        showFilterPanel={showFilterPanel} setShowFilterPanel={setShowFilterPanel}
        filters={filters} setFilters={setFilters} filterOptions={filterOptions}
        onClearFilters={onClearFilters} setIsModalOpen={setIsModalOpen}
      />

      <AddPedidoModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        onPedidoAdded={handlePedidoAdded} filterOptions={filterOptions}
      />

      <PedidoContextMenu
        contextMenu={contextMenu} pedidos={pedidos} startEdit={api.startEdit}
        handleEliminar={api.handleEliminar}
      />

      <EditContextMenu
        editContextMenu={editContextMenu} saveEdit={api.saveEdit} cancelEdit={api.cancelEdit}
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