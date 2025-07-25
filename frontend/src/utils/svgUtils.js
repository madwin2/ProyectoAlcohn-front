/**
 * Utilidades para manejar SVG y cálculos de vectorización
 * VERSIÓN AJUSTADA para coincidir con tiempos reales de Aspire y calibración dinámica
 */

/**
 * Mide las dimensiones de un SVG desde una URL
 */
export const medirSVG = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.debug('SVG no disponible para medir:', response.status, response.statusText, url);
      return { width: 0, height: 0 };
    }
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    // Medición detallada con getBBox
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempSvg.style.visibility = 'hidden';
    document.body.appendChild(tempSvg);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    svgDoc.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon').forEach(el => {
      const clone = el.cloneNode(true);
      tempSvg.appendChild(clone);
      const bbox = clone.getBBox();
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.width);
      maxY = Math.max(maxY, bbox.y + bbox.height);
      tempSvg.removeChild(clone);
    });
    document.body.removeChild(tempSvg);
    const width = maxX - minX;
    const height = maxY - minY;
    if (!(width > 0 && height > 0)) {
      console.debug('Dimensiones SVG inválidas:', { width, height }, url);
      return { width: 0, height: 0 };
    }
    return { width, height };
  } catch (error) {
    console.error('Error midiendo SVG:', error);
    return { width: 0, height: 0 };
  }
};

/**
 * Redimensiona un SVG a las medidas especificadas (cm)
 */
