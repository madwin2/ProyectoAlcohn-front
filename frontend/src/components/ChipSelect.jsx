import React from 'react';
import './ChipSelect.css';

// Paleta de colores y estilos para los chips
const CHIP_STYLES = {
  fabricacion: {
    'Sin Hacer':   { color: '#bdbdbd', border: '#bdbdbd', icon: '⏸️' },
    'Haciendo':    { color: '#42a5f5', border: '#42a5f5', icon: '🔄' },
    'Rehacer':     { color: '#ef5350', border: '#ef5350', icon: '♻️' },
    'Retocar':     { color: '#ffb300', border: '#ffb300', icon: '🖌️' },
    'Prioridad':   { color: '#ab47bc', border: '#ab47bc', icon: '⚡' },
    'Verificar':   { color: '#26a69a', border: '#26a69a', icon: '✔️' },
    'Hecho':       { color: '#66bb6a', border: '#66bb6a', icon: '✅' },
  },
  venta: {
    'Foto':        { color: '#90caf9', border: '#90caf9', icon: '📷' },
    'Transferido': { color: '#ffd54f', border: '#ffd54f', icon: '💸' },
    'Ninguno':     { color: '#e0e0e0', border: '#e0e0e0', icon: '—' },
  },
  envio: {
    'Sin enviar':         { color: '#bdbdbd', border: '#bdbdbd', icon: '⏸️' },
    'Hacer Etiqueta':     { color: '#29b6f6', border: '#29b6f6', icon: '🏷️' },
    'Etiqueta Lista':     { color: '#7e57c2', border: '#7e57c2', icon: '📦' },
    'Despachado':         { color: '#66bb6a', border: '#66bb6a', icon: '🚚' },
    'Seguimiento Enviado':{ color: '#ffa726', border: '#ffa726', icon: '✈️' },
  }
};

export default function ChipSelect({ value, type }) {
  if (!value) return null;
  const style = CHIP_STYLES[type]?.[value] || { color: '#e0e0e0', border: '#e0e0e0', icon: '' };
  return (
    <span
      className="chip-visual"
      style={{
        border: `2px solid ${style.border}`,
        color: style.color,
        background: `${style.color}22`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5em',
        fontWeight: 600,
        fontSize: '15px',
        padding: '4px 16px',
        borderRadius: '20px',
        minWidth: '90px',
        justifyContent: 'center',
      }}
    >
      <span style={{fontSize: '1.1em'}}>{style.icon}</span>
      {value}
    </span>
  );
} 