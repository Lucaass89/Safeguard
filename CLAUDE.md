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
  Sin verificación en dos pasos: se sacó el 27/11/2026 (componente `DosPasos`, el aviso del perfil y el punto de la lista).
  `phishguard_org_id()` devuelve la organización con cualquier sesión (migración `20261127120000_phishguard_sin_dos_pasos.sql`).
  Los factores TOTP que alguien ya había creado quedan en `auth.mfa_factors` pero la app no los pide.
- **SafeLink** (puerta Personas, `/personas`, gratis): detector propio que devuelve un semáforo
  (verde, amarillo, rojo, gris) con el motivo, para URL, QR, PDF, correo y WhatsApp. **Faro** es el chat que
  explica cada resultado (función `safelink-faro`), en la web y en la app. No consulta VirusTotal ni Google Safe Browsing en el veredicto.
  APK: un enlace a un `.apk` da rojo, salvo desde el sitio oficial de una marca de `marcas.json` o de `descargaConfiable`
  (F-Droid y el sitio de SafeGuard), que da amarillo; nunca verde. En un WhatsApp o un correo, un APK (enlace, adjunto o
  nombre de archivo) siempre da rojo. No se analiza el contenido del archivo.
- **Portada** (`/`, `pages/Landing.jsx`, `Portada.css`): arriba el buscador `components/BuscadorPortada.jsx`, que da el color
  al pegar un enlace sin entrar a la cuenta ("Revisar" lleva a `/panel/enlaces?url=…`), y abajo los dos caminos partidos al
  medio: SafeLink en azul y PhishGuard en coral.
- **Personas** (`/personas`, `pages/Personas.jsx`, `Personas.css`): franja azul con el mismo buscador y lo que se puede revisar,
  qué significa cada color, dónde usarlo (web, celular, Chrome y Faro) con los botones de la app y la extensión, la tarjeta de
  la extensión con su video (`#instalar`) y la invitación a crear la cuenta. El botón de la app baja el archivo que dice
  `public/app/version.json`, así que no hay que tocar la página al publicar una versión.
- **Empresas** (`/empresas`, `pages/Empresas.jsx`, `Empresas.css`): franja coral con un ejemplo del tablero (datos ficticios),
  los pasos de una campaña (`pasosCampana.js`), lo que trae el panel, los tramos al lado de la calculadora `ElegirPersonas`
  (el botón lleva a `/adquirir?personas=…`), preguntas frecuentes y un cierre con "Escribinos". Si cambian los precios o las
  reglas del plan, revisar también los textos de esta página.
- **Contacto** (`/contacto`, `pages/Contacto.jsx`, `Contacto.css`): tarjetas de correo y WhatsApp, tres motivos con el mensaje
  ya escrito y el aviso de que nunca se piden claves. El correo y el número salen de `CONTACTO` en `lib/contacto.js`: se
  cambian solo ahí.
- **Términos** (`/terminos`, `pages/Terminos.jsx`, `Legal.css`): franja con la descarga del convenio
  (`public/convenio-piloto-safeguard.pdf`), índice fijo al costado, "En corto" con tildes y las secciones numeradas.
  **Privacidad** (`/privacidad`, `pages/Privacidad.jsx`) usa el mismo diseño, con "En corto" armado solo con lo que dice
  el texto. Las dos comparten `Legal.css` (prefijo `lg-`) y `components/Legal.jsx` (`Seccion`, `Indice`, `EnCorto`, `Marca`).
  Cambiar el diseño no cambia el texto legal; si cambia lo que hace el código con los datos, hay que actualizar Privacidad.

## Estructura del repo

- `frontend/` — la aplicación: React 19, Vite 8, react-router 8, supabase-js. JavaScript/JSX, un CSS por página.
  - `src/pages/` pantallas, `src/components/` piezas comunes, `src/lib/` lógica y pruebas, `src/data/` marcas y plataformas.
  - Rutas en `src/App.jsx`: `/panel/*` en la web; `/safelink`, `/phishguard/*` y `/perfil` solo dentro de la app Android (`esAppNativa`).
    En la app, `/safelink/enlaces`, `/whatsapp`, `/correo` y `/pdf` llevan a `/safelink` (con `?url=` pasa a revisarse solo, `destinoSafeLink`);
    `/safelink/qr` sigue siendo el lector.
    En la web, `/panel` pregunta qué aplicación usar con la pantalla partida de `components/ElegirApp.jsx`: oscura con
    un brillo azul (SafeLink) y coral (PhishGuard), y en el tema claro beige con los mismos brillos, a todo el ancho, con un dato real de cada una (`lib/elegirApp.js`). PhishGuard abre `components/PhishGuardWeb.jsx`: franja con el nombre de la organización, la frase de la última
    campaña, el anillo con el % que tocó el enlace contra la anterior, los cuatro pasos del plan, la última campaña en barras,
    las áreas para reforzar y los accesos (`lib/resumenPhishguard.js`, con los datos de `phishguard_tablero`). Tu empresa, Campañas, Tablero e Informe
    usan `components/CabeceraPhishGuard.jsx` (franja coral con "← Volver a PhishGuard"; dentro de la app, la cabecera de siempre) y sus
    estilos de tarjetas, tablas, campos y botones; al imprimir el informe se ve sobre blanco, sin la franja de color ni los botones.
    Tablero e Informe usan `components/AnalisisEquipo.jsx` y `lib/analisisEquipo.js`: cifras con %, "Qué hacer ahora" (recomendaciones
    armadas con los datos), evolución por campaña, barras por área y la tabla por persona con filtros y búsqueda (el informe, sin filtros).
    Campañas (`lib/armarCampana.js`, `pages/Campanas.css`) se arma en tres pasos: canal, mensaje (tarjetas con vista previa) y a quiénes
    (por área, al azar o de a una), con un resumen al costado; el nombre es opcional. Tu empresa (`pages/Empresa.css`) muestra el plan y los
    datos de la empresa como resumen con "Editar", "Sumar personas" con pestañas y la lista con búsqueda y áreas. SafeLink abre
    directo el diseño propio de compu (`components/SafeLinkWeb.jsx`, también con `?app=safelink` o `?url=`): una franja a todo
    el ancho con brillo azul, "¿Qué te llegó?" y una barra tipo buscador (Enter revisa, Shift+Enter agrega una línea, se puede
    soltar un PDF), con Pegar lo copiado, Subir un PDF y Foto de un QR; abajo, lo último que revisaste y tu actividad por color. El panel no tiene barra lateral: se navega con las tarjetas, los "Volver" de cada pantalla y el menú de la cuenta
    (Inicio del panel, Historial de SafeLink, Perfil). `/panel/historial` tiene la franja azul con contadores por color que filtran, búsqueda, lo
    revisado agrupado por día (ícono del tipo, el motivo corto, revisar de nuevo y borrar) y tus reportes (`MisReportes`). La lógica de revisar es la misma que la app (`revisarSafeLink.js`, `revisados.js`). `/panel/enlaces`, `/whatsapp`, `/pdf` y `/correo` llevan a `/panel` y conservan `?url=`
    (`destinoPanel`), que solo completa la caja.
  - `eval/` — set de URLs etiquetadas que mide el detector. El build falla si no pasa los umbrales (`eval/umbrales.json`).
- `supabase/` — `migrations/` (SQL) y `functions/` (edge functions en TypeScript/Deno).
- Inicio de la app (`src/pages/Inicio.jsx`) no revisa nada: lo compartido desde WhatsApp (`/?compartido=…`) y el enlace
  copiado se mandan a SafeLink. Muestra solo lo de hoy: la estafa del momento (`estafasSemana.js` o `consejoDelDia.js`),
  "¿Te pasó algo?" (`mePaso.js`), ¿Estafa o real?, lecciones (`lecciones.js`), tu equipo y las novedades de
  `src/data/novedades.json` (para avisar mantenimientos o funciones nuevas, se agrega ahí). La lista "Tu cuenta, más
  segura" (`listaSeguridad.js`) y los logros (`logros.js`) están en el Perfil (`components/MiProgreso.jsx`, prefijo `prog-`).
- Notificaciones (app 1.3 o más nueva): Firebase Cloud Messaging, proyecto `safeguard-3b268`
  (`android/app/google-services.json`). La web pide activarlas con `safeguard://notificaciones?anuncios=1&estafas=1&phishguard=1`
  (`src/lib/avisos.js`, `useAvisos.js`); la app se anota a los temas `anuncios` y `estafas` y devuelve el token con el evento
  `sg-push`. Con sesión, el token se guarda con `push_registrar` en `push_dispositivos` y `phishguard-avisar-caida` avisa al
  celular de quien administra. Los mantenimientos se mandan con la tarea `.github/workflows/avisar.yml` (a mano: título, texto, tema y pantalla) o desde la consola de Firebase al tema `anuncios`; las estafas
  de la semana, con `.github/workflows/avisar-estafas.yml` cuando cambia la fecha de `EDICION`. Las dos cosas necesitan
  el secreto `FCM_SERVICE_ACCOUNT` (cuenta de servicio de Firebase) en Supabase y en GitHub.
- Actualizar la app: `public/app/version.json` dice cuál es la última (`version` = número de `SafeGuardApp/N` del user agent,
  `nombre`, `archivo` y `novedades`) y el APK va en `public/app/`. Si la app instalada tiene un número menor, Inicio y Perfil
  muestran "Actualizar", que baja el APK con el gestor de descargas de Android (`actualizarApp.js`, `useActualizacion.js`).
  Para publicar una versión: subir `versionCode`/`versionName` en `android/app/build.gradle.kts` y el número de
  `SafeGuardApp/N` en `MainActivity`, compilar, copiar el APK a `public/app/` y actualizar `version.json`.
  `firmaDesde` en `version.json` (hoy 4) hace que solo a quien tiene una versión anterior a la firma propia se le pida
  desinstalar (`hayQueDesinstalar`). La última es la 1.5 (`versionCode` 6, `SafeGuardApp/5`).
  Firma: desde la 1.4 todas las versiones se firman con la clave de publicación propia (alias `safeguard`, huella SHA-256
  `26:BE:D1:08:…:44:B0:63`). La clave no está en el repo: está en los secretos de GitHub `SG_FIRMA_BASE64` (el `.jks` en
  base64) y `SG_FIRMA_CLAVE`, y la guarda el equipo. `.github/workflows/android-apk.yml` compila el APK firmado
  (`assembleRelease`) al cambiar `android/` o a mano, y lo deja como artefacto. Para compilar en una compu: variables
  `SG_FIRMA_ARCHIVO` (ruta al `.jks`) y `SG_FIRMA_CLAVE`. Sin la clave, el APK de publicación sale sin firmar. Si se pierde,
  las apps instaladas no se pueden actualizar sin desinstalar.
