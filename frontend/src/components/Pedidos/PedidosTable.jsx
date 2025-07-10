import React from 'react';
import PedidoRow from './PedidoRow'; // Componente que renderiza una fila de pedido
import './PedidosTable.css'; // Estilos CSS para la tabla

// Datos de ejemplo (mock), podés reemplazarlos con datos reales desde Supabase
const pedidosMock = [
  {
    nombre: 'Joaquin',
    apellido: 'Vai',
    fecha: '29/6/2025',
    disenoTitulo: 'Sin especificar',
    disenoSubtitulo: 'Sin notas',
    contacto: 'Whatsapp',
    telefono: '0223153461733',
    valor: 40000,
    restante: 42000,
    sena: 2000,
    envio: 4000,
    base: '',
    vector: '',
    fSello: '',
    seguimiento: '0223153461733',
  },
];

const PedidosTable = () => {
  return (
    // Wrapper para hacer la tabla desplazable horizontalmente en pantallas chicas
    <div className="pedidos-table-wrapper">
      <table className="pedidos-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Diseño</th>
            <th>Contacto</th>
            <th>Valor</th>
            <th>Seña</th>         {/* ✅ Columna separada */}
            <th>Envío</th>         {/* ✅ Incluye valor + estado de envío */}
            <th>Estado</th>        {/* ✅ Unificada: fabricación + venta */}
            <th>Base</th>
            <th>Vector</th>
            <th>F Sello</th>
            <th>Seguimiento</th>
          </tr>
        </thead>

        <tbody>
          {/* Iteramos sobre los pedidos y renderizamos cada uno con el componente PedidoRow */}
          {pedidosMock.map((pedido, idx) => (
            <PedidoRow key={idx} pedido={pedido} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PedidosTable;
