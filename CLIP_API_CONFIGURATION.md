# Configuración de CLIP API - Sistema de Verificación

## Descripción

Este documento explica cómo configurar el sistema de verificación para habilitar o deshabilitar la CLIP API según sea necesario.

## Configuración Actual

### CLIP API Deshabilitada (Configuración por Defecto)

Actualmente, la CLIP API está **deshabilitada** por defecto. Esto significa que:

1. **Las fotos se guardan directamente en "Fotos Pendientes"**
2. **No se procesan automáticamente con IA**
3. **Se requiere asignación manual de fotos a pedidos**
4. **El estado cambia automáticamente a "Hecho" cuando se asigna una foto**

### Ventajas de CLIP API Deshabilitada

- ✅ **Mejor rendimiento**: No hay llamadas a API externa que traben la aplicación
- ✅ **Más control**: Asignación manual más precisa
- ✅ **Menos errores**: Sin falsos positivos de la IA
- ✅ **Flujo más simple**: Menos pasos para el usuario

## Cómo Habilitar/Deshabilitar CLIP API

### 1. Editar Archivo de Configuración

Abre el archivo: `frontend/src/config/verificacionConfig.js`

### 2. Cambiar Configuración

```javascript
export const VERIFICACION_CONFIG = {
  // CLIP API habilitada/deshabilitada
  CLIP_API_ENABLED: false, // Cambiar a true para habilitar
  
  // Mensaje cuando CLIP API está deshabilitada
  CLIP_DISABLED_MESSAGE: 'CLIP API temporalmente deshabilitada: Las fotos se guardarán en pendientes para asignación manual.',
  
  // Cambiar automáticamente estado a 'Hecho' cuando se asigna foto
  AUTO_CHANGE_STATUS: true,
  
  // Mostrar notificación de CLIP API deshabilitada
  SHOW_DISABLED_NOTICE: true
};
```

### 3. Opciones de Configuración

| Opción | Descripción | Valores |
|--------|-------------|---------|
| `CLIP_API_ENABLED` | Habilita/deshabilita CLIP API | `true` / `false` |
| `CLIP_DISABLED_MESSAGE` | Mensaje mostrado cuando CLIP API está deshabilitada | `string` |
| `AUTO_CHANGE_STATUS` | Cambia automáticamente estado a 'Hecho' al asignar foto | `true` / `false` |
| `SHOW_DISABLED_NOTICE` | Muestra notificación cuando CLIP API está deshabilitada | `true` / `false` |

## Flujos de Trabajo

### Con CLIP API Deshabilitada (Actual)

1. **Usuario sube fotos** → Fotos van directamente a "Fotos Pendientes"
2. **Usuario abre "Fotos Pendientes"** → Ve todas las fotos sin asignar
3. **Usuario asigna foto manualmente** → Selecciona pedido y asigna foto
4. **Sistema cambia estado** → Automáticamente cambia a "Hecho"

### Con CLIP API Habilitada

1. **Usuario sube fotos** → Sistema procesa con CLIP API
2. **Sistema sugiere coincidencias** → Muestra resultados de similitud
3. **Usuario confirma o rechaza** → Acepta sugerencia o va a pendientes
4. **Sistema actualiza pedido** → Asigna foto y cambia estado

## Requisitos para CLIP API

Si decides habilitar CLIP API, asegúrate de que:

1. **API CLIP esté ejecutándose**:
   ```bash
   cd "C:\Users\julia\Documents\Alcohn Ai Nuevo\ProyectoAlcohn\Detector de Sellos"
   uvicorn api:app --reload
   ```

2. **API esté accesible** en `http://localhost:8000`

3. **Archivos de diseño existan** (archivo_base o archivo_vector)

## Troubleshooting

### CLIP API No Responde

Si CLIP API está habilitada pero no responde:

1. Verifica que el servidor esté ejecutándose
2. Revisa los logs del servidor CLIP
3. Temporalmente deshabilita CLIP API cambiando `CLIP_API_ENABLED: false`

### Fotos No Se Guardan

Si las fotos no se guardan en pendientes:

1. Verifica la conexión a Supabase
2. Revisa los permisos de la tabla `fotos_pendientes`
3. Verifica que el usuario esté autenticado

### Estado No Cambia Automáticamente

Si el estado no cambia a "Hecho":

1. Verifica que `AUTO_CHANGE_STATUS: true`
2. Revisa los logs de la función `editar_pedido`
3. Verifica permisos en la base de datos

## Revertir Cambios

Para volver al comportamiento original con CLIP API:

1. Cambia `CLIP_API_ENABLED: true` en `verificacionConfig.js`
2. Asegúrate de que CLIP API esté ejecutándose
3. Reinicia la aplicación frontend

## Notas Importantes

- **Los cambios son inmediatos**: No requiere reiniciar el servidor
- **Fácil de revertir**: Solo cambiar una variable de configuración
- **Sin pérdida de datos**: Las fotos se mantienen en storage
- **Compatible**: Funciona con la estructura existente de la base de datos

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0
