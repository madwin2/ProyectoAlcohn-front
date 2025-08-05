import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronRight, FiHome, FiBox } from "react-icons/fi";
import { Shapes, Computer, CheckCircle, MessageSquare } from "lucide-react";
import { useAuth } from '../hooks/useAuth.jsx';
import { useTareasPendientes } from '../hooks/useTareasPendientes';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [fixed, setFixed] = useState(false);
  
  // Hook para tareas pendientes
  const { totalTareasPendientes } = useTareasPendientes();
  const { user, signOut } = useAuth();

  const isExpanded = expanded || fixed;

  const navItems = [
    { to: "/", label: "Inicio", icon: <FiHome /> },
    { to: "/pedidos", label: "Pedidos", icon: <FiBox /> },
    { to: "/vectorizacion", label: "Vectorización", icon: <Shapes /> },
    { to: "/produccion", label: "Producción", icon: <FiBox /> },
    { to: "/programas", label: "Programas", icon: <Computer /> },
    { to: "/verificacion", label: "Verificación", icon: <CheckCircle /> },
    { to: "/whatsapp-bot", label: "WhatsApp Bot", icon: <MessageSquare /> }
  ];

  return (
    <aside
      className={`sidebar-container ${isExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={() => !fixed && setExpanded(true)}
      onMouseLeave={() => !fixed && setExpanded(false)}
    >
      {/* Botón para fijar/desfijar expansión */}
      <button
        className={`pin-button ${isExpanded ? "rotated" : ""}`}
        onClick={() => setFixed(f => !f)}
        tabIndex={0}
        aria-label={fixed ? "Desfijar barra lateral" : "Fijar barra lateral"}
      >
        <FiChevronRight className="text-white" />
      </button>
      
      <div className={`sidebar-content ${isExpanded ? 'scrollable' : ''}`}>
        {/* Logo o título */}
        <div className="sidebar-logo">
          <span className="logo-icon">{navItems[0].icon}</span>
          {isExpanded && <span className="logo-text">Alcohn AI</span>}
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item ${location.pathname === item.to ? 'active' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}
              tabIndex={0}
              aria-label={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {isExpanded && <span className="nav-label">{item.label}</span>}
              {/* Contador de tareas pendientes para la página de pedidos */}
              {item.to === "/pedidos" && totalTareasPendientes > 0 && (
                <span className="tareas-badge">
                  {totalTareasPendientes}
                </span>
              )}
            </Link>
          ))}
        </nav>
        {/* User Section simplificada */}
        <div className="sidebar-user" style={{
          marginTop: 'auto',
          padding: isExpanded ? '16px' : '8px',
          borderTop: '1px solid rgba(39, 39, 42, 0.5)',
          display: 'flex',
          flexDirection: isExpanded ? 'column' : 'row',
          alignItems: isExpanded ? 'flex-start' : 'center',
          gap: isExpanded ? '8px' : '0'
        }}>
          {user && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: '#3b82f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  flexShrink: 0
                }}>
                  {(user.profile?.nombre || user.email)?.[0]?.toUpperCase() || 'U'}
                </div>
                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontWeight: 500, color: 'white', fontSize: '15px', lineHeight: 1, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.profile?.nombre || user.email?.split('@')[0] || 'Usuario'}
                    </span>
                    <span style={{ color: '#a1a1aa', fontSize: '12px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </span>
                  </div>
                )}
              </div>
              {isExpanded && (
                <button
                  onClick={async () => {
                    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                      await signOut();
                    }
                  }}
                  style={{
                    marginTop: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    padding: '6px 0',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 500,
                    width: '100%'
                  }}
                >
                  Cerrar Sesión
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
} 