// Script de utilidad para limpiar archivos antiguos del bucket
// Este script se puede ejecutar una vez para limpiar archivos con el naming anterior

import { supabase } from '../supabaseClient';

export const cleanupOldVectorFiles = async () => {
  try {
    console.log('🧹 Iniciando limpieza de archivos antiguos...');
    
    // Listar todos los archivos en la carpeta vector
    const { data: archivos, error } = await supabase.storage
      .from('archivos-ventas')
      .list('vector');
    
    if (error) {
      console.error('Error listando archivos:', error);
      return;
    }
    
    // Filtrar archivos que usan el naming anterior (sin timestamp)
    const archivosAntiguos = archivos.filter(archivo => {
      const nombre = archivo.name;
      // Archivos que NO tienen timestamp (más de 10 dígitos al final)
      return !/\d{10,}\.svg$/.test(nombre);
    });
    
    if (archivosAntiguos.length === 0) {
      console.log('✅ No hay archivos antiguos para limpiar');
      return;
    }
    
    console.log(`📁 Encontrados ${archivosAntiguos.length} archivos antiguos:`);
    archivosAntiguos.forEach(archivo => {
      console.log(`  - ${archivo.name}`);
    });
    
    // Crear lista de archivos a eliminar
    const archivosAEliminar = archivosAntiguos.map(archivo => `vector/${archivo.name}`);
    
    // Eliminar archivos antiguos
    const { error: deleteError } = await supabase.storage
      .from('archivos-ventas')
      .remove(archivosAEliminar);
    
    if (deleteError) {
      console.error('Error eliminando archivos:', deleteError);
      return;
    }
    
    console.log(`✅ Eliminados ${archivosAntiguos.length} archivos antiguos`);
    
  } catch (error) {
    console.error('Error en limpieza:', error);
  }
};

// Función para verificar el estado del bucket
export const checkBucketStatus = async () => {
  try {
    console.log('🔍 Verificando estado del bucket...');
    
    const { data: archivos, error } = await supabase.storage
      .from('archivos-ventas')
      .list('vector');
    
    if (error) {
      console.error('Error listando archivos:', error);
      return;
    }
    
    console.log(`📊 Total de archivos en vector/: ${archivos.length}`);
    
    // Agrupar por tipo de archivo
    const porTipo = {
      manual: archivos.filter(a => a.name.includes('_manual_')).length,
      ia: archivos.filter(a => a.name.includes('_ia_')).length,
      dimensionado: archivos.filter(a => a.name.includes('_dim_')).length,
      antiguos: archivos.filter(a => !/\d{10,}\.svg$/.test(a.name)).length
    };
    
    console.log('📈 Distribución por tipo:');
    console.log(`  - Manual: ${porTipo.manual}`);
    console.log(`  - IA: ${porTipo.ia}`);
    console.log(`  - Dimensionado: ${porTipo.dimensionado}`);
    console.log(`  - Antiguos: ${porTipo.antiguos}`);
    
  } catch (error) {
    console.error('Error verificando bucket:', error);
  }
};
