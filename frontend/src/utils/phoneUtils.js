/**
 * Utilidades para el manejo de números de teléfono
 */

/**
 * Limpia un número de teléfono removiendo caracteres no numéricos
 * y el prefijo 549 si está presente
 * @param {string} phoneNumber - El número de teléfono a limpiar
 * @returns {string} - El número limpio solo con dígitos, sin prefijo 549
 */
export const cleanPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return '';
  }

  // Remover todos los caracteres no numéricos (espacios, guiones, paréntesis, etc.)
  let cleaned = phoneNumber.replace(/[^\d]/g, '');
  
  // Remover el prefijo 549 si está presente al inicio
  if (cleaned.startsWith('549')) {
    cleaned = cleaned.substring(3);
  }
  
  return cleaned;
};

/**
 * Formatea un número de teléfono para mostrar en la UI
 * @param {string} phoneNumber - El número de teléfono a formatear
 * @returns {string} - El número limpio sin espacios ni guiones
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return '';
  }

  const cleaned = cleanPhoneNumber(phoneNumber);
  
  if (cleaned.length === 0) {
    return '';
  }

  // Devolver solo el número limpio, sin formateo
  return cleaned;
};

/**
 * Valida si un número de teléfono es válido
 * @param {string} phoneNumber - El número de teléfono a validar
 * @returns {boolean} - true si el número es válido
 */
export const isValidPhoneNumber = (phoneNumber) => {
  const cleaned = cleanPhoneNumber(phoneNumber);
  
  // Números argentinos típicamente tienen 8-11 dígitos (sin prefijo 549)
  return cleaned.length >= 8 && cleaned.length <= 11;
};

/**
 * Prepara un número de teléfono para enviar al servidor
 * Asegura que no tenga el prefijo 549 y esté limpio
 * @param {string} phoneNumber - El número de teléfono a preparar
 * @returns {string} - El número limpio solo con dígitos, listo para el servidor
 */
export const preparePhoneForServer = (phoneNumber) => {
  return cleanPhoneNumber(phoneNumber);
};
