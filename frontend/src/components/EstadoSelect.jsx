import React from 'react';
import Select from 'react-select';

const ESTADO_COLORS = {
  fabricacion: {
    'Sin Hacer':   { color: '#bdbdbd' },
    'Haciendo':    { color: '#42a5f5' },
    'Rehacer':     { color: '#ef5350' },
    'Retocar':     { color: '#ffb300' },
    'Prioridad':   { color: '#ab47bc' },
    'Verificar':   { color: '#26a69a' },
    'Hecho':       { color: '#66bb6a' },
  },
  venta: {
    'Foto':        { color: '#90caf9' },
    'Transferido': { color: '#ffd54f' },
    'Ninguno':     { color: '#e0e0e0' },
  },
  envio: {
    'Sin enviar':         { color: '#bdbdbd' },
    'Hacer Etiqueta':     { color: '#29b6f6' },
    'Etiqueta Lista':     { color: '#7e57c2' },
    'Despachado':         { color: '#66bb6a' },
    'Seguimiento Enviado':{ color: '#ffa726' },
  }
};

export default function EstadoSelect({ value, onChange, options, type, isDisabled }) {
  const colorMap = ESTADO_COLORS[type] || {};
  const selectOptions = options.map(opt => ({
    value: opt,
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          display: 'inline-block',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: colorMap[opt]?.color || '#bdbdbd',
          marginRight: 4,
        }} />
        <span style={{ color: '#e5e5e5', fontWeight: 500 }}>{opt}</span>
      </span>
    ),
    color: colorMap[opt]?.color || '#bdbdbd',
  }));

  const customStyles = {
    control: (provided, state) => {
      return {
        ...provided,
        background: 'rgba(0,0,0,0.0)',
        borderColor: '#555',
        borderWidth: 0.5,
        boxShadow: state.isFocused ? '0 0 0 2px #5557' : 'none',
        borderRadius: 999,
        minHeight: 32,
        color: '#e5e5e5',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s, border 0.2s',
        paddingLeft: 14,
        paddingRight: 14,
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
      };
    },
    singleValue: (provided) => ({
      ...provided,
      color: '#e5e5e5',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 999,
      // width: '100%', // Eliminar para ancho automático
      // textAlign: 'center', // Eliminar para ancho automático
      padding: 0,
      margin: 0,
      minWidth: 0,
      maxWidth: '100%',
    }),
    option: (provided, { data, isFocused, isSelected }) => ({
      ...provided,
      backgroundColor: isSelected
        ? 'rgba(255,255,255,0.04)'
        : isFocused
        ? 'rgba(200, 210, 230, 0.08)'
        : 'transparent',
      color: '#e5e5e5',
      fontWeight: isSelected ? 700 : 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      cursor: 'pointer',
      transition: 'background 0.2s',
      borderRadius: 999,
      minHeight: 32,
      paddingLeft: 14,
      paddingRight: 14,
      // textAlign: 'center', // Eliminar para ancho automático
      minWidth: 0,
      maxWidth: '100%',
    }),
    menu: (provided) => ({
      ...provided,
      background: 'rgba(30,32,36,0.98)',
      borderRadius: 16,
      zIndex: 20,
      boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
    }),
    dropdownIndicator: () => ({ display: 'none' }),
    indicatorSeparator: () => ({ display: 'none' }),
    input: (provided) => ({ ...provided, color: '#e5e5e5' }),
  };

  return (
    <Select
      isSearchable={false}
      isDisabled={isDisabled}
      value={selectOptions.find(opt => opt.value === value) || null}
      onChange={opt => onChange(opt.value)}
      options={selectOptions}
      styles={customStyles}
      menuPlacement="auto"
      menuPortalTarget={document.body}
      theme={theme => ({
        ...theme,
        borderRadius: 12,
        colors: {
          ...theme.colors,
          primary25: '#333',
          primary: '#007bff',
          neutral0: '#23272f',
          neutral80: '#fff',
        },
      })}
    />
  );
}

// Utilidad para aclarar un color hex
function lightenColor(hex, percent) {
  // hex: #RRGGBB
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + Math.round((255 - (num >> 16)) * percent);
  let g = ((num >> 8) & 0x00FF) + Math.round((255 - ((num >> 8) & 0x00FF)) * percent);
  let b = (num & 0x0000FF) + Math.round((255 - (num & 0x0000FF)) * percent);
  r = Math.min(255, r);
  g = Math.min(255, g);
  b = Math.min(255, b);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
} 