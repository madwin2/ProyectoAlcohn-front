import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle } from 'lucide-react';

const SVGPreview = ({ 
  vectorUrl, 
  size = 60, 
  className = '', 
  style = {},
  showError = true,
  backgroundColor = 'rgba(39, 39, 42, 0.5)',
  borderRadius = '6px'
}) => {
  const [svgContent, setSvgContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!vectorUrl) {
      setLoading(false);
      setError(true);
      return;
    }

    const loadSVG = async () => {
      setLoading(true);
      setError(false);
      
      try {
        const response = await fetch(vectorUrl);
        if (!response.ok) {
          throw new Error('Error al cargar SVG');
        }
        
        const svgText = await response.text();
        
        // Limpiar el SVG y asegurar que sea válido
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');
        
        if (!svgElement) {
          throw new Error('Archivo SVG inválido');
        }

        // Remover dimensiones fijas y agregar viewBox si no existe
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');
        
        if (!svgElement.getAttribute('viewBox')) {
          // Intentar calcular viewBox basado en el contenido
          const bbox = svgElement.getBBox?.() || { x: 0, y: 0, width: 100, height: 100 };
          svgElement.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
        }

        // Serializar el SVG limpio
        const serializer = new XMLSerializer();
        const cleanedSVG = serializer.serializeToString(svgElement);
        
        setSvgContent(cleanedSVG);
      } catch (err) {
        console.error('Error cargando SVG:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadSVG();
  }, [vectorUrl]);

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    background: backgroundColor,
    borderRadius: borderRadius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '1px solid rgba(63, 63, 70, 0.5)',
    ...style
  };

  if (loading) {
    return (
      <div className={className} style={containerStyle}>
        <div style={{
          width: '12px',
          height: '12px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderTop: '2px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (error || !svgContent) {
    return (
      <div className={className} style={containerStyle}>
        {showError ? (
          <AlertCircle style={{ 
            width: '16px', 
            height: '16px', 
            color: '#ef4444',
            opacity: 0.7
          }} />
        ) : (
          <FileText style={{ 
            width: '16px', 
            height: '16px', 
            color: '#a1a1aa',
            opacity: 0.7
          }} />
        )}
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px'
        }}
        dangerouslySetInnerHTML={{ 
          __html: svgContent.replace(
            '<svg',
            `<svg style="width: 100%; height: 100%; max-width: ${size - 8}px; max-height: ${size - 8}px; object-fit: contain;"`
          )
        }}
      />
    </div>
  );
};

export default SVGPreview;