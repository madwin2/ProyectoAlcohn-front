import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { medirSVG, dimensionarSVG, calcularOpcionesEscalado, calcularTipoPlanchuela, calcularLargoPlanchuela, calcularTiemposCNC } from '../utils/svgUtils';

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
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .neq('estado_fabricacion', 'Hecho');
      
      if (!error) {
        setPedidos(data || []);
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

  // Medir SVGs y calcular opciones de escalado
  const medirTodos = async () => {
    let nuevasDim = {};
    let nuevasOpc = {};
    
    for (const pedido of pedidos) {
      if (pedido.archivo_vector && pedido.medida_pedida && pedido.medida_pedida.includes("x")) {
        const url = publicUrl(pedido.archivo_vector);
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

  // Vectorizar con IA (simulado)
  const handleVectorizar = async (pedido) => {
    if (!pedido.archivo_base || procesando[pedido.id_pedido]) return;
    
    const archivoBase = Array.isArray(pedido.archivo_base) ? pedido.archivo_base[0] : pedido.archivo_base;
    const baseUrl = publicUrl(archivoBase);
    
    if (!baseUrl) return;

    setProcesando(prev => ({ ...prev, [pedido.id_pedido]: true }));
    setSvgLoading(true);
    
    try {
      // Simular proceso de vectorización
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generar SVG simulado basado en el pedido
      const svgSimulado = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#grad1)" rx="20"/>
          <text x="200" y="120" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
            ${pedido.disenio || 'Diseño Vectorizado'}
          </text>
          <text x="200" y="160" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16">
            ID: ${pedido.id_pedido}
          </text>
          <text x="200" y="200" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14">
            Vectorizado con IA
          </text>
          <circle cx="200" cy="240" r="20" fill="white" opacity="0.8"/>
          <path d="M190 240 L200 250 L210 230" stroke="#2563eb" stroke-width="3" fill="none"/>
        </svg>
      `;
      
      setSvgPreview(svgSimulado);
      setSvgPedido(pedido);
    } catch (error) {
      console.error('Error vectorizando:', error);
      alert('Error al vectorizar la imagen');
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
    
    setProcesando(prev => ({ ...prev, [pedido.id_pedido]: true }));
    
    try {
      const url = publicUrl(pedido.archivo_vector);
      const svgDimensionado = await dimensionarSVG(url, medidaReal);
      
      if (svgDimensionado) {
        const [cmW, cmH] = medidaReal.split("x").map(parseFloat);
        const widthMm = cmW * 10;
        const heightMm = cmH * 10;
        const tiempos = await calcularTiemposCNC(svgDimensionado, widthMm, heightMm);
        
        const tipoPlanchuela = calcularTipoPlanchuela(medidaReal);
        const largoPlanchuela = calcularLargoPlanchuela(medidaReal);
        
        const { error } = await supabase
          .from('pedidos')
          .update({
            medida_real: medidaReal,
            tiempo_estimado: Math.round(tiempos.totalTime),
            tiempo_estimado_desbaste: Math.round(tiempos.roughingTime),
            tiempo_estimado_ultrafino: Math.round(tiempos.fineProfilingTime),
            tipo_planchuela: tipoPlanchuela,
            largo_planchuela: largoPlanchuela
          })
          .eq('id_pedido', pedido.id_pedido);
        
        if (!error) {
          await fetchPedidos();
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
    
    // Groups
    grupoBase,
    grupoVector,
    grupoVerificados,
    
    // Actions
    setActiveTab,
    setBusqueda,
    handleVectorizar,
    handlePrevisualizar,
    handleDimensionar,
    handleGuardarSVG,
    handleRechazarSVG,
    handleDescargar,
    
    // Utils
    publicUrl,
    fetchPedidos
  };
};