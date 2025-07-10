import React, { useState, useRef, useEffect } from 'react';
import './PedidoRow.css';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from "../../supabaseClient";

const PedidoRow = ({ pedido }) => {
  const opcionesFabricacion = ['Sin Hacer', 'En proceso', 'Hecho'];
  const opcionesVenta = ['Foto', 'Transferido'];
  const opcionesEnvio = ['Sin Enviar', 'Hacer Etiqueta', 'Despachado'];

  const [showConfirm, setShowConfirm] = useState(false);

  const handleEliminar = async () => {
    try {
      const { error } = await supabase.rpc('eliminar_pedido', { id_pedido: pedido.id });
      if (error) throw error;
      // Si tenés un método para refrescar la tabla:
      window.location.reload(); // o alguna función `onPedidoEliminado(pedido.id)`
    } catch (err) {
      console.error('Error al eliminar:', err.message);
    }
  };

  return (
    <>
      <tr className="pedido-row">
        <td>
          <div className="cliente">
            <span className="nombre">{pedido.nombre}</span>
            <span className="apellido">{pedido.apellido}</span>
          </div>
        </td>
        <td>{pedido.fecha}</td>
        <td>
          <div className="diseno">
            <span className="titulo">{pedido.disenoTitulo}</span>
            <span className="subtitulo">{pedido.disenoSubtitulo}</span>
          </div>
        </td>
        <td>
          <div className="contacto">
            <span className="tipo-contacto">{pedido.contacto}</span>
            <span className="telefono">{pedido.telefono}</span>
          </div>
        </td>
        <td>
          <div className="valor">
            <span className="principal">${pedido.valor}</span>
            <span className="restante">Restante: ${pedido.restante}</span>
          </div>
        </td>
        <td>
          <div className="sena">${pedido.sena}</div>
        </td>
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
        <td>{pedido.base}</td>
        <td>{pedido.vector}</td>
        <td>{pedido.fSello}</td>
        <td className="seguimiento">{pedido.seguimiento}</td>
        <td style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            title="Editar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            onClick={() => console.log('Editar pedido', pedido.id)}
          >
            <Pencil size={18} color="#a1a1aa" />
          </button>
          <button
            title="Eliminar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 size={18} color="#ef4444" />
          </button>
        </td>
      </tr>

      {/* Modal de confirmación */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 420, textAlign: 'center' }}>
            <h2>¿Eliminar pedido?</h2>
            <p>Esta acción no se puede deshacer.</p>
            <div className="form-actions" style={{ justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleEliminar}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PedidoRow;


