import React from 'react';
import FilterPanel from './FilterPanel';
import { Search, Plus, Filter, X, Package } from 'lucide-react';
import { hayFiltrosActivos } from '../utils/pedidosUtils';

const PageHeader = ({
  pedidos,
  searchTerm,
  setSearchTerm,
  showFilterPanel,
  setShowFilterPanel,
  filters,
  setFilters,
  filterOptions,
  onClearFilters,
  setIsModalOpen
}) => {
  const hayFiltros = hayFiltrosActivos(filters);

  return (
    <div style={{
      borderBottom: '1px solid rgba(39, 39, 42, 0.5)',
      background: 'rgba(9, 9, 11, 0.8)',
      backdropFilter: 'blur(24px)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      padding: '24px 32px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'white',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package style={{ width: '20px', height: '20px', color: 'black' }} />
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '300',
                letterSpacing: '-0.025em',
                margin: 0
              }}>
                Pedidos
              </h1>
              <p style={{
                fontSize: '12px',
                color: '#71717a',
                margin: '2px 0 0 0'
              }}>
                {pedidos.length} activos
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#71717a'
            }} />
            <input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '320px',
                background: 'rgba(39, 39, 42, 0.5)',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                color: 'white',
                borderRadius: '8px',
                padding: '8px 16px 8px 44px',
                outline: 'none',
                fontSize: '14px',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'}
            />
          </div>

          {/* Filtros */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              style={{
                color: hayFiltros ? 'white' : '#a1a1aa',
                background: hayFiltros ? 'rgba(39, 39, 42, 0.5)' : 'transparent',
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = 'white';
                e.target.style.background = 'rgba(39, 39, 42, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = hayFiltros ? 'white' : '#a1a1aa';
                e.target.style.background = hayFiltros ? 'rgba(39, 39, 42, 0.5)' : 'transparent';
              }}
            >
              <Filter style={{ width: '16px', height: '16px' }} />
            </button>

            {showFilterPanel && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '384px',
                background: 'rgba(9, 9, 11, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(39, 39, 42, 0.5)',
                borderRadius: '8px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                zIndex: 50,
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '4px',
                      height: '24px',
                      background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)',
                      borderRadius: '9999px'
                    }}></div>
                    <h3 style={{ fontSize: '18px', fontWeight: '500', color: 'white', margin: 0 }}>Filtros</h3>
                  </div>
                  {hayFiltros && (
                    <button
                      onClick={onClearFilters}
                      style={{
                        color: '#a1a1aa',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.color = 'white';
                        e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = '#a1a1aa';
                        e.target.style.background = 'transparent';
                      }}
                    >
                      <X style={{ width: '12px', height: '12px' }} />
                      Limpiar
                    </button>
                  )}
                </div>

                <FilterPanel
                  filterOptions={filterOptions}
                  filters={filters}
                  setFilters={setFilters}
                  onClear={onClearFilters}
                  isExpanded={showFilterPanel}
                  onToggle={() => setShowFilterPanel(!showFilterPanel)}
                  showHeader={false}
                />
              </div>
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: 'white',
              color: 'black',
              border: 'none',
              fontWeight: '500',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              transition: 'background 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Nuevo
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;