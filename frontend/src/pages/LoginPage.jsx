import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { User, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const { signIn, loading, error, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      window.location.href = '/';
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores al escribir
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Validaciones básicas
    if (!formData.email || !formData.password) {
      setLocalError('Por favor completa todos los campos');
      return;
    }

    if (!formData.email.includes('@')) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }

    const result = await signIn(formData.email, formData.password);
    if (result.error) {
      setLocalError(getErrorMessage(result.error));
    }
  };

  const getErrorMessage = (error) => {
    if (error.includes('Invalid login credentials')) {
      return 'Email o contraseña incorrectos';
    }
    if (error.includes('Email not confirmed')) {
      return 'Email no confirmado. Revisa tu bandeja de entrada';
    }
    if (error.includes('Too many requests')) {
      return 'Demasiados intentos. Espera unos minutos';
    }
    return 'Error al iniciar sesión. Intenta nuevamente';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(9, 9, 11, 0.95)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(39, 39, 42, 0.5)',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'white',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <LogIn style={{ width: '28px', height: '28px', color: 'black' }} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '300',
            letterSpacing: '-0.025em',
            color: 'white',
            margin: '0 0 8px 0'
          }}>
            Iniciar Sesión
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#a1a1aa',
            margin: 0
          }}>
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>

        {/* Error Display */}
        {(localError || error) && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle style={{ width: '16px', height: '16px', color: '#fca5a5', flexShrink: 0 }} />
            <span style={{ color: '#fca5a5', fontSize: '14px' }}>
              {localError || error}
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white',
              marginBottom: '8px'
            }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <User style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#a1a1aa'
              }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tu@email.com"
                style={{
                  width: '100%',
                  background: 'rgba(39, 39, 42, 0.5)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  borderRadius: '8px',
                  padding: '12px 12px 12px 40px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white',
              marginBottom: '8px'
            }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#a1a1aa'
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'rgba(39, 39, 42, 0.5)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  borderRadius: '8px',
                  padding: '12px 40px 12px 40px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '4px',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = '#a1a1aa'}
              >
                {showPassword ? 
                  <EyeOff style={{ width: '16px', height: '16px' }} /> : 
                  <Eye style={{ width: '16px', height: '16px' }} />
                }
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'rgba(59, 130, 246, 0.5)' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = '#3b82f6';
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn style={{ width: '16px', height: '16px' }} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          padding: '20px 0',
          borderTop: '1px solid rgba(39, 39, 42, 0.5)'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#71717a',
            margin: 0
          }}>
            Sistema de Gestión Alcohn
          </p>
        </div>
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoginPage;