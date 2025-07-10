import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
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
import './PedidosPage.css';

// Arrays fijos para los selects de estado
const ESTADOS_FABRICACION = [
  'Sin Hacer', 'Haciendo', 'Rehacer', 'Retocar', 'Prioridad', 'Verificar', 'Hecho'
];
const ESTADOS_VENTA = [
  'Foto', 'Transferido', 'Ninguno'
];
const ESTADOS_ENVIO = [
  'Sin enviar', 'Hacer Etiqueta', 'Etiqueta Lista', 'Despachado', 'Seguimiento Enviado'
];

const initialFiltersState = {
  fecha_compra_gte: null,
  fecha_compra_lte: null,
  estado_fabricacion: [],
  estado_venta: [],
  estado_envio: [],
};

// Estados con estilos tipo estetica.txt
const estadosFabricacion = [
  { value: "Sin Hacer", label: "Sin Hacer", color: "slate", glow: "shadow-slate-500/20" },
  { value: "Haciendo", label: "Haciendo", color: "cyan", glow: "shadow-cyan-500/20" },
  { value: "Hecho", label: "Hecho", color: "emerald", glow: "shadow-emerald-500/20" },
  { value: "Rehacer", label: "Rehacer", color: "red", glow: "shadow-red-500/20" },
  { value: "Retocar", label: "Retocar", color: "amber", glow: "shadow-amber-500/20" },
  { value: "Prioridad", label: "Prioridad", color: "purple", glow: "shadow-purple-500/20" },
  { value: "Verificar", label: "Verificar", color: "teal", glow: "shadow-teal-500/20" },
];

const estadosVenta = [
  { value: "Ninguno", label: "Ninguno", color: "slate", glow: "shadow-slate-500/20" },
  { value: "Foto", label: "Foto", color: "blue", glow: "shadow-blue-500/20" },
  { value: "Transferido", label: "Transferido", color: "green", glow: "shadow-green-500/20" },
];

