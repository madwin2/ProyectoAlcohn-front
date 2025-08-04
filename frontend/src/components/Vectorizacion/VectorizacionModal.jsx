import React from 'react';
import { CheckCircle, Download, X, Shapes } from 'lucide-react';
import ComparadorSlider from './ComparadorSlider';

const VectorizacionModal = ({ 
  svgPreview, 
  svgPedido, 
  publicUrl, 
  onGuardar, 
  onDescargar, 
  onCerrar 
}) => {
  if (!svgPreview || !svgPedido) return null;

  let archivoBase = svgPedido.archivo_base;
  if (Array.isArray(archivoBase)) archivoBase = archivoBase[0];
  const baseUrl = publicUrl(archivoBase);

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0, 0, 0, 0.8)', 
      backdropFilter: 'blur(8px)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 50 
    }}>
      <div style={{ 
        maxWidth: '1024px', 
        width: '100%', 
        margin: '0 16px', 
        background: 'rgba(9, 9, 11, 0.98)', 
        backdropFilter: 'blur(24px)', 
        border: '1px solid rgba(39, 39, 42, 0.5)', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', 
        borderRadius: '12px' 
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(39, 39, 42, 0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'white', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Shapes style={{ width: '20px', height: '20px', color: 'black' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '300', letterSpacing: '-0.025em', color: 'white' }}>Previsualización SVG</div>
              <div style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: '400' }}>{svgPedido.disenio}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <ComparadorSlider baseUrl={baseUrl} svgString={svgPreview} width={500} height={400} />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onGuardar}
                style={{
                  background: 'white',
                  color: 'black',
                  padding: '8px 24px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                <CheckCircle style={{ width: '16px', height: '16px' }} />
                Aprobar
              </button>
              <button
                onClick={async () => {
                  try {
                    const blob = new Blob([svgPreview], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    await onDescargar(url, `vectorAI-${svgPedido.id_pedido}.svg`);
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error al descargar:', error);
                  }
                }}
                style={{
                  background: 'rgba(24, 24, 27, 0.5)',
                  border: '1px solid rgba(113, 113, 122, 0.5)',
                  color: '#d4d4d8',
                  padding: '8px 24px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(24, 24, 27, 0.5)';
                  e.target.style.color = '#d4d4d8';
                }}
              >
                <Download style={{ width: '16px', height: '16px' }} />
                Descargar
              </button>
              <button
                onClick={onCerrar}
                style={{
                  background: 'rgba(24, 24, 27, 0.5)',
                  border: '1px solid rgba(113, 113, 122, 0.5)',
                  color: '#a1a1aa',
                  padding: '8px 24px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                  e.target.style.color = '#d4d4d8';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(24, 24, 27, 0.5)';
                  e.target.style.color = '#a1a1aa';
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VectorizacionModal;