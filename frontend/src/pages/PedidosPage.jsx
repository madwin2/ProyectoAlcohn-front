import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import FilterPanel from '../components/FilterPanel';
import AddPedidoModal from '../components/AddPedidoModal';
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
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  const endOfDay = new Date(year, month - 1, day);
  endOfDay.setHours(23, 59, 59, 999);
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
  const [filterOptions, setFilterOptions] = useState({ 
    estado_fabricacion: [], 
    estado_venta: [], 
    estado_envio: [],
  });
  const [filters, setFilters] = useState(initialFiltersState);
  const [activeFilters, setActiveFilters] = useState(initialFiltersState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const pedidoFields = ['estado_fabricacion', 'estado_venta', 'estado_envio'];
      const newOptions = {};
      
      for (const field of pedidoFields) {
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

  const handlePedidoAdded = () => {
    getPedidos();
    setIsModalOpen(false);
  };

  const getPedidos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('pedidos').select('*, clientes (*)');

      if (debouncedSearchTerm) {
        const { data: idObjects, error: rpcError } = await supabase.rpc('get_pedido_ids_by_client_search', { search_term: debouncedSearchTerm });
        if (rpcError) throw rpcError;
        const ids = idObjects.map(o => o.id_pedido);
        query = query.in('id_pedido', ids.length > 0 ? ids : [-1]);
      }

      // Aplicar filtros de forma segura
      if (activeFilters.fecha_compra_gte) {
        query = query.gte('fecha_compra', activeFilters.fecha_compra_gte);
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

      // Aplicar orden al final
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
  }, [sortOrder, debouncedSearchTerm, activeFilters, getInclusiveEndDateISOString]);

  useEffect(() => {
    getPedidos();
  }, [getPedidos]);

  const startEdit = (pedido) => {
    setEditingId(pedido.id_pedido);
    setEditForm({
      fecha_compra: pedido.fecha_compra ? pedido.fecha_compra.split('T')[0] : '',
      nombre_cliente: pedido.clientes?.nombre_cliente || '',
      apellido_cliente: pedido.clientes?.apellido_cliente || '',
      telefono_cliente: pedido.clientes?.telefono_cliente || '',
      medio_contacto: pedido.clientes?.medio_contacto || '',
      valor_sello: pedido.valor_sello || '',
      valor_envio: pedido.valor_envio || '',
      valor_senia: pedido.valor_senia || '',
      estado_fabricacion: pedido.estado_fabricacion || '',
      estado_venta: pedido.estado_venta || '',
      estado_envio: pedido.estado_envio || '',
      notas: pedido.notas || '',
      disenio: pedido.disenio || '',
      archivo_base: pedido.archivo_base || '',
      archivo_vector: pedido.archivo_vector || '',
      foto_sello: pedido.foto_sello || '',
      numero_seguimiento: pedido.numero_seguimiento || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async (id) => {
    const { error } = await supabase.rpc('editar_pedido', {
      p_id: id,
      p_fecha_compra: editForm.fecha_compra,
      p_nombre_cliente: editForm.nombre_cliente,
      p_apellido_cliente: editForm.apellido_cliente,
      p_telefono_cliente: editForm.telefono_cliente,
      p_medio_contacto: editForm.medio_contacto,
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
      p_numero_seguimiento: editForm.numero_seguimiento,
    });
    if (error) {
      alert('Error al editar el pedido');
    } else {
      getPedidos();
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
      const { error } = await supabase.rpc('eliminar_pedido', { p_id: id });
      if (error) {
        alert('Error al eliminar el pedido');
      } else {
        getPedidos(); // Refresca la lista
      }
    }
  };

  return (
    <div className="pedidos-page-container">
      <h1>Gestión de Pedidos</h1>
      <div className="top-bar-container">
        <input
          type="text"
          placeholder="Buscar por cliente, diseño o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="top-bar-buttons">
            <button onClick={() => setShowFilterPanel(!showFilterPanel)} className="filter-button">
              {showFilterPanel ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
            <button onClick={() => setIsModalOpen(true)} className="new-pedido-button">
              Crear Pedido
            </button>
        </div>
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
       <AddPedidoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPedidoAdded={handlePedidoAdded}
        filterOptions={filterOptions}
      />
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
              <th>Editar</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="19" style={{ textAlign: 'center' }}>Cargando...</td></tr>
            ) : error ? (
              <tr><td colSpan="19" style={{ textAlign: 'center', color: 'red' }}>Error: {error}</td></tr>
            ) : pedidos.length > 0 ? (
              pedidos.map((pedido) => (
                editingId === pedido.id_pedido ? (
                  <tr key={pedido.id_pedido}>
                    <td><input name="fecha_compra" type="date" value={editForm.fecha_compra} onChange={handleEditFormChange} /></td>
                    <td><input name="nombre_cliente" value={editForm.nombre_cliente} onChange={handleEditFormChange} /></td>
                    <td><input name="apellido_cliente" value={editForm.apellido_cliente} onChange={handleEditFormChange} /></td>
                    <td><input name="telefono_cliente" value={editForm.telefono_cliente} onChange={handleEditFormChange} /></td>
                    <td><input name="medio_contacto" value={editForm.medio_contacto} onChange={handleEditFormChange} /></td>
                    <td><input name="valor_sello" type="number" value={editForm.valor_sello} onChange={handleEditFormChange} /></td>
                    <td><input name="valor_envio" type="number" value={editForm.valor_envio} onChange={handleEditFormChange} /></td>
                    <td>{pedido.restante_pagar}</td>
                    <td>
                      <select name="estado_fabricacion" value={editForm.estado_fabricacion} onChange={handleEditFormChange}>
                        {filterOptions.estado_fabricacion.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                    <td>
                      <select name="estado_venta" value={editForm.estado_venta} onChange={handleEditFormChange}>
                        {filterOptions.estado_venta.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                    <td>
                      <select name="estado_envio" value={editForm.estado_envio} onChange={handleEditFormChange}>
                        {filterOptions.estado_envio.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                    <td><input name="notas" value={editForm.notas} onChange={handleEditFormChange} /></td>
                    <td><input name="disenio" value={editForm.disenio} onChange={handleEditFormChange} /></td>
                    <td><input name="archivo_base" value={editForm.archivo_base} onChange={handleEditFormChange} /></td>
                    <td><input name="archivo_vector" value={editForm.archivo_vector} onChange={handleEditFormChange} /></td>
                    <td><input name="foto_sello" value={editForm.foto_sello} onChange={handleEditFormChange} /></td>
                    <td><input name="numero_seguimiento" value={editForm.numero_seguimiento} onChange={handleEditFormChange} /></td>
                    <td>
                      <button onClick={() => saveEdit(pedido.id_pedido)}>Guardar</button>
                      <button onClick={cancelEdit}>Cancelar</button>
                    </td>
                    <td>
                      <button onClick={() => handleEliminar(pedido.id_pedido)}>Eliminar</button>
                    </td>
                  </tr>
                ) : (
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
                    <td>
                      <button onClick={() => startEdit(pedido)}>Editar</button>
                    </td>
                    <td>
                      <button onClick={() => handleEliminar(pedido.id_pedido)}>Eliminar</button>
                    </td>
                  </tr>
                )
              ))
            ) : (
              <tr><td colSpan="19" style={{ textAlign: 'center' }}>No se encontraron pedidos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PedidosPage;