const estadosEnvio = [
  { value: "Sin enviar", label: "Sin Enviar", color: "slate", glow: "shadow-slate-500/20" },
  { value: "Hacer Etiqueta", label: "Hacer Etiqueta", color: "orange", glow: "shadow-orange-500/20" },
  { value: "Etiqueta Lista", label: "Etiqueta Lista", color: "violet", glow: "shadow-violet-500/20" },
  { value: "Despachado", label: "Despachado", color: "teal", glow: "shadow-teal-500/20" },
  { value: "Seguimiento Enviado", label: "Seguimiento Enviado", color: "green", glow: "shadow-green-500/20" },
];

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
  if (filePath.startsWith('http')) {
    const idx = filePath.indexOf('/archivos-ventas/');
    if (idx !== -1) {
      filePath = filePath.substring(idx + '/archivos-ventas/'.length);
    }
  }
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
  const [editContextMenu, setEditContextMenu] = useState({ visible: false, x: 0, y: 0 });

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
      setEditContextMenu({ visible: false, x: 0, y: 0 });
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

  // Debounce para filtros
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

      // Aplicar filtros
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
  }, [sortOrder, debouncedSearchTerm, debouncedFilters]);

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

  const handleEditRowRightClick = (e) => {
    e.preventDefault();
    setEditContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY
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
      medida_pedida: pedido.medida_pedida || '',
      numero_seguimiento: pedido.numero_seguimiento || '',
    });
    setContextMenu({ visible: false, x: 0, y: 0, pedidoId: null });
  };

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({});
  }, []);

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = useCallback(async (id) => {
    try {
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
        console.error('Error al actualizar cliente:', clienteResult.error);
        alert('Error al actualizar los datos del cliente');
        return;
      }

      if (pedidoResult.error) {
        console.error('Error al actualizar pedido:', pedidoResult.error);
        alert('Error al actualizar los datos del pedido');
        return;
      }

      getPedidos();
      setEditingId(null);
      setEditForm({});

    } catch (error) {
      console.error('Error general al editar:', error);
      alert('Error al editar el pedido');
    }
  }, [editForm, getPedidos]);

  // Manejar teclas Escape y Enter para edición
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingId) {
        if (e.key === 'Escape') {
          cancelEdit();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          saveEdit(editingId);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingId, saveEdit, cancelEdit]);

  // Guardar edición con doble clic fuera
  useEffect(() => {
    if (!editingId) return;
    const handleDblClick = (e) => {
      const table = document.querySelector('.table-container');
      if (table && !table.contains(e.target)) {
        saveEdit(editingId);
      }
    };
    document.addEventListener('dblclick', handleDblClick);
    return () => document.removeEventListener('dblclick', handleDblClick);
  }, [editingId, saveEdit]);

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
      const { error } = await supabase.rpc('eliminar_pedido', { p_id: id });
      if (error) {
        alert('Error al eliminar el pedido');
      } else {
        getPedidos();
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0, pedidoId: null });
  };

  const handleEliminarArchivo = async (publicUrl, field, pedidoId) => {
    const url = new URL(publicUrl);
    const path = decodeURIComponent(url.pathname.split('/storage/v1/object/public/archivos-ventas/')[1]);
    await supabase.storage.from('archivos-ventas').remove([path]);
    const updateData = {};
    updateData[`p_${field}`] = null;
    await supabase.rpc('editar_pedido', {
      p_id: pedidoId,
      ...updateData
    });
    getPedidos();
  };

  const getEstadoStyle = (estado, tipo) => {
    let estados = estadosFabricacion;
    if (tipo === "venta") estados = estadosVenta;
    if (tipo === "envio") estados = estadosEnvio;

    const estadoObj = estados.find((e) => e.value === estado);
    return estadoObj || { color: "slate", glow: "shadow-slate-500/20", label: estado };
  };

  const hayFiltrosActivos = Object.values(filters).some((filtro) => filtro !== "" && filtro !== null && (!Array.isArray(filtro) || filtro.length > 0));

  return (
    <div style={{
      background: '#000000',
      minHeight: '100vh',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(39, 39, 42, 0.5)',
        background: 'rgba(9, 9, 11, 0.8)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        padding: '24px 32px'
      }}>
        <div style={{
          /* maxWidth: '1200px', */
          /* margin: '0 auto', */
          paddingLeft: '0',
          paddingRight: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'white',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Package style={{ width: '20px', height: '20px', color: 'black' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: '300',
                  letterSpacing: '-0.025em',
                  margin: 0
                }}>
                  Pedidos
                </h1>
                <p style={{
                  fontSize: '12px',
                  color: '#71717a',
                  margin: '2px 0 0 0'
                }}>
                  {pedidos.length} activos
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#71717a'
              }} />
              <input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: undefined, // Elimino paddingLeft
                  width: '320px',
                  background: 'rgba(39, 39, 42, 0.5)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '8px 16px 8px 44px',
                  outline: 'none',
                  fontSize: '14px',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'}
              />
            </div>

            {/* Filtros */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                style={{
                  color: hayFiltrosActivos ? 'white' : '#a1a1aa',
                  background: hayFiltrosActivos ? 'rgba(39, 39, 42, 0.5)' : 'transparent',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = 'white';
                  e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = hayFiltrosActivos ? 'white' : '#a1a1aa';
                  e.target.style.background = hayFiltrosActivos ? 'rgba(39, 39, 42, 0.5)' : 'transparent';
                }}
              >
                <Filter style={{ width: '16px', height: '16px' }} />
              </button>

              {showFilterPanel && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '48px',
                  width: '384px',
                  background: 'rgba(9, 9, 11, 0.95)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(39, 39, 42, 0.5)',
                  borderRadius: '8px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  zIndex: 50,
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '4px',
                        height: '24px',
                        background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)',
                        borderRadius: '9999px'
                      }}></div>
                      <h3 style={{ fontSize: '18px', fontWeight: '500', color: 'white', margin: 0 }}>Filtros</h3>
                    </div>
                    {hayFiltrosActivos && (
                      <button
                        onClick={onClearFilters}
                        style={{
                          color: '#a1a1aa',
                          background: 'transparent',
                          border: 'none',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = 'white';
                          e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = '#a1a1aa';
                          e.target.style.background = 'transparent';
                        }}
                      >
                        <X style={{ width: '12px', height: '12px' }} />
                        Limpiar
                      </button>
                    )}
                  </div>

                  <FilterPanel
                    filterOptions={filterOptions}
                    filters={filters}
                    setFilters={setFilters}
                    onClear={onClearFilters}
                    isExpanded={showFilterPanel}
                    onToggle={() => setShowFilterPanel(!showFilterPanel)}
                    showHeader={false}
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: 'white',
                color: 'black',
                border: 'none',
                fontWeight: '500',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                transition: 'background 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Nuevo
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AddPedidoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPedidoAdded={handlePedidoAdded}
        filterOptions={filterOptions}
      />

      {/* Menús contextuales */}
      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'rgba(9, 9, 11, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(39, 39, 42, 0.5)',
            borderRadius: '8px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            padding: '8px 0'
          }}
        >
          <button
            style={{
              width: '100%',
              padding: '8px 16px',
              textAlign: 'left',
              color: 'white',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(39, 39, 42, 0.5)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
            onClick={() => {
              const pedido = pedidos.find(p => p.id_pedido === contextMenu.pedidoId);
              if (pedido) startEdit(pedido);
            }}
          >
            Editar
          </button>
          <button
            style={{
              width: '100%',
              padding: '8px 16px',
              textAlign: 'left',
              color: '#ef4444',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(39, 39, 42, 0.5)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
            onClick={() => handleEliminar(contextMenu.pedidoId)}
          >
            Eliminar
          </button>
        </div>
      )}

      {editContextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            top: editContextMenu.y,
            left: editContextMenu.x,
            background: 'rgba(9, 9, 11, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(39, 39, 42, 0.5)',
            borderRadius: '8px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            padding: '8px 0'
          }}
        >
          <button
            style={{
              width: '100%',
              padding: '8px 16px',
              textAlign: 'left',
              color: 'white',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(39, 39, 42, 0.5)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
            onClick={() => {
              saveEdit(editingId);
              setEditContextMenu({ visible: false, x: 0, y: 0 });
            }}
          >
            Guardar (Ctrl+Enter)
          </button>
          <button
            style={{
              width: '100%',
              padding: '8px 16px',
              textAlign: 'left',
              color: '#a1a1aa',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(39, 39, 42, 0.5)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
            onClick={() => {
              cancelEdit();
              setEditContextMenu({ visible: false, x: 0, y: 0 });
            }}
          >
            Cancelar (Escape)
          </button>
        </div>
      )}

      {/* Tabla */}
      <div style={{
        maxWidth: '100%',
        margin: '0 auto',
        padding: '32px'
      }}>
        <div className="table-container" style={{
          background: 'rgba(9, 9, 11, 0.5)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(39, 39, 42, 0.5)',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '1200px'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(39, 39, 42, 0.5)' }}>
                  <th style={{
                    color: '#a1a1aa',
                    fontWeight: '500',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'left',
                    padding: '16px 12px',
                    verticalAlign: 'middle'
                  }}>
                    Fecha
                  </th>
                  <th style={{
                    color: '#a1a1aa',
                    fontWeight: '500',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'left',
                    padding: '16px 12px',
                    verticalAlign: 'middle'
                  }}>
                    Cliente
                  </th>
                  <th style={{
                    color: '#a1a1aa',
                    fontWeight: '500',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'left',
                    padding: '16px 12px',
                    verticalAlign: 'middle'
                  }}>
                    Diseño
                  </th>
                  <th style={{
                    color: '#a1a1aa',
                    fontWeight: '500',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'left',
                    padding: '16px 12px',
                    verticalAlign: 'middle'
                  }}>
                    Contacto
                  </th>
                  <th style={{
                    color: '#a1a1aa',
                    fontWeight: '500',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'left',
                    padding: '16px 12px',
                    verticalAlign: 'middle'
                  }}>
                    Seña/Envío
                  </th>
                  <th style={{
                    color: '#a1a1aa',
                    fontWeight: '500',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'left',
                    padding: '16px 12px',
                    verticalAlign: 'middle'
                  }}>
                    Valor
                  </th>
                  <th style={{
                    color: '#a1a1aa',
                    fontWeight: '500',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'left',
                    padding: '16px 12px',
                    verticalAlign: 'middle',
                    minWidth: '220px'
                  }}>
                    Estado
                  </th>
                  <th style={{
                    color: '#a1a1aa',
                    fontWeight: '500',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'center',
                    padding: '16px 12px',
                    verticalAlign: 'middle'
                  }}>
                    Base
                  </th>
                  <th style={{
                    color: '#a1a1aa',
                    fontWeight: '500',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'center',
                    padding: '16px 12px',
                    verticalAlign: 'middle'
                  }}>
                    Vector
                  </th>
                  <th style={{
                    color: '#a1a1aa',
                    fontWeight: '500',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'center',
                    padding: '16px 12px',
                    verticalAlign: 'middle'
                  }}>
                    F Sello
                  </th>
                  <th style={{
                    color: '#a1a1aa',
                    fontWeight: '500',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'left',
                    padding: '16px 12px',
                    verticalAlign: 'middle'
                  }}>
                    Seguimiento
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{
                      textAlign: 'center',
                      color: '#71717a',
                      padding: '32px'
                    }}>
                      Cargando...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="9" style={{
                      textAlign: 'center',
                      color: '#ef4444',
                      padding: '32px'
                    }}>
                      Error: {error}
                    </td>
                  </tr>
                ) : pedidos.length > 0 ? (
                  pedidos.map((pedido) => (
                    <Row
                      key={pedido.id_pedido}
                      pedido={pedido}
                      editing={editingId === pedido.id_pedido}
                      editForm={editForm}
                      handleEditFormChange={handleEditFormChange}
                      handleEditRowRightClick={handleEditRowRightClick}
                      handleRowRightClick={handleRowRightClick}
                      startEdit={startEdit}
                      getEstadoStyle={getEstadoStyle}
                      handlePedidoAdded={handlePedidoAdded}
                      handleEliminarArchivo={handleEliminarArchivo}
                      supabase={supabase}
                      getPedidos={getPedidos}
                      ESTADOS_FABRICACION={ESTADOS_FABRICACION}
                      ESTADOS_VENTA={ESTADOS_VENTA}
                      ESTADOS_ENVIO={ESTADOS_ENVIO}
                      setEditForm={setEditForm}
                      editingId={editingId}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{
                      textAlign: 'center',
                      color: '#71717a',
                      padding: '32px'
                    }}>
                      No se encontraron pedidos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Elimino los componentes EditingRow y DisplayRow y creo un solo componente Row:
function Row({ pedido, editing, editForm, handleEditFormChange, handleEditRowRightClick, handleRowRightClick, startEdit, getEstadoStyle, handlePedidoAdded, handleEliminarArchivo, supabase, getPedidos, ESTADOS_FABRICACION, ESTADOS_VENTA, ESTADOS_ENVIO, setEditForm, editingId }) {
  // Estilo invisible para inputs
  const invisibleInput = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'inherit',
    font: 'inherit',
    width: '100%',
    padding: 0,
    margin: 0,
    boxShadow: 'none',
    appearance: 'none',
    minWidth: 0,
    fontSize: 'inherit',
    fontWeight: 'inherit',
  };

  // Función para actualizar un campo de estado en la base de datos
  const handleEstadoChange = async (campo, valor) => {
    try {
      const pedidoFields = {
        p_id: pedido.id_pedido,
        p_fecha_compra: pedido.fecha_compra,
        p_valor_sello: pedido.valor_sello,
        p_valor_envio: pedido.valor_envio,
        p_valor_senia: pedido.valor_senia,
        p_estado_fabricacion: campo === 'estado_fabricacion' ? valor : pedido.estado_fabricacion,
        p_estado_venta: campo === 'estado_venta' ? valor : pedido.estado_venta,
        p_estado_envio: campo === 'estado_envio' ? valor : pedido.estado_envio,
        p_notas: pedido.notas,
        p_disenio: pedido.disenio,
        p_archivo_base: pedido.archivo_base,
        p_archivo_vector: pedido.archivo_vector,
        p_foto_sello: pedido.foto_sello,
        p_medida_pedida: pedido.medida_pedida,
        p_numero_seguimiento: pedido.numero_seguimiento,
      };
      await supabase.rpc('editar_pedido', pedidoFields);
      getPedidos();
    } catch (err) {
      alert('Error al actualizar el estado');
    }
  };

  // Render de la fila (idéntico al modo normal, pero con inputs invisibles si editing)
  return (
    <tr
      className="pedido-row"
      style={{
        borderBottom: '1px solid rgba(39, 39, 42, 0.3)',
        ...(editing ? { background: 'rgba(39, 39, 42, 0.3)' } : {}),
        transition: 'background 0.3s ease',
        cursor: editing ? 'default' : 'context-menu',
      }}
      onContextMenu={editing ? handleEditRowRightClick : (e) => handleRowRightClick(e, pedido.id_pedido)}
      onDoubleClick={e => {
        if (!editing) {
          e.preventDefault();
          e.stopPropagation();
          startEdit(pedido);
        }
      }}
    >
      {/* Fecha */}
      <td style={{ padding: '16px 12px' }}>
        {editing ? (
          <input
            name="fecha_compra"
            type="date"
            value={editForm.fecha_compra}
            onChange={handleEditFormChange}
            style={invisibleInput}
            autoFocus
          />
        ) : (
          <span style={{ color: '#a1a1aa', fontSize: '13px' }}>
            {pedido.fecha_compra ? new Date(pedido.fecha_compra).toLocaleDateString() : '-'}
          </span>
        )}
      </td>
      {/* Nombre/Apellido */}
      <td style={{ padding: '16px 12px', minWidth: '120px' }}>
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '2px'
        }}>
          {editing ? (
            <>
              <input
                name="nombre_cliente"
                value={editForm.nombre_cliente}
                onChange={handleEditFormChange}
                style={{ ...invisibleInput, color: 'white', fontWeight: 500, fontSize: '15px' }}
                placeholder="Nombre"
              />
              <input
                name="apellido_cliente"
                value={editForm.apellido_cliente}
                onChange={handleEditFormChange}
                style={{ ...invisibleInput, color: '#71717a', fontWeight: 400, fontSize: '13px' }}
                placeholder="Apellido"
              />
            </>
          ) : (
            <>
              <span style={{ color: 'white', fontWeight: 500, fontSize: '15px', display: 'block' }}>
                {pedido.clientes?.nombre_cliente || 'N/A'}
              </span>
              <span style={{ color: '#71717a', fontWeight: 400, fontSize: '13px', display: 'block' }}>
                {pedido.clientes?.apellido_cliente || ''}
              </span>
            </>
          )}
        </div>
      </td>
      {/* Diseño y notas */}
      <td style={{ padding: '16px 12px' }}>
        {editing ? (
          <>
            <input
              name="disenio"
              value={editForm.disenio}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: 'white', fontWeight: 500, fontSize: '15px', marginBottom: 0, display: 'block' }}
              placeholder="Diseño"
            />
            <input
              name="medida_pedida"
              value={editForm.medida_pedida || ''}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: '#71717a', fontWeight: 400, fontSize: '13px', marginBottom: 0, display: 'block' }}
              placeholder="Medida"
            />
            <input
              name="notas"
              value={editForm.notas}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: '#71717a', fontWeight: 400, fontSize: '13px', marginBottom: 0, display: 'block' }}
              placeholder="Notas"
            />
          </>
        ) : (
          <div>
            <span style={{ color: 'white', fontWeight: 500, fontSize: '15px', margin: 0, display: 'block' }}>
              {pedido.disenio || "Sin especificar"}
            </span>
            <span style={{ color: '#71717a', fontWeight: 400, fontSize: '13px', margin: 0, display: 'block' }}>
              {(pedido.medida_pedida || "Sin medida") + " - " + (pedido.notas || "Sin notas")}
            </span>
          </div>
        )}
      </td>
      {/* Contacto */}
      <td style={{ padding: '16px 12px' }}>
        {editing ? (
          <>
            <input
              name="medio_contacto"
              value={editForm.medio_contacto}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: 'white', fontWeight: 500, fontSize: '15px', marginBottom: 0, display: 'block' }}
              placeholder="Medio"
            />
            <input
              name="telefono_cliente"
              value={editForm.telefono_cliente}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: '#71717a', fontWeight: 400, fontSize: '13px', marginBottom: 0, display: 'block' }}
              placeholder="Teléfono"
            />
          </>
        ) : (
          <div>
            <span style={{ color: 'white', fontWeight: 500, fontSize: '15px', margin: 0, display: 'block' }}>
              {pedido.clientes?.medio_contacto || 'N/A'}
            </span>
            <span style={{ color: '#71717a', fontWeight: 400, fontSize: '13px', margin: 0, display: 'block' }}>
              {pedido.clientes?.telefono_cliente || 'N/A'}
            </span>
          </div>
        )}
      </td>
      {/* Seña/Envío */}
      <td style={{ padding: '16px 12px' }}>
        {editing ? (
          <>
            <input
              name="valor_senia"
              type="number"
              value={editForm.valor_senia}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: 'white', fontWeight: 500, fontSize: '15px', marginBottom: 0, display: 'block' }}
              placeholder="Seña"
            />
            <input
              name="valor_envio"
              type="number"
              value={editForm.valor_envio}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: '#71717a', fontWeight: 400, fontSize: '13px', marginBottom: 0, display: 'block' }}
              placeholder="Envío"
            />
          </>
        ) : (
          <div>
            <span style={{ color: 'white', fontWeight: 500, fontSize: '15px', margin: 0, display: 'block' }}>
              Seña: ${pedido.valor_senia?.toLocaleString() || 0}
            </span>
            <span style={{ color: '#71717a', fontWeight: 400, fontSize: '13px', margin: 0, display: 'block' }}>
              Envío: ${pedido.valor_envio?.toLocaleString() || 0}
            </span>
          </div>
        )}
      </td>
      {/* Valor y resto */}
      <td style={{ padding: '16px 12px' }}>
        {editing ? (
          <>
            <input
              name="valor_sello"
              type="number"
              value={editForm.valor_sello}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: 'white', fontWeight: 500, fontSize: '15px', marginBottom: 0, display: 'block' }}
              placeholder="Valor"
            />
            <span style={{ color: '#71717a', fontWeight: 400, fontSize: '13px', display: 'block', margin: 0 }}>
              Resta: ${(Number(editForm.valor_sello || 0) - Number(editForm.valor_senia || 0)).toLocaleString()}
            </span>
          </>
        ) : (
          <div>
            <span style={{ color: 'white', fontWeight: 500, fontSize: '15px', margin: 0, display: 'block' }}>
              ${pedido.valor_sello?.toLocaleString()}
            </span>
            <span style={{ color: '#71717a', fontWeight: 400, fontSize: '13px', display: 'block', margin: 0 }}>
              Resta: ${pedido.restante_pagar?.toLocaleString()}
            </span>
          </div>
        )}
      </td>
      {/* Estado */}
      <td style={{ minWidth: '220px', padding: '16px 12px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <EstadoSelect
            value={editing ? editForm.estado_fabricacion : pedido.estado_fabricacion}
            onChange={val => editing ? setEditForm(prev => ({ ...prev, estado_fabricacion: val })) : handleEstadoChange('estado_fabricacion', val)}
            options={ESTADOS_FABRICACION}
            type="fabricacion"
            isDisabled={false}
            size="small"
            style={{ width: '75%' }}
          />
          <div style={{ display: 'flex', width: '100%' }}>
            <EstadoSelect
              value={editing ? editForm.estado_venta : pedido.estado_venta}
              onChange={val => editing ? setEditForm(prev => ({ ...prev, estado_venta: val })) : handleEstadoChange('estado_venta', val)}
              options={ESTADOS_VENTA}
              type="venta"
              isDisabled={editing ? false : pedido.estado_fabricacion !== "Hecho"}
              size="small"
              style={{ width: '50%' }}
            />
            <EstadoSelect
              value={editing ? editForm.estado_envio : pedido.estado_envio}
              onChange={val => editing ? setEditForm(prev => ({ ...prev, estado_envio: val })) : handleEstadoChange('estado_envio', val)}
              options={ESTADOS_ENVIO}
              type="envio"
              isDisabled={editing ? false : pedido.estado_venta !== "Transferido"}
              size="small"
              style={{ width: '50%' }}
            />
          </div>
        </div>
      </td>
      {/* Base */}
      <td style={{ padding: '16px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
        <ArchivoCell
          filePath={editing ? editForm.archivo_base : pedido.archivo_base}
          nombre="Archivo Base"
          pedidoId={pedido.id_pedido}
          field="archivo_base"
          onUpload={handlePedidoAdded}
          onDelete={handleEliminarArchivo}
          editing={editing}
        />
      </td>
      {/* Vector */}
      <td style={{ padding: '16px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
        <ArchivoCell
          filePath={editing ? editForm.archivo_vector : pedido.archivo_vector}
          nombre="Archivo Vector"
          pedidoId={pedido.id_pedido}
          field="archivo_vector"
          onUpload={handlePedidoAdded}
          onDelete={handleEliminarArchivo}
          editing={editing}
        />
      </td>
      {/* Foto Sello */}
      <td style={{ padding: '16px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
        <ArchivoCell
          filePath={editing ? editForm.foto_sello : pedido.foto_sello}
          nombre="Foto Sello"
          pedidoId={pedido.id_pedido}
          field="foto_sello"
          onUpload={handlePedidoAdded}
          onDelete={handleEliminarArchivo}
          editing={editing}
        />
      </td>
      {/* Seguimiento */}
      <td style={{ padding: '16px 12px' }}>
        {editing ? (
          <input
            name="numero_seguimiento"
            value={editForm.numero_seguimiento}
            onChange={handleEditFormChange}
            style={{ ...invisibleInput, fontFamily: 'monospace', color: 'white', fontSize: '13px' }}
            placeholder="Seguimiento"
          />
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: '13px', color: pedido.numero_seguimiento ? '#d4d4d8' : '#71717a', fontStyle: pedido.numero_seguimiento ? 'normal' : 'italic' }}>
            {pedido.numero_seguimiento || 'Sin asignar'}
          </div>
        )}
      </td>
    </tr>
  );
}

// Componente para gestión de archivos estilo estetica.txt
function ArchivoCell({ filePath, nombre, pedidoId, field, onUpload, onDelete, editing }) {
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
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${field}_${pedidoId}_${timestamp}.${fileExtension}`;
      const { data, error } = await supabase.storage
        .from('archivos-ventas')
        .upload(fileName, file);
      if (error) throw error;
      const { data: publicData } = supabase.storage
        .from('archivos-ventas')
        .getPublicUrl(fileName);
      const updateData = {};
      updateData[`p_${field}`] = publicData.publicUrl;
      await supabase.rpc('editar_pedido', {
        p_id: pedidoId,
        ...updateData
      });
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

  if (!filePath) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <label style={{
          color: '#a1a1aa',
          background: 'transparent',
          border: '1px solid rgba(63, 63, 70, 0.5)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.3s ease'
        }}
          onMouseEnter={(e) => {
            e.target.style.color = 'white';
            e.target.style.background = 'rgba(39, 39, 42, 0.5)';
            e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#a1a1aa';
            e.target.style.background = 'transparent';
            e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)';
          }}
        >
          <Upload style={{ width: '12px', height: '12px' }} />
          {field === 'foto_sello' ? 'Foto' : 'Subir'}
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

  if (!signedUrl) return <span style={{ color: '#71717a', fontSize: '12px' }}>Cargando...</span>;

  const isImage = filePath.match(/\.(jpg|jpeg|png|gif|svg)$/i);

  if (isImage) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '48px', width: '48px' }}>
        <div
          style={{
            position: 'relative',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <a href={signedUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={signedUrl}
              alt={nombre}
              style={{
                width: '48px',
                height: '48px',
                objectFit: 'cover',
                borderRadius: '6px',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                transition: 'border-color 0.3s ease'
              }}
            />
          </a>
          {isHovered && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <button
                onClick={handleDownload}
                style={{
                  color: 'white',
                  fontSize: '10px',
                  background: 'rgba(39, 39, 42, 0.8)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
              >
                Ver
              </button>
              <button
                onClick={handleDelete}
                style={{
                  color: '#ef4444',
                  fontSize: '10px',
                  background: 'rgba(39, 39, 42, 0.8)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
              >
                X
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => window.open(signedUrl, '_blank')}
        style={{
          color: '#a1a1aa',
          background: 'transparent',
          border: '1px solid rgba(63, 63, 70, 0.5)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.color = 'white';
          e.target.style.background = 'rgba(39, 39, 42, 0.5)';
          e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.target.style.color = '#a1a1aa';
          e.target.style.background = 'transparent';
          e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)';
        }}
      >
        <Upload style={{ width: '12px', height: '12px' }} />
        {field === 'foto_sello' ? 'Foto' : 'Ver'}
      </button>
    </div>
  );
}

export default PedidosPage;