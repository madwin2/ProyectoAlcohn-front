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

const getSignedUrl = async (filePath) => {
  if (!filePath) return null;
  // Si es una URL completa, extrae solo la ruta relativa
  if (filePath.startsWith('http')) {
    const idx = filePath.indexOf('/archivos-ventas/');
    if (idx !== -1) {
      filePath = filePath.substring(idx + '/archivos-ventas/'.length);
    }
  }
  console.log('Intentando generar signedUrl para:', filePath); // DEPURACIÓN
  const { data, error } = await supabase.storage
    .from('archivos-ventas')
    .createSignedUrl(filePath, 60);
  if (error) {
    alert('No se pudo generar el enlace de acceso al archivo');
    return null;
  }
  return data.signedUrl;
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
  const [debouncedFilters, setDebouncedFilters] = useState(initialFiltersState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, pedidoId: null });

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

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0, pedidoId: null });
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSort = () => setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'));
  
  const onClearFilters = () => {
    setFilters(initialFiltersState);
  };

  // Debounce para término de búsqueda
  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  // Debounce para filtros (más rápido que la búsqueda)
  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timerId);
  }, [filters]);

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
      if (debouncedFilters.fecha_compra_gte) {
        query = query.gte('fecha_compra', debouncedFilters.fecha_compra_gte);
      }
      if (debouncedFilters.fecha_compra_lte) {
        const isoEndOfDay = getInclusiveEndDateISOString(debouncedFilters.fecha_compra_lte);
        query = query.lte('fecha_compra', isoEndOfDay);
      }
      if (debouncedFilters.estado_fabricacion.length > 0) {
        query = query.in('estado_fabricacion', debouncedFilters.estado_fabricacion);
      }
      if (debouncedFilters.estado_venta.length > 0) {
        query = query.in('estado_venta', debouncedFilters.estado_venta);
      }
      if (debouncedFilters.estado_envio.length > 0) {
        query = query.in('estado_envio', debouncedFilters.estado_envio);
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
  }, [sortOrder, debouncedSearchTerm, debouncedFilters, getInclusiveEndDateISOString]);

  useEffect(() => {
    getPedidos();
  }, [getPedidos]);

  const handleRowRightClick = (e, pedidoId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      pedidoId
    });
  };

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
    setContextMenu({ visible: false, x: 0, y: 0, pedidoId: null });
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
    setContextMenu({ visible: false, x: 0, y: 0, pedidoId: null });
  };

  const handleEliminarArchivo = async (publicUrl, field, pedidoId) => {
    // Extraer el path relativo del archivo desde la URL pública
    const url = new URL(publicUrl);
    const path = decodeURIComponent(url.pathname.split('/storage/v1/object/public/archivos-ventas/')[1]);
    await supabase.storage.from('archivos-ventas').remove([path]);
    // Actualiza el pedido en la base de datos para quitar la referencia
    await supabase.rpc('editar_pedido', {
      p_id: pedidoId,
      [`p_${field}`]: null
    });
    getPedidos();
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
            <button onClick={() => setIsModalOpen(true)} className="new-pedido-button">
              Crear Pedido
            </button>
        </div>
      </div>
      
      <FilterPanel 
        filterOptions={filterOptions}
        filters={filters}
        setFilters={setFilters}
        onClear={onClearFilters}
        isExpanded={showFilterPanel}
        onToggle={() => setShowFilterPanel(!showFilterPanel)}
      />
       <AddPedidoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPedidoAdded={handlePedidoAdded}
        filterOptions={filterOptions}
      />

      {/* Menú contextual */}
      {contextMenu.visible && (
        <div 
          className="context-menu"
          style={{ 
            position: 'absolute', 
            top: contextMenu.y, 
            left: contextMenu.x,
            background: '#333',
            border: '1px solid #555',
            borderRadius: '5px',
            padding: '5px 0',
            zIndex: 1000,
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}
        >
          <button 
            className="context-menu-item"
            onClick={() => {
              const pedido = pedidos.find(p => p.id_pedido === contextMenu.pedidoId);
              if (pedido) startEdit(pedido);
            }}
          >
            Editar
          </button>
          <button 
            className="context-menu-item"
            onClick={() => handleEliminar(contextMenu.pedidoId)}
          >
            Eliminar
          </button>
        </div>
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
                editingId === pedido.id_pedido ? (
                  <>
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
                      <td>
                        <ArchivoCell filePath={pedido.archivo_base} nombre="Archivo Base" pedidoId={pedido.id_pedido} field="archivo_base" onUpload={handlePedidoAdded} onDelete={handleEliminarArchivo} />
                      </td>
                      <td>
                        <ArchivoCell filePath={pedido.archivo_vector} nombre="Archivo Vector" pedidoId={pedido.id_pedido} field="archivo_vector" onUpload={handlePedidoAdded} onDelete={handleEliminarArchivo} />
                      </td>
                      <td><input name="foto_sello" value={editForm.foto_sello} onChange={handleEditFormChange} /></td>
                      <td><input name="numero_seguimiento" value={editForm.numero_seguimiento} onChange={handleEditFormChange} /></td>
                    </tr>
                    <tr>
                      <td colSpan="17" style={{ textAlign: 'center', background: '#2a2a2a', padding: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => saveEdit(pedido.id_pedido)}
                            style={{ 
                              padding: '8px 16px', 
                              background: '#28a745', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px', 
                              cursor: 'pointer' 
                            }}
                          >
                            Guardar
                          </button>
                          <button 
                            onClick={cancelEdit}
                            style={{ 
                              padding: '8px 16px', 
                              background: '#6c757d', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px', 
                              cursor: 'pointer' 
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr 
                    key={pedido.id_pedido} 
                    onContextMenu={(e) => handleRowRightClick(e, pedido.id_pedido)}
                    style={{ cursor: 'context-menu' }}
                  >
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
                    <td>
                      <ArchivoCell filePath={pedido.archivo_base} nombre="Archivo Base" pedidoId={pedido.id_pedido} field="archivo_base" onUpload={handlePedidoAdded} onDelete={handleEliminarArchivo} />
                    </td>
                    <td>
                      <ArchivoCell filePath={pedido.archivo_vector} nombre="Archivo Vector" pedidoId={pedido.id_pedido} field="archivo_vector" onUpload={handlePedidoAdded} onDelete={handleEliminarArchivo} />
                    </td>
                    <td>{pedido.foto_sello}</td>
                    <td>{pedido.numero_seguimiento}</td>
                  </tr>
                )
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

// Componente auxiliar para mostrar y gestionar archivos
function ArchivoCell({ filePath, nombre, pedidoId, field, onUpload, onDelete }) {
  const [signedUrl, setSignedUrl] = React.useState(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    if (!filePath) return;
    let mounted = true;
    getSignedUrl(filePath).then(url => { if (mounted) setSignedUrl(url); });
    return () => { mounted = false; };
  }, [filePath]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Crear nombre único para el archivo
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${field}_${pedidoId}_${timestamp}.${fileExtension}`;
      
      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('archivos-ventas')
        .upload(fileName, file);

      if (error) throw error;

      // Obtener URL pública
      const { data: publicData } = supabase.storage
        .from('archivos-ventas')
        .getPublicUrl(fileName);

      // Actualizar el pedido en la base de datos
      const updateData = {};
      updateData[`p_${field}`] = publicData.publicUrl;
      
      await supabase.rpc('editar_pedido', {
        p_id: pedidoId,
        ...updateData
      });

      // Llamar callback para refrescar datos
      if (onUpload) onUpload();

    } catch (err) {
      alert('Error al subir el archivo: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!signedUrl) return;
    try {
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filePath.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('No se pudo descargar el archivo');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar ${nombre}?`)) {
      onDelete && onDelete(signedUrl || filePath, field, pedidoId);
    }
  };

  // Si no hay archivo, mostrar botón de subida
  if (!filePath) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <label style={{ 
          padding: '8px 12px', 
          background: '#007bff', 
          color: 'white', 
          borderRadius: '4px', 
          cursor: isUploading ? 'not-allowed' : 'pointer',
          opacity: isUploading ? 0.6 : 1,
          fontSize: '12px'
        }}>
          {isUploading ? 'Subiendo...' : `Subir ${nombre}`}
          <input 
            type="file" 
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            disabled={isUploading}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </label>
      </div>
    );
  }

  if (!signedUrl) return <span>Cargando...</span>;

  const isImage = filePath.match(/\.(jpg|jpeg|png|gif|svg)$/i);

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Previsualización del archivo */}
      {isImage ? (
        <a href={signedUrl} target="_blank" rel="noopener noreferrer">
          <img 
            src={signedUrl} 
            alt={nombre} 
            style={{ 
              width: 60, 
              height: 60, 
              objectFit: 'cover',
              borderRadius: '4px'
            }} 
          />
        </a>
      ) : (
        <a 
          href={signedUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            background: '#444',
            borderRadius: '4px',
            color: 'white',
            textDecoration: 'none',
            fontSize: '12px',
            textAlign: 'center'
          }}
        >
          📄<br/>Ver
        </a>
      )}

      {/* Botones que aparecen al hacer hover */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: '6px',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '8px',
          padding: '4px'
        }}>
          <button 
            onClick={handleDownload}
            style={{
              padding: '4px 8px',
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#444'}
            onMouseLeave={(e) => e.target.style.background = '#333'}
          >
            Descargar
          </button>
          <button 
            onClick={handleDelete}
            style={{
              padding: '4px 8px',
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#444'}
            onMouseLeave={(e) => e.target.style.background = '#333'}
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

export default PedidosPage;
