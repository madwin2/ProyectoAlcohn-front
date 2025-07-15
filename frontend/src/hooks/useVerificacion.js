import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { processVerification, checkClipApiHealth } from '../services/clipService';
import { useNotification } from './useNotification';

export const useVerificacion = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clipApiAvailable, setClipApiAvailable] = useState(false);
  const { showNotification } = useNotification();

  // Check if CLIP API is available
  const checkApiHealth = useCallback(async () => {
    try {
      const isAvailable = await checkClipApiHealth();
      setClipApiAvailable(isAvailable);
      return isAvailable;
    } catch (err) {
      setClipApiAvailable(false);
      return false;
    }
  }, []);

  // Get pedidos with 'Verificar' status
  const getPedidosVerificar = useCallback(async () => {
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

      return data || [];
    } catch (err) {
      console.error("Error al obtener pedidos:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload photos to Supabase storage
  const uploadPhotos = useCallback(async (pedidoId, files) => {
    try {
      const uploadedPhotos = [];
      
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
        const fileName = `verificacion_${pedidoId}_${timestamp}.${fileExtension}`;
        
        const { error: uploadError } = await supabase.storage
          .from('archivos-ventas')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        const { data: publicData } = supabase.storage
          .from('archivos-ventas')
          .getPublicUrl(fileName);
          
        uploadedPhotos.push({
          id: fileName,
          url: publicData.publicUrl,
          name: file.name,
          path: fileName
        });
      }
      
      return uploadedPhotos;
    } catch (err) {
      console.error('Error uploading photos:', err);
      throw err;
    }
  }, []);

  // Process verification with CLIP
  const processPhotoVerification = useCallback(async (pedido, photoFiles) => {
    try {
      setLoading(true);
      setError(null);

      // Check if CLIP API is available
      const isApiAvailable = await checkApiHealth();
      if (!isApiAvailable) {
        throw new Error('La API de verificación automática no está disponible');
      }

      // Process with CLIP
      const result = await processVerification(pedido, photoFiles);
      
      if (!result.success) {
        throw new Error(result.error || 'Error en el procesamiento');
      }

      return result.results;
    } catch (err) {
      console.error('Error in photo verification:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [checkApiHealth]);

  // Save verification results to database
  const saveVerificationResult = useCallback(async (pedidoId, photos, matchResults) => {
    try {
      // Update pedido with primary photo
      const primaryPhoto = photos[0];
      if (primaryPhoto) {
        const { error: updateError } = await supabase.rpc('editar_pedido', {
          p_id: pedidoId,
          p_foto_sello: primaryPhoto.path
        });

        if (updateError) throw updateError;
      }

      // Save match results to a verification log table (if exists)
      // This would require a new table to store verification history
      // For now, we'll just return the results
      
      return {
        success: true,
        photos,
        matches: matchResults,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error('Error saving verification result:', err);
      throw err;
    }
  }, []);

  // Mark pedido as completed
  const marcarCompleto = useCallback(async (pedidoId) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.rpc('editar_pedido', {
        p_id: pedidoId,
        p_estado_fabricacion: 'Hecho'
      });

      if (error) throw error;

      showNotification('Pedido marcado como completado', 'success');
      return true;
    } catch (err) {
      console.error('Error marking as complete:', err);
      setError(err.message);
      showNotification('Error al marcar como completo', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Complete verification process
  const completarVerificacion = useCallback(async (pedidoId, photoFiles) => {
    try {
      setLoading(true);
      setError(null);

      // Get pedido data
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id_pedido', pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      // Upload photos
      const uploadedPhotos = await uploadPhotos(pedidoId, photoFiles);

      // Process verification if CLIP API is available
      let matchResults = [];
      if (clipApiAvailable) {
        matchResults = await processPhotoVerification(pedido, photoFiles);
      }

      // Save results
      const result = await saveVerificationResult(pedidoId, uploadedPhotos, matchResults);

      showNotification('Verificación completada exitosamente', 'success');
      return result;
    } catch (err) {
      console.error('Error in complete verification:', err);
      setError(err.message);
      showNotification('Error en la verificación', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [uploadPhotos, processPhotoVerification, saveVerificationResult, clipApiAvailable, showNotification]);

  // Delete photo from storage
  const deletePhoto = useCallback(async (photoPath) => {
    try {
      const { error } = await supabase.storage
        .from('archivos-ventas')
        .remove([photoPath]);

      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error('Error deleting photo:', err);
      throw err;
    }
  }, []);

  // Get public URL for file
  const getPublicUrl = useCallback((filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;
    return `${supabase.supabaseUrl}/storage/v1/object/public/archivos-ventas/${filePath}`;
  }, []);

  return {
    loading,
    error,
    clipApiAvailable,
    checkApiHealth,
    getPedidosVerificar,
    uploadPhotos,
    processPhotoVerification,
    saveVerificationResult,
    marcarCompleto,
    completarVerificacion,
    deletePhoto,
    getPublicUrl,
    setError
  };
};