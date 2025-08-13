// Configuración para el sistema de verificación
// Permite habilitar/deshabilitar fácilmente la CLIP API

console.log('🔧 DEBUG: verificacionConfig.js loaded');

export const VERIFICACION_CONFIG = {
  // CLIP API habilitada/deshabilitada
  CLIP_API_ENABLED: false,
  
  // Mensaje cuando CLIP API está deshabilitada
  CLIP_DISABLED_MESSAGE: 'CLIP API temporalmente deshabilitada: Las fotos se guardarán en pendientes para asignación manual.',
  
  // Cambiar automáticamente estado a 'Hecho' cuando se asigna foto
  AUTO_CHANGE_STATUS: true,
  
  // Mostrar notificación de CLIP API deshabilitada
  SHOW_DISABLED_NOTICE: true
};

console.log('🔧 DEBUG: VERIFICACION_CONFIG:', VERIFICACION_CONFIG);

// Función helper para verificar si CLIP API está habilitada
export const isClipApiEnabled = () => {
  const enabled = VERIFICACION_CONFIG.CLIP_API_ENABLED;
  console.log('🔧 DEBUG: isClipApiEnabled() called, returning:', enabled);
  return enabled;
};

// Función helper para obtener el mensaje de CLIP deshabilitada
export const getClipDisabledMessage = () => {
  return VERIFICACION_CONFIG.CLIP_DISABLED_MESSAGE;
};

// Función helper para verificar si debe cambiar estado automáticamente
export const shouldAutoChangeStatus = () => {
  return VERIFICACION_CONFIG.AUTO_CHANGE_STATUS;
};

// Función helper para verificar si debe mostrar notificación
export const shouldShowDisabledNotice = () => {
  return VERIFICACION_CONFIG.SHOW_DISABLED_NOTICE;
};
