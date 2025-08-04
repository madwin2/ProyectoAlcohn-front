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

  // Medir SVGs y calcular opciones de escalado
  const medirTodos = async () => {
    let nuevasDim = {};
    let nuevasOpc = {};
    
    for (const pedido of pedidos) {
      if (pedido.archivo_vector && pedido.medida_pedida && pedido.medida_pedida.includes("x")) {
        const url = publicUrl(pedido.archivo_vector);
        
        // Agregar un pequeño delay para archivos recién subidos
        if (pedido.archivo_vector.includes('_manual-') || pedido.archivo_vector.includes('archivo_vector_')) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const dimensiones = await medirSVG(url);
        nuevasDim[pedido.id_pedido] = dimensiones;
        
        const opciones = calcularOpcionesEscalado(dimensiones, pedido.medida_pedida);
        if (opciones) {
          nuevasOpc[pedido.id_pedido] = opciones;
        }
      }
    }
    
    setDimensionesSVG(nuevasDim);
    setOpcionesEscalado(nuevasOpc);
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
        // 1. Subir el SVG redimensionado a Supabase Storage
        const fileName = `vector/archivo_vector_${pedido.id_pedido}_${Date.now()}.svg`;
        const svgBlob = new Blob([svgDimensionado], { type: 'image/svg+xml' });
        
        console.log('Subiendo SVG redimensionado:', fileName);
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
      const fileName = `vector/${svgPedido.id_pedido}-${Date.now()}.svg`;
      
      const { error } = await supabase.storage
        .from('archivos-ventas')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (!error) {
        const { error: updateError } = await supabase
          .from('pedidos')
          .update({ archivo_vector: fileName })
          .eq('id_pedido', svgPedido.id_pedido);
        
        if (!updateError) {
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
  const handleDescargar = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  // Cargar vector manualmente
  const handleCargarVector = async (pedido, file) => {
    if (!file || procesando[pedido.id_pedido]) return;
    
    setProcesando(prev => ({ ...prev, [pedido.id_pedido]: true }));
    
    try {
      console.log('Cargando vector manual:', file.name);
      
      // Leer el contenido del archivo SVG
      const svgContent = await file.text();
      
      // Subir el SVG a Supabase Storage
      const fileName = `vector/${pedido.id_pedido}-manual-${Date.now()}.svg`;
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      
      const { error: uploadError } = await supabase.storage
        .from('archivos-ventas')
        .upload(fileName, svgBlob, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error subiendo SVG:', uploadError);
        throw uploadError;
      }

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

  // Effects
  useEffect(() => {
    fetchPedidos();
  }, []);

  useEffect(() => {
    if (pedidos.length > 0) {
      medirTodos();
    }
  }, [pedidos]);

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
    
    // Utils
    publicUrl,
    fetchPedidos
  };
};