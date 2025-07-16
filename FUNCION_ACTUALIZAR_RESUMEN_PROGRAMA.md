# Función de Actualización de Resumen de Programa

## Descripción

Esta función permite calcular y actualizar automáticamente los campos de resumen de un programa basándose en los pedidos asignados a él.

## Campos que se actualizan

### `tiempo_usado`
- **Descripción**: Suma total del tiempo estimado de todos los pedidos asignados al programa
- **Fuente**: Campo `tiempo_estimado` de la tabla `pedidos`
- **Tipo**: `integer` (en minutos)

### `largo_usado_XX`
- **Descripción**: Suma del largo de planchuela utilizado por tipo de planchuela
- **Fuente**: Campo `largo_planchuela` de la tabla `pedidos`, filtrado por `tipo_planchuela`
- **Tipos disponibles**:
  - `largo_usado_63`: Para pedidos con `tipo_planchuela = 63`
  - `largo_usado_38`: Para pedidos con `tipo_planchuela = 38`
  - `largo_usado_25`: Para pedidos con `tipo_planchuela = 25`
  - `largo_usado_19`: Para pedidos con `tipo_planchuela = 19`
  - `largo_usado_12`: Para pedidos con `tipo_planchuela = 12`
- **Tipo**: `numeric` (en centímetros)

## Funciones disponibles

### 1. `actualizar_resumen_programa(programa_id)`

**Descripción**: Función RPC que actualiza manualmente el resumen de un programa específico.

**Parámetros**:
- `programa_id` (text): ID del programa a actualizar

**Retorna**:
```sql
TABLE (
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
```

**Ejemplo de uso**:
```javascript
const { data, error } = await supabase.rpc('actualizar_resumen_programa', {
  programa_id: 'PROG123'
});

if (data && data[0] && data[0].success) {
  console.log('Resumen actualizado:', data[0]);
}
```

### 2. Trigger automático

**Descripción**: Se ejecuta automáticamente cuando se modifican los pedidos para mantener los resúmenes actualizados.

**Eventos que disparan el trigger**:
- **INSERT**: Cuando se asigna un pedido a un programa
- **UPDATE**: Cuando se modifica:
  - El programa asignado a un pedido
  - El `tiempo_estimado` de un pedido
  - El `tipo_planchuela` de un pedido
  - El `largo_planchuela` de un pedido
- **DELETE**: Cuando se elimina un pedido de un programa

## Uso en el Frontend

### Hook personalizado

```javascript
import { useProgramas } from '../hooks/useProgramas';

const { actualizarResumenPrograma } = useProgramas();

// Actualizar resumen manualmente
const handleActualizarResumen = async (programaId) => {
  try {
    await actualizarResumenPrograma(programaId);
    console.log('Resumen actualizado exitosamente');
  } catch (error) {
    console.error('Error actualizando resumen:', error);
  }
};
```

### Componente de ejemplo

```javascript
// En ProgramaCard.jsx
<button onClick={() => handleActualizarResumen(programa.id_programa)}>
  <RefreshCw style={{ width: '14px', height: '14px' }} />
  Actualizar Resumen
</button>
```

## Visualización de datos

Los valores de `largo_usado_XX` se muestran en el componente `ProgramaCard` cuando son mayores que 0:

```javascript
{/* Información de planchuelas utilizadas */}
{(programa.largo_usado_38 > 0 || programa.largo_usado_25 > 0 || 
  programa.largo_usado_19 > 0 || programa.largo_usado_12 > 0 || 
  programa.largo_usado_63 > 0) && (
  <div>
    <div>Planchuelas Utilizadas</div>
    {/* Muestra cada tipo de planchuela con su largo total */}
  </div>
)}
```

## Instalación

Para instalar estas funciones en tu base de datos Supabase:

1. Copia el contenido de `funciones_rpc_supabase.txt`
2. Ejecuta las funciones en el SQL Editor de Supabase
3. Las funciones y triggers se crearán automáticamente

## Notas importantes

- **Automático**: Los resúmenes se actualizan automáticamente cuando se modifican los pedidos
- **Manual**: Puedes actualizar manualmente usando la función RPC
- **Performance**: El trigger se ejecuta solo cuando es necesario
- **Consistencia**: Los datos siempre están sincronizados entre pedidos y programas

## Troubleshooting

### Si los valores no se actualizan automáticamente:
1. Verifica que el trigger esté creado correctamente
2. Asegúrate de que los pedidos tengan `id_programa` asignado
3. Verifica que los campos `tiempo_estimado`, `tipo_planchuela` y `largo_planchuela` estén completos

### Si la función manual falla:
1. Verifica que el `programa_id` existe
2. Revisa los logs de Supabase para errores específicos
3. Asegúrate de tener permisos para ejecutar funciones RPC 