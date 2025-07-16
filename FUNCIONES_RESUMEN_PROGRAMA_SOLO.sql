-- ================================================
-- FUNCIONES PARA ACTUALIZAR RESUMEN DE PROGRAMA
-- ================================================

-- 0. FUNCIÓN ACTUALIZADA PARA OBTENER PROGRAMAS ACTIVOS (CON CAMPOS DE PLANCHUELAS)
-- ================================================================================

CREATE OR REPLACE FUNCTION get_programas_activos()
RETURNS TABLE (
  id_programa text,
  fecha_programa date,
  maquina text,
  programa_bloqueado boolean,
  nombre_archivo text,
  cantidad_sellos numeric,
  limite_tiempo integer,
  estado_programa character varying,
  verificado boolean,
  tiempo_usado integer,
  largo_usado_38 numeric,
  largo_usado_25 numeric,
  largo_usado_19 numeric,
  largo_usado_12 numeric,
  largo_usado_63 numeric,
  updated_at timestamp with time zone,
  cantidad_pedidos bigint,
  tiempo_total_pedidos numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id_programa,
    pr.fecha_programa,
    pr.maquina,
    pr.programa_bloqueado,
    pr.nombre_archivo,
    pr.cantidad_sellos,
    pr.limite_tiempo,
    pr.estado_programa,
    pr.verificado,
    pr.tiempo_usado,
    pr.largo_usado_38,
    pr.largo_usado_25,
    pr.largo_usado_19,
    pr.largo_usado_12,
    pr.largo_usado_63,
    pr.updated_at,
    COALESCE(COUNT(p.id_pedido), 0) AS cantidad_pedidos,
    COALESCE(SUM(p.tiempo_estimado), 0) AS tiempo_total_pedidos
  FROM programas pr
  LEFT JOIN pedidos p ON pr.id_programa = p.id_programa
  WHERE pr.estado_programa != 'Hecho'
  GROUP BY 
    pr.id_programa,
    pr.fecha_programa,
    pr.maquina,
    pr.programa_bloqueado,
    pr.nombre_archivo,
    pr.cantidad_sellos,
    pr.limite_tiempo,
    pr.estado_programa,
    pr.verificado,
    pr.tiempo_usado,
    pr.largo_usado_38,
    pr.largo_usado_25,
    pr.largo_usado_19,
    pr.largo_usado_12,
    pr.largo_usado_63,
    pr.updated_at
  ORDER BY pr.fecha_programa DESC, pr.id_programa DESC;
END;
$$;

-- 1. FUNCIÓN PRINCIPAL PARA ACTUALIZAR RESUMEN
-- ===============================================

CREATE OR REPLACE FUNCTION actualizar_resumen_programa(programa_id text)
RETURNS TABLE (
  id_programa text,
  tiempo_usado integer,
  largo_usado_38 numeric,
  largo_usado_25 numeric,
  largo_usado_19 numeric,
  largo_usado_12 numeric,
  largo_usado_63 numeric,
  success boolean,
  message text
)
LANGUAGE plpgsql
AS $$
DECLARE
  tiempo_total integer;
  largo_38 numeric := 0;
  largo_25 numeric := 0;
  largo_19 numeric := 0;
  largo_12 numeric := 0;
  largo_63 numeric := 0;
BEGIN
  -- Verificar que el programa existe
  IF NOT EXISTS(SELECT 1 FROM programas WHERE programas.id_programa = programa_id) THEN
    RETURN QUERY SELECT 
      programa_id::text,
      0::integer,
      0::numeric,
      0::numeric,
      0::numeric,
      0::numeric,
      0::numeric,
      false::boolean,
      'El programa especificado no existe'::text;
    RETURN;
  END IF;

  -- Calcular la suma del tiempo_estimado de todos los pedidos del programa
  SELECT COALESCE(SUM(p.tiempo_estimado), 0) INTO tiempo_total
  FROM pedidos p
  WHERE p.id_programa = programa_id;

  -- Calcular la suma de largo_planchuela por tipo de planchuela
  SELECT COALESCE(SUM(p.largo_planchuela), 0) INTO largo_38
  FROM pedidos p
  WHERE p.id_programa = programa_id AND p.tipo_planchuela = 38;

  SELECT COALESCE(SUM(p.largo_planchuela), 0) INTO largo_25
  FROM pedidos p
  WHERE p.id_programa = programa_id AND p.tipo_planchuela = 25;

  SELECT COALESCE(SUM(p.largo_planchuela), 0) INTO largo_19
  FROM pedidos p
  WHERE p.id_programa = programa_id AND p.tipo_planchuela = 19;

  SELECT COALESCE(SUM(p.largo_planchuela), 0) INTO largo_12
  FROM pedidos p
  WHERE p.id_programa = programa_id AND p.tipo_planchuela = 12;

  SELECT COALESCE(SUM(p.largo_planchuela), 0) INTO largo_63
  FROM pedidos p
  WHERE p.id_programa = programa_id AND p.tipo_planchuela = 63;

  -- Actualizar el programa con los valores calculados
  UPDATE programas 
  SET 
    tiempo_usado = tiempo_total,
    largo_usado_38 = largo_38,
    largo_usado_25 = largo_25,
    largo_usado_19 = largo_19,
    largo_usado_12 = largo_12,
    largo_usado_63 = largo_63,
    updated_at = NOW()
  WHERE programas.id_programa = programa_id;

  -- Retornar los valores actualizados
  RETURN QUERY SELECT 
    programa_id::text,
    tiempo_total::integer,
    largo_38::numeric,
    largo_25::numeric,
    largo_19::numeric,
    largo_12::numeric,
    largo_63::numeric,
    true::boolean,
    'Resumen del programa actualizado exitosamente'::text;
END;
$$;

-- 2. TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA
-- =========================================

CREATE OR REPLACE FUNCTION trigger_actualizar_resumen_programa()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se insertó un nuevo pedido con programa asignado
  IF TG_OP = 'INSERT' AND NEW.id_programa IS NOT NULL THEN
    PERFORM actualizar_resumen_programa(NEW.id_programa);
  END IF;
  
  -- Si se actualizó un pedido y cambió el programa
  IF TG_OP = 'UPDATE' THEN
    -- Si cambió el programa, actualizar ambos programas (el anterior y el nuevo)
    IF OLD.id_programa IS DISTINCT FROM NEW.id_programa THEN
      IF OLD.id_programa IS NOT NULL THEN
        PERFORM actualizar_resumen_programa(OLD.id_programa);
      END IF;
      IF NEW.id_programa IS NOT NULL THEN
        PERFORM actualizar_resumen_programa(NEW.id_programa);
      END IF;
    -- Si no cambió el programa pero sí cambió tiempo_estimado o tipo_planchuela o largo_planchuela
    ELSIF OLD.tiempo_estimado IS DISTINCT FROM NEW.tiempo_estimado OR 
          OLD.tipo_planchuela IS DISTINCT FROM NEW.tipo_planchuela OR 
          OLD.largo_planchuela IS DISTINCT FROM NEW.largo_planchuela THEN
      PERFORM actualizar_resumen_programa(NEW.id_programa);
    END IF;
  END IF;
  
  -- Si se eliminó un pedido
  IF TG_OP = 'DELETE' AND OLD.id_programa IS NOT NULL THEN
    PERFORM actualizar_resumen_programa(OLD.id_programa);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. CREAR EL TRIGGER
-- ===================

DROP TRIGGER IF EXISTS trigger_actualizar_resumen_programa ON pedidos;
CREATE TRIGGER trigger_actualizar_resumen_programa
  AFTER INSERT OR UPDATE OR DELETE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_actualizar_resumen_programa();

-- ================================================
-- INSTRUCCIONES DE USO
-- ================================================

/*
1. Copia y pega TODO este código en el SQL Editor de Supabase
2. Ejecuta el script
3. ¡Listo! Los programas se actualizarán automáticamente

Para usar desde JavaScript:
const { data } = await supabase.rpc('actualizar_resumen_programa', { 
  programa_id: 'ID_DEL_PROGRAMA' 
});
*/ 