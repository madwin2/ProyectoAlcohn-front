import React from 'react';
import { cleanPhoneNumber, formatPhoneNumber } from '../../utils/phoneUtils';

const PhoneInput = ({ 
  value, 
  onChange, 
  onBlur, 
  placeholder = "Teléfono", 
  required = false,
  style = {},
  className = "",
  name = "telefono_cliente",
  ...props 
}) => {
  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Limpiar y formatear el número automáticamente
    const cleanedPhone = cleanPhoneNumber(inputValue);
    const formattedPhone = formatPhoneNumber(cleanedPhone);
    
    // Crear un evento sintético con el valor formateado
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: formattedPhone
      }
    };
    
    onChange(syntheticEvent);
  };

  const handleBlur = (e) => {
    // Al perder el foco, asegurar que el número esté limpio para el servidor
    if (onBlur) {
      const cleanedPhone = cleanPhoneNumber(e.target.value);
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name,
          value: cleanedPhone
        }
      };
      onBlur(syntheticEvent);
    }
  };

  return (
    <input
      type="tel"
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      required={required}
      style={{
        flex: 1,
        background: 'rgba(24, 24, 27, 0.5)',
        border: '1px solid rgba(63, 63, 70, 0.5)',
        borderRadius: '8px',
        padding: '12px',
        color: 'white',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.3s ease',
        ...style
      }}
      className={className}
      onFocus={(e) => e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)'}
      onBlur={(e) => {
        e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)';
        handleBlur(e);
      }}
      {...props}
    />
  );
};

export default PhoneInput;
