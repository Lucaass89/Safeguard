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
    muestra: {
      etiqueta: 'Correo de prueba',
      entrada: [
        ['De', 'Banco Aurora <avisos@...>'],
        ['Asunto', 'Validá tu cuenta antes de las 18 h'],
      ],
      color: 'amarillo',
      veredicto: 'Simulación en curso',
      motivos: ['12 personas lo recibieron.', '3 tocaron el enlace y ya vieron la explicación.'],
    },
    pasos: [
      ['Elegís la plantilla', 'Hay modelos en español: banco, organismo fiscal, envío, colegio, tienda y más, con marcas ficticias. Cada uno trae el texto y la página de prueba.'],
      ['Elegís el canal', 'Correo, WhatsApp o SMS. El correo llega a la bandeja de cada persona como un mensaje común.'],
      ['Elegís a quién', 'Marcás personas de tu lista o pedís una cantidad al azar, para que nadie sepa de antemano a quién le toca.'],
      ['Seguís los resultados', 'En el tablero ves quién lo abrió, quién tocó el enlace y quién cargó datos. Cada caída queda en el historial.'],
    ],
    consejos: [
      'Empezá con una plantilla fácil y subí la dificultad de a poco.',
      'Contale al equipo que van a existir simulaciones, sin decir cuándo.',
      'Mirá el porcentaje del equipo, no a la persona que cayó.',
    ],
    preguntas: [
      ['¿Puedo mandarle una simulación a cualquier correo?', 'No. Solo a las personas que tu organización cargó y autorizó. Es un ejercicio interno de capacitación.'],
      ['¿Qué pasa si alguien escribe su clave?', 'La página de prueba no guarda contraseñas ni datos de pago. Solo registra que llegó a ese paso.'],
      ['¿Puedo frenar una campaña?', 'Sí. Quien administra puede borrarla cuando quiera, con todos sus resultados.'],
    ],
    nota: 'PhishGuard es un ejercicio de capacitación, no un ataque. Las condiciones completas están en Términos y condiciones.',
    accion: { texto: 'Conocer PhishGuard', ruta: '/empresas' },
  },

  explicacion: {
    parte: 'PhishGuard',
    titulo: 'Explicación',
    bajada:
      'Cuando alguien cae en la simulación no recibe un reto. Ve, en ese mismo momento, qué señales tenía el mensaje y cómo darse cuenta la próxima vez.',
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
    pasos: [
      ['La persona toca el enlace', 'En vez de una página falsa que roba datos, llega a la explicación de SafeGuard.'],
      ['Ve qué pasó', 'Le contamos que era una prueba interna y que no se guardó nada de lo que escribió.'],
      ['Ve las pistas', 'Le mostramos las señales de ese mensaje: el remitente, la urgencia, el enlace que no coincidía.'],
      ['Se lleva un consejo', 'Una regla corta para la próxima vez, por ejemplo: entrá al banco escribiendo la dirección vos.'],
    ],
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
  },

  semaforo: {
    parte: 'SafeLink',
    titulo: 'Semáforo',
    bajada:
      'SafeLink revisa un enlace, un WhatsApp, un PDF o un correo y te contesta con un color y un motivo. Nada de informes técnicos: sabés qué hacer en un segundo.',
    muestra: { etiqueta: 'Cómo leerlo', semaforo: true },
    pasos: [
      ['Pegás o subís', 'Un enlace, un mensaje de WhatsApp, un PDF o un correo.'],
      ['Revisamos', 'Miramos la dirección, a dónde lleva, la edad del dominio, si imita una marca y qué hay adentro.'],
      ['Sumamos señales', 'Cada pista suma. Una sola señal fuerte alcanza para un rojo.'],
      ['Te respondemos', 'Un color, un motivo en palabras simples y qué te conviene hacer.'],
    ],
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
  },

  nube: {
    parte: 'SafeGuard',
    titulo: 'En la nube',
    bajada:
      'Todo SafeGuard funciona desde el navegador. No hay que instalar programas en cada computadora ni pedirle a sistemas que toque cada equipo.',
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
    pasos: [
      ['Entrás', 'Con tu correo o con Google. La cuenta es opcional para SafeLink.'],
      ['Usás', 'Revisás enlaces o armás campañas desde el panel.'],
      ['Se guarda', 'El historial y los resultados quedan en tu cuenta.'],
      ['Seguís en otro lado', 'Entrás desde otro equipo y está todo.'],
    ],
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
  },

  enlace: {
    parte: 'SafeLink',
    titulo: 'Revisar un enlace',
    bajada:
      'Pegás la dirección antes de abrirla y SafeLink te dice si es segura. Si es un link acortado, como bit.ly, lo seguimos por vos y te mostramos a dónde lleva de verdad.',
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
    pasos: [
      ['Copiá el link', 'Mantené apretado el enlace y elegí Copiar. No lo abras.'],
      ['Pegalo', 'En Revisar un enlace, dentro de tu panel.'],
      ['Lo revisamos', 'Dominio, destino final, edad del sitio, certificado y lo que pide la página.'],
      ['Leé el resultado', 'El color, el motivo y qué te conviene hacer.'],
    ],
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
  },

  whatsapp: {
    parte: 'SafeLink',
    titulo: 'Pegar un WhatsApp',
    bajada:
      'Copiás el mensaje entero que te llegó y SafeLink lo revisa. No hace falta que encuentres el enlace: separamos el texto, el número y los links por vos.',
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
    pasos: [
      ['Copiá el mensaje', 'Mantené apretado el globo del mensaje y elegí Copiar.'],
      ['Pegalo entero', 'En Pegar un WhatsApp. Si tiene el número del remitente, mejor.'],
      ['Lo separamos', 'Sacamos el texto, el número y cada enlace, y revisamos todo.'],
      ['Leé el resultado', 'El color y qué truco usa el mensaje, en una frase.'],
    ],
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
  },

  pdf: {
    parte: 'SafeLink',
    titulo: 'Revisar un PDF',
    bajada:
      'Subís un PDF que te mandaron y SafeLink mira si esconde algo antes de que lo abras: enlaces raros, código, formularios que piden datos o archivos escondidos adentro.',
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
    pasos: [
      ['Elegí el archivo', 'Desde tu computadora o tu celular. No hace falta abrirlo.'],
      ['Lo leemos en tu navegador', 'El archivo no se sube a ningún servidor.'],
      ['Buscamos lo escondido', 'Acciones automáticas, código, formularios, adjuntos y enlaces.'],
      ['Leé el resultado', 'El color y qué encontramos, explicado simple.'],
    ],
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
  },

  correo: {
    parte: 'SafeLink',
    titulo: 'Revisar un correo',
    bajada:
      'Un correo puede mostrar el nombre de tu banco y venir de cualquier lado. SafeLink lee los datos ocultos del mensaje y te dice si el remitente es quien dice ser.',
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
    pasos: [
      ['Abrí el original', 'En Gmail: abrí el correo, tocá los tres puntitos y elegí Mostrar original.'],
      ['Copiá todo', 'Incluidos los encabezados de arriba. Ahí están los datos que importan.'],
      ['Pegalo', 'En Revisar un correo, dentro de tu panel.'],
      ['Leé el resultado', 'El color, si el remitente es real y qué enlaces o adjuntos son peligrosos.'],
    ],
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
  },
}
