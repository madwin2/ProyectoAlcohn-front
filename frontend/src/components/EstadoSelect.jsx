import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const EstadoSelect = ({ value, onChange, options, type, isDisabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState('down');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  // Mapeo de variables CSS según el tipo y valor
  const getCSSVariables = (estado, tipo) => {
    const variableMap = {
      fabricacion: {
        'Sin Hacer': {
          background: 'var(--estado-color-disabled-bg)',
          color: 'var(--estado-fabricacion-sin-hacer)',
          borderColor: 'var(--estado-color-disabled-border)'
        },
        'Haciendo': {
          background: 'var(--estado-color-fabricacion-haciendo-bg)',
          color: 'var(--estado-fabricacion-haciendo)',
          borderColor: 'var(--estado-color-fabricacion-haciendo-border)'
        },
        'Hecho': {
          background: 'var(--estado-color-fabricacion-hecho-bg)',
          color: 'var(--estado-fabricacion-hecho)',
          borderColor: 'var(--estado-color-fabricacion-hecho-border)'
        },
        'Rehacer': {
          background: 'var(--estado-color-fabricacion-rehacer-bg)',
          color: 'var(--estado-fabricacion-rehacer)',
          borderColor: 'var(--estado-color-fabricacion-rehacer-border)'
        },
        'Retocar': {
          background: 'var(--estado-color-fabricacion-retocar-bg)',
          color: 'var(--estado-fabricacion-retocar)',
          borderColor: 'var(--estado-color-fabricacion-retocar-border)'
        },
        'Prioridad': {
          background: 'var(--estado-color-fabricacion-prioridad-bg)',
          color: 'var(--estado-fabricacion-prioridad)',
          borderColor: 'var(--estado-color-fabricacion-prioridad-border)'
        },
        'Verificar': {
          background: 'var(--estado-color-fabricacion-verificar-bg)',
          color: 'var(--estado-fabricacion-verificar)',
          borderColor: 'var(--estado-color-fabricacion-verificar-border)'
        },
      },
      venta: {
        'Ninguno': {
          background: 'var(--estado-color-disabled-bg)',
          color: 'var(--estado-venta-ninguno)',
          borderColor: 'var(--estado-color-disabled-border)'
        },
        'Foto': {
          background: 'var(--estado-color-venta-foto-bg)',
          color: 'var(--estado-venta-foto)',
          borderColor: 'var(--estado-color-venta-foto-border)'
        },
        'Transferido': {
          background: 'var(--estado-color-venta-transferido-bg)',
          color: 'var(--estado-venta-transferido)',
          borderColor: 'var(--estado-color-venta-transferido-border)'
        },
      },
      envio: {
        'Sin enviar': {
          background: 'var(--estado-color-disabled-bg)',
          color: 'var(--estado-envio-sin-enviar)',
          borderColor: 'var(--estado-color-disabled-border)'
        },
        'Hacer Etiqueta': {
          background: 'var(--estado-color-envio-hacer-etiqueta-bg)',
          color: 'var(--estado-envio-hacer-etiqueta)',
          borderColor: 'var(--estado-color-envio-hacer-etiqueta-border)'
        },
        'Etiqueta Lista': {
          background: 'var(--estado-color-envio-etiqueta-lista-bg)',
          color: 'var(--estado-envio-etiqueta-lista)',
          borderColor: 'var(--estado-color-envio-etiqueta-lista-border)'
        },
        'Despachado': {
          background: 'var(--estado-color-envio-despachado-bg)',
          color: 'var(--estado-envio-despachado)',
          borderColor: 'var(--estado-color-envio-despachado-border)'
        },
        'Seguimiento Enviado': {
          background: 'var(--estado-color-envio-seguimiento-enviado-bg)',
          color: 'var(--estado-envio-seguimiento-enviado)',
          borderColor: 'var(--estado-color-envio-seguimiento-enviado-border)'
        },
      },
      vectorizacion: {
        'Para Vectorizar': {
          background: 'var(--estado-color-vectorizacion-para-vectorizar-bg)',
          color: 'var(--estado-vectorizacion-para-vectorizar)',
          borderColor: 'var(--estado-color-vectorizacion-para-vectorizar-border)'
        },
        'Vectorizado': {
          background: 'var(--estado-color-vectorizacion-vectorizado-bg)',
          color: 'var(--estado-vectorizacion-vectorizado)',
          borderColor: 'var(--estado-color-vectorizacion-vectorizado-border)'
        },
      },
    };

    return variableMap[tipo]?.[estado] || {
      background: 'var(--estado-color-disabled-bg)',
      color: 'var(--estado-color-disabled)',
      borderColor: 'var(--estado-color-disabled-border)'
    };
  };

  // Mapeo de labels más cortos para la visualización
  const getLabelShort = (estado, tipo) => {
    const labelMap = {
      fabricacion: {
        'Sin Hacer': 'Sin Hacer',
        'Haciendo': 'Haciendo',
        'Hecho': 'Hecho',
        'Rehacer': 'Rehacer',
        'Retocar': 'Retocar',
        'Prioridad': 'Prioridad',
        'Verificar': 'Verificar',
      },
      venta: {
        'Ninguno': 'Ninguno',
        'Foto': 'Foto',
        'Transferido': 'Transferido',
      },
      envio: {
        'Sin enviar': 'Sin Enviar',
        'Hacer Etiqueta': 'Hacer Etiqueta',
        'Etiqueta Lista': 'Etiqueta Lista',
        'Despachado': 'Despachado',
        'Seguimiento Enviado': 'Seguimiento Enviado',
      },
      vectorizacion: {
        'Para Vectorizar': 'PV',
        'Vectorizado': 'V',
      },
    };

    return labelMap[tipo]?.[estado] || estado;
  };

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleButtonClick = (e) => {
    if (isDisabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    if (!isOpen) {
      // Calcular posición del botón
      const buttonRect = e.currentTarget.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      // Determinar dirección
      const shouldOpenUp = spaceBelow < 200 && spaceAbove > spaceBelow;
      setDropdownDirection(shouldOpenUp ? 'up' : 'down');
      
      // Calcular posición para el portal
      setDropdownPosition({
        top: shouldOpenUp ? buttonRect.top - 208 : buttonRect.bottom + 4,
        left: buttonRect.left
      });
    }
    
    setIsOpen(!isOpen);
  };

  const handleOverlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  };

  const handleOptionClick = (e, option) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelect(option);
  };

  const cssVars = getCSSVariables(value, type);
  const displayLabel = getLabelShort(value, type);

  // Renderizar el dropdown como portal
  const renderDropdown = () => {
    if (!isOpen) return null;
    
    return createPortal(
      <>
        {/* Overlay para cerrar el dropdown */}
        <div
          onClick={handleOverlayClick}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998
          }}
        />

        {/* Dropdown menu */}
        <div
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            background: 'var(--estado-dropdown-bg)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--estado-dropdown-border)',
            borderRadius: 'var(--estado-dropdown-radius)',
            boxShadow: 'var(--estado-dropdown-shadow)',
            zIndex: 9999,
            padding: '4px 0',
            minWidth: buttonRef.current?.offsetWidth || 'auto',  /* ← Usar ancho del botón */
            width: buttonRef.current?.offsetWidth || 'auto',     /* ← Usar ancho del botón */
            maxHeight: 'var(--estado-dropdown-max-height)',
            overflowY: 'auto'
          }}
        >
          {options.map((option) => {
            const optionCSSVars = getCSSVariables(option, type);
            const optionLabel = getLabelShort(option, type);

            return (
              <button
                key={option}
                type="button"
                onClick={(e) => handleOptionClick(e, option)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontSize: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--estado-dropdown-hover-bg)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: 'var(--estado-padding-badge)',
                  borderRadius: 'var(--estado-border-radius)',
                  fontSize: 'var(--estado-font-size-badge)',
                  fontWeight: 'var(--estado-font-weight)',
                  whiteSpace: 'nowrap',
                  border: '1px solid',
                  background: optionCSSVars.background,
                  color: optionCSSVars.color,
                  borderColor: optionCSSVars.borderColor
                }}>
                  {optionLabel}
                </span>
              </button>
            );
          })}
        </div>
      </>,
      document.body
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        className={`estado-button${type === 'venta' ? ' venta' : ''}`}
        disabled={isDisabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--estado-padding-sm)',
          borderRadius: 'var(--estado-border-radius)',
          fontSize: 'var(--estado-font-size)',
          fontWeight: 'var(--estado-font-weight)',
          border: '1px solid',
          transition: 'var(--estado-transition)',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          maxWidth: 'var(--estado-max-width)',
          minWidth: type === 'vectorizacion' ? 'var(--estado-vectorizacion-min-width)' : type === 'venta' ? 'var(--estado-venta-min-width)' : 'var(--estado-min-width)',
          width: type === 'vectorizacion' ? 'var(--estado-vectorizacion-width)' : type === 'venta' ? 'var(--estado-venta-width)' : '100%',
          outline: 'none',
          opacity: isDisabled ? 0.5 : 1,
          pointerEvents: isDisabled ? 'none' : 'auto',
          background: cssVars.background,
          color: cssVars.color,
          borderColor: cssVars.borderColor,
          minHeight: 'var(--estado-min-height)',
          height: 'var(--estado-height)',
        }}
      >
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {displayLabel}
        </span>
        <ChevronDown style={{
          width: 'var(--estado-icon-size)',
          height: 'var(--estado-icon-size)',
          marginLeft: 'var(--estado-icon-margin)',
          transform: isOpen ? 
            (dropdownDirection === 'up' ? 'rotate(0deg)' : 'rotate(180deg)') : 
            'rotate(0deg)',
          transition: 'var(--estado-transition-icon)'
        }} />
      </button>

      {renderDropdown()}
    </div>
  );
};

export default EstadoSelect;