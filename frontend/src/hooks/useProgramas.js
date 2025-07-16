import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useProgramas = () => {
  const [programas, setProgramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener URL pública
  const publicUrl = (path) => {
    if (!path) return null;
    if (Array.isArray(path)) path = path[0];
    if (!path) return null;
    return supabase.storage.from('archivos-ventas').getPublicUrl(path).data.publicUrl;
  };

  // Fetch programas usando RPC optimizado
  const fetchProgramas = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_programas_activos');
      
      if (error) {
        throw error;
      }
      
      setProgramas(data || []);
    } catch (err) {
      console.error('Error fetching programas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Crear programa
  const crearPrograma = async (programaData) => {
    try {
      const { data, error } = await supabase
        .from('programas')
        .insert([programaData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error creando programa:', err);
      throw err;
    }
  };

  // Actualizar programa
  const actualizarPrograma = async (id, updateData) => {
    try {
      const { data, error } = await supabase
        .from('programas')
        .update(updateData)
        .eq('id_programa', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Actualizar estado local
      setProgramas(prev => 
        prev.map(p => p.id_programa === id ? { ...p, ...updateData } : p)
      );

      return data;
    } catch (err) {
      console.error('Error actualizando programa:', err);
      throw err;
    }
  };

  // Actualizar estado de programa y sus pedidos usando RPC
  const actualizarEstadoProgramaConPedidos = async (programaId, nuevoEstado) => {
    try {
      const { data, error } = await supabase.rpc('actualizar_estado_programa_con_pedidos', {
        p_programa_id: programaId,
        p_nuevo_estado: nuevoEstado
      });

      if (error) {
        throw error;
      }

      // Verificar que la operación fue exitosa
      const result = data?.[0];
      if (!result?.success) {
        throw new Error(result?.message || 'Error actualizando estado del programa y pedidos');
      }

      // Actualizar estado local
      setProgramas(prev => 
        prev.map(p => p.id_programa === programaId ? { ...p, estado_programa: nuevoEstado } : p)
      );

      return result;
    } catch (err) {
      console.error('Error actualizando estado del programa con pedidos:', err);
      throw err;
    }
  };

  // Eliminar programa usando RPC (desasocia pedidos automáticamente)
  const eliminarProgramaConPedidos = async (programaId) => {
    try {
      const { data, error } = await supabase.rpc('eliminar_programa_y_desasociar_pedidos', {
        p_programa_id: programaId
      });

      if (error) {
        throw error;
      }

      // Verificar que la operación fue exitosa
      const result = data?.[0];
      if (!result?.success) {
        throw new Error(result?.message || 'Error eliminando programa y desasociando pedidos');
      }

      // Actualizar estado local
      setProgramas(prev => prev.filter(p => p.id_programa !== programaId));

      return result;
    } catch (err) {
      console.error('Error eliminando programa con pedidos:', err);
      throw err;
    }
  };

  // Eliminar programa (función original - mantiene compatibilidad)
  const eliminarPrograma = async (id) => {
    try {
      const { error } = await supabase
        .from('programas')
        .delete()
        .eq('id_programa', id);

      if (error) {
        throw error;
      }

      // Actualizar estado local
      setProgramas(prev => prev.filter(p => p.id_programa !== id));
    } catch (err) {
      console.error('Error eliminando programa:', err);
      throw err;
    }
  };

  // Obtener pedidos disponibles para agregar a programa según tipo de máquina
  const obtenerPedidosDisponibles = async (tipoMaquina) => {
    try {
      let functionName;
      
      switch (tipoMaquina) {
        case 'C':
          functionName = 'get_pedidos_maquina_c';
          break;
        case 'G':
          functionName = 'get_pedidos_maquina_g';
          break;
        case 'XL':
          functionName = 'get_pedidos_maquina_xl';
          break;
        default:
          throw new Error(`Tipo de máquina no válido: ${tipoMaquina}`);
      }

      const { data, error } = await supabase.rpc(functionName);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Error obteniendo pedidos disponibles:', err);
      throw err;
    }
  };

  // Actualizar resumen de programa (tiempo_usado y largo_usado_xx)
  const actualizarResumenPrograma = async (programaId) => {
    try {
      const { data, error } = await supabase.rpc('actualizar_resumen_programa', {
        programa_id: programaId
      });

      if (error) {
        throw error;
      }

      // Si la actualización fue exitosa, actualizar el estado local
      if (data && data[0] && data[0].success) {
        setProgramas(prev => prev.map(programa => {
          if (programa.id_programa === programaId) {
            return {
              ...programa,
              tiempo_usado: data[0].tiempo_usado,
              largo_usado_38: data[0].largo_usado_38,
              largo_usado_25: data[0].largo_usado_25,
              largo_usado_19: data[0].largo_usado_19,
              largo_usado_12: data[0].largo_usado_12,
              largo_usado_63: data[0].largo_usado_63,
              updated_at: new Date().toISOString()
            };
          }
          return programa;
        }));
      }

      return data;
    } catch (err) {
      console.error('Error actualizando resumen del programa:', err);
      throw err;
    }
  };

  // Obtener pedidos de un programa específico
  const obtenerPedidosPrograma = async (programaId) => {
    try {
      const { data, error } = await supabase.rpc('get_pedidos_programa', {
        programa_id: programaId
      });

      if (error) {
        throw error;
      }

      // Transformar datos para mantener compatibilidad con estructura anterior
      const pedidosTransformados = (data || []).map(pedido => ({
        ...pedido,
        clientes: {
          nombre_cliente: pedido.nombre_cliente,
          apellido_cliente: pedido.apellido_cliente,
          telefono_cliente: pedido.telefono_cliente
        }
      }));

      return pedidosTransformados;
    } catch (err) {
      console.error('Error obteniendo pedidos del programa:', err);
      throw err;
    }
  };

  // Agregar pedido a programa usando RPC optimizado
  const agregarPedidoAPrograma = async (pedidoId, programaId) => {
    try {
      const { data, error } = await supabase.rpc('asignar_pedido_programa', {
        pedido_id: pedidoId,
        programa_id: programaId
      });

      if (error) {
        throw error;
      }

      // Verificar que la operación fue exitosa
      const result = data?.[0];
      if (!result?.success) {
        throw new Error(result?.message || 'Error asignando pedido al programa');
      }

      return result;
    } catch (err) {
      console.error('Error agregando pedido al programa:', err);
      throw err;
    }
  };

  // Remover pedido de programa usando RPC optimizado
  const removerPedidoDePrograma = async (pedidoId) => {
    try {
      const { data, error } = await supabase.rpc('remover_pedido_programa', {
        pedido_id: pedidoId
      });

      if (error) {
        throw error;
      }

      // Verificar que la operación fue exitosa
      const result = data?.[0];
      if (!result?.success) {
        throw new Error(result?.message || 'Error removiendo pedido del programa');
      }

      return result;
    } catch (err) {
      console.error('Error removiendo pedido del programa:', err);
      throw err;
    }
  };

  // Obtener estadísticas de programas
  const obtenerEstadisticas = () => {
    const stats = {
      total: programas.length,
      sinHacer: programas.filter(p => p.estado_programa === 'Sin Hacer').length,
      haciendo: programas.filter(p => p.estado_programa === 'Haciendo').length,
      verificar: programas.filter(p => p.estado_programa === 'Verificar').length,
      rehacer: programas.filter(p => p.estado_programa === 'Rehacer').length,
      hecho: programas.filter(p => p.estado_programa === 'Hecho').length,
      verificado: programas.filter(p => p.verificado).length,
      bloqueado: programas.filter(p => p.programa_bloqueado).length
    };

    return stats;
  };

  return {
    // Estado
    programas,
    loading,
    error,
    
    // Acciones
    fetchProgramas,
    crearPrograma,
    actualizarPrograma,
    actualizarEstadoProgramaConPedidos, // Nueva función RPC
    eliminarPrograma,
    eliminarProgramaConPedidos, // Nueva función RPC
    obtenerPedidosDisponibles,
    actualizarResumenPrograma, // Nueva función RPC
    obtenerPedidosPrograma,
    agregarPedidoAPrograma,
    removerPedidoDePrograma,
    obtenerEstadisticas,
    
    // Utils
    publicUrl
  };
};