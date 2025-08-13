import React, { useState, useRef, useEffect } from 'react';
import { CLIP_API_URL } from '../../config/api.js';
import { 
  X, 
  Upload, 
  Camera, 
  Trash2, 
  Zap, 
  AlertCircle,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  FileText,
  Loader2,
  Check,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useNotification } from '../../hooks/useNotification';
import { isClipApiEnabled, getClipDisabledMessage, shouldShowDisabledNotice } from '../../config/verificacionConfig';

// Función para detectar dispositivos móviles
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

// Función para validar archivos de manera más robusta
const validateFile = (file, isMobile) => {
  // Validar que el archivo existe
  if (!file) {
    throw new Error('Archivo no válido');
  }

  // Validar tamaño (más restrictivo en móviles)
  const maxSize = isMobile ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB en móviles, 10MB en desktop
  if (file.size > maxSize) {
    throw new Error(`${file.name} es demasiado grande (máximo ${isMobile ? '5MB' : '10MB'})`);
  }

  // Validar tipo de archivo de manera más robusta
  const isValidImage = 
    // Verificar por tipo MIME
    (file.type && file.type.startsWith('image/')) ||
    // Verificar por extensión como respaldo
    /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name) ||
    // Verificar por nombre de archivo
    file.name.toLowerCase().includes('img') ||
    file.name.toLowerCase().includes('photo') ||
    file.name.toLowerCase().includes('image');

  if (!isValidImage) {
    throw new Error(`${file.name} no parece ser una imagen válida`);
  }

  return true;
};

