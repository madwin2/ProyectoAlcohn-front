import React, { useState } from 'react';

const ComparadorSlider = ({ baseUrl, svgString, width = 500, height = 400 }) => {
  const [sliderValue, setSliderValue] = useState(50);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '100%', 
      gap: '24px' 
    }}>
      <div
        style={{ 
          width, 
          height,
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(39, 39, 42, 0.5)',
          background: 'rgba(9, 9, 11, 1)'
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

      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default ComparadorSlider;