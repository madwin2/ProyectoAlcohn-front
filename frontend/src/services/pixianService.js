const PIXIAN_API_ID = 'pxekaq6i395qgge';
const PIXIAN_API_SECRET = 'v7a4o7opqln6il8btfepch3bcro9igmvme4dfnvte348mnm6l5qm';

export const removeBackground = async (imageBlob) => {
  try {
    // Crear FormData para la imagen
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.jpg');
    
    // Usar el proxy local para evitar CORS
    const response = await fetch('http://localhost:3001/api/remove-background', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    // Obtener la imagen sin fondo como blob
    const imageWithoutBackground = await response.blob();
    return imageWithoutBackground;
  } catch (error) {
    console.error('Error removiendo fondo:', error);
    throw error;
  }
}; 