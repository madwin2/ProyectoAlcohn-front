import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth'; // Ajusta la ruta si es necesario

console.log('*** useGuardarVistaUsuario.js CARGADO ***');

// Cargar la configuración guardada del usuario para una página
export async function cargarVistaUsuario(pagina, user) {
  if (!user) return null;
  const { data, error } = await supabase
    .from('vistas_usuario')
    .select('configuracion')
    .eq('usuario_id', user.id)
    .eq('pagina', pagina)
    .eq('nombre_vista', 'default')
    .single();
  if (error) return null;
  return data?.configuracion || null;
}

// Hook para guardar automáticamente la configuración cada vez que cambie
export function useGuardarVistaUsuario(pagina, configuracion, habilitado = true) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!user || loading || !habilitado) return; // Esperar a que el usuario esté disponible y habilitado
    console.log('useGuardarVistaUsuario useEffect disparado', { pagina, configuracion, user });
    const guardar = async () => {
      console.log('Intentando guardar vista', { user, pagina, configuracion });
      const { error } = await supabase
        .from('vistas_usuario')
        .upsert([
          {
            usuario_id: user.id,
            pagina,
            nombre_vista: 'default',
            configuracion,
            actualizado_en: new Date().toISOString()
          }
        ], { onConflict: ['usuario_id', 'pagina', 'nombre_vista'] });
      if (error) {
        console.error('Error al guardar vista:', error);
      } else {
        console.log('Vista guardada correctamente');
      }
    };
    guardar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, habilitado, pagina, JSON.stringify(configuracion)]);
}

// Nueva función normal para guardar la vista del usuario
export async function guardarVistaUsuario(user, pagina, configuracion) {
  if (!user) return;
  try {
    const { error } = await supabase
      .from('vistas_usuario')
      .upsert([
        {
          usuario_id: user.id,
          pagina,
          nombre_vista: 'default',
          configuracion,
          actualizado_en: new Date().toISOString()
        }
      ], { onConflict: ['usuario_id', 'pagina', 'nombre_vista'] });
    if (error) {
      console.error('Error al guardar vista:', error);
    } else {
      console.log('Vista guardada correctamente');
    }
  } catch (err) {
    console.error('Error inesperado al guardar vista:', err);
  }
} 