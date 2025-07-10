import React from 'react';
import './PedidosPrueba.css';
import { Table, TableHeader, TableHeaderCell } from '../components/ui/Table';

const PedidosPrueba = () => {
  // Datos de prueba
  const pedidosPrueba = [
    {
      id: 1,
      fecha: '2024-01-15',
      cliente: 'Juan Pérez',
      diseño: 'Logo Empresa',
      estado: 'En proceso'
    },
    {
      id: 2,
      fecha: '2024-01-16',
      cliente: 'María García',
      diseño: 'Sello Personal',
      estado: 'Completado'
    }
  ];

  return (
    <div className="pedidos-prueba-container">
      <h1>Pedidos Prueba</h1>
      <p>Esta es una página de prueba para experimentar con los componentes de Pedidos.</p>
      
      <div style={{ marginTop: '32px' }}>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Fecha</TableHeaderCell>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>Diseño</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
            </tr>
          </TableHeader>
          <tbody>
            {pedidosPrueba.map((pedido) => (
              <tr key={pedido.id} style={{ borderBottom: '1px solid rgba(39, 39, 42, 0.3)' }}>
                <td style={{ padding: '16px 12px', color: '#a1a1aa' }}>{pedido.id}</td>
                <td style={{ padding: '16px 12px', color: 'white' }}>{pedido.fecha}</td>
                <td style={{ padding: '16px 12px', color: 'white' }}>{pedido.cliente}</td>
                <td style={{ padding: '16px 12px', color: 'white' }}>{pedido.diseño}</td>
                <td style={{ padding: '16px 12px', color: '#10b981' }}>{pedido.estado}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default PedidosPrueba; 