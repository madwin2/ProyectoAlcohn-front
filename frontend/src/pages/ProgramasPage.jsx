import React, { useState, useEffect } from 'react';
import { Computer, Plus, Search, Filter, X } from 'lucide-react';
import { useProgramas } from '../hooks/useProgramas';
import AddProgramaModal from '../components/Programas/AddProgramaModal';
import ProgramaCard from '../components/Programas/ProgramaCard';

const ProgramasPage = () => {
  const {
    programas,
    loading,
    fetchProgramas,
    publicUrl
  } = useProgramas();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filtroMaquina, setFiltroMaquina] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    fetchProgramas();
  }, []);

  const handleProgramaAdded = () => {
    fetchProgramas();
  };

  // Filtrar programas
  const programasFiltrados = programas.filter(programa => {
    const coincideBusqueda = !busqueda || 
      programa.nombre_archivo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      programa.id_programa.toString().includes(busqueda);
    
    const coincideMaquina = !filtroMaquina || programa.maquina === filtroMaquina;
    const coincideEstado = !filtroEstado || programa.estado_programa === filtroEstado;
    
    return coincideBusqueda && coincideMaquina && coincideEstado;
  });

  // Agrupar por estado
  const programasPorEstado = {
    'Sin Hacer': programasFiltrados.filter(p => p.estado_programa === 'Sin Hacer'),
    'Haciendo': programasFiltrados.filter(p => p.estado_programa === 'Haciendo'),
    'Verificar': programasFiltrados.filter(p => p.estado_programa === 'Verificar'),
    'Rehacer': programasFiltrados.filter(p => p.estado_programa === 'Rehacer'),
    'Hecho': programasFiltrados.filter(p => p.estado_programa === 'Hecho')
  };

  const hayFiltros = filtroMaquina || filtroEstado;

  const limpiarFiltros = () => {
    setFiltroMaquina('');
    setFiltroEstado('');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        color: '#a1a1aa'
      }}>
        Cargando programas...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      {/* Header */}
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
                <Computer style={{ width: '20px', height: '20px', color: 'black' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '300',
                  letterSpacing: '-0.025em',
                  margin: 0
                }}>
                  Programas
                </h1>
                <p style={{
                  fontSize: '12px',
                  color: '#71717a',
                  margin: '2px 0 0 0'
                }}>
                  {programas.length} programas
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
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
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
                  width: '300px',
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
                        onClick={limpiarFiltros}
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        color: '#a1a1aa', 
                        marginBottom: '6px' 
                      }}>
                        Máquina
                      </label>
                      <select
                        value={filtroMaquina}
                        onChange={(e) => setFiltroMaquina(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(39, 39, 42, 0.5)',
                          border: '1px solid rgba(63, 63, 70, 0.5)',
                          borderRadius: '6px',
                          padding: '8px',
                          color: 'white',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      >
                        <option value="">Todas las máquinas</option>
                        <option value="C">Máquina C</option>
                        <option value="G">Máquina G</option>
                        <option value="XL">Máquina XL</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        color: '#a1a1aa', 
                        marginBottom: '6px' 
                      }}>
                        Estado
                      </label>
                      <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(39, 39, 42, 0.5)',
                          border: '1px solid rgba(63, 63, 70, 0.5)',
                          borderRadius: '6px',
                          padding: '8px',
                          color: 'white',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      >
                        <option value="">Todos los estados</option>
                        <option value="Sin Hacer">Sin Hacer</option>
                        <option value="Haciendo">Haciendo</option>
                        <option value="Verificar">Verificar</option>
                        <option value="Rehacer">Rehacer</option>
                        <option value="Hecho">Hecho</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
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

      <div style={{ padding: '24px 32px' }}>
        {/* Estadísticas rápidas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {Object.entries(programasPorEstado).map(([estado, progs]) => (
            <div
              key={estado}
              style={{
                background: 'rgba(24, 24, 27, 0.5)',
                border: '1px solid rgba(39, 39, 42, 0.5)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: '600', color: 'white' }}>
                {progs.length}
              </div>
              <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                {estado}
              </div>
            </div>
          ))}
        </div>

        {/* Grid de tarjetas de programas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {programasFiltrados.map(programa => (
            <ProgramaCard
              key={programa.id_programa}
              programa={programa}
              onProgramaUpdated={fetchProgramas}
              publicUrl={publicUrl}
            />
          ))}
        </div>

        {programasFiltrados.length === 0 && (
          <div style={{
            background: 'rgba(24, 24, 27, 0.5)',
            border: '1px solid rgba(39, 39, 42, 0.5)',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            color: '#a1a1aa'
          }}>
            <Computer style={{ width: '48px', height: '48px', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 8px 0' }}>
              No se encontraron programas
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {busqueda || filtroMaquina || filtroEstado 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Crea tu primer programa de producción'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal para agregar programa */}
      <AddProgramaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProgramaAdded={handleProgramaAdded}
      />

      {/* Click away para cerrar filtros */}
      {showFilterPanel && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5
          }}
          onClick={() => setShowFilterPanel(false)}
        />
      )}
    </div>
  );
};

export default ProgramasPage;