// Archivo de prueba para verificar la configuración
import { isClipApiEnabled, getClipDisabledMessage } from './verificacionConfig.js';

console.log('🧪 TEST: testConfig.js loaded');
console.log('🧪 TEST: isClipApiEnabled imported:', typeof isClipApiEnabled);
console.log('🧪 TEST: getClipDisabledMessage imported:', typeof getClipDisabledMessage);

// Probar las funciones
try {
  console.log('🧪 TEST: isClipApiEnabled() result:', isClipApiEnabled());
  console.log('🧪 TEST: getClipDisabledMessage() result:', getClipDisabledMessage());
  console.log('🧪 TEST: All functions working correctly');
} catch (error) {
  console.error('🧪 ERROR: Functions failed:', error);
}
