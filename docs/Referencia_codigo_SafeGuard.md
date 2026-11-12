# Referencia del código de SafeGuard (uso interno, no es un entregable)

Relevamiento del repositorio al 12/11/2026 (rama `claude/sharp-allen-x8x2it`, último commit de `main`: `49e699d`).
Sirve para actualizar la propuesta, el ERS, los casos de prueba, el manual y los diagramas con lo que el código
hace de verdad. No hay que entregarlo.

> La base publicada (`axbwxsghgxcqhjxckqcp.supabase.co`) no se pudo consultar desde esta sesión. Lo que dice
> "base" sale de las migraciones del repo y del código que las usa. Hay que confirmar en el panel de Supabase
> qué migraciones están aplicadas antes de marcar algo como "Implementada".

## 1. Números para citar

| Dato | Valor | De dónde sale |
| --- | --- | --- |
| Commits en el repo | 105 | `git rev-list --count HEAD` |
| Tag `entrega-tfc` | No existe (ni local ni en GitHub) | `git ls-remote --tags origin` |
| Pruebas unitarias | 294 pruebas en 44 grupos, 0 fallas | `npm test` |
| Casos del eval del detector | 3295 (1114 legítimos, 2181 maliciosos) | `npm run eval` |
| Falsos positivos | 3,23 % (umbral ≤ 3,24 %) | `eval/reporte.md` |
| Detección | 99,54 % (umbral ≥ 99,54 %) | `eval/reporte.md` |
| Maliciosos en gris | 0,46 % (umbral ≤ 0,46 %) | `eval/reporte.md` |
| Imitaciones de marca en verde | 0 (regla dura) | `eval/reporte.md` |
| Marcas protegidas contra imitación | 44 | `src/data/marcas.json` |
| Plataformas conocidas | 27 acortadores, 31 de contenido de terceros, 13 de direcciones temporales | `src/data/plataformas.json` |
| Migraciones SQL | 25 | `supabase/migrations/` |
| Funciones del servidor (edge functions) | 6 | `supabase/functions/` |

Sobre el eval, para el benchmark: los 2181 maliciosos son typosquats generados a partir de las 44 marcas
(letras cambiadas, cirílicas, omisiones, transposiciones, subdominios, etc., en `eval/casos.js`). Los legítimos
salen del top 1000 de Tranco más sitios argentinos. Mide el análisis de la dirección, no el seguimiento de
redirecciones, la edad del dominio ni la base de amenazas. El set aparte `urls_eval.csv` (44 casos) tiene una
sola URL real de phishing. El propio repo dice que las sintéticas son una prueba circular.

## 2. Tecnología (para el PL04 y la arquitectura)

