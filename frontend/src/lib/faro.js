import { motivosLimpios } from './analisis.js'
import { sinConsulta } from './enlace.js'
import { PUNTAJE } from './puntaje.js'

export const SALUDO =
  'Hola. Soy Faro. Puedo analizar este caso, resumirlo, dar un ejemplo o responder lo que preguntes. Elegí si lo querés simple, técnico o avanzado.'

export const MODOS = [
  { id: 'simple', etiqueta: 'Simple' },
  { id: 'tecnico', etiqueta: 'Técnico' },
  { id: 'avanzado', etiqueta: 'Avanzado' },
]

export const PREGUNTAS_LISTAS = [
  'Analizá este caso',
  'Hacé un resumen',
  'Dame un ejemplo',
  '¿Por qué dio este resultado?',
  '¿Se puede abrir?',
  '¿Qué pasa si ya hice clic?',
]

const TOPE_PREGUNTA = 600
const TOPE_ITEMS = 10

const PELIGROSO = [
  /\b(abrilo|abrila|abrelo|abrela|abrir(lo|la|los|las)?|abri el|abri la|abri este)\b/,
  /\b(descargalo|descargala|descargar(lo|la)?|descarga el|bajalo|baja el archivo)\b/,
  /\b(responde(le|les|lo)?|responder(le|les)?|contestale|contestar(le|les)?)\b/,
  /\b(pagalo|pagala|pagar|transferi|hace la transferencia|manda la plata)\b/,
  /\b(carga|cargar|ingresa|ingresar|escribi|pone|poner|pongas|manda|envia)\b[^.]{0,40}\b(clave|claves|dato|datos|codigo|cbu|tarjeta|contrasena)\b/,
  /\b(hace|hacer) (clic|click)\b/,
  /\b(entra|entre) (al|a ese|en el enlace|en el link|al enlace|al link)\b/,
  /\b(segui|seguir) (el mensaje|el enlace|ese enlace|ese link|ese mensaje)\b/,
  /\b(podes|puede|conviene|esta bien|es seguro|dale)\b[^.]{0,30}\b(abrir|abrilo|descarg|respond|pagar|entrar|seguir|hacer clic)\b/,
  /\b(es seguro|esta todo bien|podes confiar|no es peligroso|no hay riesgo)\b/,
]

const DUDOSO = [
  /\b(segui|seguir) (el mensaje|el enlace|ese mensaje|ese enlace)\b/,
  /\b(hace|hacer) lo que (dice|pide)\b/,
  /\b(abrilo|abrelo|abrir(lo|la)?|hace clic|hacer clic|entra al enlace|entra al link)\b/,
  /\b(podes|puede|conviene|esta bien)\b[^.]{0,30}\b(seguir|abrir|entrar|hacer clic)\b/,
]

const SEGURO = [
  /\b(pone|poner|pongas|ingresa|ingresar|carga|cargar|escribi|manda|envia|pasa)\b[^.]{0,40}\b(clave|codigo|contrasena|cbu|tarjeta)\b/,
  /\b(paga|pagar|pagalo|transferi)\b[^.]{0,40}\b(enlace|link|mensaje|ahi|aca)\b/,
  /\b(podes|puede)\b[^.]{0,40}\b(pagar|poner la clave|ingresar la clave|cargar los datos)\b/,
]

// En ningún nivel se dice que un sitio es seguro o que algo está garantizado.
const NUNCA = [/\bes seguro\b/, /\bgarantizad[oa]s?\b/, /\bdudoso\b/]

const DUDAS = [
  ['clic', /ya (lo |la )?(hice clic|hice click|clique|entre|abri|descargue|pague|respondi|cargue|cai)|si ya (hice|entre|abri|clique|cai)/],
  ['datos', /clave|contrasena|password|cbu|tarjeta|\bcodigo\b|\botp\b|\bdatos\b/],
  ['abrir', /puedo abrir|se puede abrir|lo abro|lo puedo abrir|puedo entrar|hacer clic|hago clic|puedo descargar|lo descargo/],
  ['avisar', /a quien aviso|a quien le aviso|a quien le cuento|como aviso|denuncio|reporto/],
  ['borrar', /\bborrar\b|\bborro\b|\bborrarlo\b|\belimin/],
  ['responder', /respond|contest/],
  ['reenviar', /reenvi|se lo mando|lo reenvio/],
  ['llamar', /\bllamar\b|\bllamo\b|\bllame\b|\btelefono\b|\bnumero\b/],
  ['conocido', /conocido|me conoce|parece de alguien|lo conozco|remitente real|es de verdad/],
  ['porque', /por que|porque/],
  ['hacer', /que hago|que tengo que|ahora que|que sigue|que deberia/],
]

