import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import FilterPanel from '../components/FilterPanel';
import './PedidosPage.css';

const initialFiltersState = {
  fecha_compra_gte: null,
  fecha_compra_lte: null,
  estado_fabricacion: [],
  estado_venta: [],
  estado_envio: [],
};

// ✅ Función utilitaria para fecha final inclusiva
const getInclusiveEndDateISOString = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  const endOfDay = new Date(year, month - 1, day);
  endOfDay.setHours(23, 59, 59, 999); // final del día
  return endOfDay.toISOString();
};

function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ estado_fabricacion: [], estado_venta: [], estado_envio: [] });
  const [filters, setFilters] = useState(initialFiltersState);
  const [activeFilters, setActiveFilters] = useState(initialFiltersState);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const fields = ['estado_fabricacion', 'estado_venta', 'estado_envio'];
      const newOptions = {};
      for (const field of fields) {
        const { data } = await supabase.from('pedidos').select(field);
        if (data) {
          newOptions[field] = [...new Set(data.map(item => item[field]).filter(Boolean))];
        }
      }
      setFilterOptions(newOptions);
    };
    fetchFilterOptions();
  }, []);

  const handleSort = () => setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'));
  const onApplyFilters = () => setActiveFilters(filters);
  const onClearFilters = () => {
    setFilters(initialFiltersState);
    setActiveFilters(initialFiltersState);
  };

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const getPedidos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('pedidos')
        .select('*, clientes (*)');

      if (debouncedSearchTerm) {
        const { data: idObjects, error: rpcError } = await supabase.rpc('get_pedido_ids_by_client_search', { search_term: debouncedSearchTerm });
        if (rpcError) throw rpcError;
        const ids = idObjects.map(o => o.id_pedido);
        query = query.in('id_pedido', ids.length > 0 ? ids : [-1]);
      }

      if (activeFilters.fecha_compra_lte) {
        const isoEndOfDay = getInclusiveEndDateISOString(activeFilters.fecha_compra_lte);
        query = query.lte('fecha_compra', isoEndOfDay);
      }

      if (activeFilters.estado_fabricacion.length > 0) {
        query = query.in('estado_fabricacion', activeFilters.estado_fabricacion);
      }
      if (activeFilters.estado_venta.length > 0) {
        query = query.in('estado_venta', activeFilters.estado_venta);
      }
      if (activeFilters.estado_envio.length > 0) {
        query = query.in('estado_envio', activeFilters.estado_envio);
      }

      query = query.order('fecha_compra', { ascending: sortOrder === 'asc' });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setPedidos(data || []);
    } catch (err) {
      console.error("Error al obtener pedidos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sortOrder, debouncedSearchTerm, activeFilters]);

  useEffect(() => {
    getPedidos();
  }, [getPedidos]);

  return (
    <div className="pedidos-page-container">
      <h1>Gestión de Pedidos</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Buscar por cliente, diseño o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '40%', padding: '10px', borderRadius: '5px', border: '1px solid #333', background: '#2a2a2a', color: 'white' }}
        />
        <button onClick={() => setShowFilterPanel(!showFilterPanel)} style={{ padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: '#333', color: 'white' }}>
          {showFilterPanel ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>
      {showFilterPanel && (
        <FilterPanel 
          filterOptions={filterOptions}
          filters={filters}
          setFilters={setFilters}
          onApply={onApplyFilters}
          onClear={onClearFilters}
        />
      )}
      <div className="table-container">
        <table className="pedidos-table">
          <thead>
            <tr>
              <th><button onClick={handleSort}>Fecha Compra {sortOrder === 'asc' ? '↑' : '↓'}</button></th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Teléfono</th>
              <th>Medio Contacto</th>
              <th>Valor Sello</th>
              <th>Valor Envío</th>
              <th>Restante</th>
              <th>Estado Fabricación</th>
              <th>Estado Venta</th>
              <th>Estado Envío</th>
              <th>Notas</th>
              <th>Diseño</th>
              <th>Archivo Base</th>
              <th>Archivo Vector</th>
              <th>Foto Sello</th>
              <th>Nro. Seguimiento</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="17" style={{ textAlign: 'center' }}>Cargando...</td></tr>
            ) : error ? (
              <tr><td colSpan="17" style={{ textAlign: 'center', color: 'red' }}>Error: {error}</td></tr>
            ) : pedidos.length > 0 ? (
              pedidos.map((pedido) => (
                <tr key={pedido.id_pedido}>
                  <td>{new Date(pedido.fecha_compra).toLocaleDateString()}</td>
                  <td>{pedido.clientes?.nombre_cliente || 'N/A'}</td>
                  <td>{pedido.clientes?.apellido_cliente || 'N/A'}</td>
                  <td>{pedido.clientes?.telefono_cliente || 'N/A'}</td>
                  <td>{pedido.clientes?.medio_contacto || 'N/A'}</td>
                  <td>{pedido.valor_sello}</td>
                  <td>{pedido.valor_envio}</td>
                  <td>{pedido.restante_pagar}</td>
                  <td>{pedido.estado_fabricacion}</td>
                  <td>{pedido.estado_venta}</td>
                  <td>{pedido.estado_envio}</td>
                  <td>{pedido.notas}</td>
                  <td>{pedido.disenio}</td>
                  <td>{pedido.archivo_base}</td>
                  <td>{pedido.archivo_vector}</td>
                  <td>{pedido.foto_sello}</td>
                  <td>{pedido.numero_seguimiento}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="17" style={{ textAlign: 'center' }}>No se encontraron pedidos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PedidosPage;
