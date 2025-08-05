import React, { useState, useCallback } from 'react';
import { MessageSquare, Save, Edit3, Clock, User } from 'lucide-react';

const MessageConfig = ({ config, loading, updating, onUpdateMessage }) => {
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);

  const handleEditStart = useCallback((item) => {
    setEditingKey(item.config_key);
    setEditValue(item.config_value);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingKey(null);
    setEditValue('');
  }, []);

  const handleEditSave = useCallback(async (key) => {
    if (editValue.trim() === '') {
      alert('El mensaje no puede estar vacío');
      return;
    }

    const success = await onUpdateMessage(key, editValue.trim());
    if (success) {
      setEditingKey(null);
      setEditValue('');
    }
  }, [editValue, onUpdateMessage]);

  const handleBlur = useCallback((key, currentValue) => {
    // Debounce para evitar spam de requests
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      if (config && currentValue !== config.find(c => c.config_key === key)?.config_value) {
        onUpdateMessage(key, currentValue);
      }
    }, 1000);

    setDebounceTimer(timer);
  }, [config, onUpdateMessage, debounceTimer]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded p-4">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const messageConfigs = config ? config.filter(c => c.config_key.startsWith('mensaje_')) : [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Configuración de Mensajes
        {updating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
      </h2>
      
      {!messageConfigs || messageConfigs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No hay mensajes configurados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messageConfigs.map(item => (
            <div key={item.config_key} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  {item.description}
                </label>
                <div className="flex items-center gap-2">
                  {editingKey === item.config_key ? (
                    <>
                      <button
                        onClick={() => handleEditSave(item.config_key)}
                        disabled={updating}
                        className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                        title="Guardar"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleEditCancel}
                        disabled={updating}
                        className="p-1 text-gray-600 hover:text-gray-700 disabled:opacity-50"
                        title="Cancelar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEditStart(item)}
                      disabled={updating}
                      className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {editingKey === item.config_key ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleBlur(item.config_key, editValue)}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Escribe el mensaje aquí..."
                />
              ) : (
                <div className="relative">
                  <textarea
                    defaultValue={item.config_value}
                    className="w-full p-3 border rounded-md bg-gray-50 cursor-not-allowed"
                    rows={3}
                    readOnly
                  />
                  <div className="absolute inset-0 bg-transparent" />
                </div>
              )}
              
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Último cambio: {formatDate(item.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>por {item.updated_by}</span>
                  </div>
                </div>
                <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {item.config_key}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Los cambios se guardan automáticamente cuando sales del campo de texto. 
          También puedes usar los botones de edición para guardar manualmente.
        </p>
      </div>
    </div>
  );
};

export default MessageConfig; 