import React from 'react';

const TableHeader = ({ children, style = {}, className = "" }) => {
  const baseStyle = {
    borderBottom: '1px solid rgba(39, 39, 42, 0.5)',
    ...style
  };

  return (
    <thead className={className} style={baseStyle}>
      {children}
    </thead>
  );
};

const TableHeaderCell = ({ 
  children, 
  style = {}, 
  className = "",
  sortable = false,
  onSort,
  align = "left",
  ...props 
}) => {
  const baseStyle = {
    color: '#a1a1aa',
    fontWeight: '500',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: align,
    padding: '16px 12px',
    verticalAlign: 'middle',
    ...(sortable && { cursor: 'pointer' }),
    ...style
  };

  return (
    <th 
      className={className}
      style={baseStyle}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      {children}
    </th>
  );
};

export { TableHeader, TableHeaderCell };