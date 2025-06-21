import React from 'react';
import './FilterPanel.css';

function FilterPanel({ filterOptions, filters, setFilters, onApply, onClear }) {
  
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value || null }));
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

  return (
    <div className="filter-panel">
      
      <div className="filter-section">
        <h4>Rango de Fechas</h4>
        <div className="date-range-filter">
          <label>Desde:</label>
          <input type="date" name="fecha_compra_gte" value={filters.fecha_compra_gte || ''} onChange={handleDateChange} />
          <label>Hasta:</label>
          <input type="date" name="fecha_compra_lte" value={filters.fecha_compra_lte || ''} onChange={handleDateChange} />
        </div>
      </div>

      <div className="filter-section">
        <h4>Estado de Fabricación</h4>
        <div className="checkbox-group">
          {filterOptions.estado_fabricacion.map(option => (
            <div key={option} className="checkbox-item">
              <input type="checkbox" id={`fab-${option}`} name="estado_fabricacion" value={option} checked={filters.estado_fabricacion.includes(option)} onChange={handleCheckboxChange} />
              <label htmlFor={`fab-${option}`}>{option}</label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="filter-section">
        <h4>Estado de Venta</h4>
        <div className="checkbox-group">
          {filterOptions.estado_venta.map(option => (
            <div key={option} className="checkbox-item">
              <input type="checkbox" id={`vta-${option}`} name="estado_venta" value={option} checked={filters.estado_venta.includes(option)} onChange={handleCheckboxChange} />
              <label htmlFor={`vta-${option}`}>{option}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Estado de Envío</h4>
        <div className="checkbox-group">
          {filterOptions.estado_envio.map(option => (
            <div key={option} className="checkbox-item">
              <input type="checkbox" id={`env-${option}`} name="estado_envio" value={option} checked={filters.estado_envio.includes(option)} onChange={handleCheckboxChange} />
              <label htmlFor={`env-${option}`}>{option}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="filter-actions">
        <button className="apply-filters-btn" onClick={onApply}>Aplicar Filtros</button>
        <button className="clear-filters-btn" onClick={onClear}>Limpiar Filtros</button>
      </div>

    </div>
  );
}

export default FilterPanel; 