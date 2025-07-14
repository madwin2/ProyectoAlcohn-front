import React, { useState, useEffect } from 'react';
import { Computer, X, Calendar, Clock, Package, FileText, AlertCircle } from 'lucide-react';
import { useProgramas } from '../../hooks/useProgramas';

const initialFormState = {
  fecha_programa: new Date().toISOString().split('T')[0],
  maquina: 'C',
  programa_bloqueado: false,
  nombre_archivo: '',
  limite_tiempo: '',
  estado_programa: 'Sin Hacer',
  verificado: false,
  tiempo_usado: 0
};

const AddProgramaModal = ({ isOpen, onClose, onProgramaAdded }) => {
  const { crearPrograma } = useProgramas();
  const [formData, setFormData] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setError(null);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Convertir valores numéricos
      const programaData = {
        ...formData,
        id_programa: formData.nombre_archivo, // <-- Se agrega para que id_programa sea igual a nombre_archivo
        limite_tiempo: formData.limite_tiempo ? parseInt(formData.limite_tiempo) : 0, // Guardar en minutos
        tiempo_usado: 0
      };

      const nuevoPrograma = await crearPrograma(programaData);
      
      if (onProgramaAdded) {
        onProgramaAdded(nuevoPrograma);
      }
      
      onClose();
    } catch (err) {
      console.error('Error creating programa:', err);
      setError(err.message || 'Error al crear el programa');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

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
        maxWidth: '600px', 
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
              <Computer style={{ width: '20px', height: '20px', color: 'black' }} />
            </div>
            <div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '300', 
                letterSpacing: '-0.025em', 
                color: 'white', 
                margin: 0 
              }}>
                Crear Programa
              </h2>
              <p style={{ 
                fontSize: '14px', 
                color: '#a1a1aa', 
                margin: '4px 0 0 0' 
              }}>
                Configura un nuevo programa de producción
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
              {/* Información básica */}
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '500', 
                  color: 'white', 
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Calendar style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                  Información Básica
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      color: '#d4d4d8', 
                      marginBottom: '6px' 
                    }}>
                      Fecha del Programa *
                    </label>
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
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      color: '#d4d4d8', 
                      marginBottom: '6px' 
                    }}>
                      Máquina *
                    </label>
                    <select
                      name="maquina"
                      value={formData.maquina}
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
                        outline: 'none'
                      }}
                    >
                      <option value="C">Máquina C</option>
                      <option value="G">Máquina G</option>
                      <option value="XL">Máquina XL</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Archivo del programa */}
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '500', 
                  color: 'white', 
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FileText style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                  Archivo del Programa
                </h3>
                
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
                    outline: 'none'
                  }}
                />
              </div>

              {/* Configuración de producción */}
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '500', 
                  color: 'white', 
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Package style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                  Configuración de Producción
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Eliminar input de cantidad_sellos */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      color: '#d4d4d8', 
                      marginBottom: '6px' 
                    }}>
                      Tiempo Límite (minutos)
                    </label>
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
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Estado inicial */}
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '500', 
                  color: 'white', 
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Clock style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                  Estado
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      color: '#d4d4d8', 
                      marginBottom: '6px' 
                    }}>
                      Estado del Programa
                    </label>
                    <select
                      name="estado_programa"
                      value={formData.estado_programa}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        background: 'rgba(24, 24, 27, 0.5)',
                        border: '1px solid rgba(63, 63, 70, 0.5)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    >
                      <option value="Sin Hacer">Sin Hacer</option>
                      <option value="Haciendo">Haciendo</option>
                      <option value="Verificar">Verificar</option>
                      <option value="Rehacer">Rehacer</option>
                      <option value="Hecho">Hecho</option>
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#d4d4d8',
                      padding: '12px'
                    }}>
                      <input
                        type="checkbox"
                        name="programa_bloqueado"
                        checked={formData.programa_bloqueado}
                        onChange={handleChange}
                        style={{ marginRight: '4px' }}
                      />
                      Programa Bloqueado
                    </label>
                  </div>
                </div>
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
                  opacity: isSaving ? 0.5 : 1
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
                  gap: '8px'
                }}
              >
                <Computer style={{ width: '16px', height: '16px' }} />
                {isSaving ? 'Creando...' : 'Crear Programa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProgramaModal;