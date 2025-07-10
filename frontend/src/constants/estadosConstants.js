// Arrays fijos para los selects de estado
export const ESTADOS_FABRICACION = [
  'Sin Hacer', 'Haciendo', 'Rehacer', 'Retocar', 'Prioridad', 'Verificar', 'Hecho'
];

export const ESTADOS_VENTA = [
  'Foto', 'Transferido', 'Ninguno'
];

export const ESTADOS_ENVIO = [
  'Sin enviar', 'Hacer Etiqueta', 'Etiqueta Lista', 'Despachado', 'Seguimiento Enviado'
];

export const initialFiltersState = {
  fecha_compra_gte: null,
  fecha_compra_lte: null,
  estado_fabricacion: [],
  estado_venta: [],
  estado_envio: [],
};

// Estados con estilos
export const estadosFabricacion = [
  { value: "Sin Hacer", label: "Sin Hacer", color: "slate", glow: "shadow-slate-500/20" },
  { value: "Haciendo", label: "Haciendo", color: "cyan", glow: "shadow-cyan-500/20" },
  { value: "Hecho", label: "Hecho", color: "emerald", glow: "shadow-emerald-500/20" },
  { value: "Rehacer", label: "Rehacer", color: "red", glow: "shadow-red-500/20" },
  { value: "Retocar", label: "Retocar", color: "amber", glow: "shadow-amber-500/20" },
  { value: "Prioridad", label: "Prioridad", color: "purple", glow: "shadow-purple-500/20" },
  { value: "Verificar", label: "Verificar", color: "teal", glow: "shadow-teal-500/20" },
];

export const estadosVenta = [
  { value: "Ninguno", label: "Ninguno", color: "slate", glow: "shadow-slate-500/20" },
  { value: "Foto", label: "Foto", color: "blue", glow: "shadow-blue-500/20" },
  { value: "Transferido", label: "Transferido", color: "green", glow: "shadow-green-500/20" },
];

export const estadosEnvio = [
  { value: "Sin enviar", label: "Sin Enviar", color: "slate", glow: "shadow-slate-500/20" },
  { value: "Hacer Etiqueta", label: "Hacer Etiqueta", color: "orange", glow: "shadow-orange-500/20" },
  { value: "Etiqueta Lista", label: "Etiqueta Lista", color: "violet", glow: "shadow-violet-500/20" },
  { value: "Despachado", label: "Despachado", color: "teal", glow: "shadow-teal-500/20" },
  { value: "Seguimiento Enviado", label: "Seguimiento Enviado", color: "green", glow: "shadow-green-500/20" },
];