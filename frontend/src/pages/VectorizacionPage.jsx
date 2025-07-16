import React from 'react';
import { useVectorizacion } from '../hooks/useVectorizacion';
import VectorizacionHeader from '../components/Vectorizacion/VectorizacionHeader';
import VectorizacionTabs from '../components/Vectorizacion/VectorizacionTabs';
import VectorizacionContent from '../components/Vectorizacion/VectorizacionContent';
import VectorizacionModal from '../components/Vectorizacion/VectorizacionModal';

function VectorizacionPage() {
  const {
    // State
    loading,
    svgPreview,
    svgPedido,
    activeTab,
    busqueda,
    dimensionesSVG,
    opcionesEscalado,
    procesando,
    removerFondo,
    
    // Groups
    grupoBase,
    grupoVector,
    grupoVerificados,
    
    // Actions
    setActiveTab,
    setBusqueda,
    setRemoverFondo,
    handleVectorizar,
    handlePrevisualizar,
    handleDimensionar,
    handleGuardarSVG,
    handleRechazarSVG,
    handleDescargar,
    handleCargarVector,
    
    // Utils
    publicUrl
  } = useVectorizacion();

  return (
    <div style={{ minHeight: '100vh', background: 'black', color: 'white' }}>
      {/* Modal */}
      <VectorizacionModal 
        svgPreview={svgPreview}
        svgPedido={svgPedido}
        publicUrl={publicUrl}
        onGuardar={handleGuardarSVG}
        onDescargar={handleDescargar}
        onCerrar={handleRechazarSVG}
      />

      {/* Header */}
      <VectorizacionHeader 
        grupoBase={grupoBase}
        grupoVector={grupoVector}
        grupoVerificados={grupoVerificados}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
      />

      {/* Content */}
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '32px' }}>
        {/* Tabs */}
        <VectorizacionTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          grupoBase={grupoBase}
          grupoVector={grupoVector}
          grupoVerificados={grupoVerificados}
        />

        {/* Tab Content */}
        <VectorizacionContent 
          activeTab={activeTab}
          loading={loading}
          grupoBase={grupoBase}
          grupoVector={grupoVector}
          grupoVerificados={grupoVerificados}
          publicUrl={publicUrl}
          dimensionesSVG={dimensionesSVG}
          opcionesEscalado={opcionesEscalado}
          procesando={procesando}
          removerFondo={removerFondo}
          setRemoverFondo={setRemoverFondo}
          onVectorizar={handleVectorizar}
          onPrevisualizar={handlePrevisualizar}
          onDimensionar={handleDimensionar}
          onDescargar={handleDescargar}
          onCargarVector={handleCargarVector}
        />
      </div>
    </div>
  );
}

export default VectorizacionPage;