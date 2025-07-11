import React from 'react';
import { FileImage, AlertTriangle, CheckCircle } from 'lucide-react';

const VectorizacionTabs = ({ 
  activeTab, 
  setActiveTab, 
  grupoBase, 
  grupoVector, 
  grupoVerificados 
}) => {
  const tabs = [
    { 
      id: 'pendientes', 
      label: 'A Vectorizar', 
      icon: FileImage, 
      count: grupoBase.length 
    },
    { 
      id: 'verificar', 
      label: 'Verificar Medidas', 
      icon: AlertTriangle, 
      count: grupoVector.length 
    },
    { 
      id: 'completados', 
      label: 'Verificados', 
      icon: CheckCircle, 
      count: grupoVerificados.length 
    }
  ];

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ 
        background: 'rgba(24, 24, 27, 0.5)', 
        border: '1px solid rgba(39, 39, 42, 0.5)', 
        padding: '4px', 
        borderRadius: '8px', 
        display: 'inline-flex' 
      }}>
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === tab.id ? 'rgba(39, 39, 42, 1)' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#a1a1aa',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.color = '#a1a1aa';
                }
              }}
            >
              <IconComponent style={{ width: '16px', height: '16px' }} />
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VectorizacionTabs;