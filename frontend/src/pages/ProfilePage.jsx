import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../supabaseClient';
import { 
  User, 
  Mail, 
  Calendar, 
  Save, 
  LogOut, 
  Settings, 
  Eye,
  Database,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const ProfilePage = () => {
  const { user, loading, updateProfile, signOut, loadUserView, saveUserView } = useAuth();
  const [formData, setFormData] = useState({
    nombre: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [userViews, setUserViews] = useState([]);

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        nombre: user.profile.nombre || ''
      });
    }
  }, [user]);

  useEffect(() => {
    loadUserViews();
  }, [user]);

  const loadUserViews = async () => {
    if (!user) return;
    
    try {
      // Por ahora, simular vistas desde localStorage
      // TODO: Implementar desde base de datos después
      const views = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`user_view_${user.id}_`)) {
          const parts = key.split('_');
          if (parts.length >= 4) {
            views.push({
              id: i,
              pagina: parts[3],
              nombre_vista: parts[4] || 'default',
              actualizado_en: new Date().toISOString()
            });
          }
        }
      }
      setUserViews(views);
    } catch (err) {
      console.error('Error cargando vistas:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await updateProfile(formData);
      
      if (error) {
        setMessage({ type: 'error', text: error });
      } else {
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        setIsEditing(false);
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await signOut();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#a1a1aa', fontSize: '16px' }}>
          Cargando perfil...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: 'white',
      padding: '32px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'white',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User style={{ width: '20px', height: '20px', color: 'black' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '300',
              letterSpacing: '-0.025em',
              margin: '0 0 4px 0'
            }}>
              Perfil de Usuario
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#a1a1aa',
              margin: 0
            }}>
              Gestiona tu información personal y configuraciones
            </p>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div style={{
            background: message.type === 'error' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${message.type === 'error' ? 'rgba(220, 38, 38, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {message.type === 'error' ? 
              <AlertCircle style={{ width: '16px', height: '16px', color: '#fca5a5' }} /> :
              <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
            }
            <span style={{ 
              color: message.type === 'error' ? '#fca5a5' : '#10b981', 
              fontSize: '14px' 
            }}>
              {message.text}
            </span>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px'
        }}>
          {/* Información Personal */}
          <div style={{
            background: 'rgba(9, 9, 11, 0.95)',
            border: '1px solid rgba(39, 39, 42, 0.5)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '500',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Settings style={{ width: '18px', height: '18px' }} />
                Información Personal
              </h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  background: isEditing ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  border: isEditing ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(59, 130, 246, 0.5)',
                  color: isEditing ? '#ef4444' : '#3b82f6',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {isEditing ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Email (solo lectura) */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#a1a1aa',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Email
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(39, 39, 42, 0.3)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  borderRadius: '6px',
                  padding: '10px 12px'
                }}>
                  <Mail style={{ width: '14px', height: '14px', color: '#a1a1aa' }} />
                  <span style={{ color: '#a1a1aa', fontSize: '14px' }}>
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#a1a1aa',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Nombre
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      background: 'rgba(39, 39, 42, 0.5)',
                      border: '1px solid rgba(63, 63, 70, 0.5)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(39, 39, 42, 0.3)',
                    border: '1px solid rgba(63, 63, 70, 0.5)',
                    borderRadius: '6px',
                    padding: '10px 12px'
                  }}>
                    <User style={{ width: '14px', height: '14px', color: '#a1a1aa' }} />
                    <span style={{ color: 'white', fontSize: '14px' }}>
                      {user.profile?.nombre || 'Sin nombre'}
                    </span>
                  </div>
                )}
              </div>

              {/* Fecha de registro */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#a1a1aa',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Miembro desde
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(39, 39, 42, 0.3)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  borderRadius: '6px',
                  padding: '10px 12px'
                }}>
                  <Calendar style={{ width: '14px', height: '14px', color: '#a1a1aa' }} />
                  <span style={{ color: '#a1a1aa', fontSize: '14px' }}>
                    {formatDate(user.created_at)}
                  </span>
                </div>
              </div>

              {/* Botón de guardar */}
              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: saving ? 'rgba(16, 185, 129, 0.5)' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px'
                  }}
                >
                  <Save style={{ width: '14px', height: '14px' }} />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              )}
            </div>
          </div>

          {/* Configuraciones */}
          <div style={{
            background: 'rgba(9, 9, 11, 0.95)',
            border: '1px solid rgba(39, 39, 42, 0.5)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '500',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Shield style={{ width: '18px', height: '18px' }} />
              Configuración
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Estadísticas de vistas guardadas */}
              <div style={{
                background: 'rgba(39, 39, 42, 0.3)',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <Eye style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                    Vistas Guardadas
                  </span>
                </div>
                <p style={{
                  color: '#a1a1aa',
                  fontSize: '13px',
                  margin: '0 0 8px 0'
                }}>
                  Configuraciones personalizadas de páginas
                </p>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'inline-block'
                }}>
                  <span style={{ color: '#60a5fa', fontSize: '12px', fontWeight: '500' }}>
                    {userViews.length} vistas guardadas
                  </span>
                </div>
              </div>

              {/* ID de usuario */}
              <div style={{
                background: 'rgba(39, 39, 42, 0.3)',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <Database style={{ width: '16px', height: '16px', color: '#a1a1aa' }} />
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                    ID de Usuario
                  </span>
                </div>
                <p style={{
                  color: '#71717a',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  margin: 0,
                  wordBreak: 'break-all'
                }}>
                  {user.id}
                </p>
              </div>

              {/* Última actividad */}
              <div style={{
                background: 'rgba(39, 39, 42, 0.3)',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <Clock style={{ width: '16px', height: '16px', color: '#a1a1aa' }} />
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                    Última Actividad
                  </span>
                </div>
                <p style={{
                  color: '#a1a1aa',
                  fontSize: '13px',
                  margin: 0
                }}>
                  {formatDate(user.last_sign_in_at || user.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de cerrar sesión */}
        <div style={{
          marginTop: '32px',
          padding: '24px 0',
          borderTop: '1px solid rgba(39, 39, 42, 0.5)',
          textAlign: 'center'
        }}>
          <button
            onClick={handleSignOut}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#ef4444',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.3)';
              e.target.style.borderColor = 'rgba(239, 68, 68, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.2)';
              e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;