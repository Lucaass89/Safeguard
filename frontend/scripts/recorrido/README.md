# Grabación del recorrido de la app

`npm run recorrido` graba la app de SafeGuard tal como se ve en Android y arma el video por capítulos que muestra la
portada ("Así funciona la app en tu celular"). Usarlo cuando cambia alguna de esas pantallas.

## Qué hace

1. Entra con la cuenta de prueba y graba siete capítulos en tema oscuro y claro: QR (desde el botón del medio), enlace, mensaje, PDF, Faro,
   ingreso y perfil. Cada uno es una grabación real de la app, cuadro por cuadro, a resolución completa.
2. El QR se lee con una cámara de prueba de Chrome que muestra `cartel-qr.png`, un cartel de estacionamiento con un QR
   a `https://mercadopago-cobro.com/pagar`. El PDF es `aviso-cuenta.pdf`, un aviso falso de Banco Nación con un enlace a
   `bna-acceso.com`. Las dos direcciones son inventadas.
3. Une los capítulos en `public/capturas/recorrido-{oscuro,claro}.mp4`, saca la foto fija
   `recorrido-{oscuro,claro}.webp` y escribe en `src/data/recorridoApp.json` el segundo en el que arranca cada capítulo.
   Los textos de cada paso están en `src/lib/recorridoApp.js`.

## Qué hace falta

- Node 22, `ffmpeg` y `ffprobe`.
- Playwright con Chromium. No es una dependencia del proyecto; se instala aparte:
  `npm install --no-save playwright` y `npx playwright install chromium`.
- El sitio corriendo con la base real: `npm run dev` con `.env.local` completo (solo la clave publishable).
- La cuenta de prueba `cuenta.demo@example.com` ("Ana Prueba"). Su contraseña no está en el repositorio: pedila al
  equipo y pasala en `SG_DEMO_CLAVE`.

## Cómo se corre

```bash
SG_DEMO_CLAVE='...' npm run recorrido
```

Variables opcionales: `SG_BASE` (por defecto `http://localhost:5173`), `SG_DEMO_CORREO` y `SG_TEMAS`
(por defecto `oscuro,claro`).

Cada corrida deja nuevos análisis en el historial de la cuenta de prueba y hace consultas reales a la base. Después,
revisar el video, correr `npm test` y subir los archivos que cambiaron.
