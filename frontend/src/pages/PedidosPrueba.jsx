import React from 'react';
import './PedidosPrueba.css';
import PedidosTable from '../components/Pedidos/PedidosTable';

const PedidosPrueba = () => {
  return (
    <div className="pedidos-prueba-container">
      <h1>Pedidos Prueba</h1>
      <p>Esta es una página de prueba para experimentar con los componentes de Pedidos.</p>
      <PedidosTable />
    </div>
  );
};

export default PedidosPrueba; 