-- Tabla para almacenar fotos pendientes de verificación
CREATE TABLE IF NOT EXISTS fotos_pendientes (
  id SERIAL PRIMARY KEY,
  nombre_archivo TEXT NOT NULL,
  url_foto TEXT NOT NULL,
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'asignada', 'eliminada')),
  pedido_asignado INTEGER REFERENCES pedidos(id_pedido),
  fecha_asignacion TIMESTAMP WITH TIME ZONE,
  usuario_subio UUID REFERENCES auth.users(id),
  notas TEXT
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_fotos_pendientes_estado ON fotos_pendientes(estado);
CREATE INDEX IF NOT EXISTS idx_fotos_pendientes_fecha ON fotos_pendientes(fecha_subida);
CREATE INDEX IF NOT EXISTS idx_fotos_pendientes_pedido ON fotos_pendientes(pedido_asignado);

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE fotos_pendientes ENABLE ROW LEVEL SECURITY;

-- Permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden ver fotos pendientes" ON fotos_pendientes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir inserción a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden insertar fotos pendientes" ON fotos_pendientes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permitir actualización a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden actualizar fotos pendientes" ON fotos_pendientes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Permitir eliminación a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden eliminar fotos pendientes" ON fotos_pendientes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Función para obtener el conteo de fotos pendientes
CREATE OR REPLACE FUNCTION obtener_conteo_fotos_pendientes()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM fotos_pendientes WHERE estado = 'pendiente');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para asignar una foto pendiente a un pedido
CREATE OR REPLACE FUNCTION asignar_foto_pendiente(
  p_foto_id INTEGER,
  p_pedido_id INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE fotos_pendientes 
  SET 
    estado = 'asignada',
    pedido_asignado = p_pedido_id,
    fecha_asignacion = NOW()
  WHERE id = p_foto_id AND estado = 'pendiente';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 