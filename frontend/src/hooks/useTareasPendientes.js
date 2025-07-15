import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth';

export const useTareasPendientes = () => {
  const { user } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalTareasPendientes, setTotalTareasPendientes] = useState(0);

  // 1. Declarar primero obtenerTotalTareasPendientes
  const obtenerTotalTareasPendientes = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('contar_tareas_pendientes_usuario', {
        p_id_usuario: user.id
      });
      if (error) {
        console.error('Error al contar tareas pendientes:', error);
      } else {
        setTotalTareasPendientes(data?.[0]?.total_tareas || 0);
      }
    } catch (err) {
      console.error('Error al contar tareas pendientes:', err);
    }
  }, [user]);

  // 2. Luego el resto de funciones que la usan
  const obtenerTareasUsuario = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('obtener_tareas_usuario', {
        p_id_usuario: user.id
      });
      if (error) {
        console.error('Error al obtener tareas:', error);
        setError(error.message);
      } else {
        setTareas(data || []);
      }
    } catch (err) {
      console.error('Error al obtener tareas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const obtenerTareasPedido = useCallback(async (pedidoId) => {
    if (!pedidoId) return [];
    try {
      const { data, error } = await supabase.rpc('obtener_tareas_pedido', {
        p_id_pedido: pedidoId
      });
      if (error) {
        console.error('Error al obtener tareas del pedido:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Error al obtener tareas del pedido:', err);
      return [];
    }
  }, []);

  const crearTarea = useCallback(async (pedidoId, descripcion, posicionX = 0, posicionY = 0) => {
    if (!user || !pedidoId || !descripcion) return null;
    try {
      const { data, error } = await supabase.rpc('crear_tarea_pendiente', {
        p_id_pedido: pedidoId,
        p_id_usuario: user.id,
        p_descripcion: descripcion,
        p_posicion_x: posicionX,
        p_posicion_y: posicionY
      });
      if (error) {
        console.error('Error al crear tarea:', error);
        throw new Error(error.message);
      }
      if (data && data[0]?.success) {
        await obtenerTareasUsuario();
        await obtenerTotalTareasPendientes();
        return data[0];
      } else {
        throw new Error(data?.[0]?.message || 'Error al crear la tarea');
      }
    } catch (err) {
      console.error('Error al crear tarea:', err);
      throw err;
    }
  }, [user, obtenerTareasUsuario, obtenerTotalTareasPendientes]);

  const actualizarPosicionTarea = useCallback(async (tareaId, posicionX, posicionY) => {
    if (!tareaId) return;
    try {
      const { data, error } = await supabase.rpc('actualizar_posicion_tarea', {
        p_id_tarea: tareaId,
        p_posicion_x: posicionX,
        p_posicion_y: posicionY
      });
      if (error) {
        console.error('Error al actualizar posición:', error);
        throw new Error(error.message);
      }
      if (data && data[0]?.success) {
        setTareas(prev => prev.map(tarea => 
          tarea.id_tarea === tareaId 
            ? { ...tarea, posicion_x: posicionX, posicion_y: posicionY }
            : tarea
        ));
      } else {
        throw new Error(data?.[0]?.message || 'Error al actualizar posición');
      }
    } catch (err) {
      console.error('Error al actualizar posición:', err);
      throw err;
    }
  }, []);

  const completarTarea = useCallback(async (tareaId) => {
    if (!tareaId) return;
    try {
      const { data, error } = await supabase.rpc('completar_tarea', {
        p_id_tarea: tareaId
      });
      if (error) {
        console.error('Error al completar tarea:', error);
        throw new Error(error.message);
      }
      if (data && data[0]?.success) {
        setTareas(prev => prev.filter(tarea => tarea.id_tarea !== tareaId));
        await obtenerTotalTareasPendientes();
      } else {
        throw new Error(data?.[0]?.message || 'Error al completar tarea');
      }
    } catch (err) {
      console.error('Error al completar tarea:', err);
      throw err;
    }
  }, [obtenerTotalTareasPendientes]);

  const eliminarTarea = useCallback(async (tareaId) => {
    if (!tareaId) return;
    try {
      const { data, error } = await supabase.rpc('eliminar_tarea', {
        p_id_tarea: tareaId
      });
      if (error) {
        console.error('Error al eliminar tarea:', error);
        throw new Error(error.message);
      }
      if (data && data[0]?.success) {
        setTareas(prev => prev.filter(tarea => tarea.id_tarea !== tareaId));
        await obtenerTotalTareasPendientes();
      } else {
        throw new Error(data?.[0]?.message || 'Error al eliminar tarea');
      }
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      throw err;
    }
  }, [obtenerTotalTareasPendientes]);

  useEffect(() => {
    if (user) {
      obtenerTareasUsuario();
      obtenerTotalTareasPendientes();
    }
  }, [user, obtenerTareasUsuario, obtenerTotalTareasPendientes]);

  return {
    tareas,
    loading,
    error,
    totalTareasPendientes,
    obtenerTareasUsuario,
    obtenerTareasPedido,
    crearTarea,
    actualizarPosicionTarea,
    completarTarea,
    eliminarTarea,
    obtenerTotalTareasPendientes
  };
}; 