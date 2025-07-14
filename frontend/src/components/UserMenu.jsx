import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setIsOpen(false);
    window.location.href = '/profile';
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await signOut();
    }
  };

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(39, 39, 42, 0.5)',
          border: '1px solid rgba(63, 63, 70, 0.5)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(63, 63, 70, 0.5)';
          e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(39, 39, 42, 0.5)';
          e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)';
        }}
      >
        <div style={{
          width: '24px',
          height: '24px',
          background: '#3b82f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: '600',
          color: 'white'
        }}>
          {(user.profile?.nombre || user.email)?.[0]?.toUpperCase() || 'U'}
        </div>
        <span style={{
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {user.profile?.nombre || user.email?.split('@')[0] || 'Usuario'}
        </span>
        <ChevronDown style={{ 
          width: '14px', 
          height: '14px',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          background: 'rgba(9, 9, 11, 0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(39, 39, 42, 0.5)',
          borderRadius: '8px',
          padding: '8px',
          zIndex: 50,
          minWidth: '200px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}>
          {/* Header del menú */}
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid rgba(39, 39, 42, 0.5)',
            marginBottom: '8px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'white',
              marginBottom: '2px'
            }}>
              {user.profile?.nombre || 'Usuario'}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#a1a1aa'
            }}>
              {user.email}
            </div>
          </div>

          {/* Opciones del menú */}
          <button
            onClick={handleProfileClick}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'white',
              padding: '8px 12px',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(39, 39, 42, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            <User style={{ width: '14px', height: '14px' }} />
            Mi Perfil
          </button>

          <div style={{
            height: '1px',
            background: 'rgba(39, 39, 42, 0.5)',
            margin: '8px 0'
          }} />

          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              padding: '8px 12px',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;