/**
 * Utilidades para manejar SVG y cálculos de vectorización
 */

/**
 * Mide las dimensiones de un SVG desde una URL
 */
export const medirSVG = async (url) => {
  try {
    const response = await fetch(url);
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
    
    // Crear SVG temporal para medir
    const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    tempSvg.style.visibility = "hidden";
    document.body.appendChild(tempSvg);
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Obtener todos los elementos que tienen dimensiones
    const elementos = svgDoc.querySelectorAll("path, rect, circle, ellipse, line, polyline, polygon");
    
    elementos.forEach(elemento => {
      const clon = elemento.cloneNode(true);
      tempSvg.appendChild(clon);
      
      const bbox = clon.getBBox();
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.width);
      maxY = Math.max(maxY, bbox.y + bbox.height);
      
      tempSvg.removeChild(clon);
    });
    
    document.body.removeChild(tempSvg);
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    return { width, height };
  } catch (error) {
    console.error('Error midiendo SVG:', error);
    return { width: 0, height: 0 };
  }
};

/**
 * Redimensiona un SVG a las medidas especificadas
 */
export const dimensionarSVG = async (url, medidaDeseada) => {
  try {
    console.log('Dimensionando SVG:', url, 'a medida:', medidaDeseada);
    const [cmW, cmH] = medidaDeseada.split("x").map(parseFloat);
    const targetW = cmW * 10; // Convertir cm a mm
    const targetH = cmH * 10;
    console.log('Medidas objetivo en mm:', targetW, 'x', targetH);
    
    const response = await fetch(url);
    const svgText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svg = doc.documentElement;
    
    // Crear SVG temporal para calcular dimensiones
    const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    tempSvg.style.visibility = "hidden";
    document.body.appendChild(tempSvg);
    
    const elementos = svg.querySelectorAll("path, rect, circle, ellipse, line, polyline, polygon");
    const tempG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tempSvg.appendChild(tempG);
    
    // Clonar elementos para medir
    elementos.forEach(el => {
      const clon = el.cloneNode(true);
      clon.removeAttribute('transform');
      tempG.appendChild(clon);
    });
    
    const bbox = tempG.getBBox();
    document.body.removeChild(tempSvg);
    
    // Crear grupo para contener todos los elementos
    const g = doc.createElementNS("http://www.w3.org/2000/svg", "g");
    
    // Mover elementos al grupo
    elementos.forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
      el.removeAttribute('transform');
      g.appendChild(el);
    });
    
    // Calcular escala para que el contenido tenga exactamente las medidas pedidas
    const scaleX = targetW / bbox.width;
    const scaleY = targetH / bbox.height;
    
    // Usar la escala uniforme más pequeña para mantener proporciones
    const scale = Math.min(scaleX, scaleY);
    
    // Calcular dimensiones reales del contenido escalado
    const contentWidth = bbox.width * scale;
    const contentHeight = bbox.height * scale;
    
    // Usar las dimensiones del contenido como dimensiones del SVG
    const tx = -bbox.x * scale;
    const ty = -bbox.y * scale;
    
    // Aplicar transformación
    g.setAttribute("transform", `translate(${tx}, ${ty}) scale(${scale})`);
    
    // Limpiar SVG y agregar grupo
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(g);
    
    // Establecer dimensiones exactas del SVG
    svg.setAttribute("width", `${contentWidth}mm`);
    svg.setAttribute("height", `${contentHeight}mm`);
    svg.setAttribute("viewBox", `0 0 ${contentWidth} ${contentHeight}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    
    console.log('SVG redimensionado a:', contentWidth, 'x', contentHeight, 'mm');
    console.log('Equivale a:', (contentWidth/10), 'x', (contentHeight/10), 'cm');
    
    const result = new XMLSerializer().serializeToString(doc);
    console.log('SVG generado (primeros 300 chars):', result.substring(0, 300));
    
    return result;
  } catch (error) {
    console.error('Error dimensionando SVG:', error);
    return null;
  }
};

/**
 * Calcula opciones de escalado para un SVG
 */
export const calcularOpcionesEscalado = (dimensionesSVG, medidaPedida) => {
  if (!dimensionesSVG || !medidaPedida || !medidaPedida.includes("x")) {
    return null;
  }
  
  // Convertir dimensiones SVG de mm a cm para las comparaciones
  const svgWidthCm = dimensionesSVG.width / 10;
  const svgHeightCm = dimensionesSVG.height / 10;
  const [medidaX, medidaY] = medidaPedida.split("x").map(parseFloat);
  const svgRatio = svgWidthCm / svgHeightCm;
  
  let opcion1X, opcion1Y, opcion2X, opcion2Y;
  
  // Opción 1: Escalar manteniendo el ancho pedido (3) y ajustar alto según proporción del SVG
  opcion1X = medidaX;
  opcion1Y = parseFloat((medidaX / svgRatio).toFixed(1));
  
  // Opción 2: Escalar manteniendo el alto pedido (2) y ajustar ancho según proporción del SVG  
  opcion2Y = medidaY;
  opcion2X = parseFloat((medidaY * svgRatio).toFixed(1));
  
  return {
    normal: `${opcion1X}x${opcion1Y}`,
    invertido: `${opcion2X}x${opcion2Y}`,
    original: `${svgWidthCm.toFixed(2)}x${svgHeightCm.toFixed(2)}`
  };
};

/**
 * Calcula el tipo de planchuela necesario
 */
export const calcularTipoPlanchuela = (medidaReal) => {
  if (!medidaReal || !medidaReal.includes("x")) return null;
  
  const planchuelas = [12, 19, 25, 38];
  const [mx, my] = medidaReal.split("x").map(parseFloat);
  
  // Convertir a milímetros
  const minMedida = Math.min(mx, my) * 10;
  
  // Buscar la planchuela más pequeña que sea mayor que la medida
  for (let i = 0; i < planchuelas.length; i++) {
    if (minMedida < planchuelas[i]) {
      return planchuelas[i];
    }
  }
  
  return null; // Si ninguna planchuela es suficiente
};

/**
 * Calcula el largo de planchuela (el mayor de los dos valores)
 */
export const calcularLargoPlanchuela = (medidaReal) => {
  if (!medidaReal || !medidaReal.includes("x")) return null;
  
  const [mx, my] = medidaReal.split("x").map(parseFloat);
  return Math.max(mx, my);
};

/**
 * Configuración de herramientas y parámetros de mecanizado
 */
const HERRAMIENTAS = {
  fresa6mm: {
    nombre: "Fresa 6mm",
    velocidadAvance: 800, // mm/min
    profundidadPasada: 0.2, // mm
    recuperacion: 0.8, // 80% - herramienta recta
    diametro: 6
  },
  fresa1mm: {
    nombre: "Fresa 1mm",
    velocidadAvance: 1000, // mm/min
    profundidadPasada: 0.1, // mm
    recuperacion: 0.3, // 30% - cónica 15° lateral
    diametro: 1
  },
  fresa05mm: {
    nombre: "Fresa 0.5mm",
    velocidadAvance: 800, // mm/min
    profundidadPasada: 0.1, // mm  
    recuperacion: 0.3, // 30% - cónica 15° lateral
    diametro: 0.5
  }
};

/**
 * Configuración de operaciones de mecanizado
 */
const OPERACIONES = {
  planeado: {
    herramienta: HERRAMIENTAS.fresa6mm,
    profundidadTotal: 0.5, // mm - profundidad típica de planeado
    factor: 1.0 // Factor de cobertura del área
  },
  cajeado6mm: {
    herramienta: HERRAMIENTAS.fresa6mm,
    profundidadTotal: 2.0, // mm - profundidad típica de desbaste
    factor: 0.7 // 70% del área total (zonas a desbastar)
  },
  cajeado1mm: {
    herramienta: HERRAMIENTAS.fresa1mm,
    profundidadTotal: 0.5, // mm - acabado intermedio
    factor: 0.4 // 40% del área (zonas más complejas)
  },
  perfilado05mm: {
    herramienta: HERRAMIENTAS.fresa05mm,
    profundidadTotal: 0.3, // mm - acabado final
    factor: 0.2 // 20% del área (solo contornos y detalles finos)
  }
};

/**
 * Calcula el tiempo de una operación específica
 */
const calcularTiempoOperacion = (area, perimetro, operacion) => {
  const { herramienta, profundidadTotal, factor } = operacion;

  // Calcular número de pasadas necesarias
  const numPasadas = Math.ceil(profundidadTotal / herramienta.profundidadPasada);

  // Estimar longitud de trayectoria basada en área y perímetro
  let longitudTrayectoria;

  if (operacion === OPERACIONES.planeado) {
    // Planeado: trayectoria en zigzag sobre toda el área
    const espaciado = herramienta.diametro * 0.8; // 80% solapamiento
    longitudTrayectoria = (area / espaciado) * factor;
  } else if (operacion === OPERACIONES.perfilado05mm) {
    // Perfilado: principalmente perímetro y contornos
    longitudTrayectoria = perimetro * factor * 2; // Múltiples pasadas de contorno
  } else {
    // Cajeados: combinación de área y perímetro
    const espaciado = herramienta.diametro * 0.6; // 60% solapamiento para cajeado
    const trayectoriaArea = (area * factor) / espaciado;
    const trayectoriaContorno = perimetro * factor;
    longitudTrayectoria = trayectoriaArea + trayectoriaContorno;
  }

  // Tiempo de mecanizado productivo
  const tiempoProductivo = (longitudTrayectoria * numPasadas) / herramienta.velocidadAvance;

  // Tiempo de movimientos no productivos (recuperación)
  const tiempoRecuperacion = tiempoProductivo * (1 - herramienta.recuperacion);

  // Tiempo total de la operación
  const tiempoTotal = tiempoProductivo + tiempoRecuperacion;

  return {
    operacion: herramienta.nombre,
    numPasadas,
    longitudTrayectoria: longitudTrayectoria.toFixed(1),
    tiempoProductivo: tiempoProductivo.toFixed(1),
    tiempoRecuperacion: tiempoRecuperacion.toFixed(1),
    tiempoTotal: tiempoTotal.toFixed(1)
  };
};

/**
 * Estima el perímetro basado en la complejidad del SVG
 */
const estimarPerimetro = (svgString, area) => {
  // Contar elementos de path y formas que indican complejidad
  const pathCount = (svgString.match(/<path/g) || []).length;
  const circleCount = (svgString.match(/<circle/g) || []).length;
  const rectCount = (svgString.match(/<rect/g) || []).length;
  const lineCount = (svgString.match(/<line/g) || []).length;

  // Factor de complejidad basado en elementos
  const complejidad = pathCount * 2 + circleCount + rectCount + lineCount;

  // Estimar perímetro basado en área y complejidad
  // Para un círculo: perímetro = 2 * π * √(área/π)
  const perimetroBase = 2 * Math.sqrt(Math.PI * area);

  // Ajustar por complejidad (más elementos = más perímetro)
  const factorComplejidad = 1 + (complejidad * 0.1);

  return perimetroBase * factorComplejidad;
};

/**
 * Función principal de cálculo de tiempos CNC mejorada
 */
export const calcularTiemposCNC = async (svgString, widthMm, heightMm) => {
  try {
    // Calcular área en mm²
    const area = widthMm * heightMm;

    // Estimar perímetro basado en complejidad del SVG
    const perimetro = estimarPerimetro(svgString, area);

    // Calcular tiempo para cada operación
    const tiempoPlaneado = calcularTiempoOperacion(area, perimetro, OPERACIONES.planeado);
    const tiempoCajeado6 = calcularTiempoOperacion(area, perimetro, OPERACIONES.cajeado6mm);
    const tiempoCajeado1 = calcularTiempoOperacion(area, perimetro, OPERACIONES.cajeado1mm);
    const tiempoPerfilado = calcularTiempoOperacion(area, perimetro, OPERACIONES.perfilado05mm);

    // Tiempo total (convertir de minutos a segundos)
    const tiempoTotalMinutos = parseFloat(tiempoPlaneado.tiempoTotal) +
      parseFloat(tiempoCajeado6.tiempoTotal) +
      parseFloat(tiempoCajeado1.tiempoTotal) +
      parseFloat(tiempoPerfilado.tiempoTotal);

    const tiempoTotalSegundos = tiempoTotalMinutos * 60;

    // Distribución por tipo de operación (en segundos)
    const roughingTime = (parseFloat(tiempoPlaneado.tiempoTotal) + parseFloat(tiempoCajeado6.tiempoTotal)) * 60;
    const fineProfilingTime = (parseFloat(tiempoCajeado1.tiempoTotal) + parseFloat(tiempoPerfilado.tiempoTotal)) * 60;

    // Resultado detallado
    return {
      totalTime: Math.max(Math.round(tiempoTotalSegundos), 30), // Mínimo 30 segundos
      roughingTime: Math.max(Math.round(roughingTime), 10),
      fineProfilingTime: Math.max(Math.round(fineProfilingTime), 20),

      // Información detallada para debugging
      detalles: {
        area: `${area.toFixed(0)} mm²`,
        perimetro: `${perimetro.toFixed(1)} mm`,
        tiempoTotalMinutos: `${tiempoTotalMinutos.toFixed(1)} min`,
        operaciones: {
          planeado: tiempoPlaneado,
          cajeado6mm: tiempoCajeado6,
          cajeado1mm: tiempoCajeado1,
          perfilado05mm: tiempoPerfilado
        }
      }
    };

  } catch (error) {
    console.error('Error calculando tiempos CNC:', error);

    // Valores por defecto en caso de error
    return {
      totalTime: 300, // 5 minutos por defecto
      roughingTime: 180, // 3 minutos desbaste
      fineProfilingTime: 120, // 2 minutos acabado
      detalles: {
        error: error.message
      }
    };
  }
};

/**
 * Función auxiliar para mostrar el desglose detallado
 */
export const mostrarDesgloseTiempos = (resultados) => {
  if (resultados.detalles) {
    console.log('=== DESGLOSE DE TIEMPOS CNC ===');
    console.log(`Área: ${resultados.detalles.area}`);
    console.log(`Perímetro estimado: ${resultados.detalles.perimetro}`);
    console.log(`Tiempo total: ${resultados.detalles.tiempoTotalMinutos}`);
    console.log('\n--- Operaciones ---');

    Object.entries(resultados.detalles.operaciones).forEach(([nombre, datos]) => {
      console.log(`${nombre}:`);
      console.log(`  - Herramienta: ${datos.operacion}`);
      console.log(`  - Pasadas: ${datos.numPasadas}`);
      console.log(`  - Trayectoria: ${datos.longitudTrayectoria} mm`);
      console.log(`  - Tiempo: ${datos.tiempoTotal} min`);
    });
  }
};