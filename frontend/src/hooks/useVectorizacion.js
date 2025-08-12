import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { medirSVG, dimensionarSVG, calcularOpcionesEscalado, calcularTipoPlanchuela, calcularLargoPlanchuela, calcularTiemposCNC } from '../utils/svgUtils';
import { removeBackground } from '../services/pixianService';

export const useVectorizacion = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dimensionesSVG, setDimensionesSVG] = useState({});
  const [opcionesEscalado, setOpcionesEscalado] = useState({});
  const [procesando, setProcesando] = useState({});
  const [svgPreview, setSvgPreview] = useState(null);
  const [svgPedido, setSvgPedido] = useState(null);
  const [svgLoading, setSvgLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pendientes');
  const [busqueda, setBusqueda] = useState('');
  const [removerFondo, setRemoverFondo] = useState(false);
  const [medidaPersonalizada, setMedidaPersonalizada] = useState({ ancho: '', alto: '' });
  const [ratioOriginal, setRatioOriginal] = useState(1);
  const [authReady, setAuthReady] = useState(false);

  // Función para obtener URL pública
  const publicUrl = (path) => {
    if (!path) return null;
    if (Array.isArray(path)) path = path[0];
    if (!path) return null;
    return supabase.storage.from('archivos-ventas').getPublicUrl(path).data.publicUrl;
  };

  // Fetch pedidos
  const fetchPedidos = async () => {
    setLoading(true);
    try {
      console.log('Fetching pedidos from Supabase...');
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .neq('estado_fabricacion', 'Hecho');
      
      if (!error) {
        console.log('Pedidos cargados:', data?.length || 0);
        
        // Log detallado de pedidos con medida_real
        const pedidosConMedida = data?.filter(p => p.medida_real) || [];
        console.log('Pedidos con medida_real:', pedidosConMedida.length);
        pedidosConMedida.forEach(p => {
          console.log(`- Pedido ${p.id_pedido}: ${p.disenio} - Medida: ${p.medida_real} - Tiempo: ${p.tiempo_estimado}`);
        });
        
        // Log detallado de pedidos con archivo_vector pero sin medida_real
        const pedidosParaVerificar = data?.filter(p => p.archivo_vector && !p.medida_real) || [];
        console.log('Pedidos para verificar:', pedidosParaVerificar.length);
        pedidosParaVerificar.forEach(p => {
          console.log(`- Pedido ${p.id_pedido}: ${p.disenio} - Vector: ${p.archivo_vector}`);
        });
        
        setPedidos(data || []);
      } else {
        console.error('Error en fetchPedidos:', error);
      }
    } catch (error) {
      console.error('Error fetching pedidos:', error);
    }
    setLoading(false);
  };

  // Separar en grupos
  const grupoVerificados = pedidos.filter(p => p.medida_real);
  const grupoVector = pedidos.filter(p => p.archivo_vector && !p.medida_real);  
  const grupoBase = pedidos.filter(p => !p.archivo_vector && p.archivo_base && !p.medida_real);
  
  // Debug logs
  console.log('Grupos separados:', {
    total: pedidos.length,
    verificados: grupoVerificados.length,
    vector: grupoVector.length,
    base: grupoBase.length
  });

  // Medir SVGs y calcular opciones de escalado - OPTIMIZADO
  const medirTodos = async () => {
    // Solo medir vectores que están en "Verificar Medidas" (grupoVector)
    const pedidosAMedir = grupoVector.filter(p => 
      p.medida_pedida && p.medida_pedida.includes("x")
    );
    
    if (pedidosAMedir.length === 0) {
      console.log('📊 No hay vectores para medir en este momento');
      return;
    }
    
    console.log(`📐 Mediendo ${pedidosAMedir.length} vectores en paralelo...`);
    
    let nuevasDim = {};
    let nuevasOpc = {};
    
    // Medición en paralelo para mejor rendimiento
    const mediciones = pedidosAMedir.map(async (pedido) => {
      try {
        const url = publicUrl(pedido.archivo_vector);
        
        // Delay reducido para archivos recién subidos
        if (pedido.archivo_vector.includes('_manual_') || 
            pedido.archivo_vector.includes('_ia_') ||
            pedido.archivo_vector.includes('_dim_')) {
          console.log('⏳ Esperando que archivo esté disponible:', pedido.archivo_vector);
          await new Promise(resolve => setTimeout(resolve, 1500)); // Reducido a 1.5 segundos
          console.log('✅ Archivo listo para medición');
        }
        
        const dimensiones = await medirSVG(url);
        
        if (dimensiones && dimensiones.width > 0 && dimensiones.height > 0) {
          nuevasDim[pedido.id_pedido] = dimensiones;
          
          const opciones = calcularOpcionesEscalado(dimensiones, pedido.medida_pedida);
          if (opciones) {
            nuevasOpc[pedido.id_pedido] = opciones;
          }
          
          // Calcular ratio para medidas personalizadas
          const ratio = dimensiones.width / dimensiones.height;
          setRatioOriginal(prev => ({ ...prev, [pedido.id_pedido]: ratio }));
          
          console.log(`✅ Vector ${pedido.id_pedido} medido: ${dimensiones.width}x${dimensiones.height}mm`);
        } else {
          console.warn(`⚠️ No se pudieron obtener dimensiones para pedido ${pedido.id_pedido}`);
        }
      } catch (error) {
        console.error(`❌ Error midiendo vector ${pedido.id_pedido}:`, error);
      }
    });
    
    // Esperar a que todas las mediciones terminen
    await Promise.all(mediciones);
    
    // Actualizar estado una sola vez
    setDimensionesSVG(prev => ({ ...prev, ...nuevasDim }));
    setOpcionesEscalado(prev => ({ ...prev, ...nuevasOpc }));
    
    console.log(`🎯 Mediciones completadas: ${Object.keys(nuevasDim).length} vectores medidos`);
  };

  // Medir un vector específico (para uso individual)
  const medirVectorEspecifico = async (pedido) => {
    if (!pedido.archivo_vector || !pedido.medida_pedida || !pedido.medida_pedida.includes("x")) {
      console.log('⚠️ Pedido no cumple requisitos para medición');
      return;
    }
    
    try {
      console.log(`📐 Midendo vector específico: ${pedido.id_pedido}`);
      
      const url = publicUrl(pedido.archivo_vector);
      
      // Delay reducido para archivo recién subido
      if (pedido.archivo_vector.includes('_manual_') || 
          pedido.archivo_vector.includes('_ia_') ||
          pedido.archivo_vector.includes('_dim_')) {
        console.log('⏳ Esperando que archivo esté disponible...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Solo 1 segundo
        console.log('✅ Archivo listo para medición');
      }
      
      const dimensiones = await medirSVG(url);
      
      if (dimensiones && dimensiones.width > 0 && dimensiones.height > 0) {
        // Actualizar dimensiones
        setDimensionesSVG(prev => ({ ...prev, [pedido.id_pedido]: dimensiones }));
        
        // Calcular opciones de escalado
        const opciones = calcularOpcionesEscalado(dimensiones, pedido.medida_pedida);
        if (opciones) {
          setOpcionesEscalado(prev => ({ ...prev, [pedido.id_pedido]: opciones }));
        }
        
        // Calcular ratio
        const ratio = dimensiones.width / dimensiones.height;
        setRatioOriginal(prev => ({ ...prev, [pedido.id_pedido]: ratio }));
        
        console.log(`✅ Vector ${pedido.id_pedido} medido exitosamente: ${dimensiones.width}x${dimensiones.height}mm`);
      } else {
        console.warn(`⚠️ No se pudieron obtener dimensiones para pedido ${pedido.id_pedido}`);
      }
    } catch (error) {
      console.error(`❌ Error midiendo vector ${pedido.id_pedido}:`, error);
    }
  };

  // Vectorizar con IA real usando vectorizer.ai
  const handleVectorizar = async (pedido) => {
    if (!pedido.archivo_base || procesando[pedido.id_pedido]) return;
    
    const archivoBase = Array.isArray(pedido.archivo_base) ? pedido.archivo_base[0] : pedido.archivo_base;
    const baseUrl = publicUrl(archivoBase);
    
    if (!baseUrl) return;

    setProcesando(prev => ({ ...prev, [pedido.id_pedido]: true }));
    setSvgLoading(true);
    
    try {
      // Descargar la imagen base
      const imageResponse = await fetch(baseUrl);
      let imageBlob = await imageResponse.blob();
      
      // Si está activado remover fondo, procesar primero con Pixian
      if (removerFondo) {
        try {
          console.log('Removiendo fondo con Pixian...');
          imageBlob = await removeBackground(imageBlob);
          console.log('Fondo removido exitosamente');
        } catch (bgError) {
          console.error('Error removiendo fondo:', bgError);
          alert(`Error removiendo fondo: ${bgError.message}. Continuando con vectorización sin remover fondo.`);
        }
      }
      
      // Preparar FormData para el proxy local
      const formData = new FormData();
      formData.append('image', imageBlob, 'image.jpg');
      
      // Llamar al proxy local
      const response = await fetch('https://proyectoalcohn-front.onrender.com/api/vectorize', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error del servidor: ${response.status}`);
      }
      
      const svgContent = await response.text();
      
      setSvgPreview(svgContent);
      setSvgPedido(pedido);
    } catch (error) {
      console.error('Error vectorizando:', error);
      alert(`Error al vectorizar la imagen: ${error.message}`);
    } finally {
      setProcesando(prev => ({ ...prev, [pedido.id_pedido]: false }));
      setSvgLoading(false);
    }
  };

  // Previsualizar SVG
  const handlePrevisualizar = (pedido) => {
    if (pedido.archivo_vector) {
      const url = publicUrl(pedido.archivo_vector);
      fetch(url)
        .then(response => response.text())
        .then(svgContent => {
          setSvgPreview(svgContent);
          setSvgPedido(pedido);
        })
        .catch(error => {
          console.error('Error cargando SVG:', error);
        });
    }
  };

  // Dimensionar SVG
  const handleDimensionar = async (pedido, medidaReal) => {
    if (!pedido.archivo_vector || procesando[pedido.id_pedido]) return;
    
    console.log('handleDimensionar called with:', {
      pedido_id: pedido.id_pedido,
      medida_real: medidaReal,
      typeof_id: typeof pedido.id_pedido,
      typeof_medida: typeof medidaReal
    });
    
    setProcesando(prev => ({ ...prev, [pedido.id_pedido]: true }));
    
    try {
      const url = publicUrl(pedido.archivo_vector);
      console.log('🔗 URL del SVG original:', url);
      
      console.log('📐 Dimensionando SVG...');
      const svgDimensionado = await dimensionarSVG(url, medidaReal);
      console.log('📐 SVG dimensionado obtenido:', svgDimensionado ? 'SÍ' : 'NO');
      
      if (svgDimensionado) {
        // 1. Subir el SVG redimensionado a Supabase Storage con nombre único
        const fileName = generarNombreArchivo(pedido, 'dimensionado');
        const svgBlob = new Blob([svgDimensionado], { type: 'image/svg+xml' });
        
        console.log('📁 Subiendo SVG redimensionado con nombre único:', fileName);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('archivos-ventas')
          .upload(fileName, svgBlob);

        if (uploadError) {
          console.error('Error de upload:', uploadError);
          throw uploadError;
        }

        // 2. Usar el path relativo en lugar de la URL completa
        console.log('Nuevo path del vector:', fileName);

        // 3. Calcular tiempos CNC y otros valores
        console.log('🔧 Calculando valores...');
        const [cmW, cmH] = medidaReal.split("x").map(parseFloat);
        const widthMm = cmW * 10;
        const heightMm = cmH * 10;
        console.log('📏 Medidas en mm:', widthMm, 'x', heightMm);
        
        console.log('⏱️ Calculando tiempos CNC...');
        const tiempos = await calcularTiemposCNC(svgDimensionado, widthMm, heightMm);
        console.log('⏱️ Tiempos calculados:', tiempos);
        
        console.log('🔧 Calculando tipo planchuela...');
        const tipoPlanchuela = calcularTipoPlanchuela(medidaReal);
        console.log('🔧 Tipo planchuela:', tipoPlanchuela);
        
        console.log('📏 Calculando largo planchuela...');
        const largoPlanchuela = calcularLargoPlanchuela(medidaReal);
        console.log('📏 Largo planchuela:', largoPlanchuela);
        
        // 4. Actualizar el pedido con el nuevo archivo vector y todos los datos
        console.log('💾 Actualizando pedido en Supabase...');
        const datosActualizacion = {
          archivo_vector: fileName, // ¡IMPORTANTE! Guardar path relativo
          medida_real: medidaReal,
          tiempo_estimado: Math.round(tiempos.totalTime),
          tipo_planchuela: tipoPlanchuela,
          largo_planchuela: largoPlanchuela
        };
        console.log('📊 Datos a actualizar:', datosActualizacion);
        
        const { error } = await supabase
          .from('pedidos')
          .update(datosActualizacion)
          .eq('id_pedido', pedido.id_pedido);
        
        if (error) {
          console.error('Supabase error:', error);
          alert(`Error actualizando pedido: ${error.message}`);
        } else {
          console.log('✅ Pedido actualizado exitosamente con SVG redimensionado');
          console.log('📊 Datos actualizados:', {
            id_pedido: pedido.id_pedido,
            archivo_vector: fileName,
            medida_real: medidaReal,
            tiempo_estimado: Math.round(tiempos.totalTime),
            tipo_planchuela: tipoPlanchuela,
            largo_planchuela: largoPlanchuela
          });
          
          // Limpiar archivos antiguos (opcional)
          await limpiarArchivosAntiguos(pedido, fileName);
          
          // Forzar recarga de datos desde Supabase para asegurar sincronización
          console.log('🔄 Recargando datos desde Supabase...');
          await fetchPedidos();
          console.log('✅ Datos recargados');
        }
      }
    } catch (error) {
      console.error('Error dimensionando:', error);
      alert('Error al dimensionar el SVG');
    } finally {
      setProcesando(prev => ({ ...prev, [pedido.id_pedido]: false }));
    }
  };

  // Guardar SVG
  const handleGuardarSVG = async () => {
    if (!svgPreview || !svgPedido) return;
    
    try {
      const blob = new Blob([svgPreview], { type: 'image/svg+xml' });
      
      // Generar nombre único para el archivo de IA
      const fileName = generarNombreArchivo(svgPedido, 'ia');
      
      console.log('📁 Guardando SVG de IA con nombre único:', fileName);
      
      // Ahora subir el nuevo archivo
      const { error } = await supabase.storage
        .from('archivos-ventas')
        .upload(fileName, blob, {
          cacheControl: '3600'
        });
      
      if (!error) {
        const { error: updateError } = await supabase
          .from('pedidos')
          .update({ archivo_vector: fileName })
          .eq('id_pedido', svgPedido.id_pedido);
        
        if (!updateError) {
          // Limpiar archivos antiguos (opcional)
          await limpiarArchivosAntiguos(svgPedido, fileName);
          
          setSvgPreview(null);
          setSvgPedido(null);
          await fetchPedidos();
        }
      }
    } catch (error) {
      console.error('Error guardando SVG:', error);
      alert('Error al guardar el SVG');
    }
  };

  // Rechazar SVG
  const handleRechazarSVG = () => {
    setSvgPreview(null);
    setSvgPedido(null);
  };

  // Descargar archivo
  const handleDescargar = async (url, filename) => {
    try {
      // Hacer fetch del archivo para obtener el blob
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Crear URL del blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      
      // Agregar al DOM, hacer clic y limpiar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Liberar la URL del blob
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      alert(`Error al descargar el archivo: ${error.message}`);
    }
  };

  // Función para limpiar nombres de diseño para uso en archivos
  const limpiarNombreDisenio = (disenio, pedidoId) => {
    if (!disenio) return `vector-${pedidoId}`;
    
    // Limpiar el nombre del diseño para usar como nombre de archivo
    const disenioLimpio = disenio
      .replace(/[^a-zA-Z0-9\s]/g, '') // Solo letras, números y espacios
      .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
      .trim();
    
    return disenioLimpio;
  };

  // Función para generar nombre de descarga basado en el diseño
  const generarNombreDescarga = (pedido) => {
    const disenioLimpio = limpiarNombreDisenio(pedido.disenio, pedido.id_pedido);
    return `${disenioLimpio}.svg`;
  };

  // Función para generar nombres únicos de archivos según el tipo de proceso
  const generarNombreArchivo = (pedido, tipo) => {
    const disenioLimpio = limpiarNombreDisenio(pedido.disenio, pedido.id_pedido);
    const timestamp = Date.now();
    
    switch (tipo) {
      case 'manual':
        return `vector/${disenioLimpio}_${pedido.id_pedido}_manual_${timestamp}.svg`;
      case 'ia':
        return `vector/${disenioLimpio}_${pedido.id_pedido}_ia_${timestamp}.svg`;
      case 'dimensionado':
        return `vector/${disenioLimpio}_${pedido.id_pedido}_dim_${timestamp}.svg`;
      default:
        return `vector/${disenioLimpio}_${pedido.id_pedido}_${timestamp}.svg`;
    }
  };

  // Función para limpiar archivos antiguos del mismo pedido (opcional)
  const limpiarArchivosAntiguos = async (pedido, nuevoArchivo) => {
    try {
      const disenioLimpio = limpiarNombreDisenio(pedido.disenio, pedido.id_pedido);
      const patron = `${disenioLimpio}_${pedido.id_pedido}`;
      
      // Listar archivos en el bucket que coincidan con el patrón
      const { data: archivos, error } = await supabase.storage
        .from('archivos-ventas')
        .list('vector', {
          search: patron
        });
      
      if (error) {
        console.warn('No se pudieron listar archivos antiguos:', error);
        return;
      }
      
      // Eliminar archivos antiguos (mantener solo los últimos 3)
      if (archivos && archivos.length > 3) {
        const archivosAEliminar = archivos
          .filter(archivo => archivo.name !== nuevoArchivo.split('/').pop())
          .slice(0, archivos.length - 3)
          .map(archivo => `vector/${archivo.name}`);
        
        if (archivosAEliminar.length > 0) {
          console.log('🧹 Limpiando archivos antiguos:', archivosAEliminar);
          await supabase.storage.from('archivos-ventas').remove(archivosAEliminar);
        }
      }
    } catch (error) {
      console.warn('Error limpiando archivos antiguos:', error);
    }
  };

  // Cargar vector manualmente
  const handleCargarVector = async (pedido, file) => {
    if (!file || procesando[pedido.id_pedido]) return;
    
    setProcesando(prev => ({ ...prev, [pedido.id_pedido]: true }));
    
    try {
      console.log('Cargando vector manual:', file.name);
      
      // Leer el contenido del archivo SVG
      const svgContent = await file.text();
      
      // Subir el SVG a Supabase Storage con nombre único
      const fileName = generarNombreArchivo(pedido, 'manual');
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      
      console.log('📁 Subiendo archivo con nombre único:', fileName);
      
      // Ahora subir el nuevo archivo
      const { error: uploadError } = await supabase.storage
        .from('archivos-ventas')
        .upload(fileName, svgBlob, {
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.error('Error subiendo SVG:', uploadError);
        throw uploadError;
      }

      // Esperar 2 segundos para que Supabase Storage procese el archivo
      console.log('⏳ Esperando que Supabase Storage procese el archivo...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Archivo procesado, continuando...');

      // Actualizar el pedido con el nuevo archivo vector
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ archivo_vector: fileName })
        .eq('id_pedido', pedido.id_pedido);
      
      if (updateError) {
        console.error('Error actualizando pedido:', updateError);
        throw updateError;
      }

      console.log('Vector cargado exitosamente:', fileName);
      
      // Limpiar archivos antiguos (opcional)
      await limpiarArchivosAntiguos(pedido, fileName);
      
      // Medir el vector inmediatamente para mostrar opciones de escalado
      await medirVectorEspecifico(pedido);
      
      await fetchPedidos();
      
    } catch (error) {
      console.error('Error cargando vector:', error);
      alert(`Error al cargar el vector: ${error.message}`);
    } finally {
      setProcesando(prev => ({ ...prev, [pedido.id_pedido]: false }));
    }
  };

  // Enviar a Verificar Medidas (solo borra medida_real, el trigger se encarga del resto)
  const handleEnviarAVerificar = async (pedido) => {
    if (procesando[pedido.id_pedido]) return;
    
    setProcesando(prev => ({ ...prev, [pedido.id_pedido]: true }));
    
    try {
      console.log('🔄 Enviando a verificar medidas:', pedido.id_pedido);
      
      // Solo borrar medida_real - el trigger modificado se encargará de limpiar los otros campos
      const { error } = await supabase
        .from('pedidos')
        .update({
          medida_real: null
        })
        .eq('id_pedido', pedido.id_pedido);
      
      if (error) {
        console.error('❌ Error enviando a verificar:', error);
        throw error;
      }

      console.log('✅ Pedido enviado a verificar exitosamente');
      await fetchPedidos();
      
    } catch (error) {
      console.error('❌ Error enviando a verificar:', error);
      alert(`Error al enviar a verificar: ${error.message}`);
    } finally {
      setProcesando(prev => ({ ...prev, [pedido.id_pedido]: false }));
    }
  };

  // Enviar a Vectorizar (solo establece archivo_vector como null, el trigger se encarga del resto)
  const handleEnviarAVectorizar = async (pedido) => {
    if (procesando[pedido.id_pedido]) return;
    
    setProcesando(prev => ({ ...prev, [pedido.id_pedido]: true }));
    
    try {
      console.log('🔄 Enviando a vectorizar:', pedido.id_pedido);
      
      // Solo establecer archivo_vector como null - el trigger modificado se encargará de limpiar todo
      const { error } = await supabase
        .from('pedidos')
        .update({
          archivo_vector: null
        })
        .eq('id_pedido', pedido.id_pedido);
      
      if (error) {
        console.error('❌ Error enviando a vectorizar:', error);
        throw error;
      }

      console.log('✅ Pedido enviado a vectorizar exitosamente');
      await fetchPedidos();
      
    } catch (error) {
      console.error('❌ Error enviando a vectorizar:', error);
      alert(`Error al enviar a vectorizar: ${error.message}`);
    } finally {
      setProcesando(prev => ({ ...prev, [pedido.id_pedido]: false }));
    }
  };

  // Funciones para medidas personalizadas
  const handleAnchoChange = (pedidoId, ancho) => {
    const ratio = ratioOriginal[pedidoId];
    if (ancho && !isNaN(ancho) && ratio > 0) {
      const altoCalculado = (parseFloat(ancho) / ratio).toFixed(1);
      setMedidaPersonalizada(prev => ({ 
        ...prev, 
        [pedidoId]: { ancho, alto: altoCalculado } 
      }));
    } else {
      setMedidaPersonalizada(prev => ({ 
        ...prev, 
        [pedidoId]: { ancho, alto: '' } 
      }));
    }
  };

  const handleAplicarMedidaPersonalizada = async (pedido) => {
    const medida = medidaPersonalizada[pedido.id_pedido];
    if (!medida || !medida.ancho || !medida.alto) return;
    
    const medidaCompleta = `${medida.ancho}x${medida.alto}`;
    await handleDimensionar(pedido, medidaCompleta);
  };

  const limpiarMedidaPersonalizada = (pedidoId) => {
    setMedidaPersonalizada(prev => {
      const nuevo = { ...prev };
      delete nuevo[pedidoId];
      return nuevo;
    });
  };

  // Eliminar vector y volver a "A Vectorizar"
  const handleEliminarVector = async (pedido) => {
    if (procesando[pedido.id_pedido]) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el vector de "${pedido.disenio}"? Esto lo enviará de vuelta a "A Vectorizar".`)) {
      return;
    }
    
    setProcesando(prev => ({ ...prev, [pedido.id_pedido]: true }));
    
    try {
      console.log('🗑️ Eliminando vector:', pedido.id_pedido);
      
      // Eliminar el archivo del storage si existe
      if (pedido.archivo_vector) {
        try {
          await supabase.storage.from('archivos-ventas').remove([pedido.archivo_vector]);
          console.log('✅ Archivo eliminado del storage');
        } catch (storageError) {
          console.warn('⚠️ No se pudo eliminar el archivo del storage:', storageError);
        }
      }
      
      // Actualizar el pedido: eliminar archivo_vector y medida_real
      const { error } = await supabase
        .from('pedidos')
        .update({
          archivo_vector: null,
          medida_real: null,
          tiempo_estimado: null,
          tipo_planchuela: null,
          largo_planchuela: null
        })
        .eq('id_pedido', pedido.id_pedido);
      
      if (error) {
        console.error('❌ Error eliminando vector:', error);
        throw error;
      }

      console.log('✅ Vector eliminado exitosamente');
      await fetchPedidos();
      
    } catch (error) {
      console.error('❌ Error eliminando vector:', error);
      alert(`Error al eliminar el vector: ${error.message}`);
    } finally {
      setProcesando(prev => ({ ...prev, [pedido.id_pedido]: false }));
    }
  };

  // Reemplazar vector con uno nuevo
  const handleReemplazarVector = async (pedido, file) => {
    if (!file || procesando[pedido.id_pedido]) return;
    
    setProcesando(prev => ({ ...prev, [pedido.id_pedido]: true }));
    
    try {
      console.log('🔄 Reemplazando vector:', file.name);
      
      // Leer el contenido del archivo SVG
      const svgContent = await file.text();
      
      // Generar nombre único para el nuevo archivo
      const fileName = generarNombreArchivo(pedido, 'manual');
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      
      console.log('📁 Subiendo nuevo archivo:', fileName);
      
      // Subir el nuevo archivo
      const { error: uploadError } = await supabase.storage
        .from('archivos-ventas')
        .upload(fileName, svgBlob, {
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.error('Error subiendo nuevo SVG:', uploadError);
        throw uploadError;
      }

      // Esperar que Supabase Storage procese el archivo
      console.log('⏳ Esperando que Supabase Storage procese el archivo...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Archivo procesado, continuando...');

      // Eliminar el archivo anterior si existe
      if (pedido.archivo_vector) {
        try {
          await supabase.storage.from('archivos-ventas').remove([pedido.archivo_vector]);
          console.log('🗑️ Archivo anterior eliminado');
        } catch (storageError) {
          console.warn('⚠️ No se pudo eliminar el archivo anterior:', storageError);
        }
      }

      // Actualizar el pedido con el nuevo archivo vector y limpiar medidas
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          archivo_vector: fileName,
          medida_real: null,
          tiempo_estimado: null,
          tipo_planchuela: null,
          largo_planchuela: null
        })
        .eq('id_pedido', pedido.id_pedido);
      
      if (updateError) {
        console.error('Error actualizando pedido:', updateError);
        throw updateError;
      }

      console.log('✅ Vector reemplazado exitosamente:', fileName);
      
      // Limpiar archivos antiguos
      await limpiarArchivosAntiguos(pedido, fileName);
      
      // Medir el vector inmediatamente para mostrar opciones de escalado
      await medirVectorEspecifico(pedido);
      
      await fetchPedidos();
      
    } catch (error) {
      console.error('Error reemplazando vector:', error);
      alert(`Error al reemplazar el vector: ${error.message}`);
    } finally {
      setProcesando(prev => ({ ...prev, [pedido.id_pedido]: false }));
    }
  };

  // Effects
  useEffect(() => {
    // Verificar autenticación antes de hacer operaciones de base de datos
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAuthReady(true);
      }
    };

    // Suscribirse a cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setAuthReady(true);
      } else if (event === 'SIGNED_OUT') {
        setAuthReady(false);
      }
    });

    // Verificar auth inicial
    checkAuth();

    // Cleanup de la suscripción
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Solo ejecutar fetchPedidos cuando la autenticación esté lista
    if (authReady) {
      fetchPedidos();
    }
  }, [authReady]);

  useEffect(() => {
    if (pedidos.length > 0 && grupoVector.length > 0) {
      // Solo medir si hay vectores en "Verificar Medidas"
      console.log('🔄 Ejecutando medición automática...');
      medirTodos();
    }
  }, [pedidos, grupoVector.length]);

  return {
    // State
    pedidos,
    loading,
    dimensionesSVG,
    opcionesEscalado,
    procesando,
    svgPreview,
    svgPedido,
    svgLoading,
    activeTab,
    busqueda,
    removerFondo,
    medidaPersonalizada,
    ratioOriginal,
    
    // Groups
    grupoBase,
    grupoVector,
    grupoVerificados,
    
    // Actions
    setActiveTab,
    setBusqueda,
    setRemoverFondo,
    handleVectorizar,
    handlePrevisualizar,
    handleDimensionar,
    handleGuardarSVG,
    handleRechazarSVG,
    handleDescargar,
    handleCargarVector,
    handleEnviarAVerificar,
    handleEnviarAVectorizar,
    handleEliminarVector,
    handleReemplazarVector,
    
    // Medidas personalizadas
    handleAnchoChange,
    handleAplicarMedidaPersonalizada,
    limpiarMedidaPersonalizada,
    
    // Utils
    publicUrl,
    fetchPedidos,
    medirVectorEspecifico
  };
};