# Solución para Error al Eliminar Programas

## Problema
Al intentar eliminar una tarjeta de programa, se produce el siguiente error:
```
column reference "id_programa" is ambiguous
```

## Causa
El error se debe a ambigüedad en las referencias a la columna `id_programa` en las funciones SQL. PostgreSQL no puede determinar si `id_programa` se refiere al parámetro de la función o a la columna de la tabla.

## Solución

### 1. Ejecutar las funciones SQL corregidas

Ve al panel de administración de Supabase y ejecuta el siguiente SQL en el SQL Editor:

```sql
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
```

### 2. Cambios realizados en el código

Los siguientes archivos han sido actualizados:

1. **`funciones_rpc_supabase.txt`** - Funciones SQL corregidas
2. **`frontend/src/hooks/useProgramas.js`** - Parámetro corregido de `p_programa_id` a `programa_id`

### 3. Verificación

Después de aplicar los cambios:

1. Ve a la página de Programas
2. Intenta eliminar una tarjeta de programa
3. Verifica que no aparezca el error de ambigüedad de columnas
4. Confirma que el programa se elimina correctamente y los pedidos se desasocian

## Cambios específicos realizados

### En las funciones SQL:
- Agregado prefijo de tabla (`programas.id_programa`, `pedidos.id_programa`)
- Agregado prefijo de función (`eliminar_programa_y_desasociar_pedidos.programa_id`)
- Corregidas todas las referencias ambiguas a columnas

### En el código JavaScript:
- Cambiado el nombre del parámetro de `p_programa_id` a `programa_id` para que coincida con la función SQL

## Notas adicionales

- Las funciones ahora son más explícitas y evitan ambigüedades
- Se mantiene la funcionalidad de desasociar pedidos automáticamente
- Se preserva la compatibilidad con el resto del sistema 