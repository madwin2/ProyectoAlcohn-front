# Sistema de Verificación

## Descripción General

El sistema de verificación permite a los usuarios cargar fotos de sellos terminados y compararlas automáticamente con los diseños originales usando inteligencia artificial (CLIP). Esto ayuda a verificar que los sellos fabricados coincidan con los diseños solicitados.

## Características Principales

### 1. **Detección Automática de Pedidos**
- Filtra automáticamente pedidos con estado 'Verificar'
- Muestra información completa del pedido y cliente
- Interfaz tipo tarjeta para fácil visualización

### 2. **Carga de Fotos**
- Drag & drop para subir múltiples fotos
- Validación de tipos de archivo (solo imágenes)
- Límite de tamaño de 10MB por foto
- Preview inmediato de fotos subidas

### 3. **Verificación Automática con IA**
- Usa tecnología CLIP para comparar fotos con diseños
- Compara contra archivo_base y archivo_vector
- Genera puntuación de similitud (0-100%)
- Identificación automática del mejor match

### 4. **Interfaz Intuitiva**
- Diseño consistente con el resto de la aplicación
- Indicadores visuales de estado
- Colores diferenciados por nivel de similitud
- Feedback inmediato al usuario

## Componentes del Sistema

### 1. **VerificacionPage.jsx**
```javascript
// Página principal que muestra la lista de pedidos para verificar
// Funciones principales:
- getPedidosVerificar() // Obtiene pedidos con estado 'Verificar'
- handlePhotosUploaded() // Procesa fotos subidas
- handleMarcarCompleto() // Marca pedido como completado
```

### 2. **VerificacionCard.jsx**
```javascript
// Tarjeta individual para cada pedido
// Características:
- Información del pedido y cliente
- Estado de archivos disponibles
- Botones de acción (subir fotos, completar)
- Resultado de verificación automática
```

### 3. **PhotoUploadModal.jsx**
```javascript
// Modal para subir y procesar fotos
// Funcionalidades:
- Drag & drop de archivos
- Preview de fotos
- Procesamiento automático con CLIP
- Gestión de errores
```

### 4. **useVerificacion.js**
```javascript
// Hook personalizado para lógica de verificación
// Métodos principales:
- getPedidosVerificar()
- uploadPhotos()
- processPhotoVerification()
- completarVerificacion()
```

### 5. **clipService.js**
```javascript
// Servicio para integración con API CLIP
// Funciones:
- processMatching() // Procesa matching con IA
- checkClipApiHealth() // Verifica disponibilidad de API
- convertSvgToPng() // Convierte SVG a PNG para procesamiento
```

## Flujo de Trabajo

### 1. **Carga Inicial**
```
Usuario → VerificacionPage → getPedidosVerificar() → Lista de pedidos
```

### 2. **Subida de Fotos**
```
Usuario → Click "Subir fotos" → PhotoUploadModal → Drag & drop → Upload a Supabase
```

### 3. **Verificación Automática**
```
Fotos subidas → CLIP API → Comparación con diseños → Resultado de similitud
```

### 4. **Finalización**
```
Usuario → "Completar" → Estado cambia a 'Hecho' → Actualización en base de datos
```

## Integración con CLIP

### API Endpoint
```
POST http://localhost:8000/predict
```

### Formato de Request
```javascript
FormData {
  svgs: [File, File, ...],    // Archivos de diseño (SVG)
  fotos: [File, File, ...]    // Fotos a verificar
}
```

### Formato de Response
```javascript
[
  {
    "foto": "imagen1.jpg",
    "svg_match": "diseño.svg",
    "score": 0.85
  },
  {
    "foto": "imagen2.jpg",
    "error": "No se encontró coincidencia"
  }
]
```

## Configuración

### Variables de Entorno
```javascript
// clipService.js
const CLIP_API_URL = 'http://localhost:8000';
```

### Dependencias
- React 18+
- Supabase (storage y database)
- Lucide React (iconos)
- CLIP API (servicio externo)

## Uso

### 1. **Iniciar API CLIP**
```bash
cd "C:\Users\julia\Documents\Alcohn Ai Nuevo\ProyectoAlcohn\Detector de Sellos"
uvicorn api:app --reload
```

### 2. **Navegar a Verificación**
- Ir a `/verificacion` en la aplicación
- Los pedidos con estado 'Verificar' aparecerán automáticamente

### 3. **Verificar Sello**
- Click en "Subir fotos" en la tarjeta del pedido
- Arrastrar o seleccionar fotos del sello terminado
- El sistema procesará automáticamente las fotos
- Revisar resultados de similitud
- Click en "Completar" para finalizar

## Manejo de Errores

### 1. **API CLIP No Disponible**
- Se muestra mensaje informativo
- Verificación manual sigue siendo posible
- No bloquea el flujo de trabajo

### 2. **Archivos Inválidos**
- Validación de tipo de archivo
- Límite de tamaño
- Mensajes de error claros

### 3. **Errores de Upload**
- Retry automático
- Mensajes de estado
- Limpieza de archivos temporales

## Mejoras Futuras

### 1. **Historial de Verificaciones**
- Tabla de log de verificaciones
- Historial de cambios de estado
- Métricas de precisión

### 2. **Configuración Avanzada**
- Umbral de similitud configurable
- Tipos de archivo personalizables
- Múltiples APIs de verificación

### 3. **Reportes**
- Estadísticas de verificación
- Tiempo promedio de verificación
- Tasa de coincidencias

## Arquitectura Técnica

### Base de Datos
```sql
-- Tabla principal (existente)
pedidos {
  id_pedido: integer,
  estado_fabricacion: string,
  archivo_base: string,
  archivo_vector: string,
  foto_sello: string,
  ...
}

-- Tabla de verificaciones (futura)
verificaciones {
  id: integer,
  pedido_id: integer,
  fotos: json,
  resultados: json,
  timestamp: timestamp
}
```

### Storage
```
supabase/storage/archivos-ventas/
├── verificacion_123_1641234567.jpg
├── verificacion_123_1641234568.jpg
└── ...
```

### Servicios
```
Frontend (React) ←→ Supabase ←→ CLIP API
                 ↓
            File Storage
```

## Consideraciones de Seguridad

1. **Validación de Archivos**: Solo imágenes permitidas
2. **Límites de Tamaño**: 10MB por archivo
3. **Autenticación**: Usuarios autenticados únicamente
4. **Sanitización**: Nombres de archivo seguros
5. **Rate Limiting**: Control de subida de archivos

## Mantenimiento

### Limpieza de Archivos
- Archivos temporales se limpian automáticamente
- Considerar política de retención para fotos antiguas

### Monitoreo
- Logs de errores en consola
- Métricas de uso de storage
- Disponibilidad de API CLIP

---

**Nota**: Este sistema está diseñado para ser extensible y mantenible, siguiendo los patrones establecidos en el proyecto Alcohn.