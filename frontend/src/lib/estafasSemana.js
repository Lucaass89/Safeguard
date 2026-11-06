export const DIAS_VIGENCIA = 10
export const MAXIMO_ESTAFAS = 3

export const EDICION = {
  fecha: '2026-10-18',
  estafas: [
    {
      id: 'mercado-pago-dia-de-la-madre',
      quien: 'Mercado Pago',
      titulo: 'Bono falso de $150.000 por el Día de la Madre',
      canal: 'WhatsApp',
      ejemplo: '¡Acabo de recibir el mío! Mercado Pago regala $150.000 por el Día de la Madre. Reclamalo acá: [enlace]',
      mirar: [
        'Ninguna billetera regala plata por una cadena de WhatsApp.',
        'Aunque te lo mande alguien conocido, su cuenta pudo haber sido robada.',
        'Si querés ver una promo, abrí vos la app de Mercado Pago.',
      ],
      fuente: {
        nombre: 'Policía del Chaco',
        fecha: '2026-10-05',
        url: 'https://chaconoticias.com.ar/advierten-sobre-un-falso-regalo-de-150-mil-por-el-dia-de-la-madre-con-mercado-pago/',
      },
    },
    {
      id: 'banco-nacion-nueva-bna',
      quien: 'Banco Nación',
      titulo: 'Falsos gestores del pase a Nueva BNA+',
      canal: 'Llamada o WhatsApp',
      ejemplo: 'Hola, soy del Banco Nación. Te ayudo con el pase a Nueva BNA+: pasame el código que te llegó por SMS para validar tu cuenta.',
      mirar: [
        'El banco no pide claves, token, datos de la tarjeta ni fotos del DNI por teléfono o chat.',
        'La app se baja solo de Google Play. Si te mandan un archivo para instalar, es una trampa.',
        'Si falla la validación facial, esperá y probá más tarde: la app anterior sigue andando.',
      ],
      fuente: {
        nombre: 'Policía de Catamarca',
        fecha: '2026-10-09',
        url: 'https://extracatamarca.com/policia-alerta-estafas-migracion-nueva-bna',
      },
    },
    {
      id: 'arca-deuda-falsa',
      quien: 'ARCA (ex AFIP)',
      titulo: 'Correos que reclaman una deuda o un embargo',
      canal: 'Correo',
      ejemplo: 'ARCA - Fiscalización: registramos una deuda pendiente en su CUIT. Para evitar el embargo, ingrese al detalle y regularice hoy: [enlace]',
      mirar: [
        'ARCA no pide pagos ni la clave fiscal por correo, WhatsApp ni teléfono.',
        'Las notificaciones reales están en el Domicilio Fiscal Electrónico: entrá escribiendo vos arca.gob.ar.',
        'Si te apura con un embargo, no toques el enlace y reenvialo a phishing@arca.gob.ar.',
      ],
      fuente: {
        nombre: 'ARCA, vía Cadena 3',
        fecha: '2026-09-10',
        url: 'https://www.cadena3.com/noticia/politica-y-economia/alerta-por-mails-falsos-de-arca-como-detectar-la-estafa-y-donde-denunciarla_592990',
      },
    },
  ],
}

export function fechaLocal(texto) {
  const [anio, mes, dia] = texto.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

export function edicionVigente(edicion = EDICION, hoy = new Date()) {
  if (!edicion?.estafas?.length) return null
  const vence = fechaLocal(edicion.fecha)
  vence.setDate(vence.getDate() + DIAS_VIGENCIA)
  return hoy < vence ? edicion : null
}

const FORMATO = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' })

export function fechaLegible(texto) {
  return FORMATO.format(fechaLocal(texto))
}
