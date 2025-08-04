import React from 'react';
import { FileImage, Ruler, CheckCircle, Loader2 } from 'lucide-react';
import VectorizacionCard from './VectorizacionCard';

const VectorizacionContent = ({ 
  activeTab, 
  loading, 
  grupoBase, 
  grupoVector, 
  grupoVerificados,
  publicUrl,
  dimensionesSVG,
  opcionesEscalado,
  procesando,
  removerFondo,
  setRemoverFondo,
  onVectorizar,
  onPrevisualizar,
  onDimensionar,
  onDescargar,
  onCargarVector,
  onEnviarAVerificar,
  onEnviarAVectorizar
}) => {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', color: '#71717a', margin: '0 auto' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ fontSize: '18px', color: '#d4d4d8', margin: 0 }}>Cargando pedidos...</p>
            <p style={{ fontSize: '14px', color: '#71717a', margin: 0 }}>Preparando la interfaz de vectorización</p>
          </div>
        </div>
      </div>
    );
  }

  const renderEmptyState = (icon, title, description) => (
    <div style={{ 
      background: 'rgba(9, 9, 11, 0.5)', 
      backdropFilter: 'blur(24px)', 
      border: '1px solid rgba(39, 39, 42, 0.5)', 
      borderRadius: '12px', 
      padding: '48px', 
      textAlign: 'center' 
    }}>
      {React.createElement(icon, { style: { width: '64px', height: '64px', color: '#52525b', margin: '0 auto 16px auto' } })}
      <h3 style={{ fontSize: '20px', fontWeight: '500', color: '#a1a1aa', margin: '0 0 8px 0' }}>{title}</h3>
      <p style={{ color: '#71717a', margin: 0 }}>{description}</p>
    </div>
  );

  const renderGrid = (items, tipo) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
      {items.map((pedido) => (
        <VectorizacionCard
          key={pedido.id_pedido}
          pedido={pedido}
          tipo={tipo}
          publicUrl={publicUrl}
          dimensionesSVG={dimensionesSVG}
          opcionesEscalado={opcionesEscalado}
          procesando={procesando}
          removerFondo={removerFondo}
          setRemoverFondo={setRemoverFondo}
          handleVectorizar={onVectorizar}
          handlePrevisualizar={onPrevisualizar}
          handleDimensionar={onDimensionar}
          handleDescargar={onDescargar}
          handleCargarVector={onCargarVector}
          onEnviarAVerificar={onEnviarAVerificar}
          onEnviarAVectorizar={onEnviarAVectorizar}
        />
      ))}
    </div>
  );

  switch (activeTab) {
    case 'pendientes':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {grupoBase.length === 0 
            ? renderEmptyState(FileImage, 'No hay imágenes para vectorizar', 'Los pedidos con archivos base aparecerán aquí')
            : renderGrid(grupoBase, 'base')
          }
        </div>
      );
    
    case 'verificar':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {grupoVector.length === 0 
            ? renderEmptyState(Ruler, 'No hay medidas para verificar', 'Los diseños vectorizados aparecerán aquí para verificación')
            : renderGrid(grupoVector, 'vector')
          }
        </div>
      );
    
    case 'completados':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {grupoVerificados.length === 0 
            ? renderEmptyState(CheckCircle, 'No hay vectorizaciones completadas', 'Los diseños finalizados aparecerán aquí')
            : renderGrid(grupoVerificados, 'verificado')
          }
        </div>
      );
    
    default:
      return null;
  }
};

export default VectorizacionContent;