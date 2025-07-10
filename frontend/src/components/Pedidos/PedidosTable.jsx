import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import PedidoRow from './PedidoRow';
import './PedidosTable.css';
import AddPedidoModal from './AddPedidoModal';

const PedidosTable = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchPedidos = async () => {
      const { data, error } = await supabase
        .from('vista_pedidos')
        .select('*');

      if (error) {
        console.error('Error al traer pedidos:', error.message);
      } else {
        setPedidos(data);
      }

      setLoading(false);
    };

    fetchPedidos();
  }, []);

  return (
    // Wrapper para permitir scroll horizontal en pantallas chicas
    <div className="pedidos-table-wrapper" style={{ position: 'relative' }}>

      {/* �� Botón para agregar pedido */}
      <div className="pedidos-header">
        <button
          className="boton-agregar-pedido"
          onClick={() => setShowAddModal(true)}
        >
          + Agregar Pedido
        </button>
      </div>
      {showAddModal && (
        <AddPedidoModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onPedidoAdded={() => {
            setShowAddModal(false);
            // Recargar pedidos después de agregar uno nuevo
            setLoading(true);
            supabase.from('vista_pedidos').select('*').then(({ data, error }) => {
              if (!error) setPedidos(data);
              setLoading(false);
            });
          }}
        />
      )}

      <table className="pedidos-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Diseño</th>
            <th>Contacto</th>
            <th>Valor</th>
            <th>Seña</th>
            <th>Envío</th>
            <th>Estado</th>
            <th>Base</th>
            <th>Vector</th>
            <th>F Sello</th>
            <th>Seguimiento</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="12" style={{ textAlign: 'center', padding: '1rem' }}>
                Cargando...
              </td>
            </tr>
          ) : (
            pedidos.map((pedido) => (
              <PedidoRow key={pedido.id_pedido} pedido={pedido} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PedidosTable;
