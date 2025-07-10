import React from 'react';

const TableRow = ({ 
  children, 
  editing = false,
  className = "",
  style = {},
  onContextMenu,
  onDoubleClick,
  ...props 
}) => {
  const baseStyle = {
    borderBottom: '1px solid rgba(39, 39, 42, 0.3)',
    ...(editing ? { background: 'rgba(39, 39, 42, 0.3)' } : {}),
    transition: 'background 0.3s ease',
    cursor: editing ? 'default' : 'context-menu',
    ...style
  };

  return (
    <tr 
      className={`pedido-row ${className}`}
      style={baseStyle}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      {...props}
    >
      {children}
    </tr>
  );
};

export default TableRow;