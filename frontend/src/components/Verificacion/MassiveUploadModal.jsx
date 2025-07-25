import React, { useState, useRef, useEffect } from 'react';
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

function MassiveUploadModal({ isOpen, onClose, pedidos, onMatchingComplete }) {
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchingResults, setMatchingResults] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [pendingMatches, setPendingMatches] = useState([]);
  const fileInputRef = useRef(null);

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
        const randomId = Math.random().toString(36).substr(2, 9);
        const fileExtension = file.name.split('.').pop();
        const fileName = `verificacion_masiva_${timestamp}_${randomId}.${fileExtension}`;
        
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
      }
      
      setUploadedPhotos(prev => [...prev, ...uploadedFiles]);
      
      // Auto-process matching
      await processMatching([...uploadedPhotos, ...uploadedFiles]);
      
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err.message || 'Error al subir las fotos');
    } finally {
      setIsUploading(false);
    }
  };

  const processMatching = async (photos) => {
    if (!photos.length || !pedidos.length) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // First check if API is available with CORS test
      console.log('🔍 Verificando API y CORS...');
      
      try {
        const healthCheck = await fetch('http://localhost:8000/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!healthCheck.ok) {
          throw new Error('CLIP API no responde correctamente');
        }
        
        console.log('✅ Health check exitoso');
      } catch (healthError) {
        if (healthError.message.includes('CORS')) {
          throw new Error('Error de CORS: La API necesita ser reiniciada. Ejecuta: npm run restart-api');
        }
        throw new Error('CLIP API no está disponible. Asegúrate de que esté iniciada.');
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
      
      console.log('📤 Enviando request a /predict...');
      
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData
        // Don't set headers for FormData - let browser handle it automatically
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Error en API (${response.status}): ${errorText}`);
      }
      
      const results = await response.json();
      setMatchingResults(results);
      
      // Process results and update photo states
      const updatedPhotos = [...photos];
      const pendingMatchesData = [];
      
      for (const result of results) {
        if (result.error) continue;
        
        const photoIndex = updatedPhotos.findIndex(p => p.name === result.foto);
        if (photoIndex === -1) continue;
        
        const matchedPedido = pedidoFileMap[result.svg_match];
        if (!matchedPedido) continue;
        
        // Update photo with match info
        updatedPhotos[photoIndex] = {
          ...updatedPhotos[photoIndex],
          matchedPedido: matchedPedido,
          confidence: result.score,
          status: result.score >= 0.5 ? 'matched' : 'pending'
        };
        
        // Add to pending matches for user confirmation
        pendingMatchesData.push({
          photoId: updatedPhotos[photoIndex].id,
          photoName: result.foto,
          photoUrl: updatedPhotos[photoIndex].url,
          pedido: matchedPedido,
          confidence: result.score,
          svgMatch: result.svg_match,
          needsConfirmation: true
        });
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

  const handleConfirmMatch = async (matchIndex, confirmed) => {
    try {
      const match = pendingMatches[matchIndex];
      
      if (confirmed) {
        // Update pedido with the photo
        const { error: updateError } = await supabase.rpc('editar_pedido', {
          p_id: match.pedido.id_pedido,
          p_foto_sello: match.photoId // Use the filename as stored in storage
        });

        if (updateError) throw updateError;
        
        // Mark photo as confirmed
        setUploadedPhotos(prev => 
          prev.map(photo => 
            photo.id === match.photoId 
              ? { ...photo, isConfirmed: true, status: 'confirmed' }
              : photo
          )
        );
        
        // Remove from pending matches
        setPendingMatches(prev => prev.filter((_, i) => i !== matchIndex));
        
        // Notify parent component
        onMatchingComplete && onMatchingComplete(match.pedido.id_pedido, match.photoId);
        
      } else {
        // Mark as rejected, keep as pending
        setUploadedPhotos(prev => 
          prev.map(photo => 
            photo.id === match.photoId 
              ? { ...photo, status: 'pending', matchedPedido: null }
              : photo
          )
        );
        
        // Remove from pending matches
        setPendingMatches(prev => prev.filter((_, i) => i !== matchIndex));
      }
      
    } catch (err) {
      console.error('Error confirming match:', err);
      setError('Error al confirmar la coincidencia');
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
          {/* Upload Area */}
          <div style={{ marginBottom: '32px' }}>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: dragActive ? '2px dashed #06b6d4' : '2px dashed rgba(63, 63, 70, 0.5)',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                background: dragActive ? 'rgba(6, 182, 212, 0.05)' : 'rgba(39, 39, 42, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload style={{ 
                width: '48px', 
                height: '48px', 
                color: dragActive ? '#06b6d4' : '#71717a',
                margin: '0 auto 16px auto'
              }} />
              <p style={{ 
                color: dragActive ? '#06b6d4' : '#a1a1aa',
                fontSize: '18px',
                margin: '0 0 8px 0',
                fontWeight: '500'
              }}>
                {dragActive ? 'Suelta las fotos aquí' : 'Arrastra múltiples fotos aquí o haz clic para seleccionar'}
              </p>
              <p style={{ 
                color: '#71717a',
                fontSize: '14px',
                margin: 0
              }}>
                El sistema analizará automáticamente cada foto y la asignará al pedido correspondiente
              </p>
              
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
              <Loader2 style={{ width: '20px', height: '20px', color: '#06b6d4' }} className="animate-spin" />
              <span style={{ color: '#06b6d4', fontSize: '14px' }}>
                Analizando fotos con IA...
              </span>
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
                        onClick={() => handleConfirmMatch(index, true)}
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
                        onClick={() => handleConfirmMatch(index, false)}
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