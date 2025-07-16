import { useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { getInclusiveEndDateISOString } from '../utils/pedidosUtils';

export const usePedidosApi = ({
  sortOrder,
  debouncedSearchTerm,
  debouncedFilters,
  editForm,
  _editingId,
  setPedidos,
  setLoading,
  setError,
  setFilterOptions,
  setEditingId,
  setEditForm,
  setContextMenu,
  sortCriteria
}) => {
  // Memoizar los criterios de orden para evitar recreaciones innecesarias
  const stableSortCriteria = useMemo(() => {
    return Array.isArray(sortCriteria) 
      ? sortCriteria.map(c => ({ field: c.field, order: c.order }))
      : [];
  }, [sortCriteria]);
  
  // Obtener opciones de filtros
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
    
    // Return cleanup function
    return () => {};
  }, [setFilterOptions]);

  const getPedidos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar RPC optimizada para búsqueda de pedidos con ordenamiento múltiple
      const { data, error: fetchError } = await supabase.rpc('buscar_pedidos_ordenado_multiple', {
        termino_busqueda: debouncedSearchTerm || '',
        filtro_estado_fabricacion: debouncedFilters.estado_fabricacion.length === 1 ? debouncedFilters.estado_fabricacion[0] : '',
        filtro_estado_venta: debouncedFilters.estado_venta.length === 1 ? debouncedFilters.estado_venta[0] : '',
        filtro_estado_envio: debouncedFilters.estado_envio.length === 1 ? debouncedFilters.estado_envio[0] : '',
        filtro_fecha_desde: debouncedFilters.fecha_compra_gte || null,
        filtro_fecha_hasta: debouncedFilters.fecha_compra_lte || null,
        limite_resultados: 500,
        criterios_orden: stableSortCriteria
      });

      if (fetchError) throw fetchError;

      // Transformar los datos para mantener compatibilidad con la estructura anterior
      const pedidosTransformados = (data || []).map(pedido => {
        return {
          ...pedido,
          clientes: {
            nombre_cliente: pedido.nombre_cliente,
            apellido_cliente: pedido.apellido_cliente,
            telefono_cliente: pedido.telefono_cliente,
            medio_contacto: pedido.medio_contacto
          }
        };
      });

      // No aplicar ordenamiento aquí, se hará en el componente padre
      // Solo aplicar ordenamiento básico por fecha si no hay criterios específicos
      if (stableSortCriteria.length === 0 && sortOrder === 'asc') {
        pedidosTransformados.sort((a, b) => new Date(a.fecha_compra) - new Date(b.fecha_compra));
      }

      // Aplicar filtros múltiples que la RPC no soporta directamente
      let pedidosFiltrados = pedidosTransformados;
      
      if (debouncedFilters.estado_fabricacion.length > 1) {
        pedidosFiltrados = pedidosFiltrados.filter(p => 
          debouncedFilters.estado_fabricacion.includes(p.estado_fabricacion)
        );
      }
      
      if (debouncedFilters.estado_venta.length > 1) {
        pedidosFiltrados = pedidosFiltrados.filter(p => 
          debouncedFilters.estado_venta.includes(p.estado_venta)
        );
      }
      
      if (debouncedFilters.estado_envio.length > 1) {
        pedidosFiltrados = pedidosFiltrados.filter(p => 
          debouncedFilters.estado_envio.includes(p.estado_envio)
        );
      }

      setPedidos(pedidosFiltrados);
    } catch (err) {
      console.error("Error al obtener pedidos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sortOrder, debouncedSearchTerm, debouncedFilters, setPedidos, setLoading, setError, stableSortCriteria]);

  const handlePedidoAdded = () => {
    getPedidos();
  };

  const startEdit = (pedido) => {
    setEditingId(pedido.id_pedido);
    setEditForm({
      fecha_compra: pedido.fecha_compra || '',
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
  }, [setEditingId, setEditForm]);

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
  }, [editForm, getPedidos, setEditingId, setEditForm]);

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

  return {
    getPedidos,
    handlePedidoAdded,
    startEdit,
    cancelEdit,
    handleEditFormChange,
    saveEdit,
    handleEliminar,
    handleEliminarArchivo
  };
};