import React from 'react';
import './PedidoRow.css'; // Estilos específicos para esta fila

// Este componente representa una fila (tr) en la tabla de pedidos
const PedidoRow = ({ pedido }) => {
  // Opciones genéricas para los 3 estados (serán reemplazadas por datos reales de Supabase)
  const opcionesFabricacion = ['Sin Hacer', 'En proceso', 'Hecho'];
  const opcionesVenta = ['Foto', 'Transferido'];
  const opcionesEnvio = ['Sin Enviar', 'Hacer Etiqueta', 'Despachado'];

  return (
    <tr className="pedido-row">
      {/* Cliente: nombre y apellido */}
      <td>
        <div className="cliente">
          <span className="nombre">{pedido.nombre}</span>
          <span className="apellido">{pedido.apellido}</span>
        </div>
      </td>

      {/* Fecha */}
      <td>{pedido.fecha}</td>

      {/* Diseño */}
      <td>
        <div className="diseno">
          <span className="titulo">{pedido.disenoTitulo}</span>
          <span className="subtitulo">{pedido.disenoSubtitulo}</span>
        </div>
      </td>

      {/* Contacto */}
      <td>
        <div className="contacto">
          <span className="tipo-contacto">{pedido.contacto}</span>
          <span className="telefono">{pedido.telefono}</span>
        </div>
      </td>

      {/* Valor total y restante */}
      <td>
        <div className="valor">
          <span className="principal">${pedido.valor}</span>
          <span className="restante">Restante: ${pedido.restante}</span>
        </div>
      </td>

      {/* Seña */}
      <td>
        <div className="sena">
          ${pedido.sena}
        </div>
      </td>

      {/* Envío + estado envío */}
      <td>
        <div className="envio-estado">
          <div className="envio-valor">${pedido.envio}</div>
          <select defaultValue={pedido.estadoEnvio || ''}>
            {opcionesEnvio.map((op, i) => (
              <option key={i} value={op}>{op}</option>
            ))}
          </select>
        </div>
      </td>

      {/* Estado: Fabricación + Venta */}
      <td>
        <div className="estado-selects">
          <select defaultValue={pedido.estadoFabricacion || ''}>
            {opcionesFabricacion.map((op, i) => (
              <option key={i} value={op}>{op}</option>
            ))}
          </select>
          <select defaultValue={pedido.estadoVenta || ''}>
            {opcionesVenta.map((op, i) => (
              <option key={i} value={op}>{op}</option>
            ))}
          </select>
        </div>
      </td>

      {/* Archivos asociados */}
      <td>{pedido.base}</td>
      <td>{pedido.vector}</td>
      <td>{pedido.fSello}</td>

      {/* Seguimiento */}
      <td className="seguimiento">{pedido.seguimiento}</td>
    </tr>
  );
};

export default PedidoRow;