const TITULOS = ['Peligroso', 'Precaución', 'Seguro', 'Sin señales de riesgo', 'No pudimos verificarlo']

export function plano(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function recortarTexto(texto, tope = TOPE_PREGUNTA) {
  const sin = String(texto ?? '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\bwww\.\S+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return sin.slice(0, tope).trim()
}

export function sinEmojis(texto) {
  return String(texto ?? '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\uFE0F\u200D]/g, '')
    .replace(/[*_`#]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

export function oraciones(texto) {
  return String(texto ?? '')
    .split(/(?<=[.!?])\s+/)
    .map((parte) => parte.trim())
    .filter(Boolean)
}

const ITEM = /^(\d{1,2})[.)]\s+/

// Una lista numerada escrita dentro de un párrafo ("Señales: 1. X. 2. Y.") pasa a un ítem por línea.
function separarItems(texto) {
  return String(texto ?? '')
    .split('\n')
    .flatMap((linea) => {
      if (!/(^|\s)1[.)]\s/.test(linea) || !/\s2[.)]\s/.test(linea)) return [linea]
      return linea.split(/\s+(?=\d{1,2}[.)]\s+\S)/)
    })
    .map((linea) => linea.trim())
    .filter(Boolean)
}

// Una frase que presenta una lista ("Hay dos señales:") también cuenta como completa.
const completa = (parte, indice, todas) => /[.!?]$/.test(parte) || (indice === todas.length - 1 && /:$/.test(parte))

// Recorta a `max` oraciones completas sin perder los saltos de línea ni partir los ítems de una lista.
export function limitarOraciones(texto, max = 5) {
  let quedan = max
  let items = 0
  const lineas = []
  for (const linea of separarItems(texto)) {
    if (ITEM.test(linea)) {
      if (items >= TOPE_ITEMS || !/[.!?]$/.test(linea)) continue
      items += 1
      lineas.push(linea)
      continue
    }
    if (quedan <= 0) continue
    const completas = oraciones(linea).filter(completa).slice(0, quedan)
    quedan -= completas.length
    if (completas.length) lineas.push(completas.join(' '))
  }
  return lineas.join('\n')
}

// Para mostrar: párrafos sueltos y listas numeradas como lista.
export function bloquesRespuesta(texto) {
  const bloques = []
  for (const linea of separarItems(texto)) {
    const item = linea.match(ITEM)
    const ultimo = bloques.at(-1)
    if (item && ultimo?.tipo === 'lista') ultimo.items.push(linea.slice(item[0].length))
    else if (item) bloques.push({ tipo: 'lista', items: [linea.slice(item[0].length)] })
    else bloques.push({ tipo: 'parrafo', texto: linea })
  }
  return bloques
}

function codigoNivel(nivel) {
  if (nivel === 'rojo' || nivel === 'Peligroso') return 'rojo'
  if (nivel === 'amarillo' || nivel === 'Dudoso' || nivel === 'Precaución') return 'amarillo'
  if (nivel === 'verde' || nivel === 'Seguro' || nivel === 'Sin señales de riesgo') return 'verde'
  if (nivel === 'gris' || nivel === 'No verificado' || nivel === 'No pudimos verificarlo') return 'gris'
  return ''
}

// El mismo nombre que muestra la tarjeta. Si llega el título de la tarjeta, manda ese.
export function nombreNivel(nivel, titulo) {
  const codigo = codigoNivel(nivel)
  if (titulo && TITULOS.includes(titulo) && codigoNivel(titulo) === codigo) return titulo
  if (codigo === 'rojo') return 'Peligroso'
  if (codigo === 'amarillo') return 'Precaución'
  if (codigo === 'verde') return 'Sin señales de riesgo'
  if (codigo === 'gris') return 'No pudimos verificarlo'
  return ''
}

// El backend ya desplegado solo acepta estos tres nombres; el título de la tarjeta viaja aparte.
function nivelServidor(codigo) {
  if (codigo === 'rojo') return 'Peligroso'
  if (codigo === 'amarillo') return 'Dudoso'
  if (codigo === 'verde') return 'Seguro'
  return ''
}

export function sinVerificar(nivel) {
  return codigoNivel(nivel) === 'gris'
}

export function modoValido(modo) {
  return modo === 'tecnico' || modo === 'avanzado' ? modo : 'simple'
}

function topeModo(modo) {
  if (modo === 'avanzado') return 10
  if (modo === 'tecnico') return 6
  return 4
}

function intencion(pregunta) {
  const p = plano(pregunta)
  if (/\bejem/.test(p) || /por ejemplo|un caso parecido|como seria/.test(p)) return 'ejemplo'
  if (/resum/.test(p) || /en corto|contame corto/.test(p)) return 'resumen'
  if (/analiz/.test(p) || /este caso|el caso|ver caso/.test(p)) return 'analizar'
  const duda = DUDAS.find(([, patron]) => patron.test(p))
  return duda?.[0] ?? 'general'
}

const FUERZA = { fuerte: 'fuerte', media: 'media', debil: 'débil' }
const ORDEN = { fuerte: 0, media: 1, debil: 2 }

function senalesActivas(caso) {
  return (Array.isArray(caso?.senales) ? caso.senales : [])
    .filter((senal) => senal && typeof senal.texto === 'string' && senal.texto && Number(senal.peso) > 0)
    .sort((a, b) => (ORDEN[a.fuerza] ?? 3) - (ORDEN[b.fuerza] ?? 3) || b.peso - a.peso)
}

function conPunto(frase) {
  const limpia = String(frase ?? '').trim()
  return /[.!?]$/.test(limpia) ? limpia : `${limpia}.`
}

function motivoPrincipal(motivos, caso) {
  const senal = senalesActivas(caso)[0]
  if (senal) return conPunto(motivosLimpios([senal.texto]).join(' '))
  return conPunto(motivosLimpios(motivos)[0] ?? 'No hay un motivo extra en este caso.')
}

function umbralesDe(caso) {
  const u = caso?.umbrales
  return Number.isFinite(u?.precaucion) && Number.isFinite(u?.peligroso) ? u : PUNTAJE.umbrales
}

function lineaVirusTotal(caso) {
  const vt = caso?.virusTotal
  if (!vt || !Number.isFinite(vt.maliciosos) || !Number.isFinite(vt.total)) {
    return 'VirusTotal no se consultó en este caso.'
  }
  return `VirusTotal: ${vt.maliciosos} de ${vt.total} motores la marcan como peligrosa.`
}

function lineaPuntaje(caso) {
  if (!Number.isFinite(caso?.puntuacion)) return ''
  const u = umbralesDe(caso)
  return `Puntaje: ${Math.round(caso.puntuacion)} de 100 (Precaución desde ${u.precaucion}, Peligroso desde ${u.peligroso}).`
}

function listaTecnica(caso) {
  return senalesActivas(caso)
    .slice(0, TOPE_ITEMS)
    .map((senal, indice) => {
      const fuerza = FUERZA[senal.fuerza] ?? 'sin fuerza'
      return `${indice + 1}. ${senal.id}, ${fuerza}, ${Math.round(senal.peso)} puntos: ${conPunto(motivosLimpios([senal.texto]).join(' '))}`
    })
}

function porQueNivel(codigo, caso) {
  const activas = senalesActivas(caso)
  const fuertes = activas.filter((senal) => senal.fuerza === 'fuerte')
  const gruposMedios = new Set(activas.filter((senal) => senal.fuerza === 'media').map((senal) => senal.grupo))
  const recortado = (caso?.senales ?? []).some((senal) => senal?.id === 'tope_sin_senal_fuerte')
  const t = PUNTAJE.topes
  const partes = [
    `Las señales parecidas se agrupan y cada grupo tiene un tope: las palabras sospechosas suman como máximo ${t.palabras} y los rasgos débiles, ${t.debiles}.`,
  ]
  if (fuertes.length) {
    partes.push(`Hay ${fuertes.length === 1 ? 'una señal fuerte' : `${fuertes.length} señales fuertes`} (${fuertes.map((senal) => senal.id).join(', ')}), y eso habilita llegar a Peligroso.`)
  } else if (gruposMedios.size >= 2) {
    partes.push('No hay una señal fuerte, pero sí señales medias de grupos distintos, y esa combinación habilita llegar a Peligroso.')
  } else {
    partes.push('No hay una señal fuerte ni dos señales medias de grupos distintos, así que este caso no puede pasar de Precaución.')
  }
  if (recortado) partes.push('El puntaje sumaba más, pero se recortó justo debajo de Peligroso por esa regla.')
  if (codigo === 'amarillo') {
    partes.push('Pasaría a Peligroso con una señal fuerte, por ejemplo una marca imitada o 5 o más motores de VirusTotal.')
  }
  return partes
}

function queNoSeReviso(caso) {
  return caso?.sinContenido
    ? 'El contenido de la página no se pudo revisar: todo sale de la dirección del enlace.'
    : 'Se revisó la dirección y, si se pudo abrir, lo que devolvió la página; eso no cubre todo lo que puede pasar después en el sitio.'
}

function analizarCaso(codigo, motivos, caso, modo) {
  const nombre = nombreNivel(codigo, caso?.titulo)
  const dominio = String(caso?.dominio ?? '').trim()
  const cabeza = dominio ? `Revisamos ${dominio}: quedó en ${nombre}.` : `Este caso quedó en ${nombre}.`
  if (modo === 'simple') return `${cabeza} ${motivoPrincipal(motivos, caso)} ${cuidado(codigo)}`

  const lista = listaTecnica(caso)
  if (modo === 'tecnico') {
    return [
      [cabeza, lineaPuntaje(caso)].filter(Boolean).join(' '),
      ...(lista.length ? lista : ['No hay señales con peso en este caso.']),
      lineaVirusTotal(caso),
      cuidado(codigo),
    ].join('\n')
  }
  return [
    [cabeza, lineaPuntaje(caso)].filter(Boolean).join(' '),
    porQueNivel(codigo, caso).join(' '),
    ...lista,
    `${lineaVirusTotal(caso)} ${queNoSeReviso(caso)}`,
    cuidado(codigo),
  ].join('\n')
}

function ejemploDe(codigo, modo) {
  if (codigo === 'rojo') {
    if (modo === 'tecnico') {
      return 'Ejemplo del mismo tipo: un dominio que cambia una letra de una marca por un número, o un subdominio con la marca sobre un dominio ajeno. Esas son señales fuertes y alcanzan para Peligroso. No se abre y no se cargan datos.'
    }
    if (modo === 'avanzado') {
      return 'Ejemplo avanzado: el dominio no es el oficial, imita a la marca y la ruta abre una página para entrar a la cuenta. La marca imitada es una señal fuerte, la ruta suma como media, y juntas cruzan el umbral de Peligroso. El nivel no cambia aunque el sitio no responda.'
    }
    return 'Un ejemplo parecido: un mensaje que dice ser del banco, pero el enlace no es la página del banco. No se abre y no se cargan datos.'
  }
  if (codigo === 'amarillo') {
    if (modo === 'tecnico') {
      return 'Ejemplo del mismo tipo: un final de dirección muy usado en sitios truchos, o palabras como "pagos" o "premio" en un dominio cualquiera. Son señales débiles: alcanzan para Precaución, no para Peligroso. No se sigue desde el mensaje.'
    }
    if (modo === 'avanzado') {
      return 'Ejemplo avanzado: un dominio .click con palabras de trámite suma puntos, pero las señales débiles tienen tope y solas no pasan de Precaución. Si apareciera una señal fuerte, como una marca imitada o varios motores de VirusTotal, pasaría a Peligroso.'
    }
    return 'Un ejemplo parecido: un enlace con algo raro, pero sin una prueba fuerte. No se abre desde el mensaje. Si es un banco o una tienda, se entra escribiendo la dirección oficial.'
  }
  if (modo === 'tecnico') {
    return 'Ejemplo del mismo tipo: una dirección sin acortador, sin marca imitada y sin página de clave en la ruta. Que no haya señales no garantiza nada sobre el sitio. Una clave o un pago igual no se hacen desde un enlace que llegó en un mensaje.'
  }
  if (modo === 'avanzado') {
    return 'Ejemplo avanzado: un puntaje por debajo del umbral de Precaución quiere decir que no encontramos señales de riesgo, no que el sitio sea confiable. Una marca que no está en la lista o una página que cambia después no se ven desde la dirección.'
  }
  return 'Un ejemplo parecido: un enlace común, sin apuro ni página de clave. No encontramos señales de riesgo, pero la clave igual no se escribe desde un enlace que llegó en un mensaje.'
}

function conModo(texto, codigo, modo, caso) {
  if (modo === 'simple') return texto
  const lista = listaTecnica(caso).slice(0, modo === 'tecnico' ? 3 : TOPE_ITEMS)
  if (modo === 'tecnico') {
    return [texto, lineaPuntaje(caso), ...lista].filter(Boolean).join('\n')
  }
  return [texto, lineaPuntaje(caso), porQueNivel(codigo, caso).join(' '), ...lista, lineaVirusTotal(caso)]
    .filter(Boolean)
    .join('\n')
}

function afirma(frase, patron) {
  const re = new RegExp(patron.source, 'g')
  let hallazgo = re.exec(frase)
  while (hallazgo) {
    const antes = frase.slice(Math.max(0, hallazgo.index - 42), hallazgo.index)
    const tramo = antes.split(/\bpero\b/).pop() ?? antes
    if (!/\b(no|nunca|ni|sin|jamas|tampoco)\b/.test(tramo)) return true
    hallazgo = re.exec(frase)
  }
  return false
}

export function respuestaContradice(nivel, texto) {
  const codigo = codigoNivel(nivel)
  if (!codigo || codigo === 'gris') return true
  const patrones = [...(codigo === 'rojo' ? PELIGROSO : codigo === 'amarillo' ? DUDOSO : SEGURO), ...NUNCA]
  return oraciones(plano(sinEmojis(texto))).some((frase) => patrones.some((patron) => afirma(frase, patron)))
}

function cuidado(codigo) {
  if (codigo === 'rojo') return 'No sigas el mensaje, no cargues claves ni datos, y avisá por otro canal.'
  if (codigo === 'amarillo') {
    return 'Antes de seguir, chequeá que la dirección sea la oficial. Si es un banco, un organismo o una tienda, entrá escribiendo vos la dirección.'
  }
  return 'No encontramos señales de riesgo, pero una clave, un código o un pago igual no se hacen desde un enlace que llegó en un mensaje.'
}

function plantilla(codigo, nombre, motivo, id) {
  const verde = 'No encontramos señales de riesgo en este enlace, aunque eso no garantiza nada sobre el sitio.'
  if (id === 'clic' && codigo === 'rojo') {
    return `Este caso es Peligroso. ${motivo} Si ya hiciste clic, cerrá esa página y no cargues claves ni datos. Avisá por otro canal, con un teléfono que ya tengas o en persona.`
  }
  if (id === 'clic' && codigo === 'amarillo') {
    return `Este caso quedó en Precaución. ${motivo} Si ya hiciste clic, no sigas el mensaje y no cargues claves ni datos. Cerrá esa página y, si hace falta, avisá por otro canal.`
  }
  if (id === 'clic') {
    return `${verde} ${motivo} Si ya hiciste clic, igual no cargues una clave, un código ni un pago desde un enlace que llegó en un mensaje.`
  }
  if (id === 'abrir' && codigo === 'rojo') {
    return `No. Este caso es Peligroso y no se abre. ${motivo} No lo descargues, no respondas y no cargues claves ni datos. Si necesitás confirmar algo, avisá por otro canal.`
  }
  if (id === 'abrir' && codigo === 'amarillo') {
    return `No lo abras desde este mensaje. Este caso quedó en Precaución. ${motivo} No sigas el mensaje: si es un banco, un organismo o una tienda, entrá escribiendo vos la dirección oficial.`
  }
  if (id === 'abrir') {
    return `${verde} ${motivo} Igual, una clave, un código o un pago no se hacen desde un enlace que llegó en un mensaje.`
  }
  if (id === 'hacer' && codigo === 'rojo') {
    return `No sigas el mensaje. Este caso es Peligroso. ${motivo} No cargues claves ni datos, y avisá por otro canal.`
  }
  if (id === 'hacer' && codigo === 'amarillo') {
    return `No sigas el mensaje. Este caso quedó en Precaución. ${motivo} Si es un banco, un organismo o una tienda, entrá escribiendo vos la dirección oficial.`
  }
  if (id === 'hacer') {
    return `${verde} ${motivo} Una clave, un código o un pago igual no se hacen desde un enlace que llegó en un mensaje.`
  }
  if (id === 'avisar') {
    return `Avisá por otro canal: un teléfono que ya tengas o en persona, no el número de este mensaje. Este caso quedó en ${nombre}. ${motivo} No hace falta señalar a nadie para pedir esa confirmación.`
  }
  if (id === 'datos' && codigo === 'verde') {
    return `${verde} Una clave, un código o un pago no se hacen desde un enlace que llegó en un mensaje. ${motivo}`
  }
  if (id === 'datos') {
    return `No cargues claves ni datos. Este caso quedó en ${nombre}. ${motivo} Si ya los mandaste, avisá por otro canal.`
  }
  if (id === 'borrar' && codigo === 'verde') {
    return `Borrar el mensaje no cambia este resultado. ${verde} ${motivo} Una clave, un código o un pago igual no se hacen desde un enlace que llegó en un mensaje.`
  }
  if (id === 'borrar') {
    return `Borrar el mensaje no cambia este resultado ni deshace un clic o un dato ya enviado. Este caso quedó en ${nombre}. ${motivo} ${codigo === 'rojo' ? 'No sigas el mensaje y no cargues claves ni datos.' : 'No sigas el mensaje.'}`
  }
  if (id === 'responder' && codigo === 'rojo') {
    return `No respondas. Este caso es Peligroso. ${motivo} Si hace falta avisar, hacelo por otro canal y no cargues claves ni datos.`
  }
  if (id === 'responder' && codigo === 'amarillo') {
    return `No respondas desde este mensaje. Este caso quedó en Precaución. ${motivo} No sigas lo que pide: si tenés que contestar, hacelo por un canal que ya uses.`
  }
  if (id === 'responder') {
    return `${verde} ${motivo} Si respondés, igual no mandes una clave, un código ni un pago por un enlace que llegó en el mensaje.`
  }
  if (id === 'reenviar' && codigo === 'rojo') {
    return `No lo reenvíes. Este caso es Peligroso. ${motivo} Si querés avisar, contá lo que pasó por otro canal, sin pasar el mensaje.`
  }
  if (id === 'reenviar' && codigo === 'amarillo') {
    return `No lo reenvíes para que lo abran. Este caso quedó en Precaución. ${motivo} No sigas el mensaje ni se lo pases a nadie para que entre.`
  }
  if (id === 'reenviar') {
    return `${verde} ${motivo} Si lo compartís, avisá que una clave, un código o un pago no se hacen desde un enlace que llegó en un mensaje.`
  }
  if (id === 'llamar' && codigo === 'verde') {
    return `${verde} ${motivo} Si llamás, usá un número que ya conozcas, no uno que haya llegado en el mensaje.`
  }
  if (id === 'llamar') {
    return `No llames al número que vino en el mensaje. Este caso quedó en ${nombre}. ${motivo} Si tenés que hablar con esa persona o esa empresa, usá un teléfono que ya tengas guardado.`
  }
  if (id === 'conocido') {
    return `Que el nombre se parezca a alguien conocido no cambia este resultado. Este caso quedó en ${nombre}. ${motivo} No es para señalar a esa persona: si querés confirmar, hablale por otro canal.`
  }
  if (id === 'porque') {
    return `Dio ${nombre} por esto: ${motivo} El semáforo queda como está.`
  }
  return `Este caso quedó en ${nombre}. ${motivo} ${cuidado(codigo)}`
}

function respuestaSinVerificar(motivos, id, caso) {
  const inicio = 'Este caso quedó en No pudimos verificarlo: con lo que pudimos ver no alcanza para dar un resultado.'
  const motivo = motivoPrincipal(motivos, caso)
  if (id === 'clic' || id === 'datos') {
    return `${inicio} ${motivo} Si ya entraste, no cargues claves ni datos y cerrá esa página. Si ya los mandaste, avisá por otro canal.`
  }
  return `${inicio} ${motivo} No lo abras desde el mensaje. Si dice ser un banco, un organismo o una tienda, entrá escribiendo vos la dirección oficial.`
}

export function respuestaLocal(nivel, motivos, pregunta, modo = 'simple', caso = {}) {
  const codigo = codigoNivel(nivel)
  if (!codigo) return 'Este resultado no tiene un nivel para explicar.'
  const tono = modoValido(modo)
  const id = intencion(pregunta)
  const tope = topeModo(tono)
  if (codigo === 'gris') return limitarOraciones(respuestaSinVerificar(motivos, id, caso), tope)
  if (id === 'analizar' || (id === 'porque' && tono !== 'simple')) {
    return limitarOraciones(analizarCaso(codigo, motivos, caso, tono), tope)
  }
  if (id === 'resumen') return limitarOraciones(analizarCaso(codigo, motivos, caso, 'simple'), 4)
  if (id === 'ejemplo') return limitarOraciones(ejemploDe(codigo, tono), tope)
  const nombre = nombreNivel(codigo, caso?.titulo)
  return limitarOraciones(conModo(plantilla(codigo, nombre, motivoPrincipal(motivos, caso), id), codigo, tono, caso), tope)
}

export function prepararRespuesta(nivel, motivos, pregunta, cruda, modo = 'simple', caso) {
  const limpia = limitarOraciones(sinEmojis(cruda), topeModo(modoValido(modo)))
  if (!limpia || respuestaContradice(nivel, limpia)) return respuestaLocal(nivel, motivos, pregunta, modo, caso)
  return limpia
}

function casoConsulta(caso) {
  const origen = caso && typeof caso === 'object' ? caso : {}
  const crudo = String(origen.url ?? '').replace(/\s+/g, ' ').trim()
  const url = (/^[a-z][a-z0-9+.-]*:/i.test(crudo) ? sinConsulta(crudo) : crudo).slice(0, 300)
  const dominio = String(origen.dominio ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)
  const canal = ['enlace', 'whatsapp', 'pdf', 'correo', 'qr'].includes(origen.canal) ? origen.canal : ''
  const puntuacion = Number.isFinite(origen.puntuacion)
    ? Math.max(0, Math.min(100, Math.round(origen.puntuacion)))
    : null
  const titulo = TITULOS.includes(origen.titulo) ? origen.titulo : ''
  return { url, dominio, puntuacion, canal, titulo, sinContenido: Boolean(origen.sinContenido) }
}

function senalesConsulta(caso) {
  return senalesActivas(caso)
    .slice(0, 12)
    .map((senal) => ({
      id: String(senal.id).slice(0, 60),
      grupo: String(senal.grupo ?? '').slice(0, 30),
      fuerza: ['fuerte', 'media', 'debil'].includes(senal.fuerza) ? senal.fuerza : '',
      peso: Math.round(senal.peso),
      texto: recortarTexto(senal.texto, 240),
    }))
}

function virusTotalConsulta(caso) {
  const vt = caso?.virusTotal
  if (!vt || !Number.isFinite(vt.maliciosos) || !Number.isFinite(vt.total)) return null
  return { maliciosos: Math.max(0, Math.round(vt.maliciosos)), total: Math.max(0, Math.round(vt.total)) }
}

export function armarConsulta(nivel, motivos, pregunta, turnos, modo = 'simple', caso) {
  const codigo = codigoNivel(nivel)
  const nombre = nivelServidor(codigo)
  const preguntaLimpia = recortarTexto(pregunta)
  if (!codigo || !preguntaLimpia || !/[a-z0-9]/i.test(plano(preguntaLimpia))) return null

  const lista = motivosLimpios(motivos)
    .map((motivo) => recortarTexto(motivo, 240))
    .filter(Boolean)
    .slice(0, 8)

  const historial = (Array.isArray(turnos) ? turnos : [])
    .slice(-6)
    .map((turno) => ({
      rol: turno?.rol === 'vos' ? 'vos' : 'faro',
      texto: recortarTexto(turno?.texto, 700),
    }))
    .filter((turno) => turno.texto)

  const datosCaso = casoConsulta(caso)
  return {
    nivel: nombre,
    titulo: datosCaso.titulo || nombreNivel(codigo),
    motivos: lista,
    senales: senalesConsulta(caso),
    virusTotal: virusTotalConsulta(caso),
    umbrales: { ...PUNTAJE.umbrales },
    pregunta: preguntaLimpia,
    turnos: historial,
    modo: modoValido(modo),
    caso: datosCaso,
  }
}
