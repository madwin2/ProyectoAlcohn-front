import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>Alcohn AI</h2>
      <nav>
        <ul>
          <li>
            <NavLink to="/">Inicio</NavLink>
          </li>
          <li>
            <NavLink to="/pedidos">Pedidos</NavLink>
          </li>
          {/* Aquí se pueden añadir más enlaces en el futuro */}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar; 