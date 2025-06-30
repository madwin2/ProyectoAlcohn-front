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
  fecha_compra: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
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
    // Resetea el formulario cuando el modal se abre
    if (isOpen) {
      setFormData(initialFormState);
      setError(null);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      // Manejar la selección de archivos
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // --- Lógica de subida de archivos ---
      // Nota: Requiere un bucket PÚBLICO en Supabase Storage llamado 'archivos_pedidos'
      
      let archivoBaseUrl = '';
      if (formData.archivo_base) {
        const file = formData.archivo_base;
        const filePath = `public/base/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('archivos_pedidos')
          .upload(filePath, file);
        if (uploadError) throw new Error(`Error subiendo archivo base: ${uploadError.message}`);
        const { data } = supabase.storage.from('archivos_pedidos').getPublicUrl(filePath);
        archivoBaseUrl = data.publicUrl;
      }

      let archivoVectorUrl = '';
      if (formData.archivo_vector) {
        const file = formData.archivo_vector;
        const filePath = `public/vector/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('archivos_pedidos')
          .upload(filePath, file);
        if (uploadError) throw new Error(`Error subiendo archivo vector: ${uploadError.message}`);
        const { data } = supabase.storage.from('archivos_pedidos').getPublicUrl(filePath);
        archivoVectorUrl = data.publicUrl;
      }

      // --- Lógica de Cliente Mejorada ---
      let clienteId = null;

      // 1. Buscar si el cliente ya existe por número de teléfono
      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id_cliente')
        .eq('telefono_cliente', formData.telefono_cliente)
        .single();
      
      if (existingClient) {
        // Usar el ID del cliente existente
        clienteId = existingClient.id_cliente;
      } else {
        // Si no existe, crear un nuevo cliente
        const { data: newClient, error: clienteError } = await supabase
          .from('clientes')
          .insert({
            nombre_cliente: formData.nombre_cliente,
            apellido_cliente: formData.apellido_cliente,
            telefono_cliente: formData.telefono_cliente,
            medio_contacto: formData.medio_contacto,
          })
          .select('id_cliente')
          .single();
        
        if (clienteError) throw clienteError;
        clienteId = newClient.id_cliente;
      }

      if (!clienteId) {
        throw new Error("No se pudo obtener el ID del cliente.");
      }

      // 2. Crear el pedido asociando el ID del cliente y las URLs de los archivos
      const pedidoData = {
        p_id_cliente: clienteId,
        p_fecha_compra: formData.fecha_compra,
        p_valor_sello: formData.valor_sello ? parseFloat(formData.valor_sello) : null,
        p_valor_envio: formData.valor_envio ? parseFloat(formData.valor_envio) : null,
        p_restante_pagar: formData.restante_pagar ? parseFloat(formData.restante_pagar) : null,
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
      
      const { error: pedidoError } = await supabase.rpc('crear_pedido', pedidoData);

      if (pedidoError) throw pedidoError;

      // 3. Éxito
      onPedidoAdded();

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
                    {/* Opciones por defecto si no hay desde BD */}
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

            <div className="form-group" style={{gridColumn: 'span 2'}}>
              <label htmlFor="disenio">Diseño</label>
              <textarea name="disenio" value={formData.disenio} onChange={handleChange}></textarea>
            </div>
            <div className="form-group" style={{gridColumn: 'span 2'}}>
              <label htmlFor="archivo_base">Archivo Base (.jpg, .png, .jpeg)</label>
              <input type="file" name="archivo_base" onChange={handleChange} accept=".jpg,.jpeg,.png" />
            </div>
            <div className="form-group" style={{gridColumn: 'span 2'}}>
              <label htmlFor="archivo_vector">Archivo Vector (.eps, .svg, .ai, .pdf)</label>
              <input type="file" name="archivo_vector" onChange={handleChange} accept=".eps,.svg,.ai,.pdf" />
            </div>
            <div className="form-group" style={{gridColumn: 'span 2'}}>
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