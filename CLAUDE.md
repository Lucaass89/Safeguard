# SafeGuard

Trabajo Final de Carrera (Analista de Sistemas) de Lucas Acosta, Fermín Lavin y Mauricio Matos.
SafeGuard es una plataforma contra el phishing con dos módulos:

- **PhishGuard** (puerta Empresas, `/empresas`): campañas de phishing simulado por correo (SMTP de Gmail),
  kit de texto para WhatsApp/SMS (no se envía), página de enseñanza en el momento (`/simulacion/:token`,
  `/bien/:token`), tablero, informe, alta/baja de empleados por planilla y cobro con Mercado Pago
  (función `phishguard-mercadopago`). La organización elige cuántas personas cubre el plan y paga en un pago
  único el primer mes según los tramos: USD 1 por persona de 1 a 100, USD 0,85 de 101 a 300, USD 0,70 de 301 a
  600 y USD 0,55 desde 601, con un mínimo de USD 25 por mes, pasado a pesos con USD 1 = ARS 1.500
  (`src/lib/precioPhishguard.js` y `precio.ts` de la función tienen que coincidir). La cantidad queda en
  `organizaciones.usuarios_contratados` y el panel de la empresa la muestra contra las personas activas (RF-07).
  Límite: hasta un 10 % más de personas activas que las contratadas, redondeado hacia arriba (sin cantidad guardada
  cuentan 25). Lo hace cumplir el disparador `empleados_respetar_limite` en la base (error `SG001`), y
  `limitePersonas` en `precioPhishguard.js` tiene que dar lo mismo que `phishguard_limite_personas`.
  Los pagos de ARS 37.500 hechos antes cuentan como 25 personas, y los viejos de prueba de ARS 500 siguen valiendo.
  Si la vuelta de Mercado Pago no llega, `PhishGuardAcceso` recupera el acceso consultando el pago. No hay
  suscripción automática ni pago anual.
- **SafeLink** (puerta Personas, `/personas`, gratis): detector propio que devuelve un semáforo
  (verde, amarillo, rojo, gris) con el motivo, para URL, QR, PDF, correo y WhatsApp. **Faro** es el chat que
  explica cada resultado (función `safelink-faro`). No consulta VirusTotal ni Google Safe Browsing en el veredicto.

## Estructura del repo

- `frontend/` — la aplicación: React 19, Vite 8, react-router 8, supabase-js. JavaScript/JSX, un CSS por página.
  - `src/pages/` pantallas, `src/components/` piezas comunes, `src/lib/` lógica y pruebas, `src/data/` marcas y plataformas.
  - Rutas en `src/App.jsx`: `/panel/*` en la web; `/safelink`, `/phishguard/*` y `/perfil` solo dentro de la app Android (`esAppNativa`).
  - `eval/` — set de URLs etiquetadas que mide el detector. El build falla si no pasa los umbrales (`eval/umbrales.json`).
- `supabase/` — `migrations/` (SQL) y `functions/` (edge functions en TypeScript/Deno).
- `android/` — contenedor WebView en Java (`com.safeguard.app`) que carga el sitio publicado; usa la cámara para QR.
- `extension/` — extensión de Chrome (MV3) "SafeLink": pinta un color según la pestaña activa. Avisa, no bloquea.
- `backend/` — solo un `package.json` de Express, sin uso real.
- `docs/` — entregables del TFC (propuesta, ERS, casos de prueba, benchmark, competencia, diagramas, evidencia).

## Comandos (desde `frontend/`, Node 22+)

```bash
npm install
npm run dev        # servidor local
npm test           # node --test src/lib/*.test.js
npm run eval       # evaluación del detector con eval/
npm run build      # corre eval y después vite build
npm run lint
```

La CI (`.github/workflows/safelink-eval.yml`) corre `npm test`, `npm run eval` y el build en cada push.

## Configuración

- `frontend/.env.local` (copiar de `.env.example`): `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
  En el navegador solo va la clave publishable, nunca la `service_role`.
- Sitio publicado en Vercel (`vercel.json` reescribe todo a `index.html`): https://safeguardd.vercel.app

## Convenciones

- Textos de la interfaz en español rioplatense, simple y con "vos".
- El código fuente no lleva comentarios de línea.
- Mensajes de commit: una oración completa en español que describe el resultado del cambio.
- Toda lógica nueva en `src/lib/` va con su `*.test.js`.

## Documentación del TFC

Los documentos de `docs/` describen solo lo que el código y la base publicada hacen de verdad. Cada función
lleva su estado: "Implementada", "Implementada en el repositorio, falta aplicarla en la base publicada",
"Prototipo", "Planificada" o "Fuera del trabajo final". Al cambiar algo del producto, revisar que la propuesta,
el ERS y los casos de prueba sigan coincidiendo, incluidos los conteos de pruebas y commits que cita el anexo
(tag `entrega-tfc`). Hay migraciones de PhishGuard en el repo que todavía no se aplicaron en la base publicada.
