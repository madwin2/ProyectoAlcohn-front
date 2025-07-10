import React from 'react';

const ContextMenu = ({ visible, x, y, children }) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: y,
        left: x,
        background: 'rgba(9, 9, 11, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(39, 39, 42, 0.5)',
        borderRadius: '8px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        padding: '8px 0'
      }}
    >
      {children}
    </div>
  );
};

const ContextMenuItem = ({ onClick, color = 'white', children }) => (
  <button
    style={{
      width: '100%',
      padding: '8px 16px',
      textAlign: 'left',
      color,
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background 0.3s ease'
    }}
    onMouseEnter={(e) => e.target.style.background = 'rgba(39, 39, 42, 0.5)'}
    onMouseLeave={(e) => e.target.style.background = 'transparent'}
    onClick={onClick}
  >
    {children}
  </button>
);

export { ContextMenu, ContextMenuItem };