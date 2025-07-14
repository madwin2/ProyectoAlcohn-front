# Documentación de la Base de Datos - Proyecto Sellos

Este documento detalla la estructura, relaciones y lógica de la base de datos del proyecto, alojada en Supabase.

## Resumen General

El sistema se basa en tres tablas principales que interactúan entre sí:
1.  `clientes`: Almacena la información de los clientes.
2.  `programas`: Agrupa los pedidos en lotes de fabricación.
3.  `pedidos`: Contiene todos los detalles de cada pedido individual.

El esquema está diseñado para ser robusto y automatizado, utilizando funciones y triggers de PostgreSQL para mantener la integridad y consistencia de los datos.

---

## 1. Esquema de Tablas

### Tabla `clientes`
Almacena la información de contacto y envío de cada cliente.

| Columna | Tipo de Dato | Descripción |
| :--- | :--- | :--- |
| **id_cliente** | `SERIAL` | **Clave Primaria**. Identificador numérico único y autoincremental. |
| nombre | `TEXT` | Nombre(s) del cliente. No puede ser nulo. |
| apellido | `TEXT` | Apellido(s) del cliente. No puede ser nulo. |
| direccion | `TEXT` | Dirección de envío. |
| codigo_postal | `TEXT` | Código postal. |
| localidad | `TEXT` | Localidad de envío. |
| telefono | `TEXT` | Número de contacto. |
| mail | `TEXT` | Correo electrónico. |
| dni | `TEXT` | Documento Nacional de Identidad. |
| created_at | `TIMESTAMPTZ` | Fecha y hora de creación del registro (automático). |
| updated_at | `TIMESTAMPTZ` | Fecha y hora de la última modificación (automático). |

### Tabla `programas`
Representa un lote o programa de fabricación que contiene múltiples pedidos.

| Columna | Tipo de Dato | Descripción |
| :--- | :--- | :--- |
| **id_programa**| `TEXT` | **Clave Primaria**. Identificador único del programa (ej: "2024-05-21-G-01"). |
| fecha | `DATE` | Fecha de creación del programa. |
| maquina | `TEXT` | Máquina a utilizar ('C' para Chica, 'G' para Grande). |
| nombre | `TEXT` | Nombre descriptivo del programa. |
| **numero_pedidos**| `NUMERIC` | **(Automático)** Cantidad de pedidos asignados a este programa. |
| **tiempo_programa**| `INTEGER` | **(Automático)** Suma de los `tiempo_estimado` de todos sus pedidos. |
| estado_programa| `VARCHAR` | Estado actual del programa ('Sin Hacer', 'Haciendo', 'Hecho', etc.). |
| ... | ... | Otras columnas de gestión como `verificado`, `consumido`, `usado_38`, etc. |
| updated_at | `TIMESTAMPTZ`| Fecha y hora de la última modificación (automático). |

### Tabla `pedidos`
Es la tabla central, conteniendo toda la información detallada de cada trabajo.

| Columna | Tipo de Dato | Descripción |
| :--- | :--- | :--- |
| **id_pedido** | `SERIAL` | **Clave Primaria**. Identificador numérico único del pedido. |
| **id_cliente** | `INTEGER` | **Clave Foránea**. Vincula con la tabla `clientes`. |
| **id_programa**| `TEXT` | **Clave Foránea**. Vincula con la tabla `programas`. |
| valor_sello | `NUMERIC` | Costo del sello. |
| senia | `NUMERIC` | Monto de la seña entregada por el cliente. |
| valor_envio | `NUMERIC` | Costo del envío (restringido a 4000 o 7000). |
| **restante** | `NUMERIC` | **(Calculado Automáticamente)**: `(valor_sello + valor_envio) - senia`. |
| estado_de_fabricacion|`TEXT` | Estado del proceso de fabricación ('Sin Hacer', 'Haciendo', 'Hecho', etc.). |
| **fecha_fabricacion**| `DATE` | **(Automático)** Se completa con la fecha actual cuando `estado_de_fabricacion` pasa a 'Hecho'. |
| ... | ... | Todas las demás columnas con detalles del pedido. |
| updated_at | `TIMESTAMPTZ` | Fecha y hora de la última modificación (automático). |

---

## 2. Automatizaciones (Funciones y Triggers)

Estas son las piezas de "magia" que hacen que la base de datos trabaje por sí sola.

### a. `fun_actualizar_timestamp()`
- **Propósito**: Mantener actualizada la columna `updated_at`.
- **Cómo funciona**: Antes de que se actualice cualquier fila en `clientes`, `programas` o `pedidos`, este trigger intercepta la operación y actualiza el campo `updated_at` con la fecha y hora actuales.

### b. `fun_establecer_fecha_fabricacion()`
- **Propósito**: Registrar cuándo se terminó un pedido.
- **Cómo funciona**: Antes de insertar o actualizar un registro en `pedidos`, el trigger verifica si el `estado_de_fabricacion` es `'Hecho'`. Si lo es, completa el campo `fecha_fabricacion` con la fecha del día.

### c. `fun_actualizar_resumen_programa()`
- **Propósito**: Mantener los totales de la tabla `programas` siempre sincronizados.
- **Cómo funciona**: Después de cualquier cambio en la tabla `pedidos` (insertar, borrar o actualizar), este trigger se dispara y recalcula los campos `numero_pedidos` y `tiempo_programa` en el programa correspondiente.

---

## 3. Seguridad

- **Row Level Security (RLS)**: Todas las tablas (`clientes`, `programas`, `pedidos`) tienen RLS activado.
- **Políticas de Acceso**: Actualmente, se ha configurado una política básica que permite a cualquier **usuario autenticado** realizar todas las operaciones (leer, crear, modificar, borrar) en todas las tablas. Esto es ideal para el desarrollo y se puede ajustar en el futuro para dar permisos más específicos. 