- Perfil de la app (`src/pages/PerfilApp.jsx`): tarjeta de la cuenta, nivel de protección (`proteccion.js`), la lista "Tu cuenta,
  más segura" plegada, lo revisado por color, tus logros y el menú agrupado (Seguridad y avisos, Tu actividad, La app, Ayuda y
  cuenta) con subpantallas `/perfil/:seccion` (seguridad, avisos, familia, reportes, apariencia, datos, version, ayuda, cuenta);
  las de configuración reusan `PanelPerfil` con `seccion`. En la web, `/panel/perfil` usa su propio diseño en `PanelPerfil` (`CabeceraPerfilWeb`,
  `pages/PerfilWeb.css`): franja con foto, nombre, correo y chips (rol y forma de entrar), dos columnas de tarjetas
  (Cuenta y Seguridad; Actividad, Organización, Apariencia y Tus datos) y la zona de peligro abajo. "Celulares con avisos" usa `push_mis_dispositivos` y `push_borrar_otros`.
  "Cuidar a un familiar" (`familia.js`): la persona cuidada crea un código de 6 letras que vence a los 30 minutos
  (`familia_crear_codigo`), quien cuida lo carga (`familia_aceptar`), y cuando la persona cuidada guarda un análisis rojo
  la función `familia-avisar` manda un aviso al celular de quien la cuida (como mucho uno cada 10 minutos). Migración
  `20261118120000_perfil_familia.sql`.
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
  `/panel/enlaces?url=…`, que lleva a `/panel` y solo completa la caja; si no hay sesión, el ingreso vuelve ahí (`volverTrasIngreso.js`).
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

## Seguridad

- CORS: las funciones usan `conCors` de `supabase/functions/_shared/seguridad.ts`, que solo responde a
  https://safeguardd.vercel.app, localhost y la extensión (`chrome-extension://`). Al publicar una función con el MCP hay
  que subir también `../_shared/seguridad.ts`. La API REST de Supabase siempre responde a cualquier origen: la protege RLS.
- Límites: `limite_pasar(clave, máximo, segundos)` (tabla `limites_uso`, solo `service_role`) cuenta intentos por usuario
  o por IP. Lo usan `safelink-enriquecer` (120 cada 10 min por IP), `phishguard-mercadopago`, `phishguard-avisar-campana`,
  `phishguard-avisar-caida`, `eliminar-cuenta`, `familia_aceptar` (10 códigos por hora), `safelink_reportar`,
  `safelink_compartir` y `push_registrar`. Faro tiene su propio tope diario por usuario e IP.
- Permisos: cada tabla tiene RLS y `anon`/`authenticated` solo tienen los permisos que alguna política usa
  (migración `20261127130000_seguridad_limites.sql`). Las funciones viejas (`provision_it_admin`, `get_sim_by_token`, etc.)
  no se pueden llamar desde la API.
- Sesión: `vencimientoSesion.js` cierra la sesión si no se usa en 7 días en la web o 30 en la app.
- Secretos: solo en Supabase (funciones), GitHub (firma y FCM) y Vercel. En el repo van únicamente la clave publishable y
  el `google-services.json` de Firebase, que son públicos por diseño.

## Google y vista previa

- `lib/metaPaginas.js` tiene el título y la descripción de cada página pública y las rutas privadas. `components/MetaPagina.jsx`
  los aplica al cambiar de página (con `noindex` en las privadas y la dirección canónica). `public/robots.txt` y
  `public/sitemap.xml` salen de esa misma lista: si se agrega una página pública, se suma ahí y se regeneran (la prueba falla
  si no coinciden). La vista previa al compartir usa `public/compartir.png` (1200×630). Al compilar,
  `scripts/paginas/armar.mjs` deja un `dist/<página>/index.html` por cada página pública con su título, descripción y
  canónica ya escritos (`htmlDePagina`), para que Google los lea sin ejecutar JavaScript; `vercel.json` manda cada página a
  su html (la prueba revisa que estén todas). Los datos estructurados de
  `index.html` presentan a SafeGuard como sitio, organización (con logo) y SafeLink como aplicación gratuita.
- Search Console: la propiedad es `https://safeguardd.vercel.app` (prefijo de URL), con la etiqueta `google-site-verification` en
  `index.html`.

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
