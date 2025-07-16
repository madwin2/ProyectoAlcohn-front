import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, AlertCircle } from 'lucide-react';
import './AddTareaModal.css';

const AddTareaModal = ({ isOpen, onClose, pedido, onCreateTarea }) => {
  const [descripcion, setDescripcion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onCreateTarea(pedido.id_pedido, descripcion.trim());
      setDescripcion('');
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear la tarea');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setDescripcion('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !pedido) return null;

  const modalContent = (
    <div className="add-tarea-modal-overlay" onClick={handleClose}>
      <div className="add-tarea-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-tarea-modal-header">
          <h2>Agregar Tarea Pendiente</h2>
          <button 
            className="add-tarea-modal-close" 
            onClick={handleClose}
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </div>

        <div className="add-tarea-modal-content">
          <div className="pedido-info">
            <h3>Pedido #{pedido.id_pedido}</h3>
            <p className="pedido-disenio">
              {pedido.disenio || 'Sin diseño especificado'}
            </p>
            <p className="pedido-cliente">
              {pedido.clientes?.nombre_cliente} {pedido.clientes?.apellido_cliente}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="add-tarea-form">
            <div className="form-group">
              <label htmlFor="descripcion">Descripción de la tarea</label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Subir vector, Verificar medidas, Contactar cliente..."
                rows={4}
                disabled={isSaving}
                autoFocus
              />
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleClose}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={isSaving || !descripcion.trim()}
              >
                {isSaving ? (
                  <>
                    <div className="spinner"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Crear Tarea
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AddTareaModal; 