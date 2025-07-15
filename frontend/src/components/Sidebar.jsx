import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronRight, FiHome, FiBox } from "react-icons/fi";
import { Shapes, Computer, CheckCircle } from "lucide-react";
import UserMenu from './UserMenu';
import { useTareasPendientes } from '../hooks/useTareasPendientes';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [fixed, setFixed] = useState(false);
  
  // Hook para tareas pendientes
  const { totalTareasPendientes } = useTareasPendientes();

  const isExpanded = expanded || fixed;

  const navItems = [
    { to: "/", label: "Inicio", icon: <FiHome /> },
    { to: "/pedidos", label: "Pedidos", icon: <FiBox /> },
    { to: "/vectorizacion", label: "Vectorización", icon: <Shapes /> },
    { to: "/produccion", label: "Producción", icon: <FiBox /> },
    { to: "/programas", label: "Programas", icon: <Computer /> },
    { to: "/verificacion", label: "Verificación", icon: <CheckCircle /> }
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
        
        {/* User Menu */}
        <div className="sidebar-user" style={{
          marginTop: 'auto',
          padding: isExpanded ? '16px' : '8px',
          borderTop: '1px solid rgba(39, 39, 42, 0.5)'
        }}>
          <UserMenu />
        </div>
      </div>
    </aside>
  );
} 