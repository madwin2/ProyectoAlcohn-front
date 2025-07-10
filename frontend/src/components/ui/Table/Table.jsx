import React from 'react';
import './Table.css';

const Table = ({ children, loading, error, className = "", style = {} }) => {
  const baseStyle = {
    background: 'rgba(9, 9, 11, 0.5)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(39, 39, 42, 0.5)',
    borderRadius: '8px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    ...style
  };

  return (
    <div className={`table-container ${className}`} style={baseStyle}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '1200px'
        }}>
          {children}
        </table>
      </div>
    </div>
  );
};

export default Table;