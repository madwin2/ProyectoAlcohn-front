import React, { useState, useEffect } from 'react';
import './FilterPanel.css';

function FilterPanel({ filterOptions, filters, setFilters, onClear, isExpanded, onToggle }) {
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [activeFiltersChips, setActiveFiltersChips] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Opciones de fecha predefinidas tipo Notion
  const datePresets = [
    { label: 'Hoy', getValue: () => ({ gte: getTodayString(), lte: getTodayString() }) },
    { label: 'Ayer', getValue: () => ({ gte: getDateString(-1), lte: getDateString(-1) }) },
    { label: 'Esta semana', getValue: () => ({ gte: getWeekStart(), lte: getWeekEnd() }) },
    { label: 'La semana pasada', getValue: () => ({ gte: getWeekStart(-1), lte: getWeekEnd(-1) }) },
    { label: 'Este mes', getValue: () => ({ gte: getMonthStart(), lte: getMonthEnd() }) },
    { label: 'El mes pasado', getValue: () => ({ gte: getMonthStart(-1), lte: getMonthEnd(-1) }) },
    { label: 'Últimos 7 días', getValue: () => ({ gte: getDateString(-7), lte: getTodayString() }) },
    { label: 'Últimos 30 días', getValue: () => ({ gte: getDateString(-30), lte: getTodayString() }) },
  ];

  // Funciones de utilidad para fechas
  const getTodayString = () => new Date().toISOString().split('T')[0];
  
  const getDateString = (daysOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  };

  const getWeekStart = (weeksOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + (weeksOffset * 7));
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return date.toISOString().split('T')[0];
  };

  const getWeekEnd = (weeksOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + (weeksOffset * 7));
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? 0 : 7);
    date.setDate(diff);
    return date.toISOString().split('T')[0];
  };

  const getMonthStart = (monthsOffset = 0) => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsOffset);
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  };

  const getMonthEnd = (monthsOffset = 0) => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsOffset + 1);
    return new Date(date.getFullYear(), date.getMonth(), 0).toISOString().split('T')[0];
  };

  // Detectar qué preset está activo
  const getActiveDatePreset = () => {
    if (!filters.fecha_compra_gte || !filters.fecha_compra_lte) return null;
    
    for (const preset of datePresets) {
      const { gte, lte } = preset.getValue();
      if (filters.fecha_compra_gte === gte && filters.fecha_compra_lte === lte) {
        return preset.label;
      }
    }
    
    if (filters.fecha_compra_gte === filters.fecha_compra_lte) {
      return filters.fecha_compra_gte;
    }
    
    return `${filters.fecha_compra_gte} - ${filters.fecha_compra_lte}`;
  };

  useEffect(() => {
    // Calcular filtros activos y crear chips
    let count = 0;
    let chips = [];

    // Contar filtros de fecha
    if (filters.fecha_compra_gte || filters.fecha_compra_lte) {
      count++;
      const activePreset = getActiveDatePreset();
      chips.push({ 
        type: 'date', 
        text: `Fecha: ${activePreset || 'Personalizado'}`, 
        key: 'date' 
      });
    }

    // Contar filtros de estado de fabricación
    if (filters.estado_fabricacion && filters.estado_fabricacion.length > 0) {
      count++;
      chips.push({
        type: 'estado_fabricacion',
        text: `Fabricación: ${filters.estado_fabricacion.join(', ')}`,
        key: 'estado_fabricacion'
      });
    }

    // Contar filtros de estado de venta
    if (filters.estado_venta && filters.estado_venta.length > 0) {
      count++;
      chips.push({
        type: 'estado_venta',
        text: `Venta: ${filters.estado_venta.join(', ')}`,
        key: 'estado_venta'
      });
    }

    // Contar filtros de estado de envío
    if (filters.estado_envio && filters.estado_envio.length > 0) {
      count++;
      chips.push({
        type: 'estado_envio',
        text: `Envío: ${filters.estado_envio.join(', ')}`,
        key: 'estado_envio'
      });
    }

    setActiveFiltersCount(count);
    setActiveFiltersChips(chips);
  }, [filters]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notion-date-filter')) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  const handleDatePresetSelect = (preset) => {
    const { gte, lte } = preset.getValue();
    setFilters(prev => ({
      ...prev,
      fecha_compra_gte: gte,
      fecha_compra_lte: lte
    }));
    setShowDatePicker(false);
  };

  const handleCustomDateChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value || null }));
  };

  const clearDateFilter = () => {
    setFilters(prev => ({
      ...prev,
      fecha_compra_gte: null,
      fecha_compra_lte: null
    }));
    setShowDatePicker(false);
  };

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    setFilters(prev => {
      const currentValues = prev[name] || [];
      if (checked) {
        return { ...prev, [name]: [...currentValues, value] };
      } else {
        return { ...prev, [name]: currentValues.filter(v => v !== value) };
      }
    });
  };

  const removeFilter = (filterKey) => {
    if (filterKey === 'date') {
      setFilters(prev => ({ ...prev, fecha_compra_gte: null, fecha_compra_lte: null }));
    } else {
      setFilters(prev => ({ ...prev, [filterKey]: [] }));
    }
  };

  const clearAllFilters = () => {
    setFilters({
      fecha_compra_gte: null,
      fecha_compra_lte: null,
      estado_fabricacion: [],
      estado_venta: [],
      estado_envio: []
    });
    onClear();
  };

  return (
    <div className="filter-panel-container">
      {/* Botón de filtro y chips */}
      <div className="filter-header">
        <button 
          className={`filter-toggle-btn ${activeFiltersCount > 0 ? 'has-filters' : ''}`}
          onClick={onToggle}
        >
          <svg className="filter-icon" viewBox="0 0 24 24" fill="none">
            <path d="M3 4.6C3 4.03995 3 3.75992 3.10899 3.54601C3.20487 3.35785 3.35785 3.20487 3.54601 3.10899C3.75992 3 4.03995 3 4.6 3H19.4C19.9601 3 20.2401 3 20.454 3.10899C20.6422 3.20487 20.7951 3.35785 20.891 3.54601C21 3.75992 21 4.03995 21 4.6V6.33726C21 6.58185 21 6.70414 20.9724 6.81923C20.9479 6.92127 20.9075 7.01881 20.8526 7.10828C20.7908 7.2092 20.7043 7.29568 20.5314 7.46863L14.4686 13.5314C14.2957 13.7043 14.2092 13.7908 14.1474 13.8917C14.0925 13.9812 14.0521 14.0787 14.0276 14.1808C14 14.2959 14 14.4182 14 14.6627V17L10 21V14.6627C10 14.4182 10 14.2959 9.97237 14.1808C9.94787 14.0787 9.90747 13.9812 9.85264 13.8917C9.7908 13.7908 9.70432 13.7043 9.53137 13.5314L3.46863 7.46863C3.29568 7.29568 3.2092 7.2092 3.14736 7.10828C3.09253 7.01881 3.05213 6.92127 3.02763 6.81923C3 6.70414 3 6.58185 3 6.33726V4.6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Filtro
          {activeFiltersCount > 0 && (
            <span className="filter-count">{activeFiltersCount}</span>
          )}
          <svg className={`chevron-icon ${isExpanded ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="none">
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Chips de filtros activos */}
        {!isExpanded && activeFiltersChips.length > 0 && (
          <div className="filter-chips">
            {activeFiltersChips.map((chip) => (
              <div key={chip.key} className="filter-chip">
                <span className="chip-text">{chip.text}</span>
                <button 
                  className="chip-remove"
                  onClick={() => removeFilter(chip.type)}
                >
                  ×
                </button>
              </div>
            ))}
            {activeFiltersCount > 0 && (
              <button className="clear-all-btn" onClick={clearAllFilters}>
                Limpiar todo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Panel expandido */}
      {isExpanded && (
        <div className="filter-panel-expanded">
          <div className="filter-sections">
            {/* Sección de Fecha estilo Notion */}
            <div className="filter-section">
              <h4>📅 Fecha</h4>
              <div className="notion-date-filter">
                <button 
                  className="date-selector-btn"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <span className="date-selector-text">
                    {getActiveDatePreset() || 'Seleccionar fecha'}
                  </span>
                  <svg className="date-selector-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {showDatePicker && (
                  <div className="date-picker-dropdown">
                    <div className="date-presets">
                      {datePresets.map((preset) => (
                        <button
                          key={preset.label}
                          className="date-preset-option"
                          onClick={() => handleDatePresetSelect(preset)}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    
                    <div className="date-custom-section">
                      <div className="date-custom-header">Fechas personalizadas</div>
                      <div className="date-custom-inputs">
                        <div className="date-input-group">
                          <label>Desde</label>
                          <input 
                            type="date"
                            value={filters.fecha_compra_gte || ''}
                            onChange={(e) => handleCustomDateChange('fecha_compra_gte', e.target.value)}
                          />
                        </div>
                        <div className="date-input-group">
                          <label>Hasta</label>
                          <input 
                            type="date"
                            value={filters.fecha_compra_lte || ''}
                            onChange={(e) => handleCustomDateChange('fecha_compra_lte', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {(filters.fecha_compra_gte || filters.fecha_compra_lte) && (
                      <div className="date-actions">
                        <button className="date-clear-btn" onClick={clearDateFilter}>
                          Limpiar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="filter-section">
              <h4>🔨 Estado de Fabricación</h4>
              <div className="checkbox-grid">
                {filterOptions.estado_fabricacion.map(option => (
                  <label key={option} className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="estado_fabricacion" 
                      value={option} 
                      checked={filters.estado_fabricacion.includes(option)} 
                      onChange={handleCheckboxChange} 
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="filter-section">
              <h4>💰 Estado de Venta</h4>
              <div className="checkbox-grid">
                {filterOptions.estado_venta.map(option => (
                  <label key={option} className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="estado_venta" 
                      value={option} 
                      checked={filters.estado_venta.includes(option)} 
                      onChange={handleCheckboxChange} 
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4>📦 Estado de Envío</h4>
              <div className="checkbox-grid">
                {filterOptions.estado_envio.map(option => (
                  <label key={option} className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="estado_envio" 
                      value={option} 
                      checked={filters.estado_envio.includes(option)} 
                      onChange={handleCheckboxChange} 
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Acciones simplificadas - solo limpiar */}
          {activeFiltersCount > 0 && (
            <div className="filter-actions">
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                Limpiar todo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterPanel; 