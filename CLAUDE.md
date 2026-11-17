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
  Datos de la empresa: antes de pagar se completa `FormEmpresa` (nombre, tipo PyME o educativa, CUIT opcional,
  responsable y áreas). La función de cobro los valida con `phishguard_empresa_normalizada`, los guarda en
  `phishguard_solicitudes` y los aplica al aprobarse el pago; el panel los edita con `phishguard_guardar_empresa`.
  La validación del navegador (`datosEmpresa.js`) tiene que coincidir con la de la base. `organizaciones` no se
  escribe desde el navegador.
  Los pagos de ARS 37.500 hechos antes cuentan como 25 personas, y los viejos de prueba de ARS 500 siguen valiendo.
  Si la vuelta de Mercado Pago no llega, `PhishGuardAcceso` recupera el acceso consultando el pago. No hay
  suscripción automática ni pago anual.
  Verificación en dos pasos obligatoria para administrar PhishGuard: `PhishGuardAcceso` envuelve las pantallas en
  `DosPasos` (app de códigos TOTP de Supabase) y en la base `phishguard_org_id()` solo devuelve la organización con
  sesión `aal2`. Cualquier usuario la activa o desactiva desde el perfil. Si alguien pierde el celular, se le borra el
  factor a mano en `auth.mfa_factors` después de confirmar su identidad.
- **SafeLink** (puerta Personas, `/personas`, gratis): detector propio que devuelve un semáforo
  (verde, amarillo, rojo, gris) con el motivo, para URL, QR, PDF, correo y WhatsApp. **Faro** es el chat que
  explica cada resultado (función `safelink-faro`), en la web y en la app. No consulta VirusTotal ni Google Safe Browsing en el veredicto.

## Estructura del repo

- `frontend/` — la aplicación: React 19, Vite 8, react-router 8, supabase-js. JavaScript/JSX, un CSS por página.
  - `src/pages/` pantallas, `src/components/` piezas comunes, `src/lib/` lógica y pruebas, `src/data/` marcas y plataformas.
  - Rutas en `src/App.jsx`: `/panel/*` en la web; `/safelink`, `/phishguard/*` y `/perfil` solo dentro de la app Android (`esAppNativa`).
  - `eval/` — set de URLs etiquetadas que mide el detector. El build falla si no pasa los umbrales (`eval/umbrales.json`).
- `supabase/` — `migrations/` (SQL) y `functions/` (edge functions en TypeScript/Deno).
- Inicio de la app (`src/pages/Inicio.jsx`) no revisa nada: lo compartido desde WhatsApp (`/?compartido=…`) y el enlace
  copiado se mandan a SafeLink. Muestra la estafa del momento (`estafasSemana.js` o `consejoDelDia.js`), "¿Te pasó
  algo?" (`mePaso.js`), la lista de seguridad (`listaSeguridad.js`), lecciones (`lecciones.js`), logros (`logros.js`) y
  las novedades de `src/data/novedades.json` (para avisar mantenimientos o funciones nuevas, se agrega ahí).
- Notificaciones (app 1.3 o más nueva): Firebase Cloud Messaging, proyecto `safeguard-3b268`
  (`android/app/google-services.json`). La web pide activarlas con `safeguard://notificaciones?anuncios=1&estafas=1&phishguard=1`
  (`src/lib/avisos.js`, `useAvisos.js`); la app se anota a los temas `anuncios` y `estafas` y devuelve el token con el evento
  `sg-push`. Con sesión, el token se guarda con `push_registrar` en `push_dispositivos` y `phishguard-avisar-caida` avisa al
  celular de quien administra. Los mantenimientos se mandan desde la consola de Firebase al tema `anuncios`; las estafas
  de la semana, con `.github/workflows/avisar-estafas.yml` cuando cambia la fecha de `EDICION`. Las dos cosas necesitan
  el secreto `FCM_SERVICE_ACCOUNT` (cuenta de servicio de Firebase) en Supabase y en GitHub.
- `android/` — contenedor WebView en Java (`com.safeguard.app`) que carga el sitio publicado; usa la cámara para QR.
  La portada muestra `public/capturas/recorrido-{claro,oscuro}.mp4`, una grabación real de la app con capítulos
  (textos en `src/lib/recorridoApp.js`, segundos de inicio en `src/data/recorridoApp.json`). Se graba con
  `npm run recorrido` (`scripts/recorrido/`, ver su README) y la cuenta de prueba `cuenta.demo@example.com`
  ("Ana Prueba"); si cambian esas pantallas hay que volver a grabarla.
- `extension/` — extensión de Chrome (MV3) "SafeLink": sin resultado el ícono es el logo de SafeGuard; con resultado, un escudo del color con su símbolo
  (dibujado en `background.js` con `iconoDe`, `trazosSimbolo` y `barrasLogo`). Avisa, no bloquea. `npm run extension:zip` arma
  `public/safelink.zip`, que es lo que baja la portada.
  La sección "Extensión de Chrome" de `/personas` muestra `public/capturas/instalar-extension-{claro,oscuro}.mp4`, una
  animación de los pasos para instalarla en el modo de desarrollador (textos en `src/lib/instalarExtension.js`). Se arma
  con `npm run video:extension` (`scripts/instalar-extension/`); si cambian los pasos hay que volver a armarla.
  `extension/detector.js` no se edita a mano: lo genera `npm run extension` desde `src/lib/extension.js` (mismo detector
  que la web) y la CI falla si quedó atrasado. La lista de `amenazas` se baja cada 6 horas y se busca en la compu; solo
  las páginas que no dan verde se mandan a `safelink-enriquecer`, sin la parte después de `#`.
  Cuando da rojo avisa con una notificación (una vez por dominio, se puede apagar). "Ver el análisis completo" abre
  `/panel/enlaces?url=…`, que solo completa el campo; si no hay sesión, el ingreso vuelve ahí (`volverTrasIngreso.js`).
- `backend/` — solo un `package.json` de Express, sin uso real.
- `docs/` — entregables del TFC (propuesta, ERS, casos de prueba, benchmark, competencia, diagramas, evidencia).

## Comandos (desde `frontend/`, Node 22+)

```bash
npm install
npm run dev        # servidor local
npm test           # node --test src/lib/*.test.js
npm run eval       # evaluación del detector con eval/
npm run build      # corre eval y después vite build
npm run extension  # regenera extension/detector.js
npm run recorrido  # vuelve a grabar el video de la app (ver scripts/recorrido/README.md)
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
(tag `entrega-tfc`). Al 16/11/2026 todas las migraciones del repo están aplicadas en la base publicada; las nuevas se
aplican a mano o con el MCP de Supabase (la integración de Supabase apunta a otro repositorio).
