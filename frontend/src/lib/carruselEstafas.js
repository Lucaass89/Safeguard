import { analizar, motivosLimpios } from './analisis.js'
import { analizarCorreo } from './analisisCorreo.js'
import { analizarWhatsapp } from './analisisWhatsapp.js'

export const MAXIMO_MOTIVOS = 2

export const EJEMPLOS = [
  {
    id: 'correo-argentino-paquete',
    canal: 'SMS',
    quien: 'Correo Argentino',
    tipo: 'mensaje',
    remitente: '+54 9 11 2345-6789',
    mensaje:
      'Correo Argentino: tu paquete quedó retenido por falta de pago de $1.850. Abonalo hoy para recibirlo: https://correoargentino-envios.com/paquete/retenido',
    esperado: 'rojo',
    consejo: 'Si esperás un envío, seguilo desde correoargentino.com.ar escribiendo vos la dirección.',
  },
  {
    id: 'hola-ma-cambie-numero',
    canal: 'WhatsApp',
    quien: 'Un familiar',
    tipo: 'mensaje',
    remitente: 'Número desconocido',
    mensaje:
      'Hola ma, cambié de número, agendame este. Necesito que me transfieras $85.000 urgente, después te explico. Te paso el alias.',
    esperado: 'rojo',
    consejo: 'Llamá al número de siempre antes de transferir. Si es tu familiar, te va a atender.',
  },
  {
    id: 'mercado-pago-bono',
    canal: 'WhatsApp',
    quien: 'Mercado Pago',
    tipo: 'mensaje',
    remitente: 'Una amiga',
    mensaje:
      '¡Acabo de recibir el mío! Mercado Pago regala $150.000 por el Día de la Madre. Reclamalo acá: https://mercadopago-regalo.top/madre',
    esperado: 'rojo',
    consejo: 'Ninguna billetera regala plata por una cadena. Si querés ver promos, abrí vos la app.',
  },
  {
    id: 'arca-deuda',
    canal: 'Correo',
    quien: 'ARCA (ex AFIP)',
    tipo: 'correo',
    remitente: 'ARCA Fiscalizacion <avisos@arca-notificaciones.com>',
    asunto: 'Deuda pendiente en su CUIT',
    mensaje:
      'Registramos una deuda pendiente en su CUIT. Para evitar el embargo, ingrese y regularice hoy: https://arca-notificaciones.com/deuda',
    esperado: 'rojo',
    consejo: 'Los avisos reales están en tu Domicilio Fiscal Electrónico. Entrá escribiendo arca.gob.ar.',
  },
  {
    id: 'banco-nacion-clave',
    canal: 'Enlace',
    quien: 'Banco Nación',
    tipo: 'enlace',
    mensaje: 'https://bna-acceso.com/clave',
    esperado: 'rojo',
    consejo: 'El banco no te pide la clave por un enlace. Entrá desde la app oficial.',
  },
  {
    id: 'trabajo-likes',
    canal: 'WhatsApp',
    quien: 'Falsa oferta de trabajo',
    tipo: 'mensaje',
    remitente: '+1 (555) 201-4433',
    mensaje:
      'Hola! Soy de Recursos Humanos. Tenemos un trabajo desde casa: ganás $40.000 por día dando me gusta a videos. Escribime al +1 (555) 201-4433',
    esperado: 'amarillo',
    consejo: 'Nadie paga por dar me gusta. Al final te piden que pongas plata para "desbloquear" lo ganado.',
  },
  {
    id: 'mercado-libre-real',
    canal: 'Enlace',
    quien: 'Mercado Libre (el sitio real)',
    tipo: 'enlace',
    mensaje: 'https://www.mercadolibre.com.ar/ofertas',
    esperado: 'verde',
    consejo: 'Es el dominio oficial. Igual, nunca pongas tu clave en una página que te llegó por mensaje.',
  },
]

function entradaDe(ejemplo) {
  if (ejemplo.tipo !== 'correo') return ejemplo.mensaje
  return `From: ${ejemplo.remitente}\nSubject: ${ejemplo.asunto}\n\n${ejemplo.mensaje}`
}

function analizarEjemplo(ejemplo) {
  const entrada = entradaDe(ejemplo)
  if (ejemplo.tipo === 'enlace') return analizar(entrada)
  if (ejemplo.tipo === 'correo') return analizarCorreo(entrada)
  return analizarWhatsapp(entrada)
}

export function veredictoEjemplo(ejemplo) {
  const resultado = analizarEjemplo(ejemplo)
  if (!resultado) return { nivel: 'gris', motivos: [] }
  return {
    nivel: resultado.nivel,
    motivos: motivosEnteros(resultado.motivos).slice(0, MAXIMO_MOTIVOS),
  }
}

export function motivosEnteros(lista) {
  const vistos = new Set()
  const enteros = []
  for (const item of lista ?? []) {
    const frase = motivosLimpios([item]).join(' ')
    const clave = frase.toLowerCase()
    if (!frase || vistos.has(clave)) continue
    vistos.add(clave)
    enteros.push(frase)
  }
  return enteros
}

export function siguienteIndice(actual, paso, total) {
  if (total <= 0) return 0
  return Math.min(Math.max(actual + paso, 0), total - 1)
}

export function indiceVisible(desplazamiento, anchoTarjeta, total) {
  if (total <= 0 || anchoTarjeta <= 0) return 0
  return Math.min(Math.max(Math.round(desplazamiento / anchoTarjeta), 0), total - 1)
}

export const INTERVALO_MS = 6500

export function tarjetasVisibles(ancho) {
  if (!(ancho > 0)) return 1
  if (ancho >= 1040) return 3
  if (ancho >= 680) return 2
  return 1
}

export function ultimaPosicion(total, visibles) {
  return Math.max(total - Math.max(visibles, 1), 0)
}

export function siguienteCircular(actual, total, visibles) {
  const ultima = ultimaPosicion(total, visibles)
  if (total <= 0) return 0
  return actual >= ultima ? 0 : actual + 1
}

export function anteriorCircular(actual, total, visibles) {
  const ultima = ultimaPosicion(total, visibles)
  if (total <= 0) return 0
  return actual <= 0 ? ultima : Math.min(actual - 1, ultima)
}

export function debeAvanzarSolo({ reproduciendo, apuntado, enfocado, visible, pestanaVisible, movimientoReducido }) {
  return Boolean(reproduciendo && visible && pestanaVisible && !apuntado && !enfocado && !movimientoReducido)
}
