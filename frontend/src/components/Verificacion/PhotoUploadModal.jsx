import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Trash2, 
  Zap, 
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  FileText,
  Loader2
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { formatMatchingResults } from '../../services/clipService';
import { CLIP_API_URL } from '../../config/api';
import { isClipApiEnabled, getClipDisabledMessage, shouldShowDisabledNotice } from '../../config/verificacionConfig';

function PhotoUploadModal({ isOpen, onClose, pedido, onPhotosUploaded, getPublicUrl }) {
  console.log('🔧 PHOTO UPLOAD - Component loaded');
  console.log('🔧 PHOTO UPLOAD - isClipApiEnabled():', isClipApiEnabled());
  console.log('🔧 PHOTO UPLOAD - shouldShowDisabledNotice():', shouldShowDisabledNotice());
  
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchingResults, setMatchingResults] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUploadedPhotos([]);
      setMatchingResults([]);
      setError(null);
      
      // Load existing photos if any
      if (pedido?.foto_sello) {
        setUploadedPhotos([{
          id: 'existing',
          url: getPublicUrl(pedido.foto_sello),
          name: 'Foto existente',
          isExisting: true
        }]);
      }
    }
  }, [isOpen, pedido]);

  if (!isOpen) return null;

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    
    try {
      const uploadedFiles = [];
      
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} no es una imagen válida`);
        }
        
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} es demasiado grande (máximo 10MB)`);
        }

        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `fotos/verificacion_${pedido.id_pedido}_${timestamp}.${fileExtension}`;
        
        const { error: uploadError } = await supabase.storage
          .from('archivos-ventas')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        const { data: publicData } = supabase.storage
          .from('archivos-ventas')
          .getPublicUrl(fileName);
          
        uploadedFiles.push({
          id: fileName,
          url: publicData.publicUrl,
          name: file.name,
          isExisting: false
        });
      }
      
      const newPhotos = [...uploadedPhotos, ...uploadedFiles];
      setUploadedPhotos(newPhotos);
      
      // CLIP API is disabled - no automatic processing
      console.log('⏸️ DEBUG: CLIP API disabled, skipping automatic processing');
      
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err.message || 'Error al subir las fotos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (photoId) => {
    setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileUpload(files);
  };

  const handleSave = async () => {
    try {
      console.log('💾 DEBUG: handleSave called');
      console.log('💾 DEBUG: CLIP API enabled?', isClipApiEnabled());
      
      // CLIP API is disabled - always save to pending
      console.log('📸 DEBUG: Saving photos to pending table');
      const newPhotos = uploadedPhotos.filter(photo => !photo.isExisting);
      console.log('📸 DEBUG: Photos to save:', newPhotos.length);
      
      for (const photo of newPhotos) {
        const { error: insertError } = await supabase
          .from('fotos_pendientes')
          .insert({
            nombre_archivo: photo.name,
            url_foto: photo.id, // This is the relative path from the bucket
            estado: 'pendiente',
            usuario_subio: (await supabase.auth.getUser()).data.user?.id
          });
          
        if (insertError) {
          console.error('Error saving photo to pending:', insertError);
        } else {
          console.log('✅ DEBUG: Photo saved to pending:', photo.name);
        }
      }
      
      onClose();
    } catch (err) {
      console.error('Error saving photos:', err);
      setError('Error al guardar las fotos');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(9, 9, 11, 0.95)',
        border: '1px solid rgba(39, 39, 42, 0.5)',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 32px',
          borderBottom: '1px solid rgba(39, 39, 42, 0.5)'
        }}>
          <div>
            <h2 style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: '600',
              margin: 0,
              marginBottom: '4px'
            }}>
              Verificación de Sello
            </h2>
            <p style={{
              color: '#71717a',
              fontSize: '14px',
              margin: 0
            }}>
              {pedido.disenio || 'Diseño sin especificar'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(39, 39, 42, 0.5)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#71717a';
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '32px',
          maxHeight: 'calc(90vh - 160px)',
          overflowY: 'auto'
        }}>
          {/* CLIP API Disabled Notice */}
          {shouldShowDisabledNotice() && !isClipApiEnabled() && (
            <div style={{
              padding: '16px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
              <span style={{ color: '#f59e0b', fontSize: '14px' }}>
                <strong>{getClipDisabledMessage()}</strong>
              </span>
            </div>
          )}

          {/* Upload Area */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              color: 'white',
              fontSize: '16px',
              fontWeight: '500',
              margin: '0 0 16px 0'
            }}>
              Subir Fotos del Sello
            </h3>
            
            <div
              ref={fileInputRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed',
                borderColor: dragActive ? '#06b6d4' : 'rgba(63, 63, 70, 0.5)',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: dragActive ? 'rgba(6, 182, 212, 0.05)' : 'transparent'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              
              <div style={{ marginBottom: '16px' }}>
                <Upload style={{ 
                  width: '48px', 
                  height: '48px', 
                  color: dragActive ? '#06b6d4' : '#71717a',
                  margin: '0 auto'
                }} />
              </div>
              
              <p style={{
                color: dragActive ? '#06b6d4' : '#71717a',
                fontSize: '16px',
                fontWeight: '500',
                margin: '0 0 8px 0'
              }}>
                Arrastra las fotos aquí o haz clic para seleccionar
              </p>
              
              <p style={{
                color: '#71717a',
                fontSize: '14px',
                margin: 0
              }}>
                PNG, JPG, JPEG hasta 10MB
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
              <span style={{ color: '#ef4444', fontSize: '14px' }}>
                {error}
              </span>
            </div>
          )}

          {/* Uploaded Photos */}
          {uploadedPhotos.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                color: 'white',
                fontSize: '16px',
                fontWeight: '500',
                margin: '0 0 16px 0'
              }}>
                Fotos Subidas
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '16px'
              }}>
                {uploadedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    style={{
                      position: 'relative',
                      background: 'rgba(39, 39, 42, 0.5)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid rgba(63, 63, 70, 0.5)'
                    }}
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover'
                      }}
                    />
                    
                    {!photo.isExisting && (
                      <button
                        onClick={() => handleRemovePhoto(photo.id)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(239, 68, 68, 0.8)',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 style={{ width: '12px', height: '12px' }} />
                      </button>
                    )}
                    
                    <div style={{
                      padding: '8px',
                      background: 'rgba(0, 0, 0, 0.7)'
                    }}>
                      <p style={{
                        color: 'white',
                        fontSize: '12px',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {photo.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                borderRadius: '8px',
                color: '#a1a1aa',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
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
              Cancelar
            </button>
            
            <button
              onClick={handleSave}
              disabled={uploadedPhotos.length === 0 || isUploading}
              style={{
                padding: '12px 24px',
                background: uploadedPhotos.length === 0 || isUploading ? 'rgba(63, 63, 70, 0.5)' : '#06b6d4',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: uploadedPhotos.length === 0 || isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: uploadedPhotos.length === 0 || isUploading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (uploadedPhotos.length > 0 && !isUploading) {
                  e.target.style.background = '#0891b2';
                }
              }}
              onMouseLeave={(e) => {
                if (uploadedPhotos.length > 0 && !isUploading) {
                  e.target.style.background = '#06b6d4';
                }
              }}
            >
              {isUploading ? 'Subiendo...' : 'Guardar en Pendientes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhotoUploadModal;
