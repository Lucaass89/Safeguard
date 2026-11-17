export const CONSEJOS = [
  {
    id: 'correo-argentino',
    quien: 'Correo Argentino',
    canal: 'SMS',
    titulo: 'El paquete retenido que hay que pagar',
    ejemplo: 'Tu paquete quedó retenido por falta de pago de $1.850. Abonalo hoy para recibirlo: correoargentino-envios.com/pago',
    mirar: ['El correo no cobra por SMS ni manda enlaces para pagar.', 'La dirección no es correoargentino.com.ar.'],
  },
  {
    id: 'numero-nuevo',
    quien: 'Un familiar',
    canal: 'WhatsApp',
    titulo: 'El cuento del número nuevo',
    ejemplo: 'Hola, cambié de número, agendame este. Necesito que me transfieras urgente, después te explico.',
    mirar: ['Un número desconocido que dice ser alguien de tu familia.', 'Te apura para que transfieras. Llamá al número de siempre.'],
  },
  {
    id: 'codigo-whatsapp',
    quien: 'Un conocido',
    canal: 'WhatsApp',
    titulo: 'El código que te llegó por error',
    ejemplo: 'Perdón, te mandé un código de 6 números sin querer, ¿me lo reenviás?',
    mirar: ['Ese código sirve para entrar a tu WhatsApp.', 'Nadie necesita un código que te llegó a vos.'],
  },
  {
    id: 'banco-bloqueo',
    quien: 'Tu banco',
    canal: 'SMS',
    titulo: 'La cuenta bloqueada que hay que validar',
    ejemplo: 'Detectamos un ingreso sospechoso. Validá tu identidad antes de las 18 h o tu cuenta será bloqueada: banco-validacion.com',
    mirar: ['El banco no te pide validar datos desde un enlace.', 'El plazo corto es para que no pienses.'],
  },
  {
    id: 'premio',
    quien: 'Mercado Pago',
    canal: 'WhatsApp',
    titulo: 'El premio que nadie te iba a dar',
    ejemplo: '¡Ganaste $150.000 por el aniversario! Reclamalo hoy acá: mercadopago-premios.top',
    mirar: ['Ninguna billetera regala plata por una cadena.', 'El final .top no es de Mercado Pago.'],
  },
  {
    id: 'arca',
    quien: 'ARCA',
    canal: 'Correo',
    titulo: 'La deuda con ARCA que no existe',
    ejemplo: 'Tenés una deuda pendiente. Descargá el detalle desde el adjunto o regularizá en arca-pagos.com',
    mirar: ['ARCA avisa en tu Domicilio Fiscal Electrónico, no con adjuntos raros.', 'Entrá vos a arca.gob.ar.'],
  },
  {
    id: 'qr-calle',
    quien: 'Un cartel en la calle',
    canal: 'QR',
    titulo: 'El QR pegado arriba del verdadero',
    ejemplo: 'Pagá el estacionamiento escaneando este QR.',
    mirar: ['Fijate si el QR es una calcomanía pegada encima.', 'Antes de pagar, revisá a qué sitio lleva.'],
  },
]

export function consejoDelDia(hoy = new Date()) {
  const dias = Math.floor(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) / 86400000)
  return CONSEJOS[((dias % CONSEJOS.length) + CONSEJOS.length) % CONSEJOS.length]
}
