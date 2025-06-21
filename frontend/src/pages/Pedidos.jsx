import React from 'react';
import './Pedidos.css';

const Pedidos = () => {
  return (
    <div className="pedidos-container">
      <h1>Gestión de Pedidos</h1>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* Las filas de datos se agregarán aquí más adelante */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pedidos; 