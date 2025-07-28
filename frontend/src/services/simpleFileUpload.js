import { supabase } from '../supabaseClient';

/**
 * Servicio simplificado para subir archivos sin configuración automática
 */
export class SimpleFileUploadService {
  constructor() {
    this.bucketName = 'archivos-ventas';
  }

  /**
   * Genera un nombre único para el archivo con estructura de carpetas
   */
  generateFileName(field, pedidoId, originalFileName) {
    const timestamp = Date.now();
    const fileExtension = originalFileName.split('.').pop().toLowerCase();
    const fileName = `${field}_${pedidoId}_${timestamp}.${fileExtension}`;
    
    // Estructura de carpetas
    const folderMap = {
      'archivo_base': 'base',
      'archivo_vector': 'vector',
      'foto_sello': 'fotos' // Carpeta fotos
    };
    
    const folder = folderMap[field] || '';
    return folder ? `${folder}/${fileName}` : fileName;
  }

  /**
   * Valida el tipo de archivo básico
   */
  validateFileType(file, field) {
    const allowedTypes = {
      'archivo_base': ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
      'archivo_vector': ['svg', 'ai', 'eps', 'pdf', 'dxf'],
      'foto_sello': ['jpg', 'jpeg', 'png', 'gif', 'webp']
    };

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validTypes = allowedTypes[field] || allowedTypes['archivo_base'];

    if (!validTypes.includes(fileExtension)) {
      throw new Error(`Tipo de archivo no válido para ${field}. Tipos permitidos: ${validTypes.join(', ')}`);
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 10MB permitido.');
    }

    return true;
  }

  /**
   * Sube un archivo a Supabase Storage
   */
  async uploadFile(file, field, pedidoId) {
    try {
      // Validar archivo
      this.validateFileType(file, field);

      // Generar nombre único con carpeta
      const fileName = this.generateFileName(field, pedidoId, file.name);

      // Subir archivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error subiendo archivo:', uploadError);
        throw new Error(`Error al subir el archivo: ${uploadError.message}`);
      }

      // Obtener URL pública
      const { data: publicData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      return {
        fileName,
        publicUrl: fileName, // Guardar solo el path relativo
        path: uploadData.path
      };

    } catch (error) {
      console.error('Error en uploadFile:', error);
      throw error;
    }
  }

  /**
   * Actualiza el pedido con la nueva URL del archivo
   */
  async updatePedidoWithFile(pedidoId, field, fileUrl) {
    try {
      const updateData = {};
      
      // Solo guardar el path relativo, no la URL completa
      if (fileUrl && fileUrl.includes(this.bucketName)) {
        const pathIndex = fileUrl.indexOf(`/${this.bucketName}/`);
        if (pathIndex !== -1) {
          updateData[field] = fileUrl.substring(pathIndex + `/${this.bucketName}/`.length);
        } else {
          updateData[field] = fileUrl;
        }
      } else {
        updateData[field] = fileUrl;
      }

      const { data, error } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id_pedido', pedidoId)
        .select();

      if (error) {
        console.error('Error actualizando pedido:', error);
        throw new Error(`Error al actualizar pedido: ${error.message}`);
      }

      return data[0];
    } catch (error) {
      console.error('Error en updatePedidoWithFile:', error);
      throw error;
    }
  }

  /**
   * Elimina un archivo del storage
   */
  async deleteFile(filePath) {
    try {
      let fileName = filePath;
      
      if (filePath.includes(`/${this.bucketName}/`)) {
        const parts = filePath.split(`/${this.bucketName}/`);
        fileName = parts[1];
      }

      fileName = decodeURIComponent(fileName);

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([fileName]);

      if (error) {
        console.error('Error eliminando archivo:', error);
        throw new Error(`Error al eliminar archivo: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error en deleteFile:', error);
      throw error;
    }
  }

  /**
   * Obtiene una URL firmada para acceder al archivo
   */
  async getSignedUrl(filePath, expiresIn = 3600) {
    try {
      if (!filePath) return null;

      let cleanPath = filePath;
      if (filePath.startsWith('http')) {
        const idx = filePath.indexOf(`/${this.bucketName}/`);
        if (idx !== -1) {
          cleanPath = filePath.substring(idx + `/${this.bucketName}/`.length);
        }
      }

      cleanPath = decodeURIComponent(cleanPath);

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(cleanPath, expiresIn);

      if (error) {
        console.error('Error generando URL firmada:', error);
        throw new Error('No se pudo generar el enlace de acceso al archivo');
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error en getSignedUrl:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const simpleFileUploadService = new SimpleFileUploadService();