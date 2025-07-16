import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn } from 'lucide-react';

const ComparadorSlider = ({ baseUrl, svgString, width = 500, height = 400 }) => {
  const [sliderValue, setSliderValue] = useState(50);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Asegurar que el zoom no se salga de los bordes
    const zoomSize = 60;
    const adjustedX = Math.max(zoomSize, Math.min(x, rect.width - zoomSize));
    const adjustedY = Math.max(zoomSize, Math.min(y, rect.height - zoomSize));
    
    setMousePosition({ x: adjustedX, y: adjustedY });
    
    // Calcular posición del zoom (corregida para evitar desfase)
    // Usar la posición real del mouse para el transform origin
    const zoomX = (x / rect.width) * 100;
    const zoomY = (y / rect.height) * 100;
    setZoomPosition({ x: zoomX, y: zoomY });
  };

  const handleMouseEnter = () => {
    setShowZoom(true);
  };

  const handleMouseLeave = () => {
    setShowZoom(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '100%', 
      gap: '24px' 
    }}>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ 
          width, 
          height,
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(39, 39, 42, 0.5)',
          background: 'rgba(9, 9, 11, 1)',
          cursor: showZoom ? 'none' : 'default'
        }}
      >
        {/* Imagen base */}
        {baseUrl && (
          <img
            src={baseUrl}
            alt="base"
            style={{ 
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: 0.3,
              transition: 'opacity 0.5s ease',
              zIndex: 1
            }}
            draggable={false}
          />
        )}

        {/* SVG vectorizado */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transition: 'all 0.3s ease',
            clipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
            zIndex: 2,
          }}
        >
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`}
            alt="vector"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain' 
            }}
            draggable={false}
          />
        </div>

        {/* Línea divisoria */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'white',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s ease',
            left: `calc(${sliderValue}% - 1px)`,
            zIndex: 3,
          }}
        />

        {/* Zoom Lens */}
        {showZoom && (
          <div
            style={{
              position: 'absolute',
              left: mousePosition.x - 60,
              top: mousePosition.y - 60,
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0, 0, 0, 0.3)',
              background: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(4px)',
              zIndex: 10,
              pointerEvents: 'none',
              overflow: 'hidden',
              transition: 'all 0.05s ease'
            }}
          >
            {/* Zoomed Original Image */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                transform: `scale(12)`,
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                transition: 'transform 0.05s ease'
              }}
            >
              {baseUrl && (
                <img
                  src={baseUrl}
                  alt="original zoom"
                  style={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.3
                  }}
                  draggable={false}
                />
              )}
            </div>
            
            {/* Zoomed Vectorized Image */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                transform: `scale(12)`,
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                transition: 'transform 0.05s ease',
                clipPath: `inset(0 ${100 - sliderValue}% 0 0)`
              }}
            >
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`}
                alt="vector zoom"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover'
                }}
                draggable={false}
              />
            </div>
            
            {/* Zoom Icon */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'rgba(255, 255, 255, 0.6)',
                pointerEvents: 'none'
              }}
            >
              <ZoomIn style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
        )}

        {/* Labels */}
        <div style={{ 
          position: 'absolute', 
          top: '16px', 
          left: '16px', 
          right: '16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          zIndex: 10
        }}>
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.6)', 
            backdropFilter: 'blur(8px)', 
            borderRadius: '6px', 
            padding: '4px 8px', 
            fontSize: '12px', 
            color: '#a1a1aa', 
            border: '1px solid rgba(113, 113, 122, 0.5)' 
          }}>
            Original
          </div>
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.6)', 
            backdropFilter: 'blur(8px)', 
            borderRadius: '6px', 
            padding: '4px 8px', 
            fontSize: '12px', 
            color: 'white', 
            border: '1px solid rgba(63, 63, 70, 0.5)' 
          }}>
            Vectorizado
          </div>
        </div>

        {/* Zoom Indicator */}
        <div style={{ 
          position: 'absolute', 
          bottom: '16px', 
          right: '16px', 
          background: 'rgba(0, 0, 0, 0.6)', 
          backdropFilter: 'blur(8px)', 
          borderRadius: '6px', 
          padding: '6px 10px', 
          fontSize: '11px', 
          color: '#a1a1aa', 
          border: '1px solid rgba(113, 113, 122, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 10
        }}>
          <ZoomIn style={{ width: '12px', height: '12px' }} />
          Zoom
        </div>
      </div>

      {/* Slider */}
      <div style={{ width: '100%', maxWidth: '384px', position: 'relative' }}>
        <input
          type="range"
          min={0}
          max={100}
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '8px',
            appearance: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none',
            background: `linear-gradient(to right, #ffffff 0%, #ffffff ${sliderValue}%, #27272a ${sliderValue}%, #27272a 100%)`
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#71717a', marginTop: '8px' }}>
          <span>0%</span>
          <span style={{ color: 'white', fontWeight: '500' }}>{sliderValue}%</span>
          <span>100%</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            border: none;
          }
          input[type="range"]::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            border: none;
          }
        `
      }} />
    </div>
  );
};

export default ComparadorSlider;