import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Table, TableHeader, TableHeaderCell } from '../components/ui/Table';
import { Check, Upload, Image, AlertCircle, Camera, Archive, Plus } from 'lucide-react';
import VerificacionCard from '../components/Verificacion/VerificacionCard';
import PhotoUploadModal from '../components/Verificacion/PhotoUploadModal';
import MassiveUploadModal from '../components/Verificacion/MassiveUploadModal';
import PendingPhotosManager from '../components/Verificacion/PendingPhotosManager';
import ApiStatusIndicator from '../components/Verificacion/ApiStatusIndicator';
import { useNotification } from '../hooks/useNotification';

function VerificacionPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isMassiveUploadOpen, setIsMassiveUploadOpen] = useState(false);
  const [isPendingPhotosOpen, setIsPendingPhotosOpen] = useState(false);
  const [verificationResults, setVerificationResults] = useState({});
  const [pendingPhotosCount, setPendingPhotosCount] = useState(0);
  const { addNotification } = useNotification();

  useEffect(() => {
    getPedidosVerificar();
    loadPendingPhotosCount();
  }, []);

  const loadPendingPhotosCount = () => {
    try {
      const stored = localStorage.getItem('pendingVerificationPhotos');
      if (stored) {
        const photos = JSON.parse(stored);
        setPendingPhotosCount(photos.length);
      }
    } catch (err) {
      console.error('Error loading pending photos count:', err);
    }
  };

  const getPedidosVerificar = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
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

      if (fetchError) throw fetchError;

      setPedidos(data || []);
    } catch (err) {
      console.error("Error al obtener pedidos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPhotoModal = (pedido) => {
    setSelectedPedido(pedido);
    setIsPhotoModalOpen(true);
  };

  const handleClosePhotoModal = () => {
    setSelectedPedido(null);
    setIsPhotoModalOpen(false);
  };

  const handlePhotosUploaded = async (pedidoId, photos, matches) => {
    console.log('🔄 VerificacionPage - handlePhotosUploaded llamado');
    console.log('📋 Pedido ID:', pedidoId);
    console.log('📸 Photos:', photos);
    console.log('🎯 Matches:', matches);
    
    try {
      // Guardar las fotos en el pedido
      const { error: updateError } = await supabase.rpc('editar_pedido', {
        p_id: pedidoId,
        p_foto_sello: photos[0]?.url || null // Por ahora guardamos la primera foto
      });

      if (updateError) throw updateError;

      // Guardar los resultados de matching
      setVerificationResults(prev => ({
        ...prev,
        [pedidoId]: {
          photos,
          matches,
          timestamp: new Date().toISOString()
        }
      }));

      // Refrescar la lista de pedidos
      getPedidosVerificar();
      
      addNotification('Fotos subidas y procesadas correctamente', 'success');
    } catch (err) {
      console.error('Error al procesar fotos:', err);
      addNotification('Error al procesar las fotos', 'error');
    }
  };

  const handleMassiveUploadComplete = () => {
    // Refresh pedidos and pending photos count
    getPedidosVerificar();
    loadPendingPhotosCount();
    addNotification('Carga masiva completada', 'success');
  };

  const handlePendingPhotoMatched = (pedidoId, photoFileName) => {
    // Refresh pedidos and pending photos count
    getPedidosVerificar();
    loadPendingPhotosCount();
    addNotification('Foto asignada correctamente', 'success');
  };

  const handleOpenPendingPhotos = () => {
    setIsPendingPhotosOpen(true);
  };

  const handleClosePendingPhotos = () => {
    setIsPendingPhotosOpen(false);
    loadPendingPhotosCount(); // Refresh count when closing
  };

  const handleMarcarCompleto = async (pedidoId) => {
    try {
      const { error } = await supabase.rpc('editar_pedido', {
        p_id: pedidoId,
        p_estado_fabricacion: 'Hecho'
      });

      if (error) throw error;

      getPedidosVerificar();
      addNotification('Pedido marcado como completado', 'success');
    } catch (err) {
      console.error('Error al marcar como completo:', err);
      addNotification('Error al marcar como completo', 'error');
    }
  };

  const getPublicUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;
    return `${supabase.supabaseUrl}/storage/v1/object/public/archivos-ventas/${filePath}`;
  };

  return (
    <div style={{
      background: 'black', 
      minHeight: '100vh', 
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        borderBottom: '1px solid rgba(39, 39, 42, 0.5)', 
        background: 'rgba(9, 9, 11, 0.8)', 
        position: 'sticky', 
        top: 0, 
        zIndex: 10, 
        padding: '24px 32px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                background: 'linear-gradient(to br, #06b6d4, #0891b2)', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Check style={{ width: '20px', height: '20px', color: 'white' }} />
              </div>
              <div>
                <h1 style={{ 
                  fontSize: '32px', 
                  fontWeight: '300', 
                  letterSpacing: '-0.025em', 
                  margin: 0 
                }}>
                  Verificación
                </h1>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#71717a', 
                  margin: '2px 0 0 0' 
                }}>
                  {pedidos.length} pedidos para verificar
                </p>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setIsMassiveUploadOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(59, 130, 246, 0.1)';
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Carga Masiva
            </button>

            <button
              onClick={handleOpenPendingPhotos}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: pendingPhotosCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(39, 39, 42, 0.5)',
                border: pendingPhotosCount > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(63, 63, 70, 0.5)',
                borderRadius: '8px',
                color: pendingPhotosCount > 0 ? '#f59e0b' : '#71717a',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = pendingPhotosCount > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(39, 39, 42, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = pendingPhotosCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(39, 39, 42, 0.5)';
              }}
            >
              <Archive style={{ width: '16px', height: '16px' }} />
              Fotos Pendientes
              {pendingPhotosCount > 0 && (
                <span style={{
                  background: '#f59e0b',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {pendingPhotosCount}
                </span>
              )}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ApiStatusIndicator />
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '8px'
              }}>
                <AlertCircle style={{ width: '16px', height: '16px', color: '#06b6d4' }} />
                <span style={{ fontSize: '14px', color: '#06b6d4' }}>
                  Sellos listos para verificar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '32px' }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px' 
          }}>
            <div style={{ color: '#71717a', fontSize: '16px' }}>
              Cargando pedidos...
            </div>
          </div>
        ) : error ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px' 
          }}>
            <div style={{ color: '#ef4444', fontSize: '16px' }}>
              Error: {error}
            </div>
          </div>
        ) : pedidos.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
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
              <Check style={{ width: '32px', height: '32px', color: '#71717a' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#a1a1aa', fontSize: '18px', fontWeight: '500' }}>
                No hay pedidos para verificar
              </div>
              <div style={{ color: '#71717a', fontSize: '14px', marginTop: '8px' }}>
                Todos los pedidos están completados o en otros estados
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
            gap: '24px' 
          }}>
            {pedidos.map((pedido) => (
              <VerificacionCard
                key={pedido.id_pedido}
                pedido={pedido}
                onOpenPhotoModal={handleOpenPhotoModal}
                onMarcarCompleto={handleMarcarCompleto}
                getPublicUrl={getPublicUrl}
                verificationResult={verificationResults[pedido.id_pedido]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={isPhotoModalOpen}
        onClose={handleClosePhotoModal}
        pedido={selectedPedido}
        onPhotosUploaded={handlePhotosUploaded}
        getPublicUrl={getPublicUrl}
      />

      {/* Massive Upload Modal */}
      <MassiveUploadModal
        isOpen={isMassiveUploadOpen}
        onClose={() => setIsMassiveUploadOpen(false)}
        pedidos={pedidos}
        onMatchingComplete={handleMassiveUploadComplete}
      />

      {/* Pending Photos Manager */}
      <PendingPhotosManager
        isOpen={isPendingPhotosOpen}
        onClose={handleClosePendingPhotos}
        onPhotoMatched={handlePendingPhotoMatched}
      />
    </div>
  );
}

export default VerificacionPage;