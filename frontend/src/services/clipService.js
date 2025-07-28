// Service for CLIP-based image matching
// This service handles communication with the CLIP API for automatic photo-to-design matching

import { CLIP_API_URL } from '../config/api';

/**
 * Process photos against design files using CLIP
 * @param {Array} svgFiles - Array of SVG files to use as reference
 * @param {Array} photoFiles - Array of photo files to match
 * @returns {Promise<Array>} Array of matching results
 */
export const processMatching = async (svgFiles, photoFiles) => {
  try {
    const formData = new FormData();
    
    // Add SVG files as reference
    svgFiles.forEach(file => {
      formData.append('svgs', file);
    });
    
    // Add photo files to match
    photoFiles.forEach(file => {
      formData.append('fotos', file);
    });
    
    const response = await fetch(`${CLIP_API_URL}/predict`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const results = await response.json();
    return results;
    
  } catch (error) {
    console.error('Error in CLIP processing:', error);
    throw new Error('Error al procesar las imágenes con IA');
  }
};

/**
 * Check if CLIP API is available
 * @returns {Promise<boolean>} True if API is available
 */
export const checkClipApiHealth = async () => {
  try {
    const response = await fetch(`${CLIP_API_URL}/health`);
    return response.ok;
  } catch (error) {
    console.warn('CLIP API not available:', error);
    return false;
  }
};

/**
 * Convert SVG content to PNG blob for CLIP processing
 * @param {string} svgContent - SVG content as string
 * @param {string} filename - Filename for the converted PNG
 * @returns {Promise<File>} PNG file object
 */
export const convertSvgToPng = async (svgContent, filename) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      
      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw SVG
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], filename.replace('.svg', '.png'), { type: 'image/png' });
          resolve(file);
        } else {
          reject(new Error('Failed to convert SVG to PNG'));
        }
      }, 'image/png');
    };
    
    img.onerror = () => reject(new Error('Failed to load SVG'));
    
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    img.src = URL.createObjectURL(svgBlob);
  });
};

/**
 * Process verification with automatic matching
 * @param {Object} pedido - The pedido object containing design files
 * @param {Array} photoFiles - Array of photo files to verify
 * @returns {Promise<Object>} Processing results
 */
export const processVerification = async (pedido, photoFiles) => {
  try {
    const svgFiles = [];
    
    // Fetch and prepare SVG files
    if (pedido.archivo_base) {
      try {
        const response = await fetch(pedido.archivo_base);
        const svgContent = await response.text();
        const pngFile = await convertSvgToPng(svgContent, 'base.svg');
        svgFiles.push(pngFile);
      } catch (error) {
        console.warn('Error processing archivo_base:', error);
      }
    }
    
    if (pedido.archivo_vector) {
      try {
        const response = await fetch(pedido.archivo_vector);
        const svgContent = await response.text();
        const pngFile = await convertSvgToPng(svgContent, 'vector.svg');
        svgFiles.push(pngFile);
      } catch (error) {
        console.warn('Error processing archivo_vector:', error);
      }
    }
    
    if (svgFiles.length === 0) {
      throw new Error('No se encontraron archivos de diseño válidos');
    }
    
    // Process matching with CLIP
    const results = await processMatching(svgFiles, photoFiles);
    
    return {
      success: true,
      results: results,
      message: 'Verificación completada'
    };
    
  } catch (error) {
    console.error('Error in verification process:', error);
    return {
      success: false,
      error: error.message,
      message: 'Error en el proceso de verificación'
    };
  }
};

/**
 * Get similarity score color based on value
 * @param {number} score - Similarity score (0-1)
 * @returns {string} Color hex code
 */
export const getScoreColor = (score) => {
  if (score >= 0.7) return '#22c55e'; // Green
  if (score >= 0.5) return '#f59e0b'; // Yellow
  if (score >= 0.3) return '#f97316'; // Orange
  return '#ef4444'; // Red
};

/**
 * Get similarity score label
 * @param {number} score - Similarity score (0-1)
 * @returns {string} Label for the score
 */
export const getScoreLabel = (score) => {
  if (score >= 0.7) return 'Excelente coincidencia';
  if (score >= 0.5) return 'Buena coincidencia';
  if (score >= 0.3) return 'Coincidencia regular';
  return 'Coincidencia baja';
};

/**
 * Format matching results for display
 * @param {Array} results - Raw results from CLIP API
 * @returns {Array} Formatted results
 */
export const formatMatchingResults = (results) => {
  if (!Array.isArray(results)) return [];
  
  return results.map(result => ({
    ...result,
    scoreColor: getScoreColor(result.score),
    scoreLabel: getScoreLabel(result.score),
    percentage: Math.round(result.score * 100)
  }));
};