function MassiveUploadModal({ isOpen, onClose, pedidos, onMatchingComplete }) {
  console.log('🔧 MASSIVE UPLOAD - Component loaded');
  console.log('🔧 MASSIVE UPLOAD - isClipApiEnabled():', isClipApiEnabled());
  console.log('🔧 MASSIVE UPLOAD - shouldShowDisabledNotice():', shouldShowDisabledNotice());
  
  const { addNotification } = useNotification();
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchingResults, setMatchingResults] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef(null);

  // Detectar dispositivo móvil al cargar
  useEffect(() => {
    setIsMobile(isMobileDevice());
    console.log('📱 MASSIVE UPLOAD - Device detected as:', isMobile ? 'MOBILE' : 'DESKTOP');
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUploadedPhotos([]);
      setMatchingResults([]);
      setPendingMatches([]);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    
    try {
      const uploadedFiles = [];
      
      // Procesar archivos uno por uno para evitar problemas de memoria
      for (const file of files) {
        try {
          // Validar archivo con límites específicos para móviles
          validateFile(file, isMobile);
          
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substr(2, 9);
          const fileExtension = file.name.split('.').pop();
          const fileName = `fotos/verificacion_masiva_${timestamp}_${randomId}.${fileExtension}`;
          
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
            fileName: fileName,
            status: 'uploaded',
            matchedPedido: null,
            confidence: 0,
            isConfirmed: false
          });

          // Pequeña pausa entre archivos para evitar sobrecarga en móviles
          if (isMobile && files.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          // Continuar con otros archivos en lugar de fallar completamente
          addNotification(`Error con ${file.name}: ${fileError.message}`, 'error');
        }
      }
      
      if (uploadedFiles.length === 0) {
        throw new Error('No se pudo procesar ningún archivo');
      }
      
      setUploadedPhotos(prev => [...prev, ...uploadedFiles]);
      
      // Auto-process matching only if CLIP API is enabled
      if (isClipApiEnabled()) {
        await processMatching([...uploadedPhotos, ...uploadedFiles]);
      } else {
        console.log('⏸️ MASSIVE UPLOAD - CLIP API disabled, saving photos to pending table');
        // Save all photos to pending table when CLIP API is disabled
        for (const photo of uploadedFiles) {
          try {
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
              console.log('✅ MASSIVE UPLOAD - Photo saved to pending:', photo.name);
            }
          } catch (err) {
            console.error('Error saving photo to pending:', err);
          }
        }
      }
      
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err.message || 'Error al subir las fotos');
    } finally {
      setIsUploading(false);
    }
  };

  const processMatching = async (photos) => {
    if (!photos.length || !pedidos.length) return;
    
    // Check if CLIP API is enabled
    if (!isClipApiEnabled()) {
      console.log('⏸️ MASSIVE UPLOAD - CLIP API disabled, skipping processing');
      setMatchingResults([]);
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Verificar API antes de procesar
      console.log('🔍 Verificando API del servidor...');
      
      try {
        // Agregar timeout para evitar colgar en conexiones lentas
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
        
        const healthCheck = await fetch(`${CLIP_API_URL}/health`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!healthCheck.ok) {
          throw new Error('API no responde correctamente');
        }
        console.log('✅ API del servidor funcionando');
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout: La API tardó demasiado en responder');
        }
        console.error('❌ Error verificando API:', error);
        throw new Error('No se puede conectar al servidor. Verifica que esté funcionando.');
      }

      // Prepare all design files from pedidos
      const allDesignFiles = [];
      const pedidoFileMap = {};
      
      for (const pedido of pedidos) {
        const files = [];
        
        // Add base file
        if (pedido.archivo_base) {
          try {
            const baseUrl = getPublicUrl(pedido.archivo_base);
            const response = await fetch(baseUrl);
            const blob = await response.blob();
            const baseFile = new File([blob], `base_${pedido.id_pedido}.svg`, { type: 'image/svg+xml' });
            files.push(baseFile);
            allDesignFiles.push(baseFile);
            pedidoFileMap[`base_${pedido.id_pedido}.svg`] = pedido;
            console.log('Added base file:', `base_${pedido.id_pedido}.svg`, 'for pedido:', pedido.id_pedido);
          } catch (err) {
            console.warn('Error loading base file for pedido', pedido.id_pedido, err);
          }
        }
        
        // Add vector file
        if (pedido.archivo_vector) {
          try {
            const vectorUrl = getPublicUrl(pedido.archivo_vector);
            const response = await fetch(vectorUrl);
            const blob = await response.blob();
            const vectorFile = new File([blob], `vector_${pedido.id_pedido}.svg`, { type: 'image/svg+xml' });
            files.push(vectorFile);
            allDesignFiles.push(vectorFile);
            pedidoFileMap[`vector_${pedido.id_pedido}.svg`] = pedido;
            console.log('Added vector file:', `vector_${pedido.id_pedido}.svg`, 'for pedido:', pedido.id_pedido);
          } catch (err) {
            console.warn('Error loading vector file for pedido', pedido.id_pedido, err);
          }
        }
      }
      
      if (allDesignFiles.length === 0) {
        setMatchingResults([]);
        return;
      }
      
      // Prepare photo files
      const photoFiles = [];
      for (const photo of photos) {
        if (photo.status !== 'uploaded') continue;
        
        try {
          const response = await fetch(photo.url);
          const blob = await response.blob();
          const photoFile = new File([blob], photo.name, { type: blob.type });
          photoFiles.push(photoFile);
        } catch (err) {
          console.warn('Error loading photo:', err);
        }
      }
      
      if (photoFiles.length === 0) {
        setMatchingResults([]);
        return;
      }
      
      // Call CLIP API
      const formData = new FormData();
      
      allDesignFiles.forEach(file => {
        formData.append('svgs', file);
      });
      
      photoFiles.forEach(file => {
        formData.append('fotos', file);
      });
      
      console.log('📤 MASSIVE UPLOAD - Enviando request a /predict...');
      console.log('📁 MASSIVE UPLOAD - FormData contents:', {
        svgCount: formData.getAll('svgs').length,
        fotoCount: formData.getAll('fotos').length,
        svgNames: formData.getAll('svgs').map(f => f.name),
        fotoNames: formData.getAll('fotos').map(f => f.name)
      });
      
      // Agregar timeout para la request principal
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout
      
      const response = await fetch(`${CLIP_API_URL}/predict`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Error en API (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🚀 MASSIVE UPLOAD - API Response completa:', data);
      console.log('📊 MASSIVE UPLOAD - data.success:', data.success);
      console.log('📋 MASSIVE UPLOAD - data.results:', data.results);
      const results = data.results || [];
      console.log('🎯 MASSIVE UPLOAD - Results finales:', results);
      setMatchingResults(results);
      
      // Process results and update photo states
      const updatedPhotos = [...photos];
      const pendingMatchesData = [];
      
      console.log('🔄 MASSIVE UPLOAD - Processing results:', results);
      console.log('🗂️ MASSIVE UPLOAD - Pedido file map:', pedidoFileMap);
      
      for (const result of results) {
        if (result.error) continue;
        
        console.log('Processing result:', result);
        
        const photoIndex = updatedPhotos.findIndex(p => p.name === result.foto);
        console.log('Photo index:', photoIndex, 'for photo:', result.foto);
        
        if (photoIndex === -1) continue;
        
        console.log('Looking for pedido with svg:', result.svg);
        console.log('Result object keys:', Object.keys(result));
        console.log('Result matches:', result.matches);
        
        // Buscar el match con match: true
        const matchedMatch = result.matches?.find(match => match.match === true);
        console.log('Matched match:', matchedMatch);
        
        const matchedPedido = matchedMatch ? pedidoFileMap[matchedMatch.svg] : null;
        console.log('Matched pedido:', matchedPedido);
        
        if (!matchedPedido) continue;
        
        // Update photo with match info
        updatedPhotos[photoIndex] = {
          ...updatedPhotos[photoIndex],
          matchedPedido: matchedPedido,
          confidence: matchedMatch ? matchedMatch.score : 0,
          status: matchedMatch ? 'matched' : 'pending'
        };
        
        // Add to pending matches for user confirmation
        if (matchedMatch) {
          pendingMatchesData.push({
            photoId: updatedPhotos[photoIndex].id,
            photoName: result.foto,
            photoUrl: updatedPhotos[photoIndex].url,
            pedido: matchedPedido,
            confidence: matchedMatch.score,
            svgMatch: matchedMatch.svg,
            needsConfirmation: true
          });
        }
      }
      
      setUploadedPhotos(updatedPhotos);
      setPendingMatches(pendingMatchesData);
      
    } catch (err) {
      console.error('Error processing matching:', err);
      
      // Set more specific error messages
      if (err.message.includes('Failed to fetch')) {
        setError('No se puede conectar a la API CLIP. Reinicia la API con: npm run restart-api');
      } else if (err.message.includes('CORS')) {
        setError('Error de CORS. Reinicia la API con: npm run restart-api');
      } else if (err.message.includes('restart-api')) {
        setError(err.message); // Already has the restart instruction
      } else {
        setError(err.message || 'Error al procesar las imágenes con IA');
      }
      
      setMatchingResults([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPublicUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;
    return `${supabase.supabaseUrl}/storage/v1/object/public/archivos-ventas/${filePath}`;
  };

  const getDesignFileUrl = (pedido) => {
    // Prioritize base file, fallback to vector file
    if (pedido.archivo_base) {
      return getPublicUrl(pedido.archivo_base);
    }
    if (pedido.archivo_vector) {
      return getPublicUrl(pedido.archivo_vector);
    }
    return null;
  };

  const handleConfirmMatch = async (match, confirmed) => {
    try {
      if (confirmed) {
        // Update pedido with the photo in database
        const { error: updateError } = await supabase.rpc('editar_pedido', {
          p_id: match.pedido.id_pedido,
          p_foto_sello: match.photoId // Use the full path (fileName) instead of just the name
        });

        if (updateError) throw updateError;
        
        // Mark as confirmed and assign to pedido
        setUploadedPhotos(prev => 
          prev.map(photo => 
            photo.id === match.photoId 
              ? { ...photo, matchedPedido: match.pedido, status: 'confirmed' }
              : photo
          )
        );
        
        // Remove from pending matches
        setPendingMatches(prev => prev.filter(m => m.photoId !== match.photoId));
        
        // Call the callback to update the parent
        onMatchingComplete();
        
        addNotification('Foto asignada correctamente al pedido', 'success');
      } else {
        // Mark as rejected, keep as pending
        setUploadedPhotos(prev => 
          prev.map(photo => 
            photo.id === match.photoId 
              ? { ...photo, matchedPedido: null, status: 'pending' }
              : photo
          )
        );
        
        // Remove from pending matches
        setPendingMatches(prev => prev.filter(m => m.photoId !== match.photoId));
        
        // Save to database as pending photo
        const { error: saveError } = await supabase
          .from('fotos_pendientes')
          .insert({
            nombre_archivo: match.photoName,
            url_foto: match.photoId, // Use the relative path instead of full URL
            fecha_subida: new Date().toISOString(),
            estado: 'pendiente'
          });
        
        if (saveError) {
          console.error('Error saving pending photo:', saveError);
          addNotification('Error al guardar foto pendiente', 'error');
        } else {
          addNotification('Foto guardada en pendientes', 'success');
        }
      }
    } catch (err) {
      console.error('Error handling match confirmation:', err);
      addNotification('Error al procesar confirmación', 'error');
    }
  };

  const handleRemovePhoto = async (photoId) => {
    try {
      // Remove from storage
      const { error: deleteError } = await supabase.storage
        .from('archivos-ventas')
        .remove([photoId]);
      
      if (deleteError) throw deleteError;
      
      // Remove from state
      setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId));
      setPendingMatches(prev => prev.filter(match => match.photoId !== photoId));
      
    } catch (err) {
      console.error('Error removing photo:', err);
      setError('Error al eliminar la foto');
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#22c55e';
      case 'matched': return '#06b6d4';
      case 'pending': return '#f59e0b';
      default: return '#71717a';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle style={{ width: '16px', height: '16px' }} />;
      case 'matched': return <Zap style={{ width: '16px', height: '16px' }} />;
      case 'pending': return <Clock style={{ width: '16px', height: '16px' }} />;
      default: return <ImageIcon style={{ width: '16px', height: '16px' }} />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'matched': return 'Coincidencia encontrada';
      case 'pending': return 'Pendiente';
      default: return 'Subido';
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
        width: '95%',
        maxWidth: '1200px',
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
              Carga Masiva de Fotos
            </h2>
            <p style={{
              color: '#71717a',
              fontSize: '14px',
              margin: 0
            }}>
              Sube múltiples fotos y el sistema las asignará automáticamente a los pedidos correspondientes
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
            <div
              onDragOver={!isMobile ? handleDragOver : undefined}
              onDragLeave={!isMobile ? handleDragLeave : undefined}
              onDrop={!isMobile ? handleDrop : undefined}
              style={{
                border: (!isMobile && dragActive) ? '2px dashed #06b6d4' : '2px dashed rgba(63, 63, 70, 0.5)',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                background: (!isMobile && dragActive) ? 'rgba(6, 182, 212, 0.05)' : 'rgba(39, 39, 42, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload style={{ 
                width: '48px', 
                height: '48px', 
                color: (!isMobile && dragActive) ? '#06b6d4' : '#71717a',
                margin: '0 auto 16px auto'
              }} />
              <p style={{ 
                color: (!isMobile && dragActive) ? '#06b6d4' : '#a1a1aa',
                fontSize: '18px',
                margin: '0 0 8px 0',
                fontWeight: '500'
              }}>
                {isMobile 
                  ? 'Toca aquí para seleccionar fotos'
                  : dragActive 
                    ? 'Suelta las fotos aquí' 
                    : 'Arrastra múltiples fotos aquí o haz clic para seleccionar'
                }
              </p>
              <p style={{ 
                color: '#71717a',
                fontSize: '14px',
                margin: '0 0 16px 0'
              }}>
                {isClipApiEnabled() 
                  ? 'El sistema analizará automáticamente cada foto y la asignará al pedido correspondiente'
                  : 'Las fotos se guardarán en pendientes para asignación manual'
                }
              </p>
              
              {/* Información específica para móviles */}
              {isMobile && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '8px',
                  marginTop: '16px'
                }}>
                  <p style={{
                    color: '#06b6d4',
                    fontSize: '12px',
                    margin: '0 0 4px 0',
                    fontWeight: '500'
                  }}>
                    📱 Dispositivo móvil detectado
                  </p>
                  <p style={{
                    color: '#06b6d4',
                    fontSize: '11px',
                    margin: 0
                  }}>
                    • Límite de archivo: 5MB por foto<br/>
                    • Selecciona fotos una por una o en grupo<br/>
                    • Procesamiento optimizado para móviles
                  </p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Error Message */}
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

          {/* Processing Status */}
          {isProcessing && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <Loader2 style={{ 
                width: '20px', 
                height: '20px', 
                color: '#06b6d4',
                animation: 'spin 1s linear infinite'
              }} />
              <div>
                <div style={{ color: '#06b6d4', fontSize: '14px', fontWeight: '500' }}>
                  Procesando fotos...
                </div>
                <div style={{ color: '#71717a', fontSize: '12px' }}>
                  {isMobile 
                    ? 'Analizando coincidencias (puede tardar más en móviles)'
                    : 'Analizando coincidencias con IA'
                  }
                </div>
              </div>
              <style>
                {`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}
              </style>
            </div>
          )}

          {/* Uploading Status */}
          {isUploading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <Loader2 style={{ 
                width: '20px', 
                height: '20px', 
                color: '#3b82f6',
                animation: 'spin 1s linear infinite'
              }} />
              <div>
                <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '500' }}>
                  Subiendo fotos...
                </div>
                <div style={{ color: '#71717a', fontSize: '12px' }}>
                  {isMobile 
                    ? 'Subiendo archivos (procesando uno por uno para optimizar memoria)'
                    : 'Subiendo archivos al servidor'
                  }
                </div>
              </div>
            </div>
          )}

          {/* Pending Matches for Confirmation */}
          {pendingMatches.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                color: 'white',
                fontSize: '16px',
                fontWeight: '500',
                margin: '0 0 16px 0'
              }}>
                Confirmar Coincidencias
              </h3>
              
              <div style={{
                display: 'grid',
                gap: '16px'
              }}>
                {pendingMatches.map((match, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: '8px'
                    }}
                  >
                    {/* Foto subida */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        color: '#a1a1aa', 
                        fontSize: '12px', 
                        marginBottom: '4px',
                        fontWeight: '500'
                      }}>
                        Foto subida
                      </div>
                      <img
                        src={match.photoUrl}
                        alt={match.photoName}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid rgba(63, 63, 70, 0.5)'
                        }}
                      />
                      <div style={{ 
                        color: '#71717a', 
                        fontSize: '10px', 
                        marginTop: '4px',
                        maxWidth: '80px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {match.photoName}
                      </div>
                    </div>

                    {/* Flecha de comparación */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '0 16px'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Zap style={{ width: '20px', height: '20px', color: '#06b6d4' }} />
                        <span style={{ 
                          color: '#06b6d4', 
                          fontSize: '12px', 
                          fontWeight: '500',
                          textAlign: 'center'
                        }}>
                          {Math.round(match.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Archivo base/vector */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        color: '#a1a1aa', 
                        fontSize: '12px', 
                        marginBottom: '4px',
                        fontWeight: '500'
                      }}>
                        Archivo base
                      </div>
                      <img
                        src={getDesignFileUrl(match.pedido)}
                        alt={match.pedido.disenio}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid rgba(63, 63, 70, 0.5)',
                          background: 'white'
                        }}
                        onError={(e) => {
                          // Fallback to vector file if base file fails
                          const vectorUrl = getPublicUrl(match.pedido.archivo_vector);
                          if (vectorUrl && e.target.src !== vectorUrl) {
                            e.target.src = vectorUrl;
                          }
                        }}
                      />
                      <div style={{ 
                        color: '#71717a', 
                        fontSize: '10px', 
                        marginTop: '4px',
                        maxWidth: '80px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {match.pedido.disenio}
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, marginLeft: '16px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ color: '#06b6d4', fontSize: '14px', fontWeight: '500' }}>
                          Coincidencia encontrada
                        </span>
                      </div>
                      
                      <div style={{ color: 'white', fontSize: '15px', marginBottom: '8px' }}>
                        <strong>Pedido #{match.pedido.id_pedido}</strong>
                      </div>
                      
                      <div style={{ color: '#a1a1aa', fontSize: '13px' }}>
                        Cliente: {match.pedido.clientes?.nombre_cliente} {match.pedido.clientes?.apellido_cliente}
                        <br />
                        Diseño: {match.pedido.disenio}
                        <br />
                        Archivo match: {match.svgMatch}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleConfirmMatch(match, true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '8px 16px',
                          background: '#22c55e',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#16a34a';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#22c55e';
                        }}
                      >
                        <ThumbsUp style={{ width: '12px', height: '12px' }} />
                        Confirmar
                      </button>
                      
                      <button
                        onClick={() => handleConfirmMatch(match, false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '8px 16px',
                          background: '#ef4444',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#ef4444';
                        }}
                      >
                        <ThumbsDown style={{ width: '12px', height: '12px' }} />
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                Fotos Subidas ({uploadedPhotos.length})
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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
                    
                    {/* Status Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      borderRadius: '12px',
                      color: getStatusColor(photo.status)
                    }}>
                      {getStatusIcon(photo.status)}
                      <span style={{ fontSize: '10px', fontWeight: '500' }}>
                        {getStatusLabel(photo.status)}
                      </span>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleRemovePhoto(photo.id)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
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
                    
                    {/* Photo Info */}
                    <div style={{
                      padding: '8px',
                      background: 'rgba(0, 0, 0, 0.7)'
                    }}>
                      <p style={{
                        color: 'white',
                        fontSize: '12px',
                        margin: '0 0 4px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {photo.name}
                      </p>
                      
                      {photo.matchedPedido && (
                        <div>
                          <p style={{
                            color: '#06b6d4',
                            fontSize: '11px',
                            margin: '0 0 2px 0'
                          }}>
                            → {photo.matchedPedido.disenio}
                          </p>
                          <p style={{
                            color: '#a1a1aa',
                            fontSize: '10px',
                            margin: 0
                          }}>
                            {Math.round(photo.confidence * 100)}% similitud
                          </p>
                        </div>
                      )}
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
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ color: '#71717a', fontSize: '14px' }}>
              {uploadedPhotos.length > 0 && (
                <>
                  {uploadedPhotos.filter(p => p.status === 'confirmed').length} confirmadas, {' '}
                  {uploadedPhotos.filter(p => p.status === 'pending').length} pendientes
                </>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Show "Guardar en Pendientes" button when CLIP API is disabled */}
              {!isClipApiEnabled() && uploadedPhotos.length > 0 && (
                <button
                  onClick={async () => {
                    console.log('💾 MASSIVE UPLOAD - Manually saving photos to pending');
                    for (const photo of uploadedPhotos) {
                      try {
                        const { error: insertError } = await supabase
                          .from('fotos_pendientes')
                          .insert({
                            nombre_archivo: photo.name,
                            url_foto: photo.id,
                            estado: 'pendiente',
                            usuario_subio: (await supabase.auth.getUser()).data.user?.id
                          });
                          
                        if (insertError) {
                          console.error('Error saving photo to pending:', insertError);
                        } else {
                          console.log('✅ MASSIVE UPLOAD - Photo saved to pending:', photo.name);
                        }
                      } catch (err) {
                        console.error('Error saving photo to pending:', err);
                      }
                    }
                    addNotification('Fotos guardadas en pendientes', 'success');
                    onClose();
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#06b6d4',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#0891b2';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#06b6d4';
                  }}
                >
                  Guardar en Pendientes
                </button>
              )}
              
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
                {uploadedPhotos.length === 0 ? 'Cancelar' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MassiveUploadModal;