import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const EstadoSelect = ({ value, onChange, options, type, isDisabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Mapeo de colores según el tipo y valor
  const getColorClass = (estado, tipo) => {
    const colorMap = {
      fabricacion: {
        'Sin Hacer': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        'Haciendo': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        'Hecho': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'Rehacer': 'bg-red-500/10 text-red-400 border-red-500/20',
        'Retocar': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'Prioridad': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'Verificar': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      },
      venta: {
        'Ninguno': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        'Foto': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'Transferido': 'bg-green-500/10 text-green-400 border-green-500/20',
      },
      envio: {
        'Sin enviar': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        'Hacer Etiqueta': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        'Etiqueta Lista': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        'Despachado': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        'Seguimiento Enviado': 'bg-green-500/10 text-green-400 border-green-500/20',
      },
      vectorizacion: {
        'Para Vectorizar': 'bg-red-500/10 text-red-400 border-red-500/20',
        'Vectorizado': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      },
    };

    return colorMap[tipo]?.[estado] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
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
        'Para Vectorizar': 'Para Vectorizar',
        'Vectorizado': 'Vectorizado',
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

  const colorClass = getColorClass(value, type);
  const displayLabel = getLabelShort(value, type);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={handleButtonClick}
        className={`estado-button${type === 'venta' ? ' venta' : ''}`}
        disabled={isDisabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2.5px 12.5px',
          borderRadius: '9999px',
          fontSize: '15px',
          fontWeight: '500',
          border: '1px solid',
          transition: 'all 0.3s ease',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          maxWidth: '200px',
          minWidth: type === 'vectorizacion' ? '130px' : type === 'venta' ? 'unset' : '130px',
          width: type === 'vectorizacion' ? '130px' : type === 'venta' ? 'unset' : '100%',
          outline: 'none',
          opacity: isDisabled ? 0.5 : 1,
          pointerEvents: isDisabled ? 'none' : 'auto',
          background: colorClass.includes('bg-slate') ? 'rgba(100, 116, 139, 0.1)' :
            colorClass.includes('bg-cyan') ? 'rgba(6, 182, 212, 0.1)' :
              colorClass.includes('bg-emerald') ? 'rgba(16, 185, 129, 0.1)' :
                colorClass.includes('bg-red') ? 'rgba(239, 68, 68, 0.1)' :
                  colorClass.includes('bg-amber') ? 'rgba(245, 158, 11, 0.1)' :
                    colorClass.includes('bg-purple') ? 'rgba(168, 85, 247, 0.1)' :
                      colorClass.includes('bg-teal') ? 'rgba(20, 184, 166, 0.1)' :
                        colorClass.includes('bg-blue') ? 'rgba(59, 130, 246, 0.1)' :
                          colorClass.includes('bg-green') ? 'rgba(34, 197, 94, 0.1)' :
                            colorClass.includes('bg-orange') ? 'rgba(249, 115, 22, 0.1)' :
                              colorClass.includes('bg-violet') ? 'rgba(139, 92, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
          color: colorClass.includes('text-slate') ? '#94a3b8' :
            colorClass.includes('text-cyan') ? '#67e8f9' :
              colorClass.includes('text-emerald') ? '#6ee7b7' :
                colorClass.includes('text-red') ? '#f87171' :
                  colorClass.includes('text-amber') ? '#fbbf24' :
                    colorClass.includes('text-purple') ? '#c4b5fd' :
                      colorClass.includes('text-teal') ? '#5eead4' :
                        colorClass.includes('text-blue') ? '#93c5fd' :
                          colorClass.includes('text-green') ? '#86efac' :
                            colorClass.includes('text-orange') ? '#fb923c' :
                              colorClass.includes('text-violet') ? '#c4b5fd' : '#94a3b8',
          borderColor: colorClass.includes('border-slate') ? 'rgba(100, 116, 139, 0.2)' :
            colorClass.includes('border-cyan') ? 'rgba(6, 182, 212, 0.2)' :
              colorClass.includes('border-emerald') ? 'rgba(16, 185, 129, 0.2)' :
                colorClass.includes('border-red') ? 'rgba(239, 68, 68, 0.2)' :
                  colorClass.includes('border-amber') ? 'rgba(245, 158, 11, 0.2)' :
                    colorClass.includes('border-purple') ? 'rgba(168, 85, 247, 0.2)' :
                      colorClass.includes('border-teal') ? 'rgba(20, 184, 166, 0.2)' :
                        colorClass.includes('border-blue') ? 'rgba(59, 130, 246, 0.2)' :
                          colorClass.includes('border-green') ? 'rgba(34, 197, 94, 0.2)' :
                            colorClass.includes('border-orange') ? 'rgba(249, 115, 22, 0.2)' :
                              colorClass.includes('border-violet') ? 'rgba(139, 92, 246, 0.2)' : 'rgba(100, 116, 139, 0.2)',
          minHeight: '2rem',
          height: '2rem',
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
          width: '12px',
          height: '12px',
          marginLeft: '4px',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }} />
      </button>

      {isOpen && (
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
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              background: 'rgba(9, 9, 11, 0.98)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(39, 39, 42, 0.8)',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              zIndex: 9999,
              padding: '4px 0',
              minWidth: '140px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {options.map((option) => {
              const optionColorClass = getColorClass(option, type);
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
                  onMouseEnter={(e) => e.target.style.background = 'rgba(39, 39, 42, 0.6)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 6px',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    background: optionColorClass.includes('bg-slate') ? 'rgba(100, 116, 139, 0.15)' :
                      optionColorClass.includes('bg-cyan') ? 'rgba(6, 182, 212, 0.15)' :
                        optionColorClass.includes('bg-emerald') ? 'rgba(16, 185, 129, 0.15)' :
                          optionColorClass.includes('bg-red') ? 'rgba(239, 68, 68, 0.15)' :
                            optionColorClass.includes('bg-amber') ? 'rgba(245, 158, 11, 0.15)' :
                              optionColorClass.includes('bg-purple') ? 'rgba(168, 85, 247, 0.15)' :
                                optionColorClass.includes('bg-teal') ? 'rgba(20, 184, 166, 0.15)' :
                                  optionColorClass.includes('bg-blue') ? 'rgba(59, 130, 246, 0.15)' :
                                    optionColorClass.includes('bg-green') ? 'rgba(34, 197, 94, 0.15)' :
                                      optionColorClass.includes('bg-orange') ? 'rgba(249, 115, 22, 0.15)' :
                                        optionColorClass.includes('bg-violet') ? 'rgba(139, 92, 246, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                    color: optionColorClass.includes('text-slate') ? '#a8a29e' :
                      optionColorClass.includes('text-cyan') ? '#67e8f9' :
                        optionColorClass.includes('text-emerald') ? '#6ee7b7' :
                          optionColorClass.includes('text-red') ? '#f87171' :
                            optionColorClass.includes('text-amber') ? '#fbbf24' :
                              optionColorClass.includes('text-purple') ? '#c4b5fd' :
                                optionColorClass.includes('text-teal') ? '#5eead4' :
                                  optionColorClass.includes('text-blue') ? '#93c5fd' :
                                    optionColorClass.includes('text-green') ? '#86efac' :
                                      optionColorClass.includes('text-orange') ? '#fb923c' :
                                        optionColorClass.includes('text-violet') ? '#c4b5fd' : '#a8a29e',
                    border: `1px solid ${optionColorClass.includes('border-slate') ? 'rgba(100, 116, 139, 0.3)' :
                      optionColorClass.includes('border-cyan') ? 'rgba(6, 182, 212, 0.3)' :
                        optionColorClass.includes('border-emerald') ? 'rgba(16, 185, 129, 0.3)' :
                          optionColorClass.includes('border-red') ? 'rgba(239, 68, 68, 0.3)' :
                            optionColorClass.includes('border-amber') ? 'rgba(245, 158, 11, 0.3)' :
                              optionColorClass.includes('border-purple') ? 'rgba(168, 85, 247, 0.3)' :
                                optionColorClass.includes('border-teal') ? 'rgba(20, 184, 166, 0.3)' :
                                  optionColorClass.includes('border-blue') ? 'rgba(59, 130, 246, 0.3)' :
                                    optionColorClass.includes('border-green') ? 'rgba(34, 197, 94, 0.3)' :
                                      optionColorClass.includes('border-orange') ? 'rgba(249, 115, 22, 0.3)' :
                                        optionColorClass.includes('border-violet') ? 'rgba(139, 92, 246, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`
                  }}>
                    {optionLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default EstadoSelect;