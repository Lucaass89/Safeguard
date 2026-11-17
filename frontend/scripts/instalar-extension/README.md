# Video de cómo instalar la extensión

`npm run video:extension` arma el video que muestra la sección "Extensión de Chrome" de `/personas`.

La extensión todavía no está en la tienda de Chrome, así que se instala en el modo de desarrollador. Ese paso abre
una ventana del sistema para elegir la carpeta, y eso no se puede grabar desde Chrome. Por eso el video es una
animación (`escena.html`) que imita la página de extensiones con los mismos textos que ve la persona.

## Qué hace

1. Abre `escena.html` en Chromium, en tema claro y oscuro, y dibuja cuadro por cuadro (25 por segundo) los seis pasos:
   descargar, descomprimir, abrir `chrome://extensions`, activar el modo de desarrollador, cargar la carpeta y fijar.
2. Los títulos y textos de cada paso salen de `src/lib/instalarExtension.js`, y la versión, de
   `extension/manifest.json`.
3. Deja `public/capturas/instalar-extension-{claro,oscuro}.mp4`, la foto fija `.webp` y escribe en
   `src/data/instalarExtension.json` el segundo en el que arranca cada paso.

## Qué hace falta

Node 22, `ffmpeg` y Playwright con Chromium (`npm install --no-save playwright`). No necesita la base ni una cuenta.

Si cambian los pasos o los segundos en `escena.html`, volver a correrlo, después `npm test`, y subir los archivos que
cambiaron.