export const dimensionarSVG = async (url, medidaDeseada) => {
  try {
    const [cmW, cmH] = medidaDeseada.split('x').map(parseFloat);
    const targetW = cmW * 10;
    const targetH = cmH * 10;
    const res = await fetch(url);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'image/svg+xml');
    const svg = doc.documentElement;
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempSvg.style.visibility = 'hidden'; document.body.appendChild(tempSvg);
    const grupo = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    doc.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon').forEach(el => {
      const copy = el.cloneNode(true);
      copy.removeAttribute('transform');
      grupo.appendChild(copy);
    });
    tempSvg.appendChild(grupo);
    const bbox = grupo.getBBox(); document.body.removeChild(tempSvg);
    const scaleX = targetW / bbox.width;
    const scaleY = targetH / bbox.height;
    const scale = Math.min(scaleX, scaleY);
    const tx = -bbox.x * scale;
    const ty = -bbox.y * scale;
    grupo.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(grupo);
    svg.setAttribute('width', `${bbox.width * scale}mm`);
    svg.setAttribute('height', `${bbox.height * scale}mm`);
    svg.setAttribute('viewBox', `0 0 ${bbox.width * scale} ${bbox.height * scale}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    return new XMLSerializer().serializeToString(doc);
  } catch (error) {
    console.error('Error dimensionando SVG:', error);
    return null;
  }
};

/**
 * Calcula opciones de escalado manteniendo proporciones
 */
export const calcularOpcionesEscalado = (dimSVG, medida) => {
  if (!dimSVG || !medida || !medida.includes('x')) return null;
  const wCm = dimSVG.width / 10, hCm = dimSVG.height / 10;
  const [mX, mY] = medida.split('x').map(s => parseFloat(s.replace(',', '.')));
  if (!(wCm > 0 && hCm > 0 && mX > 0 && mY > 0)) return null;
  const ratio = wCm / hCm;
  const opt1 = `${mX.toFixed(2)}x${(mX / ratio).toFixed(2)}`;
  const opt2 = `${(mY * ratio).toFixed(2)}x${mY.toFixed(2)}`;
  return { normal: opt1, invertido: opt2, original: `${wCm.toFixed(2)}x${hCm.toFixed(2)}` };
};

/**
 * Determina planchuela adecuada según la menor dimensión
 */
export const calcularTipoPlanchuela = (medidaReal) => {
  if (!medidaReal || !medidaReal.includes('x')) return null;
  const arr = [12, 19, 25, 38], [x, y] = medidaReal.split('x').map(parseFloat);
  const minmm = Math.min(x, y) * 10;
  return arr.find(v => minmm < v) || null;
};

/**
 * Obtiene la longitud máxima en cm
 */
export const calcularLargoPlanchuela = (medidaReal) => {
  if (!medidaReal || !medidaReal.includes('x')) return null;
  return Math.max(...medidaReal.split('x').map(parseFloat));
};

/**
 * CONFIGURACIÓN BASE basada en tiempos reales de Aspire
 */
const CONFIGURACION_AJUSTADA = {
  planeado: { nombre: 'Planeado 6mm', herramienta: 'cilindrica', diametro: 6, feedRate: 800, passDepth: 0.2, profundidadTotal: 0.5, stepover: 4.8, estrategia: 'raster', factorArea: 0.5, pasadas: 3, factorOverhead: 1.8 },
  cajeado6mm: { nombre: 'Cajeado 6mm', herramienta: 'cilindrica', diametro: 6, feedRate: 800, passDepth: 0.2, profundidadTotal: 2.5, stepover: 3.6, estrategia: 'offset', factorArea: 0.7, pasadas: 13, factorOverhead: 2.2 },
  cajeado1mm: { nombre: 'Cajeado V-bit 1mm', herramienta: 'vbit', diametroSuperior: 6, flatDiameter: 1.1, angulo: 15, feedRate: 1000, passDepth: 0.2, profundidadTotal: 1.2, stepover: 0.33, estrategia: 'offset', factorArea: 0.6, pasadas: 6, factorOverhead: 3.5 },
  perfilado05mm: { nombre: 'Perfilado V-bit 0.5mm', herramienta: 'vbit', diametroSuperior: 3, flatDiameter: 0.6, angulo: 15, feedRate: 800, passDepth: 0.1, profundidadTotal: 1.7, stepover: 0.18, estrategia: 'profile', factorPerimetro: 3.0, pasadas: 17, factorOverhead: 2.5 },
};

const estimarPerimetro = (svgString, area) => {
  const p = (svgString.match(/<path/g) || []).length * 2;
  const c = (svgString.match(/<circle/g) || []).length;
  const r = (svgString.match(/<rect/g) || []).length;
  const l = (svgString.match(/<line/g) || []).length;
  const comp = p + c + r + l;
  const base = 2 * Math.sqrt(Math.PI * area);
  return base * (1 + comp * 0.15);
};

const calcularTiempoRasterAjustado = (cfg, areaEf) => {
  const vol = areaEf * cfg.profundidadTotal;
  const t = vol / cfg.feedRate;
  return t + t * (cfg.factorOverhead - 1);
};

const calcularTiempoOffsetAjustado = (cfg, areaEf, per) => {
  const tLin = per * cfg.pasadas / cfg.feedRate;
  return tLin + tLin * (cfg.factorOverhead - 1);
};

const calcularTiempoProfileAjustado = (cfg, per) => {
  const long = per * cfg.factorPerimetro;
  const t = long * cfg.pasadas / cfg.feedRate;
  return t + t * (cfg.factorOverhead - 1);
};

/**
 * Calibra parámetros usando tus tiempos reales de Aspire
 */
export async function calibrarCNC(svgString, widthMm, heightMm, tReal) {
  const areaTot = widthMm * heightMm;
  const perTot = estimarPerimetro(svgString, areaTot);
  const b = CONFIGURACION_AJUSTADA;
  const refs = [
    calcularTiempoRasterAjustado(b.planeado, areaTot * b.planeado.factorArea),
    calcularTiempoOffsetAjustado(b.cajeado6mm, areaTot * b.cajeado6mm.factorArea, perTot),
    calcularTiempoOffsetAjustado(b.cajeado1mm, areaTot * b.cajeado1mm.factorArea, perTot),
    calcularTiempoProfileAjustado(b.perfilado05mm, perTot)
  ];
  const factors = [
    tReal.planeado / refs[0], tReal.cajeado6 / refs[1], tReal.cajeado1 / refs[2], tReal.perfilado / refs[3]
  ];
  return {
    planeado: { ...b.planeado, feedRate: b.planeado.feedRate * factors[0], stepover: b.planeado.stepover * factors[0] },
    cajeado6mm: { ...b.cajeado6mm, feedRate: b.cajeado6mm.feedRate * factors[1], stepover: b.cajeado6mm.stepover * factors[1] },
    cajeado1mm: { ...b.cajeado1mm, feedRate: b.cajeado1mm.feedRate * factors[2], stepover: b.cajeado1mm.stepover * factors[2] },
    perfilado05mm: { ...b.perfilado05mm, feedRate: b.perfilado05mm.feedRate * factors[3], stepover: b.perfilado05mm.stepover * factors[3] }
  };
}

/**
 * Cálculo de tiempos CNC con posibilidad de configuración calibrada
 */
export const calcularTiemposCNC = async (svgString, widthMm, heightMm, config = CONFIGURACION_AJUSTADA) => {
  try {
    const areaTot = widthMm * heightMm;
    const perTot = estimarPerimetro(svgString, areaTot);
    const ops = {};
    // planeado
    const c1 = config.planeado, a1 = areaTot * c1.factorArea, t1 = calcularTiempoRasterAjustado(c1, a1);
    ops.planeado = { nombre: c1.nombre, tiempo: t1 };
    // cajeado6mm
    const c6 = config.cajeado6mm, a6 = areaTot * c6.factorArea, t6 = calcularTiempoOffsetAjustado(c6, a6, perTot);
    ops.cajeado6mm = { nombre: c6.nombre, tiempo: t6 };
    // cajeado1mm
    const c1m = config.cajeado1mm, a1m = areaTot * c1m.factorArea, t1m = calcularTiempoOffsetAjustado(c1m, a1m, perTot);
    ops.cajeado1mm = { nombre: c1m.nombre, tiempo: t1m };
    // perfilado
    const cpr = config.perfilado05mm, tpr = calcularTiempoProfileAjustado(cpr, perTot);
    ops.perfilado05mm = { nombre: cpr.nombre, tiempo: tpr };
    const total = t1 + t6 + t1m + tpr;
    const rough = t1 + t6;
    const fine = t1m + tpr;
    return { totalTime: total, roughingTime: rough, fineProfilingTime: fine, detalles: { area: `${areaTot.toFixed(0)} mm²`, perimetro: `${perTot.toFixed(1)} mm`, operaciones: ops } };
  } catch (e) { console.error('Error CNC:', e); return calcularTiemposCNCEmpirico(widthMm, heightMm); }
};

/**
 * Método empírico como fallback
 */
export const calcularTiemposCNCEmpirico = (widthMm, heightMm) => {
  const area = widthMm * heightMm;
  const base = 15, factor = 0.01;
  let t = base + area * factor;
  if (t < 25) t = 25; if (t > 35) t = 35;
  return { totalTime: t, roughingTime: t * 0.43, fineProfilingTime: t * 0.57, detalles: { metodo: 'empírico', area: `${area.toFixed(0)} mm²` } };
};

/**
 * Despliega desglose en consola
 */
export const mostrarDesgloseTiempos = (res) => {
  console.group('Desglose CNC');
  console.log('Área:', res.detalles.area);
  console.log('Perímetro:', res.detalles.perimetro);
  Object.values(res.detalles.operaciones).forEach(o => console.log(`${o.nombre}: ${o.tiempo.toFixed(2)} min`));
  console.groupEnd();
};
