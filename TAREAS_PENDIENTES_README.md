# Sistema de Tareas Pendientes

## Descripción

El sistema de tareas pendientes permite a los usuarios crear, gestionar y visualizar tareas asociadas a pedidos específicos. Las tareas aparecen como círculos animados dentro de cada fila de pedido y pueden ser arrastradas con efectos de física (gravedad, rebote, fricción).

## Características

### 🎯 Funcionalidades Principales

- **Crear tareas**: Botón secundario en cada fila de pedido para agregar tareas pendientes
- **Física realista**: Las tareas tienen efectos de gravedad, rebote y fricción
- **Arrastre interactivo**: Se pueden arrastrar las tareas dentro de la fila
- **Tooltip informativo**: Al hacer hover se muestra información de la tarea
- **Acciones rápidas**: Completar o eliminar tareas desde el tooltip
- **Contador en sidebar**: Muestra el número total de tareas pendientes del usuario

### 🎨 Diseño y UX

- **Estética consistente**: Mantiene el diseño oscuro de la aplicación
- **Animaciones suaves**: Transiciones y efectos visuales fluidos
- **Responsive**: Funciona en diferentes tamaños de pantalla
- **Accesibilidad**: Soporte para navegación por teclado

## Estructura de Base de Datos

### Tabla `tareas_pendientes`

```sql
CREATE TABLE public.tareas_pendientes (
  id_tarea integer NOT NULL DEFAULT nextval('tareas_pendientes_id_tarea_seq'::regclass),
  id_pedido integer NOT NULL,
  id_usuario uuid NOT NULL,
  descripcion text NOT NULL,
  posicion_x numeric DEFAULT 0,
  posicion_y numeric DEFAULT 0,
  completada boolean DEFAULT false,
  creado_en timestamp with time zone DEFAULT now(),
  actualizado_en timestamp with time zone DEFAULT now(),
  CONSTRAINT tareas_pendientes_pkey PRIMARY KEY (id_tarea),
  CONSTRAINT tareas_pendientes_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedidos(id_pedido) ON DELETE CASCADE,
  CONSTRAINT tareas_pendientes_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

### Funciones RPC

1. **`crear_tarea_pendiente`**: Crear nueva tarea
2. **`obtener_tareas_pedido`**: Obtener tareas de un pedido específico
3. **`obtener_tareas_usuario`**: Obtener todas las tareas del usuario
4. **`actualizar_posicion_tarea`**: Actualizar posición de una tarea
5. **`completar_tarea`**: Marcar tarea como completada
6. **`eliminar_tarea`**: Eliminar una tarea
7. **`contar_tareas_pendientes_usuario`**: Contar tareas pendientes del usuario

## Componentes React

### Hook `useTareasPendientes`

```javascript
const {
  tareas,
  loading,
  error,
  totalTareasPendientes,
  crearTarea,
  actualizarPosicionTarea,
  completarTarea,
  eliminarTarea
} = useTareasPendientes();
```

### Componente `TareaPendiente`

- **Física realista**: Gravedad, rebote, fricción
- **Arrastre interactivo**: Se puede arrastrar dentro de la fila
- **Tooltip informativo**: Muestra descripción y acciones
- **Acciones rápidas**: Completar/eliminar desde el tooltip

### Componente `AddTareaModal`

- **Formulario simple**: Solo requiere descripción
- **Información del pedido**: Muestra contexto del pedido
- **Validación**: Descripción obligatoria
- **Feedback visual**: Loading states y errores

## Cómo Usar

### 1. Crear una Tarea

1. Hacer hover sobre una fila de pedido
2. Hacer clic en el botón "+" que aparece
3. Completar la descripción de la tarea
4. Hacer clic en "Crear Tarea"

### 2. Interactuar con las Tareas

- **Arrastrar**: Hacer clic y arrastrar la tarea por la fila
- **Ver información**: Hacer hover sobre la tarea
- **Completar**: Hacer clic en el botón ✓ en el tooltip
- **Eliminar**: Hacer clic en el botón 🗑️ en el tooltip

### 3. Ver Contador

- El número de tareas pendientes aparece en el sidebar
- Solo se muestran las tareas del usuario logueado
- El badge tiene una animación de pulso

## Configuración de Física

```javascript
const GRAVITY = 0.5;        // Fuerza de gravedad
const FRICTION = 0.98;      // Fricción del aire
const BOUNCE = 0.7;         // Factor de rebote
const MAX_VELOCITY = 10;    // Velocidad máxima
```

## Seguridad

- **RLS habilitado**: Los usuarios solo ven sus propias tareas
- **Validación**: Verificación de existencia de pedido y usuario
- **Cascada**: Las tareas se eliminan si se elimina el pedido

## Archivos Principales

- `tareas_pendientes_sql.txt`: Estructura de BD y funciones RPC
- `useTareasPendientes.js`: Hook para gestión de tareas
- `TareaPendiente.jsx`: Componente de tarea con física
- `AddTareaModal.jsx`: Modal para crear tareas
- `PedidoRow.jsx`: Integración en filas de pedidos
- `Sidebar.jsx`: Contador de tareas pendientes

## Instalación

1. Ejecutar el SQL de `tareas_pendientes_sql.txt` en Supabase
2. Los componentes ya están integrados en la aplicación
3. No requiere configuración adicional

## Notas Técnicas

- **Performance**: Las animaciones usan `requestAnimationFrame`
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Accesibilidad**: Soporte para navegación por teclado
- **Estado**: Las posiciones se guardan en tiempo real
- **Sincronización**: Cambios reflejados inmediatamente en la UI 