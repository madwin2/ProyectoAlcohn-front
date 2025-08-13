// Configuración para el sistema de verificación
// Permite habilitar/deshabilitar fácilmente la CLIP API

console.log('🔧 DEBUG: verificacionConfig.js loaded');

// Configuración por defecto
const DEFAULT_CONFIG = {
  CLIP_API_ENABLED: false,
  CLIP_DISABLED_MESSAGE: 'CLIP API temporalmente deshabilitada: Las fotos se guardarán en pendientes para asignación manual.',
  AUTO_CHANGE_STATUS: true,
  SHOW_DISABLED_NOTICE: true
};

// Configuración exportada
export const VERIFICACION_CONFIG = { ...DEFAULT_CONFIG };

console.log('🔧 DEBUG: VERIFICACION_CONFIG:', VERIFICACION_CONFIG);

// Función helper para verificar si CLIP API está habilitada
export function isClipApiEnabled() {
  const enabled = VERIFICACION_CONFIG.CLIP_API_ENABLED;
  console.log('🔧 DEBUG: isClipApiEnabled() called, returning:', enabled);
  return enabled;
}

// Función helper para obtener el mensaje de CLIP deshabilitada
export function getClipDisabledMessage() {
  return VERIFICACION_CONFIG.CLIP_DISABLED_MESSAGE;
}

// Función helper para verificar si debe cambiar estado automáticamente
export function shouldAutoChangeStatus() {
  return VERIFICACION_CONFIG.AUTO_CHANGE_STATUS;
}

// Función helper para verificar si debe mostrar notificación
export function shouldShowDisabledNotice() {
  return VERIFICACION_CONFIG.SHOW_DISABLED_NOTICE;
}

// Verificar que todas las funciones estén disponibles
console.log('🔧 DEBUG: All functions exported:', {
  isClipApiEnabled: typeof isClipApiEnabled,
  getClipDisabledMessage: typeof getClipDisabledMessage,
  shouldAutoChangeStatus: typeof shouldAutoChangeStatus,
  shouldShowDisabledNotice: typeof shouldShowDisabledNotice
});

// Verificar que las funciones funcionen inmediatamente
console.log('🔧 DEBUG: Function test results:', {
  isClipApiEnabled: isClipApiEnabled(),
  getClipDisabledMessage: getClipDisabledMessage(),
  shouldAutoChangeStatus: shouldAutoChangeStatus(),
  shouldShowDisabledNotice: shouldShowDisabledNotice()
});
