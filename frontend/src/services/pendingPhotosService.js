// Service for managing pending photos
// Handles storage, retrieval, and matching of photos that haven't been assigned to pedidos

import { supabase } from '../supabaseClient';

const PENDING_PHOTOS_KEY = 'pendingVerificationPhotos';

/**
 * Save pending photos to localStorage
 * @param {Array} photos - Array of photo objects
 */
export const savePendingPhotos = (photos) => {
  try {
    localStorage.setItem(PENDING_PHOTOS_KEY, JSON.stringify(photos));
    return true;
  } catch (error) {
    console.error('Error saving pending photos:', error);
    return false;
  }
};

/**
 * Load pending photos from localStorage
 * @returns {Array} Array of photo objects
 */
export const loadPendingPhotos = () => {
  try {
    const stored = localStorage.getItem(PENDING_PHOTOS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading pending photos:', error);
    return [];
  }
};

/**
 * Add a new photo to pending list
 * @param {Object} photo - Photo object
 * @returns {boolean} Success status
 */
export const addPendingPhoto = (photo) => {
  try {
    const currentPhotos = loadPendingPhotos();
    const updatedPhotos = [...currentPhotos, photo];
    return savePendingPhotos(updatedPhotos);
  } catch (error) {
    console.error('Error adding pending photo:', error);
    return false;
  }
};

/**
 * Remove a photo from pending list
 * @param {string} photoId - Photo ID to remove
 * @returns {boolean} Success status
 */
export const removePendingPhoto = (photoId) => {
  try {
    const currentPhotos = loadPendingPhotos();
    const updatedPhotos = currentPhotos.filter(photo => photo.id !== photoId);
    return savePendingPhotos(updatedPhotos);
  } catch (error) {
    console.error('Error removing pending photo:', error);
    return false;
  }
};

/**
 * Update a pending photo
 * @param {string} photoId - Photo ID to update
 * @param {Object} updates - Updates to apply
 * @returns {boolean} Success status
 */
export const updatePendingPhoto = (photoId, updates) => {
  try {
    const currentPhotos = loadPendingPhotos();
    const updatedPhotos = currentPhotos.map(photo => 
      photo.id === photoId ? { ...photo, ...updates } : photo
    );
    return savePendingPhotos(updatedPhotos);
  } catch (error) {
    console.error('Error updating pending photo:', error);
    return false;
  }
};

/**
 * Get count of pending photos
 * @returns {number} Number of pending photos
 */
export const getPendingPhotosCount = () => {
  try {
    const photos = loadPendingPhotos();
    return photos.length;
  } catch (error) {
    console.error('Error getting pending photos count:', error);
    return 0;
  }
};

/**
 * Clear all pending photos
 * @returns {boolean} Success status
 */
export const clearPendingPhotos = () => {
  try {
    localStorage.removeItem(PENDING_PHOTOS_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing pending photos:', error);
    return false;
  }
};

/**
 * Auto-match pending photos with new pedidos
 * @param {Array} newPedidos - Array of new pedidos to match against
 * @returns {Promise<Object>} Matching results
 */
export const autoMatchPendingPhotos = async (newPedidos) => {
  try {
    const pendingPhotos = loadPendingPhotos();
    
    if (pendingPhotos.length === 0 || newPedidos.length === 0) {
      return { matches: [], remaining: pendingPhotos };
    }

    // Prepare design files from new pedidos
    const designFiles = [];
    const pedidoFileMap = {};
    
    for (const pedido of newPedidos) {
      // Add base file
      if (pedido.archivo_base) {
        try {
          const baseUrl = getPublicUrl(pedido.archivo_base);
          const response = await fetch(baseUrl);
          const blob = await response.blob();
          const baseFile = new File([blob], `base_${pedido.id_pedido}.svg`, { type: 'image/svg+xml' });
          designFiles.push(baseFile);
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
          designFiles.push(vectorFile);
          pedidoFileMap[`vector_${pedido.id_pedido}.svg`] = pedido;
        } catch (err) {
          console.warn('Error loading vector file for pedido', pedido.id_pedido, err);
        }
      }
    }

    if (designFiles.length === 0) {
      return { matches: [], remaining: pendingPhotos };
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
      return { matches: [], remaining: pendingPhotos };
    }

    // Call CLIP API
    const formData = new FormData();
    
    designFiles.forEach(file => {
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
    const matches = [];
    const remaining = [];
    
    for (const photo of pendingPhotos) {
      const result = results.find(r => r.foto === photo.name);
      
      if (result && !result.error && result.score >= 0.5) {
        const matchedPedido = pedidoFileMap[result.svg_match];
        
        if (matchedPedido) {
          matches.push({
            photo,
            pedido: matchedPedido,
            confidence: result.score,
            svgMatch: result.svg_match
          });
        } else {
          remaining.push(photo);
        }
      } else {
        remaining.push(photo);
      }
    }
    
    return { matches, remaining };
    
  } catch (error) {
    console.error('Error in auto-matching:', error);
    return { matches: [], remaining: loadPendingPhotos() };
  }
};

/**
 * Get public URL for a file path
 * @param {string} filePath - File path
 * @returns {string|null} Public URL
 */
const getPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  return `${supabase.supabaseUrl}/storage/v1/object/public/archivos-ventas/${filePath}`;
};

/**
 * Upload photo to Supabase storage
 * @param {File} file - File to upload
 * @param {string} prefix - Filename prefix
 * @returns {Promise<Object>} Upload result
 */
export const uploadPhotoToStorage = async (file, prefix = 'verificacion_masiva') => {
  try {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${prefix}_${timestamp}_${randomId}.${fileExtension}`;
    
    const { error: uploadError } = await supabase.storage
      .from('archivos-ventas')
      .upload(fileName, file);
      
    if (uploadError) throw uploadError;
    
    const { data: publicData } = supabase.storage
      .from('archivos-ventas')
      .getPublicUrl(fileName);
      
    return {
      success: true,
      fileName,
      url: publicData.publicUrl
    };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete photo from Supabase storage
 * @param {string} fileName - File name to delete
 * @returns {Promise<boolean>} Success status
 */
export const deletePhotoFromStorage = async (fileName) => {
  try {
    const { error } = await supabase.storage
      .from('archivos-ventas')
      .remove([fileName]);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting photo:', error);
    return false;
  }
};

/**
 * Assign photo to pedido
 * @param {string} photoFileName - Photo file name
 * @param {number} pedidoId - Pedido ID
 * @returns {Promise<boolean>} Success status
 */
export const assignPhotoToPedido = async (photoFileName, pedidoId) => {
  try {
    const { error } = await supabase.rpc('editar_pedido', {
      p_id: pedidoId,
      p_foto_sello: photoFileName
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error assigning photo to pedido:', error);
    return false;
  }
};

/**
 * Batch process photos for upload and matching
 * @param {Array} files - Array of files to process
 * @param {Array} pedidos - Array of pedidos to match against
 * @returns {Promise<Object>} Processing results
 */
export const batchProcessPhotos = async (files, pedidos) => {
  try {
    const results = {
      uploaded: [],
      matches: [],
      pending: [],
      errors: []
    };

    // Upload files
    for (const file of files) {
      const uploadResult = await uploadPhotoToStorage(file);
      
      if (uploadResult.success) {
        const photo = {
          id: uploadResult.fileName,
          name: file.name,
          fileName: uploadResult.fileName,
          url: uploadResult.url,
          timestamp: new Date().toISOString()
        };
        
        results.uploaded.push(photo);
      } else {
        results.errors.push({
          fileName: file.name,
          error: uploadResult.error
        });
      }
    }

    // Process matching if there are uploaded photos and pedidos
    if (results.uploaded.length > 0 && pedidos.length > 0) {
      const matchingResult = await autoMatchPendingPhotos(pedidos);
      
      // Separate matches and pending
      for (const photo of results.uploaded) {
        const match = matchingResult.matches.find(m => m.photo.id === photo.id);
        
        if (match) {
          results.matches.push(match);
        } else {
          results.pending.push(photo);
        }
      }
    } else {
      results.pending = results.uploaded;
    }

    // Save pending photos
    if (results.pending.length > 0) {
      const currentPending = loadPendingPhotos();
      const allPending = [...currentPending, ...results.pending];
      savePendingPhotos(allPending);
    }

    return results;
  } catch (error) {
    console.error('Error in batch processing:', error);
    return {
      uploaded: [],
      matches: [],
      pending: [],
      errors: [{ fileName: 'batch_process', error: error.message }]
    };
  }
};

// Hook for listening to pedido state changes
export const setupPedidoStateListener = (callback) => {
  // This would set up a real-time listener for pedido state changes
  // For now, we'll use a polling approach
  
  const checkForNewVerificationPedidos = async () => {
    try {
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('*')
        .eq('estado_fabricacion', 'Verificar');
      
      if (pedidos && pedidos.length > 0) {
        const matchingResult = await autoMatchPendingPhotos(pedidos);
        
        if (matchingResult.matches.length > 0) {
          callback(matchingResult);
        }
      }
    } catch (error) {
      console.error('Error checking for new verification pedidos:', error);
    }
  };
  
  // Check every 30 seconds
  const intervalId = setInterval(checkForNewVerificationPedidos, 30000);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};