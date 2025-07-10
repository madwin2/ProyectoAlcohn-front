import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './AddPedidoModal.css';
import {
  User,
  Phone,
  FileText,
  DollarSign,
  Upload,
  Settings
} from 'lucide-react';
import EstadoSelect from './EstadoSelect';

const initialFormState = {
  // Campos de CLIENTES
  nombre_cliente: '',
  apellido_cliente: '',
  telefono_cliente: '',
  medio_contacto: '',
  // Campos de PEDIDOS
  fecha_compra: new Date().toISOString().split('T')[0],
  valor_sello: '',
  valor_envio: '',
  valor_senia: '',
  estado_fabricacion: 'Sin Hacer',
  estado_venta: 'Foto',
  estado_envio: 'Sin enviar',
  notas: '',
  disenio: '',
  archivo_base: null,
  archivo_vector: null,
  foto_sello: '',
  medida_pedida: '',
  numero_seguimiento: '',
};

function AddPedidoModal({ isOpen, onClose, onPedidoAdded, filterOptions }) {
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
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Función helper para subir archivos (mantener en frontend por eficiencia)
  const uploadFile = async (file, folder) => {
    if (!file) return '';
    const filePath = `${folder}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('archivos-ventas')
      .upload(filePath, file);
    if (uploadError) {
      throw new Error(`Error subiendo archivo ${folder}: ${uploadError.message}`);
    }
    return filePath; // Solo la ruta relativa
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // 1. Subir archivos (mantener en frontend)
      const archivoBasePath = await uploadFile(formData.archivo_base, 'base');
      const archivoVectorPath = await uploadFile(formData.archivo_vector, 'vector');

      // 2. Preparar datos para la función RPC (ajustado a la nueva función crear_pedido)
      const pedidoCompleto = {
        // Datos del cliente
        p_nombre_cliente: formData.nombre_cliente,
        p_apellido_cliente: formData.apellido_cliente || null,
        p_telefono_cliente: formData.telefono_cliente,
        p_medio_contacto: formData.medio_contacto || null,
        // Datos del pedido
        p_fecha_compra: formData.fecha_compra,
        p_valor_sello: formData.valor_sello ? parseFloat(formData.valor_sello) : null,
        p_valor_envio: formData.valor_envio ? parseFloat(formData.valor_envio) : null,
        p_valor_senia: formData.valor_senia ? parseFloat(formData.valor_senia) : 0,
        p_estado_fabricacion: formData.estado_fabricacion,
        p_estado_venta: formData.estado_venta,
        p_estado_envio: formData.estado_envio,
        p_notas: formData.notas || null,
        p_disenio: formData.disenio || null,
        p_archivo_base: archivoBasePath || null,
        p_archivo_vector: archivoVectorPath || null,
        p_foto_sello: formData.foto_sello || null,
        p_medida_pedida: formData.medida_pedida || null,
        p_numero_seguimiento: formData.numero_seguimiento || null
      };

      // 3. Llamada RPC a la nueva función crear_pedido
      const { error: rpcError } = await supabase.rpc('crear_pedido', pedidoCompleto);

      if (rpcError) throw rpcError;

      onPedidoAdded();
      onClose();

    } catch (err) {
      setError(err.message);
      console.error("Error al guardar el pedido:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Opciones para los selects de estado
  let opcionesFabricacion = filterOptions?.estado_fabricacion?.length
    ? filterOptions.estado_fabricacion
    : ['Sin Hacer', 'Haciendo', 'Hecho', 'Completar diseño'];

  // Forzar orden específico para estado_fabricacion
  const ordenFabricacion = ['Sin Hacer', 'Haciendo', 'Hecho'];
  opcionesFabricacion = [
    ...ordenFabricacion.filter(op => opcionesFabricacion.includes(op)),
    ...opcionesFabricacion.filter(op => !ordenFabricacion.includes(op))
  ];
  const opcionesVenta = filterOptions?.estado_venta?.length
    ? filterOptions.estado_venta
    : ['Foto', 'Transferido'];
  const opcionesEnvio = filterOptions?.estado_envio?.length
    ? filterOptions.estado_envio
    : ['Sin Enviar', 'Hacer Etiqueta', 'Despachado'];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Crear Pedido</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="modal-grid-2col">
            {/* Columna Izquierda */}
            <div className="modal-col">
              <div className="modal-section">
                <div className="modal-section-title">
                  <User size={18} style={{marginRight: 4}} /> Cliente
                </div>
                <div className="modal-row">
                  <input type="text" name="nombre_cliente" placeholder="Nombre" value={formData.nombre_cliente} onChange={handleChange} required className="input-sm" />
                  <input type="text" name="apellido_cliente" placeholder="Apellido" value={formData.apellido_cliente} onChange={handleChange} className="input-sm" />
                </div>
              </div>
              <div className="modal-section">
                <div className="modal-section-title">
                  <Phone size={18} style={{marginRight: 4}} /> Contacto
                </div>
                <div className="modal-row">
                  <input type="text" name="telefono_cliente" placeholder="Teléfono" value={formData.telefono_cliente} onChange={handleChange} required className="input-sm" />
                  <select name="medio_contacto" value={formData.medio_contacto} onChange={handleChange} className="input-sm">
                    <option value="">Medio</option>
                    <option value="Whatsapp">Whatsapp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Mail">Mail</option>
                  </select>
                </div>
              </div>
              <div className="modal-section">
                <div className="modal-section-title">
                  <FileText size={18} style={{marginRight: 4}} /> Diseño
                </div>
                <textarea name="disenio" placeholder="Descripción del diseño..." value={formData.disenio} onChange={handleChange} className="input-sm" />
                <div className="modal-row">
                  <input type="text" name="medida_pedida" placeholder="Medidas (ej: 5x3 cm)" value={formData.medida_pedida} onChange={handleChange} className="input-sm" style={{flex: 1}} />
                  <textarea name="notas" placeholder="Información adicional..." value={formData.notas} onChange={handleChange} className="input-sm" style={{flex: 1, minHeight: 32, maxHeight: 60}} />
                </div>
              </div>
            </div>
            {/* Columna Derecha */}
            <div className="modal-col">
              <div className="modal-section">
                <div className="modal-section-title align-center">
                  <DollarSign size={18} style={{marginRight: 4}} /> Valores
                </div>
                <div className="modal-row">
                  <input type="number" name="valor_sello" placeholder="Sello" value={formData.valor_sello} onChange={handleChange} className="input-xs" />
                  <input type="number" name="valor_senia" placeholder="Seña" value={formData.valor_senia} onChange={handleChange} className="input-xs" />
                  <input type="number" name="valor_envio" placeholder="Envío" value={formData.valor_envio} onChange={handleChange} className="input-xs" />
                </div>
              </div>
              <div className="modal-section">
                <div className="modal-section-title align-center">
                  <Settings size={18} style={{marginRight: 4}} /> Estados
                </div>
                <div className="modal-row">
                  <EstadoSelect
                    value={formData.estado_fabricacion}
                    onChange={val => setFormData(prev => ({ ...prev, estado_fabricacion: val }))}
                    options={['Sin Hacer', 'Haciendo', 'Rehacer', 'Retocar', 'Prioridad', 'Verificar', 'Hecho']}
                    type="fabricacion"
                  />
                </div>
              </div>
              <div className="modal-section">
                <div className="modal-section-title">
                  <Upload size={18} style={{marginRight: 4}} /> Archivos
                </div>
                <div className="modal-row">
                  <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                    <label className="archivo-btn-modal">
                      <Upload style={{ width: '14px', height: '14px', marginRight: 4 }} /> Subir Base
                      <input type="file" name="archivo_base" onChange={handleChange} accept=".jpg,.jpeg,.png" style={{ display: 'none' }} />
                    </label>
                    {formData.archivo_base && (
                      <span className="archivo-nombre-modal">{formData.archivo_base.name}</span>
                    )}
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                    <label className="archivo-btn-modal">
                      <Upload style={{ width: '14px', height: '14px', marginRight: 4 }} /> Subir Vector
                      <input type="file" name="archivo_vector" onChange={handleChange} accept=".eps,.svg,.ai,.pdf" style={{ display: 'none' }} />
                    </label>
                    {formData.archivo_vector && (
                      <span className="archivo-nombre-modal">{formData.archivo_vector.name}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Crear Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPedidoModal;