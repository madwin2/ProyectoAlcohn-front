import React, { useState, useEffect } from 'react';
import { Edit, X, Calendar, Clock, FileText, AlertCircle } from 'lucide-react';
import { useProgramas } from '../../hooks/useProgramas';

const EditProgramaModal = ({ isOpen, onClose, programa, onProgramaUpdated }) => {
  const { actualizarPrograma } = useProgramas();
  const [formData, setFormData] = useState({
    fecha_programa: '',
    nombre_archivo: '',
    limite_tiempo: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && programa) {
      setFormData({
        fecha_programa: programa.fecha_programa ? programa.fecha_programa.split('T')[0] : '',
        nombre_archivo: programa.nombre_archivo || '',
        limite_tiempo: programa.limite_tiempo ? programa.limite_tiempo : '' // Mostrar en minutos
      });
      setError(null);
    }
  }, [isOpen, programa]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const updateData = {
        fecha_programa: formData.fecha_programa,
        nombre_archivo: formData.nombre_archivo,
        limite_tiempo: formData.limite_tiempo ? parseInt(formData.limite_tiempo) : 0 // Guardar en minutos
      };

      await actualizarPrograma(programa.id_programa, updateData);
      
      if (onProgramaUpdated) {
        onProgramaUpdated();
      }
      
      onClose();
    } catch (err) {
      console.error('Error updating programa:', err);
      setError(err.message || 'Error al actualizar el programa');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !programa) return null;

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
        maxWidth: '500px', 
        width: '100%', 
        margin: '0 16px', 
        background: 'rgba(9, 9, 11, 0.95)', 
        backdropFilter: 'blur(24px)', 
        border: '1px solid rgba(39, 39, 42, 0.5)', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', 
        borderRadius: '12px',
        maxHeight: '90vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px', 
          borderBottom: '1px solid rgba(39, 39, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
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
              <Edit style={{ width: '20px', height: '20px', color: 'black' }} />
            </div>
            <div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '300', 
                letterSpacing: '-0.025em', 
                color: 'white', 
                margin: 0 
              }}>
                Editar Programa
              </h2>
              <p style={{ 
                fontSize: '14px', 
                color: '#a1a1aa', 
                margin: '4px 0 0 0' 
              }}>
                Programa #{programa.id_programa} - Máquina {programa.maquina}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(39, 39, 42, 0.5)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#a1a1aa';
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          padding: '24px', 
          maxHeight: 'calc(90vh - 140px)', 
          overflowY: 'auto' 
        }}>
          {error && (
            <div style={{
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle style={{ width: '16px', height: '16px' }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Fecha del programa */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '12px' 
                }}>
                  <Calendar style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                  <label style={{ 
                    fontSize: '14px', 
                    color: 'white', 
                    fontWeight: '500' 
                  }}>
                    Fecha del Programa
                  </label>
                </div>
                <input
                  type="date"
                  name="fecha_programa"
                  value={formData.fecha_programa}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(24, 24, 27, 0.5)',
                    border: '1px solid rgba(63, 63, 70, 0.5)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'}
                />
              </div>

              {/* Nombre del archivo */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '12px' 
                }}>
                  <FileText style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                  <label style={{ 
                    fontSize: '14px', 
                    color: 'white', 
                    fontWeight: '500' 
                  }}>
                    Nombre del Archivo
                  </label>
                </div>
                <input
                  type="text"
                  name="nombre_archivo"
                  placeholder="Nombre del archivo del programa..."
                  value={formData.nombre_archivo}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    background: 'rgba(24, 24, 27, 0.5)',
                    border: '1px solid rgba(63, 63, 70, 0.5)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'}
                />
              </div>

              {/* Tiempo límite */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '12px' 
                }}>
                  <Clock style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                  <label style={{ 
                    fontSize: '14px', 
                    color: 'white', 
                    fontWeight: '500' 
                  }}>
                    Tiempo Límite (minutos)
                  </label>
                </div>
                <input
                  type="number"
                  name="limite_tiempo"
                  placeholder="0"
                  value={formData.limite_tiempo}
                  onChange={handleChange}
                  min="0"
                  style={{
                    width: '100%',
                    background: 'rgba(24, 24, 27, 0.5)',
                    border: '1px solid rgba(63, 63, 70, 0.5)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end',
              borderTop: '1px solid rgba(39, 39, 42, 0.5)',
              paddingTop: '24px',
              marginTop: '32px'
            }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                style={{
                  background: 'rgba(39, 39, 42, 0.5)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  color: '#d4d4d8',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.5 : 1,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.target.style.background = 'rgba(63, 63, 70, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                  }
                }}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  background: 'white',
                  color: 'black',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.8 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.target.style.background = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.target.style.background = 'white';
                  }
                }}
              >
                <Edit style={{ width: '16px', height: '16px' }} />
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProgramaModal;