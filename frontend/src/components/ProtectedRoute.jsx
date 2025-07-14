import React from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import LoginPage from '../pages/LoginPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            fontSize: '14px',
            color: '#a1a1aa',
            margin: 0
          }}>
            Verificando autenticación...
          </p>
        </div>
        
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
  }

  // Si no hay usuario, mostrar página de login
  if (!user) {
    return <LoginPage />;
  }

  // Si hay usuario, mostrar el contenido protegido
  return children;
};

export default ProtectedRoute;