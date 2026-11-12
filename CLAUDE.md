# SafeGuard

Trabajo Final de Carrera (Analista de Sistemas) de Lucas Acosta, Fermín Lavin y Mauricio Matos.
SafeGuard es una plataforma contra el phishing con dos módulos:

- **PhishGuard** (puerta Empresas, `/empresas`): campañas de phishing simulado por correo (SMTP de Gmail),
  kit de texto para WhatsApp/SMS (no se envía), página de enseñanza en el momento (`/simulacion/:token`,
  `/bien/:token`), tablero, informe, alta/baja de empleados por planilla y cobro con Mercado Pago
  (función `phishguard-mercadopago`): un pago único de ARS 37.500, equivalente al mínimo de USD 25 por mes,
  que desbloquea PhishGuard en la cuenta. Los pagos viejos de prueba de ARS 500 siguen valiendo. Si la vuelta de
  Mercado Pago no llega, `PhishGuardAcceso` recupera el acceso consultando el pago. Precio publicado en `/empresas`:
  por persona y por mes según el tramo de la organización (1 a 100: USD 1,00; 101 a 300: USD 0,85; 301 a 600:
  USD 0,70; más de 600: USD 0,55), mínimo USD 25 por mes, facturación mensual cancelable y pago anual opcional
  con 15 % de descuento. El código solo cobra el mínimo: el cobro por tramo, la facturación mensual automática y
  el pago anual están planificados.
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
