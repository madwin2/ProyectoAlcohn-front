import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        console.log('Obteniendo sesión inicial...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        console.log('Sesión obtenida:', session?.user?.email || 'No hay sesión');
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          console.log('No hay usuario autenticado');
        }
      } catch (err) {
        console.error('Error obteniendo sesión inicial:', err);
        setError(err.message);
      } finally {
        console.log('Finalizando carga inicial');
        setLoading(false);
      }
    };

    getInitialSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser) => {
    try {
      // Por ahora, solo usar el usuario de auth sin tabla personalizada
      // TODO: Implementar tabla usuarios después
      const basicProfile = {
        id: authUser.id,
        nombre: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario',
        email: authUser.email
      };
      
      setUser({ ...authUser, profile: basicProfile });
    } catch (err) {
      console.error('Error cargando perfil de usuario:', err);
      setError(err.message);
      // Establecer el usuario auth sin perfil
      setUser({ ...authUser, profile: null });
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { user: data.user, error: null };
    } catch (err) {
      console.error('Error en login:', err);
      setError(err.message);
      return { user: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Error en logout:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      setError(null);

      if (!user) throw new Error('Usuario no autenticado');

      // Por ahora, solo actualizar el estado local
      // TODO: Implementar actualización en base de datos después
      setUser(prev => ({
        ...prev,
        profile: { ...prev.profile, ...updates }
      }));

      return { data: updates, error: null };
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const saveUserView = async (pagina, configuracion, nombreVista = 'default') => {
    try {
      if (!user) throw new Error('Usuario no autenticado');

      // Por ahora, solo guardar en localStorage
      // TODO: Implementar guardado en base de datos después
      const key = `user_view_${user.id}_${pagina}_${nombreVista}`;
      localStorage.setItem(key, JSON.stringify(configuracion));
      
      return { data: configuracion, error: null };
    } catch (err) {
      console.error('Error guardando vista:', err);
      return { data: null, error: err.message };
    }
  };

  const loadUserView = async (pagina, nombreVista = 'default') => {
    try {
      if (!user) return { data: null, error: 'Usuario no autenticado' };

      // Por ahora, cargar desde localStorage
      // TODO: Implementar carga desde base de datos después
      const key = `user_view_${user.id}_${pagina}_${nombreVista}`;
      const saved = localStorage.getItem(key);
      
      return { data: saved ? JSON.parse(saved) : null, error: null };
    } catch (err) {
      console.error('Error cargando vista:', err);
      return { data: null, error: err.message };
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut,
    updateProfile,
    saveUserView,
    loadUserView,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};