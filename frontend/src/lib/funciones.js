export const partes = {
  PhishGuard: { ruta: '/empresas', texto: 'Para empresas y escuelas' },
  SafeLink: { ruta: '/personas', texto: 'Para personas y familias' },
  SafeGuard: { ruta: '/', texto: 'Toda la plataforma' },
}

export const funciones = {
  simulacion: {
    parte: 'PhishGuard',
    titulo: 'Simulación',
    bajada:
      'Un mensaje de prueba que se parece a un engaño real. Tu equipo practica a reconocerlo en un lugar seguro, antes de que llegue uno de verdad.',
    datos: [
      ['3 canales', 'Correo, WhatsApp y SMS'],
      ['En español', 'Plantillas con marcas y trámites de acá'],
      ['Sin riesgo', 'No se guardan claves ni datos de pago'],
    ],
    muestra: {
      etiqueta: 'Correo de prueba',
      entrada: [
        ['De', 'Banco Nación <avisos@...>'],
        ['Asunto', 'Validá tu cuenta antes de las 18 h'],
      ],
      color: 'amarillo',
      veredicto: 'Simulación en curso',
      motivos: ['12 personas lo recibieron.', '3 tocaron el enlace y ya vieron la explicación.'],
    },
    paraQue: [
      'La mayoría de los ataques a una empresa no empiezan con un virus: empiezan con un mensaje que alguien abre apurado. La simulación entrena justo ese momento.',
      'Mandás un mensaje que imita a un banco, a ARCA, a un envío o a un proveedor. Si alguien cae, no pasa nada malo: aprende en el momento y vos sabés dónde reforzar.',
    ],
    cuando: [
      'Cuando arranca alguien nuevo en el equipo.',
      'Antes de fechas con muchas estafas: aguinaldo, vencimientos de ARCA, ventas especiales.',
      'Después de un incidente, para medir si el equipo mejoró.',
      'Como rutina, una vez por mes o por trimestre.',
    ],
    pasos: [
      ['Elegís la plantilla', 'Hay modelos en español: banco, ARCA, envío, colegio, Mercado Libre y más. Cada uno trae el texto y la página de prueba.'],
      ['Elegís el canal', 'Correo, WhatsApp o SMS. El correo llega a la bandeja de cada persona como un mensaje común.'],
      ['Elegís a quién', 'Marcás personas de tu lista o pedís una cantidad al azar, para que nadie sepa de antemano a quién le toca.'],
      ['Seguís los resultados', 'En el tablero ves quién lo abrió, quién tocó el enlace y quién cargó datos. Cada caída queda en el historial.'],
    ],
    revisa: {
      titulo: 'Qué medís en cada campaña',
      items: [
        ['Enviados', 'Cuántos mensajes salieron y a quiénes.'],
        ['Abiertos', 'Quién abrió el correo.'],
        ['Clics', 'Quién tocó el enlace de prueba.'],
        ['Datos cargados', 'Quién llegó a escribir algo en la página falsa. Lo escrito no se guarda.'],
      ],
    },
    consejos: [
      'Empezá con una plantilla fácil y subí la dificultad de a poco.',
      'Contale al equipo que van a existir simulaciones, sin decir cuándo.',
      'Mirá el porcentaje del equipo, no a la persona que cayó.',
    ],
    preguntas: [
      ['¿Puedo mandarle una simulación a cualquier correo?', 'No. Solo a las personas que tu organización cargó y autorizó. Es un ejercicio interno de capacitación.'],
      ['¿Qué pasa si alguien escribe su clave?', 'La página de prueba no guarda contraseñas ni datos de pago. Solo registra que llegó a ese paso.'],
      ['¿Puedo frenar una campaña?', 'Sí. Quien administra puede pausarla o borrarla cuando quiera, con todos sus resultados.'],
    ],
    nota: 'PhishGuard es un ejercicio de capacitación, no un ataque. Las condiciones completas están en Términos y condiciones.',
    accion: { texto: 'Conocer PhishGuard', ruta: '/empresas' },
    relacionadas: ['explicacion', 'correo', 'nube'],
  },

  explicacion: {
    parte: 'PhishGuard',
    titulo: 'Explicación',
    bajada:
      'Cuando alguien cae en la simulación no recibe un reto. Ve, en ese mismo momento, qué señales tenía el mensaje y cómo darse cuenta la próxima vez.',
    datos: [
      ['Al instante', 'Aparece apenas toca el enlace'],
      ['Sin sanciones', 'Se enseña, no se castiga'],
      ['Concreta', 'Muestra las pistas de ese mensaje'],
    ],
    muestra: {
      etiqueta: 'Lo que ve la persona',
      entrada: [['Título', 'Esto era una prueba de tu equipo']],
      color: 'verde',
      veredicto: 'Ahora ya lo sabés',
      motivos: [
        'El remitente no era del banco: era una cuenta cualquiera.',
        'Te apuraba con un horario límite.',
        'El botón llevaba a otra dirección.',
      ],
    },
    paraQue: [
      'Se aprende mucho más en el momento del error que en una charla de una hora. Por eso la explicación aparece justo cuando la persona toca el enlace, con el mensaje todavía fresco.',
      'No señala a nadie ni da vergüenza. Le habla a la persona en tono amable y le deja una o dos ideas para recordar.',
    ],
    cuando: [
      'Se muestra sola en cada simulación: no hay que configurarla.',
      'Aparece si la persona toca el enlace o intenta cargar datos.',
      'Quien administra puede revisar después qué vio cada uno.',
    ],
    pasos: [
      ['La persona toca el enlace', 'En vez de una página falsa que roba datos, llega a la explicación de SafeGuard.'],
      ['Ve qué pasó', 'Le contamos que era una prueba interna y que no se guardó nada de lo que escribió.'],
      ['Ve las pistas', 'Le mostramos las señales de ese mensaje: el remitente, la urgencia, el enlace que no coincidía.'],
      ['Se lleva un consejo', 'Una regla corta para la próxima vez, por ejemplo: entrá al banco escribiendo la dirección vos.'],
    ],
    revisa: {
      titulo: 'Qué señales explica',
      items: [
        ['Remitente', 'Un nombre conocido que escribe desde otra dirección.'],
        ['Urgencia', 'Plazos cortos, bloqueos y amenazas para que no pienses.'],
        ['Enlace', 'El texto dice una cosa y el clic lleva a otra.'],
        ['Pedido', 'Claves, códigos o pagos que nadie pide por un mensaje.'],
      ],
    },
    consejos: [
      'Leé el remitente completo, no solo el nombre.',
      'Si un mensaje te apura, frená un minuto.',
      'Ante la duda, entrá al sitio oficial escribiendo la dirección.',
    ],
    preguntas: [
      ['¿El jefe ve quién cayó?', 'Sí, en el tablero y en el historial de la campaña, para planificar la capacitación. No es una evaluación de desempeño.'],
      ['¿La persona se entera de que era una prueba?', 'Sí, en el mismo momento. Así no queda con miedo ni con dudas.'],
      ['¿Se guarda lo que escribió?', 'No. La página de prueba no guarda contraseñas ni datos de pago.'],
    ],
    nota: 'Los resultados sirven para enseñar. No se usan para sancionar ni para evaluar el desempeño de nadie.',
    accion: { texto: 'Conocer PhishGuard', ruta: '/empresas' },
    relacionadas: ['simulacion', 'semaforo', 'correo'],
  },

  semaforo: {
    parte: 'SafeLink',
    titulo: 'Semáforo',
    bajada:
      'SafeLink revisa un enlace, un WhatsApp, un PDF o un correo y te contesta con un color y un motivo. Nada de informes técnicos: sabés qué hacer en un segundo.',
    datos: [
      ['3 colores', 'Verde, amarillo o rojo'],
      ['Con motivo', 'Siempre te decimos por qué'],
      ['4 formas', 'Enlace, WhatsApp, PDF y correo'],
    ],
    muestra: { etiqueta: 'Cómo leerlo', semaforo: true },
    paraQue: [
      'Un engaño bien armado se ve igual que un mensaje real. El semáforo junta muchas revisiones en una sola respuesta que se entiende a primera vista.',
      'Al lado del color siempre va una frase con el motivo, para que no solo sepas qué hacer: también aprendés a reconocerlo.',
    ],
    cuando: [
      'Te llega un link que no esperabas.',
      'Un conocido te reenvía una cadena con premios o descuentos.',
      'Te mandan una factura o un comprobante en PDF.',
      'Un correo dice ser de tu banco, de ARCA o de tu trabajo.',
    ],
    pasos: [
      ['Pegás o subís', 'Un enlace, un mensaje de WhatsApp, un PDF o un correo.'],
      ['Revisamos', 'Miramos la dirección, a dónde lleva, la edad del dominio, si imita una marca y qué hay adentro.'],
      ['Sumamos señales', 'Cada pista suma. Una sola señal fuerte alcanza para un rojo.'],
      ['Te respondemos', 'Un color, un motivo en palabras simples y qué te conviene hacer.'],
    ],
    revisa: {
      titulo: 'Qué significa cada color',
      items: [
        ['Verde', 'No aparecieron señales de riesgo en esta revisión. Podés seguir.'],
        ['Amarillo', 'Hay algo raro. Revisá con calma antes de tocar nada.'],
        ['Rojo', 'Fuentes de reputación o señales fuertes lo marcan como peligroso. No lo abras.'],
      ],
    },
    consejos: [
      'Un verde no es permiso para dar una clave: eso no se hace desde un mensaje.',
      'Si sale amarillo, preguntale a quien te lo mandó por otro medio.',
      'Si sale rojo, borralo y avisale a quien te lo reenvió.',
    ],
    preguntas: [
      ['¿El verde es una garantía?', 'Es una buena señal, no una garantía. Dice que en esa revisión no aparecieron señales fuertes.'],
      ['¿SafeLink bloquea páginas?', 'No. Te avisa con un color y vos decidís. No frena tu navegación.'],
      ['¿Por qué cambió el color de un enlace?', 'Un sitio puede volverse peligroso con el tiempo. Cada revisión mira cómo está en ese momento.'],
    ],
    nota: 'SafeLink no reemplaza al antivirus ni al firewall. Es una segunda mirada antes de abrir algo.',
    accion: { texto: 'Conocer SafeLink', ruta: '/personas' },
    relacionadas: ['enlace', 'whatsapp', 'pdf'],
  },

  nube: {
    parte: 'SafeGuard',
    titulo: 'En la nube',
    bajada:
      'Todo SafeGuard funciona desde el navegador. No hay que instalar programas en cada computadora ni pedirle a sistemas que toque cada equipo.',
    datos: [
      ['0 instalaciones', 'Se usa desde la web'],
      ['Cualquier equipo', 'Computadora o celular'],
      ['Siempre al día', 'Las mejoras llegan solas'],
    ],
    muestra: {
      etiqueta: 'Dónde lo usás',
      entrada: [
        ['Web', 'Cualquier navegador moderno'],
        ['Celular', 'Desde el navegador o como app'],
      ],
      color: 'verde',
      veredicto: 'Listo para usar',
      motivos: ['Entrás con tu cuenta y seguís donde lo dejaste.'],
    },
    paraQue: [
      'Instalar un programa en cada computadora lleva tiempo, permisos y mantenimiento. En la nube, una empresa arma su primera campaña el mismo día y una persona revisa un enlace desde el celular sin descargar nada.',
      'Tus revisiones, tus campañas y tus resultados quedan en tu cuenta: los ves desde cualquier equipo.',
    ],
    cuando: [
      'Tu empresa no tiene un área de sistemas grande.',
      'Querés probar PhishGuard sin tocar la red de la oficina.',
      'Necesitás revisar algo desde el celular, en la calle.',
    ],
    pasos: [
      ['Entrás', 'Con tu correo o con Google. La cuenta es opcional para SafeLink.'],
      ['Usás', 'Revisás enlaces o armás campañas desde el panel.'],
      ['Se guarda', 'El historial y los resultados quedan en tu cuenta.'],
      ['Seguís en otro lado', 'Entrás desde otro equipo y está todo.'],
    ],
    revisa: {
      titulo: 'Qué incluye',
      items: [
        ['Panel web', 'PhishGuard se arma y se sigue desde el navegador.'],
        ['SafeLink', 'Revisión de enlaces, WhatsApp, PDF y correos.'],
        ['Historial', 'Tus revisiones guardadas, si usás cuenta.'],
        ['Avisos', 'SafeLink avisa con un color: no bloquea tu navegación.'],
      ],
    },
    consejos: [
      'Usá una clave larga o entrá con Google.',
      'Cerrá la sesión en computadoras compartidas.',
      'Si cambiás de equipo, no perdés nada: entrá con la misma cuenta.',
    ],
    preguntas: [
      ['¿Necesito instalar algo?', 'No. Todo funciona desde el navegador.'],
      ['¿Dónde quedan mis datos?', 'En tu cuenta. Qué se analiza y qué sale de tu navegador está explicado en Privacidad.'],
      ['¿Puedo borrar mi cuenta?', 'Sí, desde tu perfil. Se borran tus datos.'],
    ],
    nota: 'Algunas revisiones, como la del PDF, pasan completas en tu navegador y el archivo no sale de tu equipo.',
    accion: { texto: 'Ver privacidad', ruta: '/privacidad' },
    relacionadas: ['semaforo', 'simulacion', 'pdf'],
  },

  enlace: {
    parte: 'SafeLink',
    titulo: 'Revisar un enlace',
    bajada:
      'Pegás la dirección antes de abrirla y SafeLink te dice si es segura. Si es un link acortado, como bit.ly, lo seguimos por vos y te mostramos a dónde lleva de verdad.',
    datos: [
      ['Segundos', 'La respuesta llega enseguida'],
      ['Acortadores', 'Vemos el destino real'],
      ['Historial', 'Con cuenta, queda guardado'],
    ],
    muestra: {
      etiqueta: 'Ejemplo',
      entrada: [['Enlace', 'bit.ly/promo-banco']],
      color: 'rojo',
      veredicto: 'Peligroso',
      motivos: [
        'El acortador termina en bancco-nacion-ar.com.',
        'El dominio se creó hace pocos días.',
        'La página pide una clave.',
      ],
    },
    paraQue: [
      'Un enlace puede tener el nombre de tu banco y llevar a cualquier lado. A simple vista una letra cambiada o un dominio raro pasan desapercibidos.',
      'SafeLink mira la dirección completa, sigue los saltos hasta el destino final y revisa qué hace esa página, sin que vos tengas que abrirla.',
    ],
    cuando: [
      'Te llega un link por mensaje, mail o redes que no esperabas.',
      'El link está acortado y no sabés a dónde va.',
      'Una oferta parece demasiado buena.',
      'Te piden entrar a "validar" o "desbloquear" una cuenta.',
    ],
    pasos: [
      ['Copiá el link', 'Mantené apretado el enlace y elegí Copiar. No lo abras.'],
      ['Pegalo', 'En Revisar un enlace, dentro de tu panel.'],
      ['Lo revisamos', 'Dominio, destino final, edad del sitio, certificado y lo que pide la página.'],
      ['Leé el resultado', 'El color, el motivo y qué te conviene hacer.'],
    ],
    revisa: {
      titulo: 'Qué revisamos',
      items: [
        ['Imitación de marca', 'Letras cambiadas o nombres de bancos y tiendas en un dominio que no es el oficial.'],
        ['Destino real', 'Seguimos acortadores y redirecciones hasta la última página.'],
        ['Edad y certificado', 'Un dominio de pocos días o un certificado recién sacado es una señal.'],
        ['Qué pide la página', 'Formularios que mandan claves, CBU o tarjetas a otro sitio, o descargas de programas.'],
      ],
    },
    consejos: [
      'Mirá lo que va justo antes del primer "/": ese es el dominio real.',
      'Tu banco no te manda links para "validar" tu cuenta.',
      'Si podés, entrá escribiendo la dirección oficial vos.',
    ],
    preguntas: [
      ['¿Abren el enlace por mí?', 'Seguimos la dirección para ver a dónde lleva y qué contiene, sin que vos lo abras en tu equipo.'],
      ['¿Necesito cuenta?', 'Con cuenta, cada enlace queda guardado en Mis enlaces y podés reportarlo.'],
      ['¿Sirve para links de WhatsApp?', 'Sí. Y si tenés el mensaje entero, mejor usá Pegar un WhatsApp: revisa también el texto.'],
    ],
    nota: 'Un verde dice que no hubo señales fuertes en esa revisión. Una clave, un código o un pago igual no se hacen desde un enlace que llegó en un mensaje.',
    accion: { texto: 'Revisar un enlace', ruta: '/panel/enlaces', cuenta: true },
    relacionadas: ['whatsapp', 'correo', 'semaforo'],
  },

  whatsapp: {
    parte: 'SafeLink',
    titulo: 'Pegar un WhatsApp',
    bajada:
      'Copiás el mensaje entero que te llegó y SafeLink lo revisa. No hace falta que encuentres el enlace: separamos el texto, el número y los links por vos.',
    datos: [
      ['Todo junto', 'Texto, número y enlaces'],
      ['Trucos comunes', 'Urgencia, premios, códigos'],
      ['De acá', 'Detecta CBU, CVU y alias'],
    ],
    muestra: {
      etiqueta: 'Ejemplo',
      entrada: [['Mensaje', 'Hola, soy del banco. Tu cuenta se bloquea hoy. Entrá acá: bit.ly/xxxx']],
      color: 'rojo',
      veredicto: 'Peligroso',
      motivos: [
        'El mensaje apura: pide que actúes ahora.',
        'Se hace pasar por un banco, pero escribe como un desconocido.',
      ],
    },
    paraQue: [
      'Por WhatsApp llegan los engaños más comunes: el falso familiar que cambió de número, el premio que hay que reclamar, el banco que pide un código.',
      'Muchas veces el peligro no está en un link sino en lo que te piden. SafeLink lee el mensaje completo y te avisa qué parte es sospechosa.',
    ],
    cuando: [
      'Alguien dice que cambió de número y te pide plata.',
      'Te piden un código que te llegó por SMS.',
      'Te prometen un premio, un reintegro o un regalo.',
      'Te llega un mensaje de un número del exterior.',
    ],
    pasos: [
      ['Copiá el mensaje', 'Mantené apretado el globo del mensaje y elegí Copiar.'],
      ['Pegalo entero', 'En Pegar un WhatsApp. Si tiene el número del remitente, mejor.'],
      ['Lo separamos', 'Sacamos el texto, el número y cada enlace, y revisamos todo.'],
      ['Leé el resultado', 'El color y qué truco usa el mensaje, en una frase.'],
    ],
    revisa: {
      titulo: 'Qué revisamos',
      items: [
        ['Pedidos peligrosos', 'Códigos de verificación, transferencias, CBU, CVU o alias.'],
        ['Presión', 'Urgencia, amenazas de bloqueo o premios que hay que reclamar ya.'],
        ['Remitente', 'Números del exterior o que se hacen pasar por una marca.'],
        ['Enlaces y trucos', 'Links camuflados, caracteres invisibles y pedidos de instalar una app.'],
      ],
    },
    consejos: [
      'El código que te llega por SMS no se le pasa a nadie, nunca.',
      'Si un familiar cambió de número, llamalo al número de siempre.',
      'Un banco no te pide un CBU ni una clave por WhatsApp.',
    ],
    preguntas: [
      ['¿Se guarda el texto de mi mensaje?', 'El texto se revisa para darte el resultado. Para seguir un enlace solo se consulta la dirección.'],
      ['¿Y si el mensaje no tiene link?', 'Igual lo revisamos: muchos engaños solo piden un código o una transferencia.'],
      ['¿Sirve para Telegram o SMS?', 'Sí. Pegá el texto igual, las señales son las mismas.'],
    ],
    nota: 'Si ya pasaste un código o hiciste una transferencia, llamá a tu banco por el número oficial lo antes posible.',
    accion: { texto: 'Pegar un WhatsApp', ruta: '/panel/whatsapp', cuenta: true },
    relacionadas: ['enlace', 'semaforo', 'correo'],
  },

  pdf: {
    parte: 'SafeLink',
    titulo: 'Revisar un PDF',
    bajada:
      'Subís un PDF que te mandaron y SafeLink mira si esconde algo antes de que lo abras: enlaces raros, código, formularios que piden datos o archivos escondidos adentro.',
    datos: [
      ['En tu equipo', 'El archivo no se sube'],
      ['Por dentro', 'Scripts, formularios y adjuntos'],
      ['Sus enlaces', 'Cada link se revisa aparte'],
    ],
    muestra: {
      etiqueta: 'Ejemplo',
      entrada: [['Archivo', 'factura_noviembre.pdf']],
      color: 'rojo',
      veredicto: 'Peligroso',
      motivos: [
        'Ejecuta JavaScript. Un PDF de una factura no lo necesita.',
        'Tiene un formulario: puede pedir datos.',
      ],
    },
    paraQue: [
      'Un PDF parece inofensivo, pero puede traer código que se ejecuta al abrirlo, formularios que piden claves o enlaces a páginas falsas.',
      'SafeLink lo lee por dentro, sin abrirlo como lo haría un lector común, y te dice si hay algo que una factura o un comprobante no deberían tener.',
    ],
    cuando: [
      'Te llega una factura de un proveedor que no esperabas.',
      'Un comprobante de pago o de envío de alguien que no conocés.',
      'Un "resumen de cuenta" que no llegó por el canal de siempre.',
      'Un CV o un documento en un correo de alguien desconocido.',
    ],
    pasos: [
      ['Elegí el archivo', 'Desde tu computadora o tu celular. No hace falta abrirlo.'],
      ['Lo leemos en tu navegador', 'El archivo no se sube a ningún servidor.'],
      ['Buscamos lo escondido', 'Acciones automáticas, código, formularios, adjuntos y enlaces.'],
      ['Leé el resultado', 'El color y qué encontramos, explicado simple.'],
    ],
    revisa: {
      titulo: 'Qué revisamos',
      items: [
        ['Acciones automáticas', 'Cosas que se disparan al abrir el archivo o al pasar el mouse.'],
        ['Código', 'JavaScript, contenido embebido o intentos de abrir un programa.'],
        ['Formularios y adjuntos', 'Campos que piden datos y archivos escondidos adentro.'],
        ['Enlaces', 'Cada link del PDF, y si habla de una marca pero lleva a otro dominio.'],
      ],
    },
    consejos: [
      'Una factura no necesita que habilites nada para verse.',
      'Si el PDF está cifrado y no esperabas uno, desconfiá.',
      'Si el archivo te pide una clave para "ver el documento", no la pongas.',
    ],
    preguntas: [
      ['¿Suben mi archivo?', 'No. El PDF se lee en tu navegador y no sale de tu equipo.'],
      ['¿Y si está cifrado?', 'Te avisamos: un PDF cifrado no deja ver qué hace hasta abrirlo con una clave.'],
      ['¿Revisa Word o Excel?', 'Por ahora solo PDF.'],
    ],
    nota: 'El archivo se lee en tu navegador. No se sube a ningún servidor.',
    accion: { texto: 'Revisar un PDF', ruta: '/panel/pdf', cuenta: true },
    relacionadas: ['correo', 'enlace', 'nube'],
  },

  correo: {
    parte: 'SafeLink',
    titulo: 'Revisar un correo',
    bajada:
      'Un correo puede mostrar el nombre de tu banco y venir de cualquier lado. SafeLink lee los datos ocultos del mensaje y te dice si el remitente es quien dice ser.',
    datos: [
      ['SPF, DKIM, DMARC', 'Los controles del remitente'],
      ['Enlaces', 'Lo que dice contra a dónde va'],
      ['Adjuntos', 'Extensiones peligrosas'],
    ],
    muestra: {
      etiqueta: 'Ejemplo',
      entrada: [
        ['De', 'Mercado Pago <soporte@mp-seguridad.net>'],
        ['Asunto', 'Actividad inusual en tu cuenta'],
      ],
      color: 'rojo',
      veredicto: 'Peligroso',
      motivos: [
        'El nombre se hace pasar por Mercado Pago y escribe desde mp-seguridad.net.',
        'El texto muestra mercadopago.com, pero el clic va a otro sitio.',
      ],
    },
    paraQue: [
      'En un correo, el nombre que ves lo elige quien lo manda. Lo que no se puede falsificar tan fácil son los datos ocultos: desde qué servidor salió y si el dominio lo autorizó.',
      'SafeLink lee esos datos y los traduce a una respuesta simple: si el correo es de quien dice ser, y si los enlaces llevan a donde prometen.',
    ],
    cuando: [
      'Un correo dice ser de tu banco, de ARCA o de una tienda.',
      'Alguien de "sistemas" o "RRHH" te pide una clave.',
      'Te llega un adjunto que no esperabas.',
      'Te piden pagar o cambiar los datos de una cuenta.',
    ],
    pasos: [
      ['Abrí el original', 'En Gmail: abrí el correo, tocá los tres puntitos y elegí Mostrar original.'],
      ['Copiá todo', 'Incluidos los encabezados de arriba. Ahí están los datos que importan.'],
      ['Pegalo', 'En Revisar un correo, dentro de tu panel.'],
      ['Leé el resultado', 'El color, si el remitente es real y qué enlaces o adjuntos son peligrosos.'],
    ],
    revisa: {
      titulo: 'Qué revisamos',
      items: [
        ['Remitente', 'SPF, DKIM y DMARC: si el correo salió de donde dice y si el dominio lo autoriza.'],
        ['Nombre contra dirección', 'Un nombre de marca que escribe desde otro dominio o desde una cuenta personal.'],
        ['Respuesta', 'Si al contestar, tu correo se va a otra dirección.'],
        ['Enlaces y adjuntos', 'Links que no coinciden con su texto y archivos que pueden ejecutarse.'],
      ],
    },
    consejos: [
      'Leé la dirección completa del remitente, no solo el nombre.',
      'Ningún área de sistemas real te pide la clave por correo.',
      'Un adjunto ".pdf.exe" no es un PDF.',
    ],
    preguntas: [
      ['¿Por qué tengo que pegar el original?', 'Porque los datos del remitente están en los encabezados, que no se ven en el correo normal.'],
      ['¿Funciona con Outlook?', 'Sí. Buscá la opción Ver origen del mensaje o Ver código fuente y pegá todo.'],
      ['¿Y si DMARC pasa?', 'Es buena señal, pero un dominio trucho también puede pasar sus propios controles. Por eso miramos además si imita una marca.'],
    ],
    nota: 'Si el correo te pide una clave o un pago, entrá a la página oficial escribiendo la dirección vos mismo.',
    accion: { texto: 'Revisar un correo', ruta: '/panel/correo', cuenta: true },
    relacionadas: ['enlace', 'pdf', 'simulacion'],
  },
}
