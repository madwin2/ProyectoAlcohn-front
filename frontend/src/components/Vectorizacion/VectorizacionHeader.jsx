import React from 'react';
import { Search, Shapes } from 'lucide-react';

const VectorizacionHeader = ({ 
  grupoBase, 
  grupoVector, 
  grupoVerificados, 
  busqueda, 
  setBusqueda 
}) => {
  return (
    <div style={{ 
      borderBottom: '1px solid rgba(39, 39, 42, 0.5)', 
      background: 'rgba(9, 9, 11, 0.8)', 
      backdropFilter: 'blur(24px)' 
    }}>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                <Shapes style={{ width: '20px', height: '20px', color: 'black' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '300', letterSpacing: '-0.025em', margin: 0 }}>Vectorización</h1>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '2px 0 0 0' }}>
                  {grupoBase.length} pendientes • {grupoVector.length} para verificar • {grupoVerificados.length} completados
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
                type="text"
                placeholder="Buscar diseños..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  paddingLeft: '48px',
                  width: '320px',
                  background: 'rgba(24, 24, 27, 0.5)',
                  border: '1px solid rgba(113, 113, 122, 0.5)',
                  color: 'white',
                  borderRadius: '8px',
                  height: '40px',
                  padding: '8px 16px 8px 48px',
                  outline: 'none',
                  fontSize: '14px',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(63, 63, 70, 1)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(113, 113, 122, 0.5)'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VectorizacionHeader;