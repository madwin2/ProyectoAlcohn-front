import React from 'react';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

const PedidoContextMenu = ({ contextMenu, pedidos, startEdit, handleEliminar }) => (
  <ContextMenu visible={contextMenu.visible} x={contextMenu.x} y={contextMenu.y}>
    <ContextMenuItem
      onClick={() => {
        const pedido = pedidos.find(p => p.id_pedido === contextMenu.pedidoId);
        if (pedido) startEdit(pedido);
      }}
    >
      Editar
    </ContextMenuItem>
    <ContextMenuItem
      color="#ef4444"
      onClick={() => handleEliminar(contextMenu.pedidoId)}
    >
      Eliminar
    </ContextMenuItem>
  </ContextMenu>
);

const EditContextMenu = ({ editContextMenu, saveEdit, cancelEdit, editingId, setEditContextMenu }) => (
  <ContextMenu visible={editContextMenu.visible} x={editContextMenu.x} y={editContextMenu.y}>
    <ContextMenuItem
      onClick={() => {
        saveEdit(editingId);
        setEditContextMenu({ visible: false, x: 0, y: 0 });
      }}
    >
      Guardar (Ctrl+Enter)
    </ContextMenuItem>
    <ContextMenuItem
      color="#a1a1aa"
      onClick={() => {
        cancelEdit();
        setEditContextMenu({ visible: false, x: 0, y: 0 });
      }}
    >
      Cancelar (Escape)
    </ContextMenuItem>
  </ContextMenu>
);

export { PedidoContextMenu, EditContextMenu };