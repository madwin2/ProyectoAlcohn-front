import React, { useState, useEffect } from 'react';
import './AddPedidoModal.css';

const initialFormState = {
  nombre_cliente: '',
  apellido_cliente: '',
  telefono_cliente: '',
  medio_contacto: '',
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
  numero_seguimiento: '',
};

function AddPedidoModal({ isOpen, onClose, onPedidoAdded }) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setTimeout(() => {
      setIsSaving(false);
      onPedidoAdded && onPedidoAdded();
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Crear Pedido</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit} className="form-scrollable">
          <div className="modal-grid-2col">
            {/* Columna Izquierda */}
            <div className="modal-col">
              <div className="modal-section">
                <div className="modal-section-title">Cliente</div>
                <div className="modal-row">
                  <input type="text" name="nombre_cliente" placeholder="Nombre" value={formData.nombre_cliente} onChange={handleChange} className="input-sm" required />
                  <input type="text" name="apellido_cliente" placeholder="Apellido" value={formData.apellido_cliente} onChange={handleChange} className="input-sm" />
                </div>
              </div>
              <div className="modal-section">
                <div className="modal-section-title">Contacto</div>
                <div className="modal-row">
                  <input type="text" name="telefono_cliente" placeholder="Teléfono" value={formData.telefono_cliente} onChange={handleChange} className="input-sm" required />
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
                <div className="modal-section-title">Diseño</div>
                <textarea name="disenio" placeholder="Descripción del diseño..." value={formData.disenio} onChange={handleChange} className="input-sm" />
                <div className="modal-row">
                  <textarea name="notas" placeholder="Notas adicionales..." value={formData.notas} onChange={handleChange} className="input-sm" />
                </div>
              </div>
            </div>
            {/* Columna Derecha */}
            <div className="modal-col">
              <div className="modal-section">
                <div className="modal-section-title">Valores</div>
                <div className="modal-row">
                  <input type="number" name="valor_sello" placeholder="Sello" value={formData.valor_sello} onChange={handleChange} className="input-xs" />
                  <input type="number" name="valor_senia" placeholder="Seña" value={formData.valor_senia} onChange={handleChange} className="input-xs" />
                  <input type="number" name="valor_envio" placeholder="Envío" value={formData.valor_envio} onChange={handleChange} className="input-xs" />
                </div>
              </div>
              <div className="modal-section">
                <div className="modal-section-title">Estados</div>
                <div className="modal-row">
                  <select name="estado_fabricacion" value={formData.estado_fabricacion} onChange={handleChange} className="input-sm">
                    <option>Sin Hacer</option>
                    <option>Haciendo</option>
                    <option>Hecho</option>
                  </select>
                  <select name="estado_venta" value={formData.estado_venta} onChange={handleChange} className="input-sm">
                    <option>Foto</option>
                    <option>Transferido</option>
                  </select>
                  <select name="estado_envio" value={formData.estado_envio} onChange={handleChange} className="input-sm">
                    <option>Sin enviar</option>
                    <option>Hacer Etiqueta</option>
                    <option>Despachado</option>
                  </select>
                </div>
              </div>
              <div className="modal-section">
                <div className="modal-section-title">Archivos</div>
                <div className="modal-row">
                  <label className="archivo-btn-modal">
                    Subir Base
                    <input type="file" name="archivo_base" onChange={handleChange} accept=".jpg,.jpeg,.png" style={{ display: 'none' }} />
                  </label>
                  <label className="archivo-btn-modal">
                    Subir Vector
                    <input type="file" name="archivo_vector" onChange={handleChange} accept=".eps,.svg,.ai,.pdf" style={{ display: 'none' }} />
                  </label>
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
