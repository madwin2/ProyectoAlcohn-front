# Documentación del Frontend - Proyecto Sellos

Este documento explica la función de cada archivo y carpeta importante dentro del directorio `frontend`. Esta es la parte visual de tu aplicación, la que los usuarios verán y con la que interactuarán en su navegador.

Fue creada con **Vite**, una herramienta moderna y súper rápida para construir interfaces web.

---

## Estructura de Carpetas y Archivos

### Archivos Principales (en `frontend/`)

-   **`package.json`**: Es el "documento de identidad" de tu proyecto. Contiene información clave como el nombre del proyecto, la lista de dependencias (librerías que necesita para funcionar) y los **scripts** (comandos que puedes ejecutar, como `npm run dev`).

-   **`package-lock.json`**: Este archivo es un registro exacto de las versiones de cada una de las dependencias que se instalaron. Asegura que, si instalas el proyecto en otra máquina, todo funcione exactamente igual. No se modifica manualmente.

-   **`vite.config.js`**: El archivo de configuración de Vite. Aquí puedes ajustar cómo se comporta la herramienta de construcción, añadir plugins, etc.

-   **`index.html`**: Es la única página HTML real de tu proyecto. Actúa como el "cascarón" o el punto de entrada. Tu aplicación de JavaScript se inyectará automáticamente dentro de esta página cuando la ejecutes.

-   **`.gitignore`**: Le dice a Git (el sistema de control de versiones) qué archivos o carpetas debe ignorar. Por ejemplo, siempre ignora `node_modules`.

### Carpetas Importantes

-   **`node_modules/`**: Esta carpeta se genera automáticamente cuando ejecutas `npm install`. Contiene todas las librerías y paquetes de los que depende tu proyecto. **Nunca debes modificarla directamente**. Si quieres añadir o quitar una librería, lo haces con comandos de `npm`.

-   **`public/`**: Contiene archivos estáticos que no necesitan ser procesados por Vite. Por ejemplo, el ícono que ves en la pestaña del navegador (`favicon.ico`) o imágenes que quieres que sean accesibles directamente por una URL.

-   **`src/`** (Source o Fuente): **¡Esta es la carpeta más importante!** Aquí es donde vas a escribir casi todo tu código.

    -   **`main.jsx`**: Es el verdadero punto de partida de tu aplicación. Este archivo toma tu componente principal (`App.jsx`) y lo "monta" o renderiza dentro del `index.html` para que se pueda ver en el navegador.

    -   **`App.jsx`**: Es el componente raíz o principal de tu aplicación. Piensa en él como el contenedor de más alto nivel. Dentro de `App.jsx` empezarás a construir tu interfaz, añadiendo otros componentes, vistas, etc.

    -   **`index.css`**: Un archivo para escribir estilos CSS globales que se aplicarán a toda tu aplicación.

    -   **`assets/`**: Un buen lugar para guardar recursos que son parte de tu código, como logos, imágenes de fondo o fuentes tipográficas que importas directamente en tus componentes.

---

## ¿Cómo se ejecuta?

1.  **Instalación**: `npm install` (solo la primera vez, para descargar todo lo que está en `package.json` a la carpeta `node_modules`).
2.  **Ejecución**: `npm run dev` (para iniciar el servidor de desarrollo y poder ver tu app en el navegador, generalmente en `http://localhost:5173`).
