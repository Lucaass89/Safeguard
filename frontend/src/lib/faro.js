import { motivosLimpios } from './analisis.js'

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

export function limitarOraciones(texto, max = 5) {
  return oraciones(texto).slice(0, max).join(' ')
}

export function nombreNivel(nivel) {
  if (nivel === 'rojo' || nivel === 'Peligroso') return 'Peligroso'
  if (nivel === 'amarillo' || nivel === 'Dudoso') return 'Dudoso'
  if (nivel === 'verde' || nivel === 'Seguro') return 'Seguro'
  return ''
}

function codigoNivel(nivel) {
  if (nivel === 'rojo' || nivel === 'Peligroso') return 'rojo'
  if (nivel === 'amarillo' || nivel === 'Dudoso') return 'amarillo'
  if (nivel === 'verde' || nivel === 'Seguro') return 'verde'
  return ''
}

export function modoValido(modo) {
  return modo === 'tecnico' || modo === 'avanzado' ? modo : 'simple'
}

function topeModo(modo) {
  if (modo === 'avanzado') return 8
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

function textoCaso(caso) {
  const dominio = String(caso?.dominio ?? '').replace(/\s+/g, ' ').trim()
  const url = String(caso?.url ?? '').replace(/\s+/g, ' ').trim().slice(0, 180)
  const canal = String(caso?.canal ?? '').trim()
  const partes = []
  if (dominio) partes.push(`Dominio: ${dominio}.`)
  if (url && url !== dominio) partes.push(`Lo revisado: ${url}.`)
  if (canal) partes.push(`Canal: ${canal}.`)
  if (Number.isFinite(caso?.puntuacion)) partes.push(`Puntaje de señales: ${Math.round(caso.puntuacion)}.`)
  return partes.join(' ')
}

function analizarCaso(nivel, motivos, caso, resumen, modo) {
  const nombre = nombreNivel(nivel)
  const lista = motivosLimpios(motivos)
  const cabeza = textoCaso(caso) || 'Este es el caso que está abierto.'
  const primero = motivoDe(lista)
  if (resumen || modo === 'simple') {
    return `${cabeza} El semáforo quedó ${nombre}. ${primero} ${cuidado(nivel)}`
  }
  if (modo === 'tecnico') {
    const senales = lista.length ? lista.join(' ') : 'No hay señales extra guardadas.'
    return `${cabeza} Nivel ${nombre}. Señales que ya se sumaron: ${senales} ${cuidado(nivel)}`
  }
  const detalle = lista.length
    ? lista.map((motivo, indice) => `${indice + 1}. ${motivoDe([motivo])}`).join(' ')
    : 'No quedó una señal suelta para desarmar.'
  return `${cabeza} El veredicto ${nombre} sale de sumar esas señales. No abre el archivo ni ejecuta nada. ${detalle} Eso no prueba el resto del sitio: solo lo que SafeLink pudo ver. ${cuidado(nivel)}`
}

function ejemploDe(nivel, modo) {
  if (nivel === 'rojo') {
    if (modo === 'tecnico') {
      return 'Ejemplo del mismo tipo: un dominio que imita una marca, o un acortador que termina en una página que pide la clave. El rojo sale de esa señal. No se abre y no se cargan datos.'
    }
    if (modo === 'avanzado') {
      return 'Ejemplo avanzado: el sitio no es el oficial, el camino nombra a la marca y la página pide una clave. Cada señal suma. Juntas cruzan el rojo. No hace falta el mensaje original para ver ese patrón, y el color no cambia.'
    }
    return 'Un ejemplo parecido: un mensaje que dice ser el banco y el enlace no es la página del banco. No se abre y no se cargan datos.'
  }
  if (nivel === 'amarillo') {
    if (modo === 'tecnico') {
      return 'Ejemplo del mismo tipo: un dominio nuevo, un final de dirección muy usado en sitios truchos, o un texto que apura. Alcanza para dudar, no para darlo por peligroso. No se sigue desde el mensaje.'
    }
    if (modo === 'avanzado') {
      return 'Ejemplo avanzado: una sola señal floja, como un dominio de pocos días, deja el caso en dudoso. Si se suma otra, por ejemplo una marca en el camino, puede pasar a rojo. Con lo que hay ahora, no se sigue el mensaje.'
    }
    return 'Un ejemplo parecido: un enlace raro que apura, pero sin una prueba fuerte. No se abre desde el mensaje. Si es un banco o una tienda, se entra escribiendo la dirección oficial.'
  }
  if (modo === 'tecnico') {
    return 'Ejemplo del mismo tipo: una dirección sin acortador, sin marca falsa y sin pedido de clave en el camino. El verde dice que no hubo esas señales. Una clave o un pago igual no se hacen desde un enlace que llegó en un mensaje.'
  }
  if (modo === 'avanzado') {
    return 'Ejemplo avanzado: cero señales por encima del umbral deja el caso en seguro. Eso no revisa el interior de un archivo ni una marca que no esté en la lista. Por eso una clave, un código o un pago siguen fuera de ese enlace.'
  }
  return 'Un ejemplo parecido: un enlace común, sin apuro ni página de clave. No hubo señales fuertes. Igual, la clave no se escribe desde un enlace que llegó en un mensaje.'
}

function conModo(texto, modo, motivos) {
  if (modo === 'simple') return texto
  const senales = motivosLimpios(motivos).slice(0, 3).join(' ')
  if (modo === 'tecnico') {
    return senales ? `${texto} En la revisión, las señales fueron: ${senales}` : texto
  }
  return `${texto} Lectura avanzada: cada motivo ya está sumado. Faro no reabre el archivo ni cambia el color.${senales ? ` Señales: ${senales}` : ''}`
}

function motivoDe(motivos) {
  const frase = motivosLimpios(motivos)[0] ?? 'No hay un motivo extra en este caso.'
  return /[.!?]$/.test(frase) ? frase : `${frase}.`
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
  if (!codigo) return true
  const patrones = codigo === 'rojo' ? PELIGROSO : codigo === 'amarillo' ? DUDOSO : SEGURO
  return oraciones(plano(sinEmojis(texto))).some((frase) => patrones.some((patron) => afirma(frase, patron)))
}

function cuidado(nivel) {
  if (nivel === 'rojo') return 'No sigas el mensaje, no cargues claves ni datos, y avisá por otro canal.'
  if (nivel === 'amarillo') {
    return 'No sigas el mensaje. Si es un banco, un organismo o una tienda, entrá escribiendo vos la dirección oficial.'
  }
  return 'No hubo señales fuertes, pero una clave, un código o un pago igual no se hacen desde un enlace que llegó en un mensaje.'
}

function plantilla(nivel, motivo, id) {
  const nombre = nombreNivel(nivel)

  if (id === 'clic' && nivel === 'rojo') {
    return `Este caso es Peligroso. ${motivo} Si ya hiciste clic, cerrá esa página y no cargues claves ni datos. Avisá por otro canal, con un teléfono que ya tengas o en persona.`
  }
  if (id === 'clic' && nivel === 'amarillo') {
    return `Este caso es Dudoso. ${motivo} Si ya hiciste clic, no sigas el mensaje y no cargues claves ni datos. Cerrá esa página y, si hace falta, avisá por otro canal.`
  }
  if (id === 'clic') {
    return `Este caso es Seguro y no hubo señales fuertes. ${motivo} Si ya hiciste clic, igual no cargues una clave, un código ni un pago desde un enlace que llegó en un mensaje.`
  }
  if (id === 'abrir' && nivel === 'rojo') {
    return `No. Este caso es Peligroso y no se abre. ${motivo} No lo descargues, no respondas y no cargues claves ni datos. Si necesitás confirmar algo, avisá por otro canal.`
  }
  if (id === 'abrir' && nivel === 'amarillo') {
    return `No lo abras desde este mensaje. Este caso es Dudoso. ${motivo} No sigas el mensaje: si es un banco, un organismo o una tienda, entrá escribiendo vos la dirección oficial.`
  }
  if (id === 'abrir') {
    return `Este caso es Seguro y no hubo señales fuertes. ${motivo} Igual, una clave, un código o un pago no se hacen desde un enlace que llegó en un mensaje.`
  }
  if (id === 'hacer' && nivel === 'rojo') {
    return `No sigas el mensaje. Este caso es Peligroso. ${motivo} No cargues claves ni datos, y avisá por otro canal.`
  }
  if (id === 'hacer' && nivel === 'amarillo') {
    return `No sigas el mensaje. Este caso es Dudoso. ${motivo} Si es un banco, un organismo o una tienda, entrá escribiendo vos la dirección oficial.`
  }
  if (id === 'hacer') {
    return `Este caso es Seguro y no hubo señales fuertes. ${motivo} Una clave, un código o un pago igual no se hacen desde un enlace que llegó en un mensaje.`
  }
  if (id === 'avisar') {
    return `Avisá por otro canal: un teléfono que ya tengas o en persona, no el número de este mensaje. Este caso es ${nombre}. ${motivo} No hace falta señalar a nadie para pedir esa confirmación.`
  }
  if (id === 'datos' && nivel === 'verde') {
    return `Aunque este caso es Seguro, una clave, un código o un pago no se hacen desde un enlace que llegó en un mensaje. ${motivo}`
  }
  if (id === 'datos') {
    return `No cargues claves ni datos. Este caso es ${nombre}. ${motivo} Si ya los mandaste, avisá por otro canal.`
  }
  if (id === 'borrar' && nivel === 'verde') {
    return `Borrar el mensaje no cambia este resultado. Este caso es Seguro y no hubo señales fuertes. ${motivo} Una clave, un código o un pago igual no se hacen desde un enlace que llegó en un mensaje.`
  }
  if (id === 'borrar') {
    return `Borrar el mensaje no cambia este resultado ni deshace un clic o un dato ya enviado. Este caso es ${nombre}. ${motivo} ${nivel === 'rojo' ? 'No sigas el mensaje y no cargues claves ni datos.' : 'No sigas el mensaje.'}`
  }
  if (id === 'responder' && nivel === 'rojo') {
    return `No respondas. Este caso es Peligroso. ${motivo} Si hace falta avisar, hacelo por otro canal y no cargues claves ni datos.`
  }
  if (id === 'responder' && nivel === 'amarillo') {
    return `No respondas desde este mensaje. Este caso es Dudoso. ${motivo} No sigas lo que pide: si tenés que contestar, hacelo por un canal que ya uses.`
  }
  if (id === 'responder') {
    return `Este caso es Seguro y no hubo señales fuertes. ${motivo} Si respondés, igual no mandes una clave, un código ni un pago por un enlace que llegó en el mensaje.`
  }
  if (id === 'reenviar' && nivel === 'rojo') {
    return `No lo reenvíes. Este caso es Peligroso. ${motivo} Si querés avisar, contá lo que pasó por otro canal, sin pasar el mensaje.`
  }
  if (id === 'reenviar' && nivel === 'amarillo') {
    return `No lo reenvíes para que lo abran. Este caso es Dudoso. ${motivo} No sigas el mensaje ni se lo pases a nadie para que entre.`
  }
  if (id === 'reenviar') {
    return `Este caso es Seguro y no hubo señales fuertes. ${motivo} Si lo compartís, avisá que una clave, un código o un pago no se hacen desde un enlace que llegó en un mensaje.`
  }
  if (id === 'llamar' && nivel === 'verde') {
    return `Este caso es Seguro y no hubo señales fuertes. ${motivo} Si llamás, usá un número que ya conozcas, no uno que haya llegado en el mensaje.`
  }
  if (id === 'llamar') {
    return `No llames al número que vino en el mensaje. Este caso es ${nombre}. ${motivo} Si tenés que hablar con esa persona o esa empresa, usá un teléfono que ya tengas guardado.`
  }
  if (id === 'conocido') {
    return `Que el nombre se parezca a alguien conocido no cambia este resultado. Este caso es ${nombre}. ${motivo} No es para señalar a esa persona: si querés confirmar, hablale por otro canal.`
  }
  if (id === 'porque') {
    return `Dio ${nombre} por esto: ${motivo} El semáforo queda como está.`
  }
  return `Este caso es ${nombre}. ${motivo} ${cuidado(nivel)}`
}

export function respuestaLocal(nivel, motivos, pregunta, modo = 'simple', caso = {}) {
  const codigo = codigoNivel(nivel)
  if (!codigo) return 'Este resultado no tiene un nivel para explicar.'
  const tono = modoValido(modo)
  const id = intencion(pregunta)
  if (id === 'analizar') return limitarOraciones(analizarCaso(codigo, motivos, caso, false, tono), topeModo(tono))
  if (id === 'resumen') return limitarOraciones(analizarCaso(codigo, motivos, caso, true, 'simple'), 4)
  if (id === 'ejemplo') return limitarOraciones(ejemploDe(codigo, tono), topeModo(tono))
  return limitarOraciones(conModo(plantilla(codigo, motivoDe(motivos), id), tono, motivos), topeModo(tono))
}

export function prepararRespuesta(nivel, motivos, pregunta, cruda, modo = 'simple', caso) {
  const limpia = limitarOraciones(sinEmojis(cruda), topeModo(modoValido(modo)))
  if (!limpia || respuestaContradice(nivel, limpia)) return respuestaLocal(nivel, motivos, pregunta, modo, caso)
  return limpia
}

function casoConsulta(caso) {
  const origen = caso && typeof caso === 'object' ? caso : {}
  const url = String(origen.url ?? '').replace(/\s+/g, ' ').trim().slice(0, 300)
  const dominio = String(origen.dominio ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)
  const canal = ['enlace', 'whatsapp', 'pdf', 'correo'].includes(origen.canal) ? origen.canal : ''
  const puntuacion = Number.isFinite(origen.puntuacion)
    ? Math.max(0, Math.min(100, Math.round(origen.puntuacion)))
    : null
  return { url, dominio, puntuacion, canal }
}

export function armarConsulta(nivel, motivos, pregunta, turnos, modo = 'simple', caso) {
  const nombre = nombreNivel(nivel)
  const preguntaLimpia = recortarTexto(pregunta)
  if (!nombre || !preguntaLimpia || !/[a-z0-9]/i.test(plano(preguntaLimpia))) return null

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

  return {
    nivel: nombre,
    motivos: lista,
    pregunta: preguntaLimpia,
    turnos: historial,
    modo: modoValido(modo),
    caso: casoConsulta(caso),
  }
}
