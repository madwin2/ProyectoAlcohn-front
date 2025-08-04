-- FUNCIÓN SIMPLIFICADA PARA ELIMINAR PROGRAMAS
-- =============================================

-- Primero, eliminar la función si existe
DROP FUNCTION IF EXISTS eliminar_programa_y_desasociar_pedidos(text);

-- Crear la función simplificada
CREATE OR REPLACE FUNCTION eliminar_programa_y_desasociar_pedidos(
  programa_id text
)
RETURNS TABLE (
  id_programa text,
  pedidos_desasociados bigint,
  success boolean,
  message text
)
LANGUAGE plpgsql
AS $$
DECLARE
  pedidos_count bigint;
BEGIN
  -- Verificar que el programa existe
  IF NOT EXISTS(SELECT 1 FROM programas WHERE id_programa = programa_id) THEN
    RETURN QUERY SELECT 
      programa_id::text,
      0::bigint,
      false::boolean,
      'El programa especificado no existe'::text;
    RETURN;
  END IF;

  -- Desasociar todos los pedidos del programa (establecer id_programa = NULL)
  UPDATE pedidos 
  SET 
    id_programa = NULL,
    updated_at = NOW()
  WHERE id_programa = programa_id;

  -- Contar cuántos pedidos fueron desasociados
  GET DIAGNOSTICS pedidos_count = ROW_COUNT;

  -- Eliminar el programa
  DELETE FROM programas WHERE id_programa = programa_id;

  -- Retornar resultado
  RETURN QUERY SELECT 
    programa_id::text,
    pedidos_count::bigint,
    true::boolean,
    'Programa eliminado y pedidos desasociados exitosamente'::text;
END;
$$;

-- Verificar que la función se creó correctamente
SELECT 
  proname as function_name,
  proargnames as parameter_names,
  proargtypes::regtype[] as parameter_types
FROM pg_proc 
WHERE proname = 'eliminar_programa_y_desasociar_pedidos'; 