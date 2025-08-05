import { supabase } from '../supabaseClient';
import { estadosFabricacion, estadosVenta, estadosEnvio } from '../constants/estadosConstants';

// Función utilitaria para fecha final inclusiva
export const getInclusiveEndDateISOString = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  const endOfDay = new Date(year, month - 1, day);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.toISOString();
};

// Función para obtener URL firmada de archivos
export const getSignedUrl = async (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) {
    const idx = filePath.indexOf('/archivos-ventas/');
    if (idx !== -1) {
      filePath = filePath.substring(idx + '/archivos-ventas/'.length);
    }
  }
  const { data, error } = await supabase.storage
    .from('archivos-ventas')
    .createSignedUrl(filePath, 60);
  if (error) {
    alert('No se pudo generar el enlace de acceso al archivo');
    return null;
  }
  return data.signedUrl;
};

// Función para obtener estilo de estado
export const getEstadoStyle = (estado, tipo) => {
  let estados = estadosFabricacion;
  if (tipo === "venta") estados = estadosVenta;
  if (tipo === "envio") estados = estadosEnvio;

  const estadoObj = estados.find((e) => e.value === estado);
  return estadoObj || { color: "slate", glow: "shadow-slate-500/20", label: estado };
};

// Función para verificar si hay filtros activos
export const hayFiltrosActivos = (filters) => {
  if (!filters || typeof filters !== 'object') return false;
  return Object.values(filters).some((filtro) => 
    filtro !== "" && filtro !== null && (!Array.isArray(filtro) || filtro.length > 0)
  );
};