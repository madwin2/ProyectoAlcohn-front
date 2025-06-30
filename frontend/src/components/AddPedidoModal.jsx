import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './AddPedidoModal.css';

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
  estado_fabricacion: 'Sin Hacer',
  estado_venta: 'Foto',
  estado_envio: 'Sin enviar',
  notas: '',
  disenio: '',
  archivo_base: null,
  archivo_vector: null,
  foto_sello: '',
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

    const filePath = `public/${folder}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('archivos_pedidos')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Error subiendo archivo ${folder}: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from('archivos_pedidos').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // 1. Subir archivos (mantener en frontend)
      const archivoBaseUrl = await uploadFile(formData.archivo_base, 'base');
      const archivoVectorUrl = await uploadFile(formData.archivo_vector, 'vector');

      // 2. Preparar datos para la función RPC (todo el resto lo maneja Supabase)
      const pedidoCompleto = {
        // Datos del cliente
        p_nombre_cliente: formData.nombre_cliente,
        p_apellido_cliente: formData.apellido_cliente,
        p_telefono_cliente: formData.telefono_cliente,
        p_medio_contacto: formData.medio_contacto,
        // Datos del pedido
        p_fecha_compra: formData.fecha_compra,
        p_valor_sello: formData.valor_sello ? parseFloat(formData.valor_sello) : null,
        p_valor_envio: formData.valor_envio ? parseFloat(formData.valor_envio) : null,
        p_estado_fabricacion: formData.estado_fabricacion,
        p_estado_venta: formData.estado_venta,
        p_estado_envio: formData.estado_envio,
        p_notas: formData.notas,
        p_disenio: formData.disenio,
        p_archivo_base: archivoBaseUrl,
        p_archivo_vector: archivoVectorUrl,
        p_foto_sello: formData.foto_sello,
        p_numero_seguimiento: formData.numero_seguimiento
      };

      // 3. Una sola llamada RPC que maneja cliente + pedido
      const { error: rpcError } = await supabase.rpc('crear_pedido_completo', pedidoCompleto);

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

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Crear Nuevo Pedido</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Campos del Cliente */}
            <div className="form-group">
              <label htmlFor="nombre_cliente">Nombre</label>
              <input type="text" name="nombre_cliente" value={formData.nombre_cliente} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="apellido_cliente">Apellido</label>
              <input type="text" name="apellido_cliente" value={formData.apellido_cliente} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="telefono_cliente">Teléfono</label>
              <input type="text" name="telefono_cliente" value={formData.telefono_cliente} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="medio_contacto">Medio de Contacto</label>
              <select name="medio_contacto" value={formData.medio_contacto} onChange={handleChange}>
                <option value="">-- Seleccionar --</option>
                <option value="Whatsapp">Whatsapp</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Mail">Mail</option>
              </select>
            </div>

            {/* Campos del Pedido */}
            <div className="form-group">
              <label htmlFor="fecha_compra">Fecha Compra</label>
              <input type="date" name="fecha_compra" value={formData.fecha_compra} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="valor_sello">Valor Sello</label>
              <input type="number" name="valor_sello" value={formData.valor_sello} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="valor_envio">Valor Envío</label>
              <input type="number" name="valor_envio" value={formData.valor_envio} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Estado Fabricación</label>
              <select name="estado_fabricacion" value={formData.estado_fabricacion} onChange={handleChange}>
                {filterOptions?.estado_fabricacion?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                {!filterOptions?.estado_fabricacion?.length && ['Sin Hacer', 'Haciendo', 'Hecho'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Estado Venta</label>
              <select name="estado_venta" value={formData.estado_venta} onChange={handleChange}>
                <option value="">Ninguno</option>
                {filterOptions?.estado_venta?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                {!filterOptions?.estado_venta?.length && ['Foto', 'Transferido'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Estado Envío</label>
              <select name="estado_envio" value={formData.estado_envio} onChange={handleChange}>
                {filterOptions?.estado_envio?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                {!filterOptions?.estado_envio?.length && ['Sin enviar', 'Hacer Etiqueta', 'Despachado'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="disenio">Diseño</label>
              <textarea name="disenio" value={formData.disenio} onChange={handleChange}></textarea>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="archivo_base">Archivo Base (.jpg, .png, .jpeg)</label>
              <input type="file" name="archivo_base" onChange={handleChange} accept=".jpg,.jpeg,.png" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="archivo_vector">Archivo Vector (.eps, .svg, .ai, .pdf)</label>
              <input type="file" name="archivo_vector" onChange={handleChange} accept=".eps,.svg,.ai,.pdf" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="notas">Notas</label>
              <textarea name="notas" value={formData.notas} onChange={handleChange}></textarea>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPedidoModal;