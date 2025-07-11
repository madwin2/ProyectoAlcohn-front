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
    const [cmW, cmH] = medidaDeseada.split("x").map(parseFloat);
    const targetW = cmW * 10; // Convertir cm a mm
    const targetH = cmH * 10;
    
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
    
    // Calcular escala y posición
    const scale = Math.min(targetW / bbox.width, targetH / bbox.height);
    const canvasWidth = targetW + 20;
    const canvasHeight = targetH + 20;
    const tx = (canvasWidth - bbox.width * scale) / 2 - bbox.x * scale;
    const ty = (canvasHeight - bbox.height * scale) / 2 - bbox.y * scale;
    
    // Aplicar transformación
    g.setAttribute("transform", `translate(${tx}, ${ty}) scale(${scale})`);
    
    // Limpiar SVG y agregar grupo
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(g);
    
    // Establecer dimensiones del SVG
    svg.setAttribute("width", `${canvasWidth}mm`);
    svg.setAttribute("height", `${canvasHeight}mm`);
    svg.setAttribute("viewBox", `0 0 ${canvasWidth} ${canvasHeight}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    
    return new XMLSerializer().serializeToString(doc);
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
  
  const [medidaX, medidaY] = medidaPedida.split("x").map(parseFloat);
  const svgRatio = dimensionesSVG.width / dimensionesSVG.height;
  
  let opcion1X, opcion1Y, opcion2X, opcion2Y;
  
  if (svgRatio > 1) {
    // SVG es más ancho que alto
    opcion1X = medidaX;
    opcion1Y = (medidaX / svgRatio).toFixed(1);
    opcion2Y = medidaY;
    opcion2X = (medidaY * svgRatio).toFixed(1);
  } else {
    // SVG es más alto que ancho
    opcion1X = medidaX;
    opcion1Y = (medidaX / svgRatio).toFixed(1);
    opcion2Y = medidaY;
    opcion2X = (medidaY * svgRatio).toFixed(1);
  }
  
  return {
    normal: `${opcion1X}x${opcion1Y}`,
    invertido: `${opcion2X}x${opcion2Y}`,
    original: `${dimensionesSVG.width.toFixed(2)}x${dimensionesSVG.height.toFixed(2)}`
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
 * Función de placeholder para cálculos CNC
 * En el futuro se puede integrar con bronzeSealUtils
 */
export const calcularTiemposCNC = async (svgString, widthMm, heightMm) => {
  // Placeholder - en el futuro integrar con bronzeSealUtils
  try {
    // Estimación básica basada en área y complejidad
    const area = (widthMm * heightMm) / 100; // cm²
    const complejidad = svgString.length / 1000; // Factor de complejidad básico
    
    const baseTime = area * 2; // 2 segundos por cm²
    const complexityTime = complejidad * 10; // 10 segundos por unidad de complejidad
    
    const totalTime = baseTime + complexityTime;
    const roughingTime = totalTime * 0.3;
    const fineProfilingTime = totalTime * 0.7;
    
    return {
      totalTime: Math.max(totalTime, 30), // Mínimo 30 segundos
      roughingTime: Math.max(roughingTime, 10),
      fineProfilingTime: Math.max(fineProfilingTime, 20)
    };
  } catch (error) {
    console.error('Error calculando tiempos CNC:', error);
    return {
      totalTime: 60,
      roughingTime: 20,
      fineProfilingTime: 40
    };
  }
};