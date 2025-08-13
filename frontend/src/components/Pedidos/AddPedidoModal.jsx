import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { simpleFileUploadService } from '../../services/simpleFileUpload';
import { X, Package, User, Phone, Calendar, DollarSign, FileText, Upload, Loader2 } from 'lucide-react';
import { preparePhoneForServer } from '../../utils/phoneUtils';
import PhoneInput from '../ui/PhoneInput';

const initialFormState = {
  nombre_cliente: '',
  apellido_cliente: '',
  telefono_cliente: '',
  medio_contacto: '',
  fecha_compra: new Date().toISOString().split('T')[0],
  valor_sello: '',
  valor_envio: '4000',
  valor_senia: '',
  estado_fabricacion: 'Sin Hacer',
  notas: '',
  disenio: '',
  medida_pedida: '',
  archivo_base: null,
  archivo_vector: null,
  numero_seguimiento: '',
};

function AddPedidoModal({ isOpen, onClose, onPedidoAdded }) {
  const [formData, setFormData] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setError(null);
      setUploadProgress('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setUploadProgress('Creando pedido...');

    try {
      // Paso 1: Crear o buscar cliente
      let clienteId = null;
      
      // Preparar el número de teléfono para el servidor (sin prefijo 549)
      const phoneForServer = preparePhoneForServer(formData.telefono_cliente);
      
      // Verificar si el cliente ya existe por teléfono
      const { data: clientesExistentes, error: clienteBusquedaError } = await supabase
        .from('clientes')
        .select('id_cliente')
        .eq('telefono_cliente', phoneForServer);

      if (clienteBusquedaError) {
        throw clienteBusquedaError;
      }

      if (clientesExistentes && clientesExistentes.length > 0) {
        // Cliente ya existe, usar el ID existente
        clienteId = clientesExistentes[0].id_cliente;
      } else {
        // Crear nuevo cliente
        const clienteData = {
          nombre_cliente: formData.nombre_cliente,
          apellido_cliente: formData.apellido_cliente,
          telefono_cliente: phoneForServer, // Usar el número limpio sin prefijo 549
          medio_contacto: formData.medio_contacto,
        };

        const { data: nuevoCliente, error: clienteError } = await supabase
          .from('clientes')
          .insert([clienteData])
          .select();

        if (clienteError) {
          throw clienteError;
        }

        clienteId = nuevoCliente[0].id_cliente;
      }

      // Paso 2: Crear pedido con referencia al cliente
      const pedidoData = {
        id_cliente: clienteId,
        fecha_compra: formData.fecha_compra,
        valor_sello: formData.valor_sello ? parseFloat(formData.valor_sello) : null,
        valor_envio: formData.valor_envio ? parseFloat(formData.valor_envio) : null,
        valor_senia: formData.valor_senia ? parseFloat(formData.valor_senia) : null,
        estado_fabricacion: formData.estado_fabricacion,
        notas: formData.notas,
        disenio: formData.disenio,
        medida_pedida: formData.medida_pedida,
        numero_seguimiento: formData.numero_seguimiento,
      };

      // Insertar pedido en Supabase
      const { data: pedidoCreado, error } = await supabase
        .from('pedidos')
        .insert([pedidoData])
        .select();

      if (error) {
        throw error;
      }

      const pedidoId = pedidoCreado[0].id_pedido;

      // Paso 3: Subir archivos si existen
      const archivosPromesas = [];
      
      if (formData.archivo_base) {
        setUploadProgress('Subiendo archivo base...');
        archivosPromesas.push(
          simpleFileUploadService.uploadFile(formData.archivo_base, 'archivo_base', pedidoId)
            .then(result => ({ field: 'archivo_base', path: result.publicUrl }))
        );
      }
      
      if (formData.archivo_vector) {
        setUploadProgress('Subiendo archivo vector...');
        archivosPromesas.push(
          simpleFileUploadService.uploadFile(formData.archivo_vector, 'archivo_vector', pedidoId)
            .then(result => ({ field: 'archivo_vector', path: result.publicUrl }))
        );
      }

      // Esperar a que se suban todos los archivos
      if (archivosPromesas.length > 0) {
        setUploadProgress('Finalizando subida de archivos...');
        const archivosSubidos = await Promise.all(archivosPromesas);
        
        // Actualizar el pedido con los paths de los archivos
        const updateData = {};
        archivosSubidos.forEach(archivo => {
          updateData[archivo.field] = archivo.path;
        });

        const { error: updateError } = await supabase
          .from('pedidos')
          .update(updateData)
          .eq('id_pedido', pedidoId);

        if (updateError) {
          console.error('Error actualizando archivos:', updateError);
          // No lanzar error aquí porque el pedido ya se creó
        }
      }

      // Obtener el pedido completo creado para pasarlo al callback
      const { data: pedidoCompleto, error: fetchError } = await supabase
        .from('pedidos')
        .select(`
          *,
          clientes (
            nombre_cliente,
            apellido_cliente,
            telefono_cliente,
            medio_contacto
          )
        `)
        .eq('id_pedido', pedidoId)
        .single();

      // Llamar callback de éxito con el pedido completo
      if (onPedidoAdded) {
        onPedidoAdded(pedidoCompleto);
      }
      
      onClose();
    } catch (err) {
      console.error('Error creating pedido:', err);
      setError(err.message || 'Error al crear el pedido');
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
        maxWidth: '900px', 
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
              <Package style={{ width: '20px', height: '20px', color: 'black' }} />
            </div>
            <div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '300', 
                letterSpacing: '-0.025em', 
                color: 'white', 
                margin: 0 
              }}>
                Crear Pedido
              </h2>
              <p style={{ 
                fontSize: '14px', 
                color: '#a1a1aa', 
                margin: '4px 0 0 0' 
              }}>
                Agrega un nuevo pedido al sistema
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
              color: '#fca5a5'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '32px',
              marginBottom: '32px'
            }}>
              {/* Columna Izquierda */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Información del Cliente */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '16px' 
                  }}>
                    <User style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '500', 
                      color: 'white', 
                      margin: 0 
                    }}>
                      Información del Cliente
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input
                        type="text"
                        name="nombre_cliente"
                        placeholder="Nombre"
                        value={formData.nombre_cliente}
                        onChange={handleChange}
                        required
                        style={{
                          flex: 1,
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
                      <input
                        type="text"
                        name="apellido_cliente"
                        placeholder="Apellido"
                        value={formData.apellido_cliente}
                        onChange={handleChange}
                        style={{
                          flex: 1,
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
                    <input
                      type="date"
                      name="fecha_compra"
                      value={formData.fecha_compra}
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
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <PhoneInput
                        value={formData.telefono_cliente}
                        onChange={handleChange}
                        required
                      />
                      <select
                        name="medio_contacto"
                        value={formData.medio_contacto}
                        onChange={handleChange}
                        style={{
                          flex: 1,
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
                      >
                        <option value="">Seleccionar medio</option>
                        <option value="Whatsapp">WhatsApp</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Mail">Email</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Diseño */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '16px' 
                  }}>
                    <FileText style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '500', 
                      color: 'white', 
                      margin: 0 
                    }}>
                      Diseño
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <textarea
                      name="disenio"
                      placeholder="Descripción del diseño..."
                      value={formData.disenio}
                      onChange={handleChange}
                      rows={3}
                      style={{
                        width: '100%',
                        background: 'rgba(24, 24, 27, 0.5)',
                        border: '1px solid rgba(63, 63, 70, 0.5)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.3s ease',
                        resize: 'vertical'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'}
                    />
                    <input
                      type="text"
                      name="medida_pedida"
                      placeholder="Medida pedida (ej: 5x3)"
                      value={formData.medida_pedida}
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
                    <textarea
                      name="notas"
                      placeholder="Notas adicionales..."
                      value={formData.notas}
                      onChange={handleChange}
                      rows={2}
                      style={{
                        width: '100%',
                        background: 'rgba(24, 24, 27, 0.5)',
                        border: '1px solid rgba(63, 63, 70, 0.5)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.3s ease',
                        resize: 'vertical'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'}
                    />
                  </div>
                </div>
              </div>

              {/* Columna Derecha */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Valores */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '16px' 
                  }}>
                    <DollarSign style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '500', 
                      color: 'white', 
                      margin: 0 
                    }}>
                      Valores
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input
                        type="number"
                        name="valor_sello"
                        placeholder="Valor sello"
                        value={formData.valor_sello}
                        onChange={handleChange}
                        style={{
                          flex: 1,
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
                      <input
                        type="number"
                        name="valor_senia"
                        placeholder="Seña"
                        value={formData.valor_senia}
                        onChange={handleChange}
                        style={{
                          flex: 1,
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
                    <select
                      name="valor_envio"
                      value={formData.valor_envio}
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
                    >
                      <option value=""></option>
                      <option value="4000">$4000</option>
                      <option value="7000">$7000</option>
                    </select>
                  </div>
                </div>

                {/* Estado */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '16px' 
                  }}>
                    <Package style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '500', 
                      color: 'white', 
                      margin: 0 
                    }}>
                      Estado
                    </h3>
                  </div>
                  <select
                    name="estado_fabricacion"
                    value={formData.estado_fabricacion}
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
                  >
                    <option value="Sin Hacer">Sin Hacer</option>
                    <option value="Prioridad">Prioridad</option>
                    <option value="Hecho">Hecho</option>
                  </select>
                </div>
                {/* Archivos */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '16px' 
                  }}>
                    <Upload style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '500', 
                      color: 'white', 
                      margin: 0 
                    }}>
                      Archivos
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      background: 'rgba(24, 24, 27, 0.5)',
                      border: '1px solid rgba(63, 63, 70, 0.5)',
                      borderRadius: '8px',
                      color: '#d4d4d8',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                      e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(24, 24, 27, 0.5)';
                      e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)';
                      e.target.style.color = '#d4d4d8';
                    }}
                    >
                      <Upload style={{ width: '16px', height: '16px' }} />
                      {formData.archivo_base ? formData.archivo_base.name : 'Subir archivo base'}
                      <input
                        type="file"
                        name="archivo_base"
                        onChange={handleChange}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        style={{ display: 'none' }}
                      />
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      background: 'rgba(24, 24, 27, 0.5)',
                      border: '1px solid rgba(63, 63, 70, 0.5)',
                      borderRadius: '8px',
                      color: '#d4d4d8',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                      e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(24, 24, 27, 0.5)';
                      e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)';
                      e.target.style.color = '#d4d4d8';
                    }}
                    >
                      <Upload style={{ width: '16px', height: '16px' }} />
                      {formData.archivo_vector ? formData.archivo_vector.name : 'Subir archivo vector'}
                      <input
                        type="file"
                        name="archivo_vector"
                        onChange={handleChange}
                        accept=".svg,.ai,.eps,.pdf,.dxf"
                        style={{ display: 'none' }}
                      />
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
              paddingTop: '24px'
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
                    e.target.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                    e.target.style.color = '#d4d4d8';
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
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
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
                {isSaving ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    {uploadProgress || 'Guardando...'}
                  </>
                ) : (
                  <>
                    <Package style={{ width: '16px', height: '16px' }} />
                    Crear Pedido
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddPedidoModal;