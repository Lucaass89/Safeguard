import {
  analizar,
  combinarConAmenaza,
  combinarConEnriquecimiento,
  marcaEnTexto,
  nivelDesde,
  peorEnlace,
} from './analisis.js'

const URGENCIA = [
  'urgente',
  'ahora mismo',
  'ya mismo',
  'últimas horas',
  'ultimas horas',
  'se vence',
  'bloqueamos',
  'suspendemos',
  'tu cuenta',
  'verificá',
  'verifica',
  'transferí',
  'transferi',
  'mandame el código',
  'mandame el codigo',
  'no le digas a nadie',
  'no se lo digas',
  'es confidencial',
  'último aviso',
  'ultimo aviso',
]

const PREMIO = ['ganaste', 'premio', 'regalo', 'sorteo', 'gift card', 'mercadería', 'devolución', 'reintegro']

const ROBO_NUMERO = [
  'me robaron el celular',
  'me robaron el teléfono',
  'me robaron el telefono',
  'cambié de número',
  'cambie de numero',
  'nuevo número',
  'nuevo numero',
  'este es mi nuevo',
  'perdí el celular',
  'perdi el celular',
]

const CODIGO = [
  'código de verificación',
  'codigo de verificacion',
  'clave de un solo uso',
  'pasame el código',
  'pasame el codigo',
  'mandame el código',
  'código que te llegó',
  'codigo que te llego',
]

const APP_FALSA = ['.apk', 'instalá esta', 'instala esta', 'descargá la app', 'descarga la app', 'instalá la aplicación', 'instala la aplicacion']

const INVISIBLES = /\u200b|\u200c|\u200d|\u2060|\ufeff/

const RE_URL = /(?:https?:\/\/|www\.)[^\s<>"']+/gi
const RE_HOST = /\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/gi
const RE_TEL = /(?:\+|00)?[\d][\d\s().-]{7,18}\d/g

function extraerEnlaces(texto) {
  const hallados = []
  for (const m of texto.match(RE_URL) ?? []) hallados.push(m.replace(/[),.;]+$/, ''))
  for (const m of texto.match(RE_HOST) ?? []) {
    if (m.includes('@')) continue
    const limpio = m.replace(/[),.;]+$/, '')
    const ya = hallados.some((h) => h.includes(limpio) || limpio.includes(h.replace(/^https?:\/\//, '')))
    if (!ya) hallados.push(limpio)
  }
  return hallados
}

function extraerNumeros(texto) {
  return (texto.match(RE_TEL) ?? [])
    .map((n) => n.trim())
    .filter((n) => n.replace(/\D/g, '').length >= 8)
}

function numeroRaro(numero) {
  const d = numero.replace(/\D/g, '')
  if (d.startsWith('54')) return false
  if (d.startsWith('549')) return false
  return true
}

export function analizarWhatsapp(crudo) {
  const texto = (crudo ?? '').trim()
  if (!texto) return null

  const minuscula = texto.toLowerCase()
  const motivos = []
  let puntos = 0

  if (URGENCIA.some((p) => minuscula.includes(p))) {
    puntos += 25
    motivos.push('El mensaje apura: pide que actúes ahora, un clásico del engaño por WhatsApp.')
  }

  if (PREMIO.some((p) => minuscula.includes(p))) {
    puntos += 20
    motivos.push('Promete un premio o una devolución. En WhatsApp eso casi nunca es cierto.')
  }

  const numeros = extraerNumeros(texto)
  const raros = numeros.filter(numeroRaro)
  if (raros.length > 0) {
    puntos += 30
    motivos.push(
      `El número ${raros[0]} no parece de Argentina. Pedir plata o códigos desde un número raro es una señal fuerte.`,
    )
  }

  const marca = marcaEnTexto(minuscula)
  if (marca && (raros.length > 0 || URGENCIA.some((p) => minuscula.includes(p)) || PREMIO.some((p) => minuscula.includes(p)))) {
    puntos += 25
    motivos.push(`Se hace pasar por ${marca.nombre}, pero escribe como un desconocido.`)
  }

  if (/\bbanco\b/.test(minuscula) && (raros.length > 0 || URGENCIA.some((p) => minuscula.includes(p)))) {
    puntos += 20
    motivos.push('Habla de un banco y a la vez apura o escribe desde un número raro.')
  }

  if (ROBO_NUMERO.some((p) => minuscula.includes(p))) {
    puntos += 35
    motivos.push('Dice que cambió de número o que le robaron el teléfono. Es un engaño muy común.')
  }

  if (CODIGO.some((p) => minuscula.includes(p)) || /c[oó]digo de verificaci[oó]n/.test(minuscula)) {
    puntos += 30
    motivos.push('Pide un código de verificación. Ese código es la llave de la cuenta.')
  }

  if (APP_FALSA.some((p) => minuscula.includes(p))) {
    puntos += 40
    motivos.push('Manda a instalar una aplicación. Por un mensaje no se instala nada.')
  }

  if (/\bcbu\b|\bcvu\b/.test(minuscula) || /\balias\s*[:=]\s*\S+/.test(minuscula)) {
    puntos += 30
    motivos.push('Pide un CBU, un CVU o un alias. Un banco no pide eso por WhatsApp.')
  } else {
    const grupos = texto.match(/\d[\d\s.-]{18,34}\d/g) ?? []
    if (grupos.some((grupo) => grupo.replace(/\D/g, '').length === 22)) {
      puntos += 30
      motivos.push('Incluye un número de 22 dígitos, el largo de un CBU o un CVU.')
    }
  }

  if (INVISIBLES.test(texto)) {
    puntos += 22
    motivos.push('Tiene caracteres invisibles, usados para disfrazar una palabra o un enlace.')
  }

  const crudos = extraerEnlaces(texto)
  const enlaces = crudos
    .map((e) => analizar(e))
    .filter(Boolean)
    .sort((a, b) => b.puntuacion - a.puntuacion)

  if (crudos.length > 0 && enlaces.length === 0) {
    puntos += 10
    motivos.push('Hay algo que parece un enlace, pero no se pudo leer bien.')
  }

  if (enlaces.length === 0 && motivos.length === 0) {
    motivos.push('No hay enlaces ni señales fuertes en el texto. Igual, si te pide un código, no lo pases.')
  }

  const peor = peorEnlace(enlaces) ?? {
    puntuacion: 0,
    nivel: 'verde',
    motivos: [],
    dominio: null,
    url: null,
  }

  const puntuacion = Math.min(100, puntos + peor.puntuacion)
  const todos = [
    ...motivos,
    ...enlaces.flatMap((e) => e.motivos.filter((m) => !m.startsWith('No aparecen'))),
  ]

  return {
    url: peor.url ?? 'mensaje-whatsapp',
    dominio: peor.dominio ?? 'whatsapp',
    puntuacion,
    nivel: nivelDesde(puntuacion),
    motivos: [...new Set(todos.length ? todos : motivos)],
    enlaces,
    numeros: raros,
    texto,
  }
}

export function cerrarWhatsapp(local, amenaza, extra) {
  const conAmenaza = combinarConAmenaza(local, amenaza)
  return combinarConEnriquecimiento(conAmenaza, extra)
}