- **Web:** React 19, Vite 8, react-router 8, supabase-js 2. JavaScript/JSX. Publicada en Vercel
  (https://safeguardd.vercel.app). Se puede instalar como PWA (manifest y service worker).
- **Librerías del detector:** `tldts` (dominio registrable), `pdfjs-dist` (PDF en el navegador), `zxing-wasm`
  (lectura de QR), `read-excel-file` (planilla de empleados).
- **Servidor:** Supabase (PostgreSQL 17 con RLS, Auth, Edge Functions en TypeScript/Deno).
- **Correo:** SMTP de Gmail con contraseña de aplicación (`denomailer`).
- **Cobro:** Mercado Pago, Checkout Pro (preferencia, vuelta y consulta de pago).
- **Faro:** API de Google Gemini (`gemini-3.8-flash` por defecto, `gemini-2.5-flash` de respaldo).
- **Datos externos del enriquecimiento:** rdap.org (edad del dominio), crt.sh (edad del certificado),
  DNS sobre HTTPS de Cloudflare.
- **Android:** app nativa en Java (`com.safeguard.app`, minSdk 24, targetSdk 37, versión 1.1). Es un WebView que
  carga el sitio publicado y pide permiso de cámara para leer QR.
- **Extensión de Chrome:** Manifest V3, versión 0.1.0, permisos `tabs` y `storage`.
- **Calidad:** `node --test` para las pruebas, ESLint, y CI en GitHub Actions (`safelink-eval.yml`) que corre
  pruebas, eval y build en cada push.
- **Sin uso:** `backend/` (Express) está vacío. No hay backend propio fuera de Supabase.
- **No se usa en el veredicto:** VirusTotal y Google Safe Browsing. `src/lib/virustotal.js` existe, pero solo lo
  usan los scripts de `eval/` con respuestas guardadas.

## 3. SafeLink (Personas, gratis)

### Veredicto

Cuatro niveles: **verde** (título "Seguro" solo si es un dominio oficial de una marca conocida, si no "Sin señales
de riesgo"), **amarillo** ("Precaución"), **rojo** ("Peligroso") y **gris** ("No pudimos verificarlo").

Puntaje de 0 a 100 armado con señales que tienen peso y fuerza (`src/lib/puntaje.js`):

- Precaución desde 20 puntos y Peligroso desde 55.
- Solo se llega a Peligroso con una señal fuerte o con señales medias de al menos dos grupos distintos. Si no,
  el puntaje queda en 54 como máximo.
- Topes por grupo: las palabras suman hasta 15 y las señales débiles hasta 30. Una palabra suelta o un TLD
  barato nunca alcanzan para un rojo.
- Gris cuando no se pudo verificar: acortador sin seguir, plataforma de terceros, dirección demasiado larga,
  sitio que no respondió, base de amenazas caída, o un enlace que abre otra app.

### Canales

| Canal | Dónde corre | Qué mira |
| --- | --- | --- |
| Enlace | Navegador + servidor | Imitación de marca (letras cambiadas, otro alfabeto, parecido, marca en el subdominio o en el camino), IP, arroba, punycode, http, TLD barato, acortadores y plataformas, subdominios, guiones, puerto, rutas de login, parámetros de redirección, descargas y doble extensión, datos personales en la URL |
| Enlace, enriquecimiento (`safelink-enriquecer`) | Servidor | Sigue hasta 5 redirecciones (4 s por salto, 12 s en total) sin cookies y bloquea redes internas. Edad del dominio (menos de 30 días suma, menos de 7 suma más), certificado de menos de 14 días, redirección automática, formulario que manda a otro sitio, script o iframe de otro sitio, página que pide clave (más grave si el título nombra una marca o si el dominio tiene menos de 4 meses), descarga ejecutable |
| Base propia `amenazas` | Servidor | Dominio ya marcado en rojo (piso de 90) o en amarillo (piso de 45) |
| WhatsApp / SMS / Telegram (pegando el texto) | Navegador + servidor para el peor enlace | Urgencia, premio, "cambié de número", código de verificación, instalar una app o APK, CBU, CVU o alias (o un número de 22 dígitos), caracteres invisibles, enlaces camuflados (`hxxp`, `[.]`), número que no es de Argentina, marca más presión |
| Correo (pegando el original con encabezados) | Navegador + servidor para el peor enlace | SPF, DKIM y DMARC, nombre contra dirección, Reply-To y Return-Path distintos, cuenta gratuita que firma como un área, Message-ID de otro dominio, fecha futura, texto oculto, adjuntos peligrosos o con doble extensión, enlace cuyo texto muestra un dominio y lleva a otro, urgencia |
| PDF | Solo en el navegador, el archivo no se sube | JavaScript, Launch, acciones automáticas, GoToR, RichMedia, cifrado, adjuntos (y si son ejecutables), formularios, urgencia, marca en el texto con un enlace a otro dominio. Cada enlace del PDF pasa por el análisis de enlaces sin servidor |
| QR | Cámara o imagen de la galería, en el navegador | Distingue web, pago (EMVCo: receptor, red y validación del dígito de CBU/CVU), cripto, Wi-Fi, SMS, teléfono, correo, ubicación, contacto (vCard/MeCard), evento, texto y código peligroso. Si es web, usa el motor de enlaces |

### Otras funciones

- **Faro** (`safelink-faro`): chat que explica el resultado en modo Simple, Técnico o Avanzado. Tiene preguntas
  listas: "Analizá este caso", "Hacé un resumen", "Dame un ejemplo", "¿Por qué dio este resultado?",
  "¿Se puede abrir?" y "¿Qué pasa si ya hice clic?". Pide sesión. Límite de 30 consultas por usuario y 60 por
  IP cada 24 h, y guarda los tokens que usa cada respuesta (`safelink_faro_uso`). Descarta la respuesta del
  modelo si contradice el veredicto o revela instrucciones. El resumen se arma en el navegador, sin el modelo.
  Faro explica, no cambia el color.
- **Historial** (con cuenta): `safelink_analisis` guarda dirección, dominio, nivel, puntaje, explicación y canal.
  El texto de un WhatsApp o un correo no se guarda en la base: se guardan como mucho 80 caracteres en el
  `localStorage` del dispositivo. Resumen de la semana en el inicio.
- **Reportar un error** (`safelink_reportar_error` → `safelink_errores`): queda para revisión manual y no cambia
  ningún veredicto. La dirección se guarda sin `?` ni `#`.
- **Compartir una ficha** (`safelink_compartir`, `/c/:token`): la ve cualquiera sin cuenta y sin el autor.
- **¿Estafa o real?** (inicio de la app): 13 mensajes (8 estafas, 5 reales) con su lección. Se guarda una fila
  por respuesta con un identificador del dispositivo, sin cuenta (`entrenamiento_respuestas`).
- **Estafas de la semana**: 3 casos reales con su fuente (edición del 18/10/2026, vigencia de 10 días). Hoy, al
  12/11, la edición ya está vencida.
- **Aviso del portapapeles** (celular): ofrece revisar un enlace copiado.
- **Extensión de Chrome**: colorea el ícono según la pestaña activa con una copia del motor, consulta
  `amenazas` y `safelink-enriquecer`. No bloquea y no guarda historial (solo un estado por pestaña en
  `chrome.storage.session`). Se descarga como `safelink.zip` y no está en la Chrome Web Store.
- **Cuenta**: correo y contraseña o Google (Supabase Auth). Cambio de contraseña y borrado de cuenta
  (`eliminar-cuenta`).

## 4. PhishGuard (Empresas)

- **Acceso**: se desbloquea con un pago único de ARS 37.500 por Mercado Pago (`phishguard-mercadopago`, acciones
  `crear`, `confirmar` y `verificar`). Al pagar se crea la organización ("Prueba PhishGuard", plan "Inicial",
  estado "activa") y el usuario queda como `Admin_Principal`. Los pagos de prueba de ARS 500 siguen valiendo.
  Si la vuelta de Mercado Pago no llega, `PhishGuardAcceso` consulta el pago y recupera el acceso. No hay
  suscripción automática ni pago anual.
- **Empleados**: alta manual o por planilla CSV/XLSX (columnas nombre, correo y área; acepta sinónimos como
  email, departamento o puesto; hasta 1000 filas y 2 MB). La organización la define la sesión, no el archivo.
  Estados: activo, inactivo, pendiente de verificación, pendiente de aprobación y rechazado. Solo un
  administrador cambia el estado. Un trigger impide mandarle una simulación a quien no está activo.
- **Plantillas** (`plantillas_phishing`): 14 en las migraciones, más las que se crean solas desde SafeLink.
  - Semilla: CEO por WhatsApp, Paquete retenido por SMS (Correo Argentino), Paquete retenido por WhatsApp
    (Andreani), AFIP intimación, Banco verificar cuenta y RRHH recibo de sueldo.
  - Mercado Libre: compra pendiente.
  - Región: Banco Galicia, Banco Nación, ARCA devolución, Colegio cuota, Colegio circular, OCA y Mercado Envíos.
  - Automáticas: cada dominio que entra en rojo a `amenazas` genera una plantilla "Estafa real" por WhatsApp
    (trigger `phishguard_al_reportar_amenaza`).
  - Cada plantilla trae canal (email, whatsapp, sms o todos), dificultad (bajo, medio o alto), categoría y una
    lección en `metadata.lesson`.
- **Campañas**: nombre, plantilla, canal y destinatarios (marcados a mano o una cantidad al azar). Estados:
  borrador, programada, en proceso y finalizada. Se pueden ver las estadísticas y borrar. **No hay botón de
  pausa.**
- **Envío** (`phishguard-avisar-campana`):
  - Correo: sale por Gmail a cada empleado, con el nombre de remitente de la plantilla y la dirección de Gmail
    del proyecto, y un botón "Ingresar ahora".
  - WhatsApp y SMS: no se envían. El administrador recibe por correo un kit con el enlace de cada persona y el de
    "lo hiciste bien", y lo manda él.
- **Página de simulación** (`/simulacion/:token`): imita según el canal (correo, WhatsApp, SMS o Mercado Libre).
  Registra los eventos `abrio` (abrió la página), `clic` y `datos`. **Lo que se escribe no viaja al servidor**:
  `armarRegistro` solo manda el token y el nombre del evento, y la base solo guarda los booleanos
  `pagina_abierta`, `hizo_clic`, `ingreso_datos`, `completo_capacitacion` y `vio_reconocimiento`, con la fecha.
  Hay una prueba que lo verifica (`registroSimulacion.test.js`). Después muestra la lección "Esto era una
  simulación" y registra `capacitacion`.
- **"Lo hiciste bien"** (`/bien/:token`): reconoce a quien no cayó y registra `reconocimiento`.
- **Aviso de caída** (`phishguard-avisar-caida`): al primer clic, manda un correo a los administradores con la
  persona y su área. Una sola vez por persona y campaña.
- **Refuerzo**: quien cayó recibe otra simulación a los 21 días con una plantilla de dificultad alta. Se lanza al
  abrir el tablero, y `phishguard_lanzar_refuerzo` permite probarlo sin esperar.
- **Tablero** (`phishguard_tablero`): totales, por área (personas, cayeron, no cayeron, se capacitaron,
  mejoraron) y por persona.
- **Informe**: por área, por persona e historial de caídas (fecha, nombre, área, campaña, canal, qué hizo). Se
  guarda o se imprime desde el navegador (`window.print`), no se genera un PDF propio.
- **"Abiertos" no es la apertura del correo**: no hay píxel de seguimiento. La columna `mail_abierto` se renombró
  a `pagina_abierta` y mide quién abrió la página de la simulación.

## 5. Datos (para el diagrama de clases y el DER)

Las tablas y columnas no llevan ñ ni tildes por convención de PostgreSQL (`campanas`, `contrasena`,
`area`). En los documentos conviene aclararlo una vez ("los nombres técnicos van sin ñ ni tildes") y usar la
forma con ñ en el texto (Campaña, Área).

| Tabla | Para qué |
| --- | --- |
| `auth.users` (Supabase Auth) | Cuenta: correo y **contraseña guardada como hash bcrypt** (`encrypted_password`), o identidad de Google. La aplicación nunca guarda ni lee la contraseña en sus tablas |
| `organizaciones` | Empresa: nombre, plan, estado de la suscripción |
| `usuarios_admin` | Quién administra cada organización: usuario de Auth, nombre, correo, rol |
| `pagos_phishguard` | Pago: usuario, organización, medio, monto (500 o 37500), moneda, si es de prueba, id del pago de Mercado Pago |
| `empleados` | Persona de la organización: nombre, correo, área (departamento), estado, origen (manual, csv o link) |
| `plantillas_phishing` | Título, asunto, remitente falso, cuerpo, dificultad, categoría, canal, dominio de la amenaza, lección |
| `campanas` | Nombre, plantilla, canal, estado, si es refuerzo y de qué campaña sale |
| `eventos_simulacion` | Una fila por persona y campaña: token único, mail enviado, página abierta, clic, ingresó datos, capacitación, reconocimiento, aviso de caída, fecha del evento |
| `amenazas` | Dominio, nivel, motivo, veces reportado |
| `safelink_analisis` | Historial de cada usuario |
| `safelink_reportes` | Reportes de un dominio |
| `safelink_compartidos` | Fichas compartidas con un token |
| `safelink_errores` | Reportes de error para revisión manual |
| `safelink_faro_uso` | Uso de Faro (usuario, IP, tokens, caché) |
| `entrenamiento_respuestas` | Respuestas de "¿Estafa o real?" por dispositivo |
| `usuarios`, `analisis_urls`, `reportes` | Tablas viejas del primer SafeLink (id entero). Ya no se usan y la migración de setiembre las dejó sin tocar |

Las tablas `organizaciones`, `usuarios_admin`, `empleados`, `plantillas_phishing`, `campanas` y
`eventos_simulacion` ya existían en la base antes de las migraciones del repo, que solo las modifican. Para el DER
completo hay que sacar el esquema de la base publicada (Supabase → Database → Schema visualizer).

## 6. Inconsistencias encontradas (producto contra documentación interna)

1. **Precio en `/empresas`**: muestra tramos (USD 1,00 / 0,85 / 0,70 / 0,55), "Facturación mensual, cancelable" y
   "Pago anual opcional: 15% de descuento". El cobro real es un pago único de ARS 37.500 y no hay pago anual ni
   tramos implementados. Hay que decidir si los tramos y el anual quedan como "Planificada" en los documentos.
2. **Rojo por "fuentes de reputación"**: `/personas` y la ficha del Semáforo dicen que el rojo sale de "fuentes de
   reputación". El rojo sale de señales propias o de la base `amenazas` de SafeLink. No se consulta ninguna
   fuente externa.
3. **Pausar una campaña**: Términos y la ficha de Simulación dicen que se puede pausar. Solo se puede borrar.
4. **Plantillas nombradas en Términos**: Términos dice que las plantillas usan ARCA, Mercado Libre, OCA y Correo
   Argentino. También hay Banco Galicia, Banco Nación, Andreani, AFIP, Mercado Envíos, colegio, CEO, RRHH y
   las automáticas "Estafa real".
5. **"No usa como anzuelo plata"** (Términos): varias plantillas usan plata (transferencia del CEO, tasa de
   aduana de $2.490, devolución de ARCA de $48.900, compra de $186.400, cuota vencida).
6. **"Abiertos: quién abrió el correo"** (ficha de Simulación): mide la apertura de la página, no del correo.
7. **Reportar el mensaje como sospechoso** (Términos: "queda registrada como tal"): no hay un botón para que el
   empleado reporte. Lo más parecido es el enlace "lo hiciste bien" que manda el administrador.
8. **Contacto**: la página muestra `[COMPLETAR: número de WhatsApp]`, y `/empresas` promete soporte por WhatsApp
   Business.
9. **Privacidad usa nombres de funciones** (`guardarAnalisis`, `safelink_reportar_error`, `safelink_analisis`):
   es el mismo problema que marcó el profe en el manual.
10. **Estafas de la semana**: la edición es del 18/10/2026 con 10 días de vigencia, así que hoy está vencida.
11. **Un comentario de línea en el código** (`analisis.js:573`) y otro en `safelink-enriquecer` (línea 193)
    contradicen la convención de no comentar.

## 7. Aclaraciones del profe: qué dice el código

| Observación | Qué hay en el código | Qué hacer en los documentos |
| --- | --- | --- |
| Notas de trabajo y comentarios de revisión en los entregables | — | Sacar todas las notas, comentarios de Word y textos "a validar" o "[COMPLETAR]" |
| RNF "a validar" con notas de la herramienta | Hay métricas medibles: `npm test` (294 pruebas), eval con umbrales que traban el build, tiempos del enriquecimiento (5 saltos, 4 s y 12 s), límites de Faro (30 y 60 por día), planilla (1000 filas y 2 MB), RLS en todas las tablas | Cerrar cada RNF con la métrica, el resultado medido y la herramienta, y borrar la nota |
| PL04: tecnología y alcance desactualizados | Ver la sección 2 | Reemplazar la lista de tecnologías y el alcance por los de hoy |
| Resguardos éticos de la simulación | Términos y `convenio-piloto-safeguard.pdf`: autorización de la organización, solo personas cargadas, sin malware, sin guardar lo escrito, sin sanciones, se informa al personal, excluidos, Ley 25.326 y Ley 26.388 | Sumar una sección "Marco ético y legal" en la propuesta y en la viabilidad legal |
| Manual: que diga qué datos se cargan (nombre, correo, área) | La planilla lleva nombre, correo y área | Decirlo explícito en el manual y sacar los términos técnicos |
| RF03 "registrar si ingresó datos" no dice qué se guarda | Solo se guarda `ingreso_datos = true` y la fecha. El valor escrito no sale del navegador | RF03: "El sistema registra que la persona ingresó datos y la fecha. No guarda lo que escribió". RNF nuevo: "El sistema registra solo que hubo ingreso de datos y nunca almacena los valores ingresados", verificable con `registroSimulacion.test.js` y revisando `eventos_simulacion` |
| Plantillas de bancos y Mercado Libre sin marco ni consentimiento de una empresa real | El convenio cubre la autorización de la organización cliente. No hay permiso de las marcas imitadas | Viabilidad legal: la organización cliente firma el convenio; las marcas se usan con fines educativos y en un entorno cerrado, sin dominios que las imiten ni envíos fuera de la organización; si hace falta, se cambian por marcas genéricas |
| Que el envío de simulaciones esté en Términos | Está, en "PhishGuard: para qué sirve" y "Qué no hace una campaña" | Citarlo. Corregir los puntos 3, 4, 5 y 7 de la sección 6, o decir que se conocen y se van a corregir |
| Diagrama de clases: que diga que se guarda la contraseña | `auth.users.encrypted_password` (hash bcrypt, Supabase Auth). PhishGuard no guarda lo escrito en la simulación | Atributo `contraseña (hash, Supabase Auth)` en Usuario/Cuenta, con una nota de que no es texto plano |
| Datos que parecen distintos por la falta de ñ | Nombres técnicos sin ñ (`campanas`, `area`) | Aclarar la convención y usar los nombres de forma pareja en todos los documentos |
| Ejecutar los casos de prueba | 294 pruebas automáticas pasan. Eval: 3295 casos dentro de los umbrales | Correr los casos manuales en el sitio publicado y anotar el resultado y la evidencia |
| Unificar clases y DER | Ver la sección 5 | Mismos nombres de entidades y atributos en los dos diagramas |
| Falta el Gantt | El repo arranca el 03/10/2026 (79 commits en octubre y 26 en noviembre). Las migraciones tienen fechas desde el 12/09/2026, así que hubo trabajo antes del repo | Hacer el Gantt con las fases reales y estas fechas |
