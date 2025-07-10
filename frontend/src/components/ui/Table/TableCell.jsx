import React from 'react';

const TableCell = ({ 
  children, 
  style = {}, 
  className = "",
  align = "left",
  verticalAlign = "middle",
  padding = "16px 12px",
  minWidth,
  onClick,
  onContextMenu,
  onDoubleClick,
  ...props 
}) => {
  const baseStyle = {
    padding,
    textAlign: align,
    verticalAlign,
    ...(minWidth && { minWidth }),
    ...style
  };

  return (
    <td 
      className={className}
      style={baseStyle}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      {...props}
    >
      {children}
    </td>
  );
};

export default TableCell;