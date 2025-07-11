import { supabase } from '../supabaseClient';

/**
 * Utilitario para configurar Supabase Storage y verificar la configuración
 */
export const setupSupabaseStorage = async () => {
  try {
    console.log('🔧 Verificando configuración de Supabase...');
    
    // 1. Verificar conexión con Supabase
    console.log('1. Verificando conexión...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.warn('Advertencia de autenticación:', authError.message);
    }
    
    // 2. Verificar acceso a la tabla pedidos
    console.log('2. Verificando acceso a base de datos...');
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('count')
      .limit(1);
    
    if (pedidosError) {
      console.error('❌ Error accediendo a tabla pedidos:', pedidosError);
      throw new Error('No se puede acceder a la tabla pedidos');
    }
    console.log('✅ Acceso a base de datos verificado');
    
    // 3. Verificar buckets existentes
    console.log('3. Verificando buckets de Storage...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error accediendo a Storage:', bucketsError);
      throw new Error('No se puede acceder a Supabase Storage');
    }
    
    console.log('📦 Buckets existentes:', buckets.map(b => b.name));
    
    // 4. Verificar si existe el bucket 'archivos-ventas'
    const bucketName = 'archivos-ventas';
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`❌ El bucket '${bucketName}' no existe`);
      throw new Error(`El bucket '${bucketName}' no existe en Supabase Storage. Por favor, créalo manualmente en el dashboard de Supabase con las carpetas 'base' y 'vector'.`);
    } else {
      console.log('✅ Bucket ya existe');
    }
    
    // 5. Verificar permisos del bucket
    console.log('5. Verificando permisos del bucket...');
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucketName);
    
    if (bucketError) {
      console.warn('⚠️  Advertencia obteniendo información del bucket:', bucketError);
    } else {
      console.log('📋 Configuración del bucket:', {
        name: bucketData.name,
        public: bucketData.public,
        file_size_limit: bucketData.file_size_limit
      });
    }
    
    // 6. Verificar carpetas del bucket
    console.log('6. Verificando carpetas del bucket...');
    const folders = ['base', 'vector'];
    
    for (const folder of folders) {
      try {
        const { data: folderData, error: folderError } = await supabase.storage
          .from(bucketName)
          .list(folder, { limit: 1 });
        
        if (folderError) {
          console.log(`📁 Carpeta '${folder}' no encontrada (se creará automáticamente)`);
        } else {
          console.log(`✅ Carpeta '${folder}' verificada`);
        }
      } catch (folderError) {
        console.log(`📁 Carpeta '${folder}' no encontrada (se creará automáticamente)`);
      }
    }
    
    // 7. Probar subida de archivo de prueba
    console.log('7. Probando subida de archivo...');
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const testFileName = `test_${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testFile);
    
    if (uploadError) {
      console.error('❌ Error en prueba de subida:', uploadError);
      throw new Error(`No se pudo subir archivo de prueba: ${uploadError.message}`);
    }
    
    console.log('✅ Prueba de subida exitosa');
    
    // 8. Limpiar archivo de prueba
    await supabase.storage.from(bucketName).remove([testFileName]);
    console.log('🧹 Archivo de prueba eliminado');
    
    console.log('🎉 Configuración de Supabase completada exitosamente');
    
    return {
      success: true,
      bucket: bucketName,
      message: 'Configuración verificada correctamente'
    };
    
  } catch (error) {
    console.error('❌ Error en configuración:', error);
    return {
      success: false,
      error: error.message,
      message: 'Error en la configuración de Supabase'
    };
  }
};

/**
 * Función simple para verificar si el setup está completo
 */
export const checkSupabaseSetup = async () => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    return buckets.some(bucket => bucket.name === 'archivos-ventas');
  } catch (error) {
    console.error('Error verificando setup:', error);
    return false;
  }
};