// Service for checking API health and connectivity
import { CLIP_API_URL } from '../config/api.js';

/**
 * Check if CLIP API is available and responsive
 * @returns {Promise<Object>} Status object with health info
 */
export const checkApiHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${CLIP_API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      available: true,
      status: data.status,
      url: CLIP_API_URL,
      message: 'API disponible y funcionando'
    };
    
  } catch (error) {
    console.warn('CLIP API health check failed:', error.message);
    
    let message = 'API no disponible';
    
    if (error.name === 'AbortError') {
      message = 'Timeout: API no responde';
    } else if (error.message.includes('Failed to fetch')) {
      message = 'No se puede conectar a la API. Verifica que esté iniciada.';
    } else if (error.message.includes('CORS')) {
      message = 'Error de CORS. Verifica la configuración de la API.';
    }
    
    return {
      available: false,
      error: error.message,
      url: CLIP_API_URL,
      message
    };
  }
};

/**
 * Test the predict endpoint with minimal data
 * @returns {Promise<Object>} Test result
 */
export const testPredictEndpoint = async () => {
  try {
    // Create minimal test files
    const testSvg = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
    const testPhoto = new File([''], 'test.jpg', { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('svgs', testSvg);
    formData.append('fotos', testPhoto);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${CLIP_API_URL}/predict`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Even if it returns an error, if we get a response, CORS is working
    return {
      corsWorking: true,
      endpointAccessible: true,
      status: response.status,
      message: 'Endpoint accesible, CORS funcionando'
    };
    
  } catch (error) {
    console.warn('Predict endpoint test failed:', error.message);
    
    if (error.message.includes('CORS')) {
      return {
        corsWorking: false,
        endpointAccessible: false,
        error: error.message,
        message: 'Error de CORS en endpoint /predict'
      };
    }
    
    return {
      corsWorking: true,
      endpointAccessible: false,
      error: error.message,
      message: 'Endpoint no accesible'
    };
  }
};

/**
 * Comprehensive API diagnostic
 * @returns {Promise<Object>} Complete diagnostic info
 */
export const runApiDiagnostic = async () => {
  console.log('🔍 Ejecutando diagnóstico de API CLIP...');
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    url: CLIP_API_URL,
    tests: {}
  };
  
  // Test 1: Health check
  console.log('📊 Test 1: Health check...');
  diagnostic.tests.health = await checkApiHealth();
  
  // Test 2: CORS and endpoint access
  if (diagnostic.tests.health.available) {
    console.log('📊 Test 2: Endpoint access...');
    diagnostic.tests.predict = await testPredictEndpoint();
  } else {
    diagnostic.tests.predict = {
      corsWorking: false,
      endpointAccessible: false,
      message: 'Saltado: API no disponible'
    };
  }
  
  // Overall status
  diagnostic.overall = {
    healthy: diagnostic.tests.health.available,
    corsOk: diagnostic.tests.predict.corsWorking,
    ready: diagnostic.tests.health.available && diagnostic.tests.predict.corsWorking
  };
  
  console.log('📊 Diagnóstico completado:', diagnostic);
  
  return diagnostic;
};

/**
 * Get user-friendly status message
 * @param {Object} diagnostic - Diagnostic result
 * @returns {Object} Status message and color
 */
export const getStatusMessage = (diagnostic) => {
  if (!diagnostic) {
    return {
      message: 'Ejecutando diagnóstico...',
      color: '#71717a',
      icon: '🔍'
    };
  }
  
  if (diagnostic.overall.ready) {
    return {
      message: 'API funcionando correctamente',
      color: '#22c55e',
      icon: '✅'
    };
  }
  
  if (!diagnostic.tests.health.available) {
    return {
      message: 'API no iniciada o no accesible',
      color: '#ef4444',
      icon: '❌'
    };
  }
  
  if (!diagnostic.tests.predict.corsWorking) {
    return {
      message: 'Error de CORS - Revisar configuración',
      color: '#f59e0b',
      icon: '⚠️'
    };
  }
  
  return {
    message: 'Estado desconocido',
    color: '#71717a',
    icon: '❓'
  };
};