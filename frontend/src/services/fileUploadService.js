import { supabase } from '../supabaseClient';
import { setupSupabaseStorage, checkSupabaseSetup } from '../utils/supabaseSetup';

/**
 * Servicio modular para manejar la subida de archivos a Supabase
 */
export class FileUploadService {
  constructor() {
    this.bucketName = 'archivos-ventas';
    this.isSetupComplete = false;
  }

  /**
   * Asegura que la configuración de Supabase esté completa
   */
  async ensureSetup() {
    if (this.isSetupComplete) return;
    
    // Simplemente verificar que el bucket existe, no intentar crearlo
    try {
      await this.validateBucket();
      this.isSetupComplete = true;
    } catch (error) {
      console.error('Error validando configuración:', error);
      throw new Error('El bucket "archivos-ventas" no existe. Por favor, créalo manualmente en Supabase Storage con las carpetas "base" y "vector".');
    }
  }

  /**
   * Valida que el cliente de Supabase esté configurado correctamente
   */
  async validateSupabaseConnection() {
    try {
      const { data, error } = await supabase.from('pedidos').select('count').limit(1);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error de conexión con Supabase:', error);
      throw new Error('No se pudo conectar con Supabase. Verifica tu configuración.');
    }
  }

  /**
   * Verifica que el bucket de archivos existe y está configurado
   */
  async validateBucket() {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      
      const bucketExists = data.some(bucket => bucket.name === this.bucketName);
      if (!bucketExists) {
        throw new Error(`El bucket '${this.bucketName}' no existe en Supabase Storage. Por favor, créalo manualmente en el dashboard de Supabase.`);
      }
      return true;
    } catch (error) {
      console.error('Error validando bucket:', error);
      throw error;
    }
  }

  /**
   * Verifica que las carpetas del bucket existen
   */
  async validateFolders() {
    try {
      const folders = ['base', 'vector'];
      
      for (const folder of folders) {
        try {
          const { data, error } = await supabase.storage
            .from(this.bucketName)
            .list(folder, { limit: 1 });
          
          if (error && error.message.includes('not found')) {
            console.log(`Carpeta '${folder}' no encontrada, pero se creará automáticamente al subir archivos`);
          }
        } catch (folderError) {
          console.warn(`Advertencia verificando carpeta '${folder}':`, folderError);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validando carpetas:', error);
      // No lanzar error, las carpetas se crean automáticamente
      return true;
    }
  }

  /**
   * Genera un nombre único para el archivo con la estructura de carpetas
   */
  generateFileName(field, pedidoId, originalFileName, disenio = null) {
    const timestamp = Date.now();
    const fileExtension = originalFileName.split('.').pop().toLowerCase();
    
    let fileName;
    if (field === 'archivo_vector' && disenio) {
      // Para vectores SVG, usar el nombre del diseño + pedidoId
      const disenioLimpio = disenio.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      fileName = `${disenioLimpio}_${pedidoId}.${fileExtension}`;
    } else {
      // Para otros archivos, mantener el formato original
      fileName = `${field}_${pedidoId}_${timestamp}.${fileExtension}`;
    }
    
    // Estructura de carpetas según el tipo de archivo
    const folderMap = {
      'archivo_base': 'base',
      'archivo_vector': 'vector',
      'foto_sello': '' // Carpeta raíz para fotos
    };
    
    const folder = folderMap[field] || '';
    return folder ? `${folder}/${fileName}` : fileName;
  }

  /**
   * Valida el tipo de archivo
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
  async uploadFile(file, field, pedidoId, disenio = null) {
    try {
      // Asegurar configuración inicial
      await this.ensureSetup();
      
      // Validaciones iniciales
      this.validateFileType(file, field);

      // Generar nombre de archivo único
      const fileName = this.generateFileName(field, pedidoId, file.name, disenio);

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
        publicUrl: publicData.publicUrl,
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
      // Usar UPDATE directo en lugar de RPC si hay problemas
      const updateData = {};
      updateData[field] = fileUrl;

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
      // Extraer el nombre del archivo de la URL
      let fileName = filePath;
      
      if (filePath.includes(`/${this.bucketName}/`)) {
        const parts = filePath.split(`/${this.bucketName}/`);
        fileName = parts[1];
      }

      // Decodificar la URL en caso de que tenga caracteres especiales
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

      // Limpiar la ruta del archivo
      let cleanPath = filePath;
      if (filePath.startsWith('http')) {
        const idx = filePath.indexOf(`/${this.bucketName}/`);
        if (idx !== -1) {
          cleanPath = filePath.substring(idx + `/${this.bucketName}/`.length);
        }
      }

      // Decodificar la URL en caso de que tenga caracteres especiales
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
export const fileUploadService = new FileUploadService();