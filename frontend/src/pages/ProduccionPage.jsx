import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import AddPedidoModal from '../components/Pedidos/AddPedidoModal';
import EstadoSelect from '../components/EstadoSelect';
import FilterPanel from '../components/FilterPanel';
import { useMultiSort } from '../hooks/useMultiSort';
import SortModal from '../components/ui/SortModal';
import {
  Plus,
  Filter,
  Search,
  X,
  Package,
  Upload,
  ArrowUpDown
} from 'lucide-react';
import { useGuardarVistaUsuario, cargarVistaUsuario, guardarVistaUsuario } from '../hooks/useGuardarVistaUsuario';
import { useAuth } from '../hooks/useAuth';
import './ProduccionPage.css';

const ESTADOS_FABRICACION = [
  'Sin Hacer', 'Haciendo', 'Rehacer', 'Retocar', 'Prioridad', 'Verificar', 'Hecho'
];
const ESTADOS_VENTA = [
  'Foto', 'Transferido', 'Ninguno'
];
const ESTADOS_ENVIO = [
  'Sin enviar', 'Hacer Etiqueta', 'Etiqueta Lista', 'Despachado', 'Seguimiento Enviado'
];

const ESTADOS_FABRICACION_DEFAULT = [
  'Sin Hacer', 'Haciendo', 'Rehacer', 'Retocar', 'Prioridad', 'Verificar', 'Hecho'
];

const initialFiltersState = {
  fecha_compra_gte: null,
  fecha_compra_lte: null,
  estado_fabricacion: [],
  estado_venta: [],
  estado_envio: [],
};




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

function ProduccionPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder] = useState('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    estado_fabricacion: [],
  });
  const [filters, setFilters] = useState(initialFiltersState);
  const [debouncedFilters, setDebouncedFilters] = useState(initialFiltersState);
  const multiSort = useMultiSort([]);
  // Estado local para el valor mockeado de programado
  // const [programadoValues, setProgramadoValues] = useState({});
  // const opcionesProgramado = ['No Programado', 'Programado', 'En Proceso'];
  const { user, loading: authLoading } = useAuth();
  const [configCargada, setConfigCargada] = useState(false);
  const [ordenEstadosFabricacion, setOrdenEstadosFabricacion] = useState(ESTADOS_FABRICACION_DEFAULT);
  const [sortAplicado, setSortAplicado] = useState(false);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const { data } = await supabase.from('pedidos').select('estado_fabricacion');
      if (data) {
        setFilterOptions({
          estado_fabricacion: [...new Set(data.map(item => item.estado_fabricacion).filter(Boolean))],
        });
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timerId);
  }, [filters]);

  const onClearFilters = () => {
    setFilters(initialFiltersState);
  };

  useEffect(() => {
    const getPedidos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Usar RPC optimizada para búsqueda de pedidos con ordenamiento múltiple
        const { data, error: fetchError } = await supabase.rpc('buscar_pedidos_ordenado_multiple', {
          termino_busqueda: debouncedSearchTerm || '',
          filtro_estado_fabricacion: debouncedFilters.estado_fabricacion.length === 1 ? debouncedFilters.estado_fabricacion[0] : '',
          filtro_estado_venta: '',
          filtro_estado_envio: '',
          filtro_fecha_desde: debouncedFilters.fecha_compra_gte || null,
          filtro_fecha_hasta: debouncedFilters.fecha_compra_lte || null,
          limite_resultados: 500,
          criterios_orden: multiSort.sortCriteria
        });

        if (fetchError) throw fetchError;

        // Aplicar ordenamiento (la RPC ordena por fecha desc por defecto)
        let pedidosOrdenados = data || [];
        if (sortOrder === 'asc') {
          pedidosOrdenados.sort((a, b) => new Date(a.fecha_compra) - new Date(b.fecha_compra));
        }

        // Aplicar filtros múltiples que la RPC no soporta directamente
        if (debouncedFilters.estado_fabricacion.length > 1) {
          pedidosOrdenados = pedidosOrdenados.filter(p => 
            debouncedFilters.estado_fabricacion.includes(p.estado_fabricacion)
          );
        }

        // Ordenar por estado de fabricación personalizado si corresponde
        const criterioEstado = multiSort.sortCriteria.find(c => c.field === 'estado_fabricacion');
        if (criterioEstado) {
          const asc = criterioEstado.order === 'asc';
          pedidosOrdenados.sort((a, b) => {
            const idxA = ordenEstadosFabricacion.indexOf(a.estado_fabricacion);
            const idxB = ordenEstadosFabricacion.indexOf(b.estado_fabricacion);
            if (idxA !== idxB) {
              return asc
                ? (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB)
                : (idxB === -1 ? 999 : idxB) - (idxA === -1 ? 999 : idxA);
            }
            return 0;
          });
        }

        setPedidos(pedidosOrdenados);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    getPedidos();
  }, [sortOrder, debouncedSearchTerm, debouncedFilters, multiSort.sortCriteria, ordenEstadosFabricacion]);

  // Función para refrescar pedidos manteniendo filtros y ordenamiento
  const refreshPedidosWithFilters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar RPC optimizada para búsqueda de pedidos con ordenamiento múltiple
      const { data, error: fetchError } = await supabase.rpc('buscar_pedidos_ordenado_multiple', {
        termino_busqueda: debouncedSearchTerm || '',
        filtro_estado_fabricacion: debouncedFilters.estado_fabricacion.length === 1 ? debouncedFilters.estado_fabricacion[0] : '',
        filtro_estado_venta: '',
        filtro_estado_envio: '',
        filtro_fecha_desde: debouncedFilters.fecha_compra_gte || null,
        filtro_fecha_hasta: debouncedFilters.fecha_compra_lte || null,
        limite_resultados: 500,
        criterios_orden: multiSort.sortCriteria
      });

      if (fetchError) throw fetchError;

      // Aplicar ordenamiento (la RPC ordena por fecha desc por defecto)
      let pedidosOrdenados = data || [];
      if (sortOrder === 'asc') {
        pedidosOrdenados.sort((a, b) => new Date(a.fecha_compra) - new Date(b.fecha_compra));
      }

      // Aplicar filtros múltiples que la RPC no soporta directamente
      if (debouncedFilters.estado_fabricacion.length > 1) {
        pedidosOrdenados = pedidosOrdenados.filter(p => 
          debouncedFilters.estado_fabricacion.includes(p.estado_fabricacion)
        );
      }

      // Ordenar por estado de fabricación personalizado si corresponde
      const criterioEstado = multiSort.sortCriteria.find(c => c.field === 'estado_fabricacion');
      if (criterioEstado) {
        const asc = criterioEstado.order === 'asc';
        pedidosOrdenados.sort((a, b) => {
          const idxA = ordenEstadosFabricacion.indexOf(a.estado_fabricacion);
          const idxB = ordenEstadosFabricacion.indexOf(b.estado_fabricacion);
          if (idxA !== idxB) {
            return asc
              ? (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB)
              : (idxB === -1 ? 999 : idxB) - (idxA === -1 ? 999 : idxA);
          }
          return 0;
        });
      }

      setPedidos(pedidosOrdenados);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePedidoAdded = () => {
    setIsModalOpen(false);
    // Refrescar pedidos manteniendo filtros y ordenamiento
    refreshPedidosWithFilters();
  };

  const handleEstadoChange = async (pedido, campo, valor) => {
    try {
      // Actualización optimista: cambiar inmediatamente en la UI
      setPedidos(prevPedidos => {
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
      await refreshPedidosWithFilters();
    }
  };

  // const handleMaquinaChange = async (pedido, nuevaMaquina) => {
  //   try {
  //     await supabase.rpc('editar_pedido', {
  //       p_id: pedido.id_pedido,
  //       p_tipo_maquina: nuevaMaquina
  //     });
  //     // Refrescar pedidos manteniendo filtros y ordenamiento
  //     await refreshPedidosWithFilters();
  //   } catch {
  //     alert('Error al actualizar la máquina');
  //   }
  // };

  const handleVectorizacionChange = async (pedido, nuevaVectorizacion) => {
    try {
      // Actualización optimista: cambiar inmediatamente en la UI
      setPedidos(prevPedidos => {
        const updatedPedidos = prevPedidos.map(p => 
          p.id_pedido === pedido.id_pedido 
            ? { ...p, vectorizacion: nuevaVectorizacion }
            : p
        );
        
        // Re-aplicar ordenamiento local
        return aplicarOrdenamientoLocal(updatedPedidos);
      });
      
      // Actualizar en BD en segundo plano
      await supabase.rpc('editar_pedido', {
        p_id: pedido.id_pedido,
        p_vectorizacion: nuevaVectorizacion
      });
      
    } catch (error) {
      // Si hay error, revertir el cambio optimista
      console.error('Error al actualizar la vectorización:', error);
      alert('Error al actualizar la vectorización');
      // Refrescar para asegurar consistencia
      await refreshPedidosWithFilters();
    }
  };

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
            
          case 'vectorizacion':
            const valA = a.vectorizacion || '';
            const valB = b.vectorizacion || '';
            comparison = valA.localeCompare(valB);
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

  const hayFiltrosActivos = filters && Object.values(filters).some((filtro) => filtro !== "" && filtro !== null && (!Array.isArray(filtro) || filtro.length > 0));

  // Campos disponibles para ordenamiento en producción
  const sortFields = [
    { value: 'fecha_compra', label: 'Fecha de compra' },
    { value: 'estado_fabricacion', label: 'Estado de fabricación' },
    { value: 'vectorizacion', label: 'Vectorización' },
    { value: 'id_programa', label: 'Programado' }
  ];

  const handleApplySort = () => {
    // Refrescar pedidos con el nuevo ordenamiento
    refreshPedidosWithFilters();
    setSortAplicado(true);
  };

  // ===== FUNCIÓN DE FORMATEO DE FECHAS =====
  /*
   * formatearFechaEspanol: Convierte una fecha ISO a formato español legible
   * 
   * Parámetros:
   * - fechaISO: String de fecha en formato ISO (ej: "2025-08-07")
   * 
   * Retorna:
   * - String formateado en español (ej: "7 de agosto del 2025")
   * - "-" si la fecha es inválida o no existe
   * 
   * Características del formato:
   * - Día en número (sin ceros a la izquierda)
   * - Preposición "de" entre día y mes
   * - Mes completo en español (enero, febrero, etc.)
   * - Preposición "del" antes del año
   * - Año completo de 4 dígitos
   */
  const formatearFechaEspanol = (fechaISO) => {
    if (!fechaISO) return '-';
    
    try {
      const fecha = new Date(fechaISO);
      
      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) return '-';
      
      // Array de meses en español
      const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      
      const dia = fecha.getDate();           // Día del mes (1-31)
      const mes = meses[fecha.getMonth()];   // Mes en español
      const año = fecha.getFullYear();       // Año completo
      
      // Retornar fecha formateada en español
      return `${dia} de ${mes} del ${año}`;
      
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return '-';
    }
  };

  // Cargar configuración de vista al montar
  useEffect(() => {
    if (!user || authLoading) return;
    async function fetchVista() {
      const config = await cargarVistaUsuario('produccion', user);
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

  // Guardar la vista solo cuando se aplica el sort
  useEffect(() => {
    if (sortAplicado && configCargada && user) {
      guardarVistaUsuario(user, 'produccion', {
        filtros: filters,
        orden: multiSort.sortCriteria,
        ordenEstadosFabricacion
      });
      setSortAplicado(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortAplicado]);

  // Guardar la vista solo cuando se aplican los filtros (debouncedFilters cambia, pero no en cada input)
  useEffect(() => {
    if (configCargada && user) {
      guardarVistaUsuario(user, 'produccion', {
        filtros: debouncedFilters,
        orden: multiSort.sortCriteria,
        ordenEstadosFabricacion
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters]);

  // Función para mover un estado hacia arriba o abajo
  const moverEstado = (index, direccion) => {
    setOrdenEstadosFabricacion(prev => {
      const nuevoOrden = [...prev];
      const newIndex = index + direccion;
      if (newIndex < 0 || newIndex >= nuevoOrden.length) return nuevoOrden;
      [nuevoOrden[index], nuevoOrden[newIndex]] = [nuevoOrden[newIndex], nuevoOrden[index]];
      return nuevoOrden;
    });
  };

  return (
    <div className="produccion-page">
      <div className="produccion-header">
        <div className="produccion-header-content">
          <div className="produccion-header-left">
            <div className="produccion-header-title">
              <div className="produccion-header-icon">
                <Package style={{ width: '20px', height: '20px', color: 'black' }} />
              </div>
              <div className="produccion-header-text">
                <h1>Producción</h1>
                <p>{pedidos.length} activos</p>
              </div>
            </div>
          </div>
          <div className="produccion-header-right">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button
              onClick={() => setSortModalOpen(true)}
              className={`sort-button ${multiSort.sortCriteria.length > 0 ? 'active' : ''}`}
            >
              <ArrowUpDown style={{ width: '16px', height: '16px' }} />
              Ordenar
              {multiSort.sortCriteria.length > 0 && (
                <span className="sort-badge">
                  {multiSort.sortCriteria.length}
                </span>
              )}
            </button>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`filter-button ${hayFiltrosActivos ? 'active' : ''}`}
              >
                <Filter style={{ width: '16px', height: '16px' }} />
              </button>
              {showFilterPanel && (
                <div className="filter-panel">
                  <div className="filter-panel-header">
                    <div className="filter-panel-title">
                      <div className="filter-panel-indicator"></div>
                      <h3>Filtros</h3>
                    </div>
                    {hayFiltrosActivos && (
                      <button
                        onClick={onClearFilters}
                        className="clear-filters-button"
                      >
                        <X style={{ width: '12px', height: '12px' }} />
                        Limpiar
                      </button>
                    )}
                  </div>
                  <FilterPanel
                    filterOptions={{ ...filterOptions, estado_fabricacion: ordenEstadosFabricacion }}
                    filters={filters}
                    setFilters={setFilters}
                    onClear={onClearFilters}
                    isExpanded={showFilterPanel}
                    onToggle={() => setShowFilterPanel(!showFilterPanel)}
                    showHeader={false}
                    visibleFilters={['fecha', 'estado_fabricacion']}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <AddPedidoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onPedidoAdded={handlePedidoAdded} />
      
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
        ordenEstadosFabricacion={ordenEstadosFabricacion}
        setOrdenEstadosFabricacion={setOrdenEstadosFabricacion}
      />
      
      <div className="table-container">
        <div className="table-wrapper">
          <div className="table-scroll">
            <table className="produccion-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Diseño</th>
                  <th>Medida</th>
                  <th>Notas</th>
                  <th>Estado</th>
                  <th className="min-width-80">Vectorización</th>
                  <th className="min-width-140">Programado</th>
                  <th className="center min-width-220">Base</th>
                  <th className="center">Vector</th>
                  <th className="center">F Sello</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="loading-cell">Cargando...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="10" className="error-cell">Error: {error}</td>
                  </tr>
                ) : pedidos.length > 0 ? (
                  pedidos.map((pedido) => (
                    <tr key={pedido.id_pedido}>
                      <td>
                        <span className="cell-date">
                          {formatearFechaEspanol(pedido.fecha_compra)}
                        </span>
                      </td>
                      <td>
                        <div>
                          <span className="cell-text">{pedido.disenio || "Sin especificar"}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span className="cell-text">{pedido.medida_pedida || "Sin medida"}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span className="cell-text">{pedido.notas || " "}</span>
                        </div>
                      </td>
                      <td className="min-width-220">
                        <div className="estado-container">
                          <EstadoSelect
                            value={pedido.estado_fabricacion}
                            onChange={val => handleEstadoChange(pedido, 'estado_fabricacion', val)}
                            options={ordenEstadosFabricacion}
                            type="fabricacion"
                            isDisabled={false}
                            size="small"
                            className="estado-select"
                          />
                        </div>
                      </td>
                      <td className="min-width-80">
                        <EstadoSelect
                          value={pedido.vectorizacion || 'Para Vectorizar'}
                          onChange={val => handleVectorizacionChange(pedido, val)}
                          options={['Para Vectorizar', 'Vectorizado']}
                          type="vectorizacion"
                          isDisabled={false}
                          size="small"
                          className="vectorizacion-select"
                        />
                      </td>
                      <td>
                        <span className="cell-programado">
                          {pedido.id_programa ?? ' '}
                        </span>
                      </td>
                      <td className="center">
                        <ArchivoCell
                          filePath={pedido.archivo_base}
                          nombre="Archivo Base"
                          pedidoId={pedido.id_pedido}
                          field="archivo_base"
                          onUpload={refreshPedidosWithFilters}
                        />
                      </td>
                      <td className="center">
                        <ArchivoCell
                          filePath={pedido.archivo_vector}
                          nombre="Archivo Vector"
                          pedidoId={pedido.id_pedido}
                          field="archivo_vector"
                          onUpload={refreshPedidosWithFilters}
                        />
                      </td>
                      <td className="center">
                        <ArchivoCell
                          filePath={pedido.foto_sello}
                          nombre="Foto Sello"
                          pedidoId={pedido.id_pedido}
                          field="foto_sello"
                          onUpload={refreshPedidosWithFilters}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="empty-cell">No se encontraron pedidos.</td>
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

// Componente para gestión de archivos estilo estetica.txt
function ArchivoCell({ filePath, nombre, pedidoId, field, onUpload, onDelete, _editing }) {
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
      const { error } = await supabase.storage
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
    } catch {
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
      <div className="archivo-cell">
        <label className="upload-button">
          <Upload style={{ width: '12px', height: '12px' }} />
          {field === 'foto_sello' ? 'Foto' : 'Subir'}
          <input
            type="file"
            onChange={handleFileUpload}
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
    // Para SVG y vectores, usar object-fit: contain para mostrar completo
    const objectFit = field === 'archivo_vector' ? 'contain' : 'cover';
    
    return (
      <div className="archivo-image-container">
        <div
          className="archivo-image-wrapper"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <a href={signedUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={signedUrl}
              alt={nombre}
              className={`archivo-image ${field === 'archivo_vector' ? 'vector' : 'base'}`}
            />
          </a>
          {isHovered && (
            <div className="archivo-image-overlay">
              <button
                onClick={handleDownload}
                className="archivo-overlay-button"
              >
                Ver
              </button>
              <button
                onClick={handleDelete}
                className="archivo-overlay-button delete"
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
        className="archivo-button"
      >
        <Upload style={{ width: '12px', height: '12px' }} />
        {field === 'foto_sello' ? 'Foto' : 'Ver'}
      </button>
    </div>
  );
}

function MaquinaSelect({ value, onChange }) {
  return (
    <div className="maquina-select">
      {['G', 'C'].map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`maquina-option ${value === opt ? 'active' : ''}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default ProduccionPage; 