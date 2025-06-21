import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Alcohn AI</h3>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <Link to="/pedidos">Pedidos</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 