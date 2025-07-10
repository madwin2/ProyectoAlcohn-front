import { useState } from 'react';
import { initialFiltersState } from '../constants/estadosConstants';

export const usePedidosState = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    estado_fabricacion: [],
    estado_venta: [],
    estado_envio: [],
  });
  const [filters, setFilters] = useState(initialFiltersState);
  const [debouncedFilters, setDebouncedFilters] = useState(initialFiltersState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, pedidoId: null });
  const [editContextMenu, setEditContextMenu] = useState({ visible: false, x: 0, y: 0 });

  const handleSort = () => setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'));

  const onClearFilters = () => {
    setFilters(initialFiltersState);
  };

  return {
    // Estados
    pedidos,
    setPedidos,
    loading,
    setLoading,
    error,
    setError,
    sortOrder,
    setSortOrder,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    setDebouncedSearchTerm,
    showFilterPanel,
    setShowFilterPanel,
    filterOptions,
    setFilterOptions,
    filters,
    setFilters,
    debouncedFilters,
    setDebouncedFilters,
    isModalOpen,
    setIsModalOpen,
    editingId,
    setEditingId,
    editForm,
    setEditForm,
    contextMenu,
    setContextMenu,
    editContextMenu,
    setEditContextMenu,
    
    // Funciones
    handleSort,
    onClearFilters
  };
};