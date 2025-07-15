import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Search, 
  Image as ImageIcon, 
  AlertCircle, 
  Zap, 
  CheckCircle, 
  X,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Archive
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

function PendingPhotosManager({ isOpen, onClose, onPhotoMatched }) {
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [availablePedidos, setAvailablePedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPendingPhotos();
      loadAvailablePedidos();
    }
  }, [isOpen]);

  const loadPendingPhotos = async () => {
    try {
      setLoading(true);
      
      // Load pending photos from localStorage or a dedicated table
      const stored = localStorage.getItem('pendingVerificationPhotos');
      if (stored) {
        setPendingPhotos(JSON.parse(stored));
      }
      
      // TODO: Replace with actual database query when table is created
      // const { data, error } = await supabase
      //   .from('fotos_pendientes')
      //   .select('*')
      //   .eq('estado', 'pendiente');
      
    } catch (err) {
      console.error('Error loading pending photos:', err);
      setError('Error al cargar fotos pendientes');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          clientes!inner (
            nombre_cliente,
            apellido_cliente,
            telefono_cliente,
            medio_contacto
          )
        `)
        .eq('estado_fabricacion', 'Verificar')
        .order('fecha_compra', { ascending: false });

      if (error) throw error;
      setAvailablePedidos(data || []);
    } catch (err) {
      console.error('Error loading pedidos:', err);
      setError('Error al cargar pedidos disponibles');
    }
  };

  const processAutoMatching = async () => {
    if (!pendingPhotos.length || !availablePedidos.length) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      // Prepare design files from available pedidos
      const allDesignFiles = [];
      const pedidoFileMap = {};
      
      for (const pedido of availablePedidos) {
        // Add base file
        if (pedido.archivo_base) {
          try {
            const baseUrl = getPublicUrl(pedido.archivo_base);
            const response = await fetch(baseUrl);
            const blob = await response.blob();
            const baseFile = new File([blob], `base_${pedido.id_pedido}.svg`, { type: 'image/svg+xml' });
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
            allDesignFiles.push(vectorFile);
            pedidoFileMap[`vector_${pedido.id_pedido}.svg`] = pedido;
          } catch (err) {
            console.warn('Error loading vector file for pedido', pedido.id_pedido, err);
          }
        }
      }
      
      if (allDesignFiles.length === 0) {
        setError('No hay archivos de diseño disponibles para comparar');
        return;
      }
      
      // Prepare photo files
      const photoFiles = [];
      const photoMap = {};
      
      for (const photo of pendingPhotos) {
        try {
          const response = await fetch(photo.url);
          const blob = await response.blob();
          const photoFile = new File([blob], photo.name, { type: blob.type });
          photoFiles.push(photoFile);
          photoMap[photo.name] = photo;
        } catch (err) {
          console.warn('Error loading photo:', err);
        }
      }
      
      if (photoFiles.length === 0) {
        setError('No hay fotos pendientes para procesar');
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
      
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Error processing matching');
      }
      
      const results = await response.json();
      
      // Process results
      const updatedPhotos = [];
      const newMatches = [];
      
      for (const photo of pendingPhotos) {
        const result = results.find(r => r.foto === photo.name);
        
        if (result && !result.error && result.score >= 0.3) {
          const matchedPedido = pedidoFileMap[result.svg_match];
          
          if (matchedPedido) {
            newMatches.push({
              ...photo,
              matchedPedido,
              confidence: result.score,
              svgMatch: result.svg_match,
              needsConfirmation: true
            });
          } else {
            updatedPhotos.push(photo);
          }
        } else {
          updatedPhotos.push(photo);
        }
      }
      
      // Update pending photos
      setPendingPhotos(updatedPhotos);
      
      // Show matches for confirmation
      if (newMatches.length > 0) {
        // You can implement a confirmation dialog here
        // For now, we'll just show them in the UI
        console.log('New matches found:', newMatches);
      }
      
      // Update localStorage
      localStorage.setItem('pendingVerificationPhotos', JSON.stringify(updatedPhotos));
      
    } catch (err) {
      console.error('Error processing auto-matching:', err);
      setError('Error al procesar coincidencias automáticas');
    } finally {
      setProcessing(false);
    }
  };

  const getPublicUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;
    return `${supabase.supabaseUrl}/storage/v1/object/public/archivos-ventas/${filePath}`;
  };

  const handleRemovePendingPhoto = async (photoId) => {
    try {
      // Remove from storage
      const { error: deleteError } = await supabase.storage
        .from('archivos-ventas')
        .remove([photoId]);
      
      if (deleteError) throw deleteError;
      
      // Remove from pending list
      const updatedPhotos = pendingPhotos.filter(photo => photo.id !== photoId);
      setPendingPhotos(updatedPhotos);
      localStorage.setItem('pendingVerificationPhotos', JSON.stringify(updatedPhotos));
      
    } catch (err) {
      console.error('Error removing photo:', err);
      setError('Error al eliminar la foto');
    }
  };

  const handleManualMatch = async (photoId, pedidoId) => {
    try {
      const photo = pendingPhotos.find(p => p.id === photoId);
      if (!photo) return;
      
      // Update pedido with the photo
      const { error: updateError } = await supabase.rpc('editar_pedido', {
        p_id: pedidoId,
        p_foto_sello: photo.fileName
      });

      if (updateError) throw updateError;
      
      // Remove from pending list
      const updatedPhotos = pendingPhotos.filter(p => p.id !== photoId);
      setPendingPhotos(updatedPhotos);
      localStorage.setItem('pendingVerificationPhotos', JSON.stringify(updatedPhotos));
      
      // Notify parent
      onPhotoMatched && onPhotoMatched(pedidoId, photo.fileName);
      
    } catch (err) {
      console.error('Error matching photo manually:', err);
      setError('Error al asignar la foto manualmente');
    }
  };

  const filteredPhotos = pendingPhotos.filter(photo => 
    photo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPedidos = availablePedidos.filter(pedido => 
    pedido.disenio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.clientes?.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.clientes?.apellido_cliente?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

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
              Fotos Pendientes
            </h2>
            <p style={{
              color: '#71717a',
              fontSize: '14px',
              margin: 0
            }}>
              {pendingPhotos.length} fotos esperando asignación
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={processAutoMatching}
              disabled={processing || !pendingPhotos.length || !availablePedidos.length}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: processing ? 'rgba(63, 63, 70, 0.5)' : 'rgba(6, 182, 212, 0.2)',
                border: processing ? '1px solid rgba(63, 63, 70, 0.5)' : '1px solid rgba(6, 182, 212, 0.5)',
                borderRadius: '8px',
                color: processing ? '#71717a' : '#06b6d4',
                fontSize: '14px',
                fontWeight: '500',
                cursor: processing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {processing ? (
                <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
              ) : (
                <Zap style={{ width: '16px', height: '16px' }} />
              )}
              {processing ? 'Procesando...' : 'Buscar Coincidencias'}
            </button>
            
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
        </div>

        {/* Content */}
        <div style={{
          padding: '32px',
          maxHeight: 'calc(90vh - 160px)',
          overflowY: 'auto'
        }}>
          {/* Search */}
          <div style={{
            position: 'relative',
            marginBottom: '24px'
          }}>
            <Search style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#71717a'
            }} />
            <input
              type="text"
              placeholder="Buscar fotos o pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(39, 39, 42, 0.5)',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                color: 'white',
                borderRadius: '8px',
                padding: '12px 16px 12px 44px',
                outline: 'none',
                fontSize: '14px',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'}
            />
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

          {/* Pending Photos Grid */}
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px'
            }}>
              <Loader2 style={{ width: '32px', height: '32px', color: '#06b6d4' }} className="animate-spin" />
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              gap: '16px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'rgba(39, 39, 42, 0.5)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Archive style={{ width: '32px', height: '32px', color: '#71717a' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#a1a1aa', fontSize: '18px', fontWeight: '500' }}>
                  No hay fotos pendientes
                </div>
                <div style={{ color: '#71717a', fontSize: '14px', marginTop: '8px' }}>
                  Todas las fotos han sido asignadas a sus pedidos correspondientes
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    background: 'rgba(39, 39, 42, 0.5)',
                    border: '1px solid rgba(63, 63, 70, 0.5)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={photo.url}
                      alt={photo.name}
                      style={{
                        width: '100%',
                        height: '160px',
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
                      color: '#f59e0b'
                    }}>
                      <Clock style={{ width: '12px', height: '12px' }} />
                      <span style={{ fontSize: '10px', fontWeight: '500' }}>
                        Pendiente
                      </span>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleRemovePendingPhoto(photo.id)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(239, 68, 68, 0.8)',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                  
                  {/* Photo Info */}
                  <div style={{ padding: '16px' }}>
                    <h4 style={{
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      margin: '0 0 8px 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {photo.name}
                    </h4>
                    
                    {/* Manual Assignment */}
                    <div style={{ marginTop: '12px' }}>
                      <label style={{
                        color: '#71717a',
                        fontSize: '12px',
                        display: 'block',
                        marginBottom: '6px'
                      }}>
                        Asignar manualmente:
                      </label>
                      
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleManualMatch(photo.id, parseInt(e.target.value));
                          }
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(39, 39, 42, 0.8)',
                          border: '1px solid rgba(63, 63, 70, 0.5)',
                          color: 'white',
                          borderRadius: '6px',
                          padding: '8px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      >
                        <option value="">Seleccionar pedido...</option>
                        {filteredPedidos.map(pedido => (
                          <option key={pedido.id_pedido} value={pedido.id_pedido}>
                            {pedido.disenio} - {pedido.clientes?.nombre_cliente} {pedido.clientes?.apellido_cliente}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PendingPhotosManager;