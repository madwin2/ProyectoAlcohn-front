import React from 'react';
import { MessageSquare } from 'lucide-react';

const WhatsAppBotHeader = ({ title, subtitle, icon }) => {
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
              {icon || <MessageSquare style={{ width: '20px', height: '20px', color: 'black' }} />}
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '300',
                letterSpacing: '-0.025em',
                margin: 0,
                color: 'white'
              }}>
                {title || 'WhatsApp Bot'}
              </h1>
              <p style={{
                fontSize: '12px',
                color: '#71717a',
                margin: '2px 0 0 0'
              }}>
                {subtitle || 'Administración del bot'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppBotHeader; 