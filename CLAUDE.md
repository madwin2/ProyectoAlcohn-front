# CLAUDE.md - Proyecto Alcohn

## Contexto del Proyecto
Proyecto de gestión para empresa Alcohn. Es una aplicación React + Vite que maneja pedidos, vectorización de archivos SVG, y cálculos de tiempos CNC. Actualmente todo el código está mezclado en archivos grandes JSX/CSS sin separación adecuada.

## Objetivos de Refactorización

### 1. Migración a Next.js
- Convertir de Vite React a Next.js 14
- Crear API routes para separar lógica backend
- Mantener funcionalidad existente
- Un solo comando `npm run dev` para todo

### 2. Separación de Componentes
- Dividir componentes grandes en componentes más pequeños y reutilizables
- Crear componentes: Table, TableRow, TableCell, Card, Modal, etc.
- Extraer lógica de UI a custom hooks
- Separar estilos en módulos CSS o Tailwind

### 3. Arquitectura Backend
- Extraer funciones de manipulación SVG a API routes
- Separar cálculos CNC a endpoints específicos
- Mover integración con Supabase al servidor
- API para vectorización automática

## Estructura Actual Problemática

```
frontend/src/components/Pedidos/
├── PedidoRow.jsx          # Mezclado: UI + lógica + API calls
├── PedidosTable.css       # Estilos globales sin modularización
├── PedidosTable.jsx       # Componente grande con muchas responsabilidades
├── Vectorizacion.jsx      # Frontend + Backend mezclado
└── otros archivos...
```

## Estructura Objetivo

```
proyecto/
├── pages/                 # Next.js pages
│   ├── api/              # API routes (backend)
│   │   ├── svg/
│   │   ├── pedidos/
│   │   └── vectorize.js
│   ├── pedidos/
│   └── vectorizacion.js
├── components/            # Componentes React modulares
│   ├── ui/               # Componentes base reutilizables
│   │   ├── Table/
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── Button/
│   ├── pedidos/          # Componentes específicos de pedidos
│   └── vectorizacion/    # Componentes específicos de vectorización
├── hooks/                # Custom hooks para lógica reutilizable
├── utils/                # Utilidades compartidas
└── styles/               # Estilos modulares
```

## Reglas de Desarrollo

### Componentes
- Un componente = una responsabilidad
- Props tipadas (TypeScript preferido)
- Componentes de máximo 150 líneas
- Extraer lógica compleja a custom hooks

### API Design
- RESTful endpoints
- Manejo de errores consistente
- Validación de inputs
- Response format estándar

### Estilos
- Tailwind CSS preferido
- CSS Modules para estilos específicos
- Evitar estilos inline
- Design system consistente

## Tecnologías

### Mantener
- React 18
- Supabase (base de datos y storage)
- Tailwind CSS

### Agregar
- Next.js 14
- TypeScript (progresivamente)
- Formidable (para uploads)

### Remover
- Vite (reemplazar con Next.js)
- Configuraciones manuales de servidor

## Prioridades

1. **Alta**: Migración a Next.js sin romper funcionalidad
2. **Alta**: Separar backend del frontend
3. **Media**: Modularizar componentes grandes
4. **Media**: Implementar TypeScript
5. **Baja**: Optimizaciones de performance

## Archivos Críticos a Refactorizar

### `/frontend/src/components/Pedidos/Vectorizacion.jsx`
- Contiene lógica frontend + backend mezclada
- Funciones de SVG manipulation deben ir a API routes
- Componente muy grande, dividir en sub-componentes

### `/frontend/src/components/Pedidos/PedidosTable.jsx`
- Separar en Table, TableRow, TableCell components
- Extraer lógica de estado a custom hooks
- Modularizar estilos

### Integración Supabase
- Mover cliente Supabase al servidor (API routes)
- Crear abstraction layer para DB operations
- Mantener real-time subscriptions en frontend

## Comandos Útiles

```bash
# Desarrollo
npm run dev          # Iniciar Next.js dev server

# Construcción
npm run build        # Build para producción
npm run start        # Servidor producción

# Análisis
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

## Notas Importantes

- **No romper funcionalidad existente** durante migración
- Mantener compatibilidad con Supabase storage URLs
- Preservar cálculos CNC existentes
- Testing manual después de cada cambio grande

## Pasos de Migración Sugeridos

1. Setup inicial Next.js
2. Migrar páginas principales
3. Crear API routes básicas
4. Refactorizar componentes uno por uno
5. Optimizar y limpiar código legacy