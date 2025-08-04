-- FUNCIONES CORREGIDAS PARA ELIMINAR PROGRAMAS SIN AMBIGÜEDAD DE COLUMNAS
-- =====================================================================

-- 1. Función principal para eliminar programa y desasociar pedidos
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
  IF NOT EXISTS(SELECT 1 FROM programas WHERE programas.id_programa = eliminar_programa_y_desasociar_pedidos.programa_id) THEN
    RETURN QUERY SELECT 
      eliminar_programa_y_desasociar_pedidos.programa_id::text,
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
  WHERE pedidos.id_programa = eliminar_programa_y_desasociar_pedidos.programa_id;

  -- Contar cuántos pedidos fueron desasociados
  GET DIAGNOSTICS pedidos_count = ROW_COUNT;

  -- Eliminar el programa
  DELETE FROM programas WHERE programas.id_programa = eliminar_programa_y_desasociar_pedidos.programa_id;

  -- Retornar resultado
  RETURN QUERY SELECT 
    eliminar_programa_y_desasociar_pedidos.programa_id::text,
    pedidos_count::bigint,
    true::boolean,
    'Programa eliminado y pedidos desasociados exitosamente'::text;
END;
$$;

-- 2. Trigger para actualizar pedidos cuando cambia el estado del programa
CREATE OR REPLACE FUNCTION trigger_actualizar_pedidos_por_estado_programa()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el estado del programa cambió
  IF OLD.estado_programa IS DISTINCT FROM NEW.estado_programa THEN
    -- Actualizar el estado de fabricación de todos los pedidos asociados
    UPDATE pedidos 
    SET 
      estado_fabricacion = NEW.estado_programa::text,
      updated_at = NOW()
    WHERE pedidos.id_programa = NEW.id_programa;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_actualizar_pedidos_estado_programa ON programas;
CREATE TRIGGER trigger_actualizar_pedidos_estado_programa
  AFTER UPDATE ON programas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_actualizar_pedidos_por_estado_programa();

-- 3. Trigger para desasociar pedidos cuando se elimina un programa
CREATE OR REPLACE FUNCTION trigger_desasociar_pedidos_al_eliminar_programa()
RETURNS TRIGGER AS $$
BEGIN
  -- Desasociar todos los pedidos del programa que se está eliminando
  UPDATE pedidos 
  SET 
    id_programa = NULL,
    updated_at = NOW()
  WHERE pedidos.id_programa = OLD.id_programa;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_desasociar_pedidos_eliminar_programa ON programas;
CREATE TRIGGER trigger_desasociar_pedidos_eliminar_programa
  BEFORE DELETE ON programas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_desasociar_pedidos_al_eliminar_programa(); 