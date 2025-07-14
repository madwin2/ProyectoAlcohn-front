import { useState } from 'react';
import { medirSVG, calcularOpcionesEscalado, dimensionarSVG, calcularTiemposCNC, calcularTipoPlanchuela, calcularLargoPlanchuela } from '../utils/svgUtils';
import { supabase } from '../supabaseClient';

export const useVerificacionMedidas = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dimensionesSVG, setDimensionesSVG] = useState(null);
  const [opcionesEscalado, setOpcionesEscalado] = useState([]);

  const medirVector = async (vectorUrl, medidaPedida) => {
    setLoading(true);
    setError(null);
    try {
      const dimensiones = await medirSVG(vectorUrl);
      setDimensionesSVG(dimensiones);
      
      if (medidaPedida) {
        const opciones = calcularOpcionesEscalado(dimensiones, medidaPedida);
        if (opciones) {
          // Convertir el objeto a array para facilitar el renderizado
          const opcionesArray = [
            { label: 'Normal', medida: opciones.normal },
            { label: 'Invertido', medida: opciones.invertido }
          ];
          setOpcionesEscalado(opcionesArray);
        }
      }
      
      return dimensiones;
    } catch (err) {
      console.error('Error midiendo SVG:', err);
      setError('Error al medir el archivo SVG');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const aplicarMedida = async (vectorUrl, medidaReal, pedidoId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Aplicando medida:', medidaReal, 'al pedido:', pedidoId);
      
      // 1. Dimensionar el SVG
      const svgDimensionado = await dimensionarSVG(vectorUrl, medidaReal);
      if (!svgDimensionado) {
        throw new Error('Error al dimensionar el SVG');
      }
      
      console.log('SVG redimensionado (primeros 200 chars):', svgDimensionado.substring(0, 200));
      
      // 2. Subir el SVG redimensionado a Supabase Storage
      const fileName = `vector/archivo_vector_${pedidoId}_${Date.now()}.svg`;
      const svgBlob = new Blob([svgDimensionado], { type: 'image/svg+xml' });
      
      console.log('Subiendo archivo:', fileName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('archivos-ventas')
        .upload(fileName, svgBlob);

      if (uploadError) {
        console.error('Error de upload:', uploadError);
        throw uploadError;
      }

      console.log('Upload exitoso:', uploadData);

      // 3. Usar el path relativo en lugar de la URL completa
      console.log('Path relativo guardado:', fileName);

      // 4. Calcular tiempos CNC y otros valores
      const [cmW, cmH] = medidaReal.split("x").map(parseFloat);
      const widthMm = cmW * 10;
      const heightMm = cmH * 10;
      const tiempos = await calcularTiemposCNC(svgDimensionado, widthMm, heightMm);
      
      const tipoPlanchuela = calcularTipoPlanchuela(medidaReal);
      const largoPlanchuela = calcularLargoPlanchuela(medidaReal);

      // 5. Actualizar el pedido usando RPC optimizada
      console.log('Actualizando pedido con RPC:', {
        pedido_id: pedidoId,
        archivo_vector_path: fileName,
        medida_real_value: medidaReal,
        tiempo_estimado_value: Math.round(tiempos.totalTime),
        tipo_planchuela_value: tipoPlanchuela,
        largo_planchuela_value: largoPlanchuela
      });
      
      const { data: updateResult, error: updateError } = await supabase.rpc('actualizar_pedido_con_medida', {
        pedido_id: pedidoId,
        archivo_vector_path: fileName,
        medida_real_value: medidaReal,
        tiempo_estimado_value: Math.round(tiempos.totalTime),
        tipo_planchuela_value: tipoPlanchuela,
        largo_planchuela_value: largoPlanchuela
      });

      if (updateError) {
        console.error('Error actualizando pedido con RPC:', updateError);
        throw updateError;
      }

      console.log('Pedido actualizado exitosamente con RPC:', updateResult);

      return {
        svgDimensionado,
        nuevaUrl: fileName, // Retornar path relativo
        medidaReal
      };
      
    } catch (err) {
      console.error('Error aplicando medida:', err);
      setError('Error al guardar el SVG redimensionado: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const limpiarEstado = () => {
    setDimensionesSVG(null);
    setOpcionesEscalado([]);
    setError(null);
  };

  return {
    // Estado
    loading,
    error,
    dimensionesSVG,
    opcionesEscalado,
    
    // Acciones
    medirVector,
    aplicarMedida,
    limpiarEstado,
    
    // Setters para casos especiales
    setError
  };
};