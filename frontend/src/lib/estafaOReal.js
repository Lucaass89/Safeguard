// Las estafas copian plantillas de PhishGuard (supabase/migrations) con su metadata.lesson.
// El {link} se reemplaza por un dominio que SafeLink marca, para que su veredicto coincida.
export const MENSAJES = [
  {
    id: 'bna-clave',
    estafa: true,
    canal: 'email',
    remitente: 'Banco Nación <seguridad@bna-acceso.com>',
    asunto: 'BNA: tu clave de home banking vence hoy',
    texto:
      'Estimado cliente,\n\nPor una actualización de seguridad, tu clave de home banking vence hoy a las 18.\nRenovala acá para no quedar sin acceso:\n\nbna-acceso.com/clave',
    enlace: 'bna-acceso.com/clave',
    leccion: {
      titulo: 'La clave no se renueva por un enlace',
      cuerpo:
        'El Banco Nación no pide la clave por correo ni avisa que vence hoy. Se entra escribiendo hb.redlink.com.ar o desde la app oficial, no desde un botón del mensaje.',
    },
  },
  {
    id: 'arca-devolucion',
    estafa: true,
    canal: 'email',
    remitente: 'ARCA <devoluciones@arca-gob.com>',
    asunto: 'ARCA: devolución de $48.900 disponible',
    texto:
      'Contribuyente,\n\nTenés una devolución de $48.900 a favor. Para acreditarla en tu cuenta hay que confirmar el CBU antes del viernes:\n\narca-gob.com/devolucion',
    enlace: 'arca-gob.com/devolucion',
    leccion: {
      titulo: 'ARCA no deposita por un enlace',
      cuerpo:
        'Una devolución de AFIP o ARCA se ve entrando a arca.gob.ar, escrito por uno mismo. Un mail que pide el CBU o la clave fiscal para acreditar es el anzuelo.',
    },
  },
  {
    id: 'afip-intimacion',
    estafa: true,
    canal: 'email',
    remitente: 'AFIP',
    asunto: 'Intimación: presentá el F. 931',
    texto:
      'Detectamos una inconsistencia en tus declaraciones. Ingresá con clave fiscal para evitar la multa: afip-intimaciones.com/931',
    enlace: 'afip-intimaciones.com/931',
    leccion: {
      titulo: 'AFIP no manda un link genérico',
      cuerpo:
        'La intimación verdadera está en el domicilio fiscal electrónico. Si el remitente no es un dominio oficial, no entres.',
    },
  },
  {
    id: 'ml-compra-pendiente',
    estafa: true,
    canal: 'email',
    remitente: 'Mercado Libre',
    asunto: 'Tu compra quedó pendiente de pago',
    texto:
      'Hola. Registramos un pedido a tu nombre y el pago no se completó. Si no lo confirmás en las próximas 24 horas, se cancela y se libera el producto.\n\nConfirmá la compra desde este aviso:\nmercadolibre-compras.com/confirmar',
    enlace: 'mercadolibre-compras.com/confirmar',
    leccion: {
      titulo: 'La tienda de verdad no se abre desde un mail',
      cuerpo:
        'Si fuera el sitio oficial, la barra del navegador diría mercadolibre.com.ar. Una compra se hace entrando vos a la app o al sitio que ya conocés, no desde un enlace que llegó en un mensaje.',
    },
  },
  {
    id: 'mercado-envios-reprogramar',
    estafa: true,
    canal: 'whatsapp',
    remitente: 'Mercado Envíos',
    texto: 'No pudimos dejar tu pedido. Reprogramá la entrega en las próximas 24 h: mercadolibre-envios.com/reprogramar',
    enlace: 'mercadolibre-envios.com/reprogramar',
    leccion: {
      titulo: 'El envío se ve dentro de Mercado Libre',
      cuerpo:
        'Mercado Envíos avisa en la compra, dentro de la app o el sitio donde ya iniciaste sesión. Un WhatsApp para reprogramar y cargar la dirección otra vez no es el aviso del pedido.',
    },
  },
  {
    id: 'oca-envio',
    estafa: true,
    canal: 'sms',
    remitente: 'OCA',
    texto: 'OCA: tu envio esta en camino. Seguí el paquete y confirmá la dirección: bit.ly/3oCaEnv',
    enlace: 'bit.ly/3oCaEnv',
    leccion: {
      titulo: 'El seguimiento se abre en oca.com.ar',
      cuerpo:
        'OCA muestra el envío en su sitio, con el número de seguimiento. Un SMS con un enlace corto para confirmar la dirección pide datos que el correo ya tiene.',
    },
  },
  {
    id: 'correo-aduana',
    estafa: true,
    canal: 'sms',
    remitente: 'Correo Argentino',
    texto: 'Tu paquete no se pudo entregar. Pagá $2.490 de aduana en 24 hs o vuelve al centro: correoargentino-aduana.com/pagar',
    enlace: 'correoargentino-aduana.com/pagar',
    leccion: {
      titulo: 'Correo Argentino no cobra por un SMS',
      cuerpo:
        'El paquete retenido es la estafa más común de la región. El verdadero correo no manda un link genérico ni pide una tasa por mensaje de texto.',
    },
  },
  {
    id: 'ceo-transferencia',
    estafa: true,
    canal: 'whatsapp',
    remitente: 'Director',
    texto:
      'Hola, soy el director. Estoy en una reunión y no puedo hablar. Necesito que hagas una transferencia ahora, el proveedor no espera. Entrá acá y confirmá: bit.ly/pago-prov',
    enlace: 'bit.ly/pago-prov',
    leccion: {
      titulo: 'El jefe no pide transferencias por WhatsApp',
      cuerpo:
        'Un CEO real llama, manda un mail corporativo o pasa por finanzas. El apuro, el secreto y el enlace son el engaño. Si alguien se hace pasar por gerencia, cortá y confirmá por otro canal.',
    },
  },
  {
    id: 'bna-codigo',
    estafa: false,
    canal: 'sms',
    remitente: 'BNA',
    texto: 'Tu código para confirmar la transferencia es 482913. No lo compartas con nadie, tampoco con empleados del banco.',
    leccion: {
      titulo: 'El código llega, nadie te lo pide',
      cuerpo:
        'El banco manda el código cuando vos estás haciendo una operación, y avisa que no lo compartas. La estafa empieza cuando alguien te escribe o te llama para pedírtelo. Si no estabas haciendo nada, no se lo pases a nadie.',
    },
  },
  {
    id: 'arca-domicilio-fiscal',
    estafa: false,
    canal: 'email',
    remitente: 'ARCA',
    asunto: 'Nueva comunicación en tu Domicilio Fiscal Electrónico',
    texto:
      'Tenés una nueva comunicación disponible. Para leerla, ingresá a arca.gob.ar con tu CUIT y clave fiscal y abrí Domicilio Fiscal Electrónico.',
    leccion: {
      titulo: 'Avisa, pero no te lleva',
      cuerpo:
        'ARCA puede mandar un correo para avisar que hay algo nuevo. No trae un enlace para pagar ni pide la clave: te dice que entres vos al sitio oficial.',
    },
  },
  {
    id: 'ml-entrega',
    estafa: false,
    canal: 'email',
    remitente: 'Mercado Libre',
    asunto: '¡Llegó tu compra!',
    texto: 'Entregamos tu pedido. Si algo no está bien, podés devolverlo gratis desde Mis compras en la app.',
    leccion: {
      titulo: 'Avisa algo que esperabas y no pide nada',
      cuerpo:
        'No te apura ni te pide datos, y te manda a la app donde ya tenés la sesión abierta. Si dudás, abrí vos Mis compras: si es verdad, ahí está.',
    },
  },
  {
    id: 'rrhh-recibos',
    estafa: false,
    canal: 'email',
    remitente: 'Recursos Humanos',
    asunto: 'Recibos de octubre',
    texto: 'Ya están los recibos de octubre en el portal de siempre. Si ves algún dato mal, avisanos respondiendo este correo.',
    leccion: {
      titulo: 'Te manda al portal que ya usás',
      cuerpo:
        'No trae enlaces ni adjuntos y te deriva al canal de siempre. Es lo contrario del recibo trampa, que llega con un enlace para "confirmar los datos".',
    },
  },
  {
    id: 'colegio-jornada',
    estafa: false,
    canal: 'whatsapp',
    remitente: 'Dirección · Familias 3° B',
    texto: 'Recuerden que mañana no hay clases por jornada docente. La circular está en el cuaderno de comunicaciones.',
    leccion: {
      titulo: 'Informa y no pide datos',
      cuerpo:
        'Llega por el grupo que el colegio ya usa, no pide confirmar nada y remite al cuaderno. Si un mensaje pide datos del alumno o un pago con un enlace, confirmalo por el cuaderno.',
    },
  },
]

export const CANALES = { email: 'Correo', whatsapp: 'WhatsApp', sms: 'SMS' }

const VISTOS = 'sg-juego-vistos'

function leerVistos() {
  try {
    const vistos = JSON.parse(localStorage.getItem(VISTOS) ?? '[]')
    return Array.isArray(vistos) ? vistos : []
  } catch {
    return []
  }
}

export function elegirMensaje(vistos = leerVistos(), excepto = null, azar = Math.random) {
  const pendientes = MENSAJES.filter((mensaje) => !vistos.includes(mensaje.id) && mensaje.id !== excepto)
  const opciones = pendientes.length > 0 ? pendientes : MENSAJES.filter((mensaje) => mensaje.id !== excepto)
  return opciones[Math.floor(azar() * opciones.length)]
}

export function marcarVisto(id) {
  const vistos = leerVistos().filter((visto) => visto !== id && MENSAJES.some((mensaje) => mensaje.id === visto))
  vistos.push(id)
  const quedan = MENSAJES.length - vistos.length
  try {
    localStorage.setItem(VISTOS, JSON.stringify(quedan > 0 ? vistos : []))
  } catch {
    // Sin almacenamiento, el juego sigue eligiendo al azar.
  }
}