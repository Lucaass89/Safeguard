import { motivosLimpios } from './analisis.js'
import { sinConsulta } from './enlace.js'
import { PUNTAJE } from './puntaje.js'

export const FALLO_FARO = 'Faro no pudo responder ahora, probá de nuevo.'

export function textoTokens(cantidad) {
  if (!Number.isInteger(cantidad) || cantidad < 0) return ''
  const cifra = String(cantidad).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return cantidad === 1 ? '1 token' : `${cifra} tokens`
}
export const LIMITE_FARO = 'Faro tuvo muchas consultas hoy. Probá más tarde.'

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

const IMP = String.raw`(?:^|[,;:]\s*|\b(?:y|entonces|ahora|tranquilo|dale)\s+)`
const recomienda = (verbos) => new RegExp(`${IMP}(?:${verbos})\\b`)
const permite = (verbos) =>
  new RegExp(String.raw`\b(?:podes|puedes|conviene|esta bien|es seguro|dale|no pasa nada si)\b[^.]{0,30}\b(?:${verbos})\b`)
const TRANQUILIZA = /\b(esta todo bien|podes confiar|no es peligroso|no hay riesgo)\b/

const PELIGROSO = [
  recomienda(
    'abrilo|abrila|abri (?:el|la|este|ese)|descargalo|descargala|descarga (?:el|la|ese)|bajalo|respondele|respondeles|contestale|responde (?:el|al|ese)|pagalo|pagala|transferi|hace la transferencia|manda la plata|hace (?:clic|click)|entra (?:al|a ese|en el)|segui (?:el|ese)',
  ),
  new RegExp(String.raw`${IMP}(?:carga|ingresa|escribi|pone|manda|envia)\b[^.]{0,40}\b(?:clave|claves|datos|codigo|cbu|tarjeta|contrasena)\b`),
  permite('abrir|abrirlo|abrirla|descargar|responder|pagar|entrar|seguir|hacer clic|cargar|ingresar'),
  TRANQUILIZA,
]

const DUDOSO = [
  recomienda('segui (?:el|ese)|hace lo que (?:dice|pide)|abrilo|abrila|abri (?:el|la|este|ese)|hace (?:clic|click)|entra (?:al|a ese|en el)'),
  permite('seguir|abrir|abrirlo|abrirla|entrar|hacer clic'),
  TRANQUILIZA,
]

const SEGURO = [
  new RegExp(String.raw`${IMP}(?:pone|ingresa|carga|escribi|manda|envia|pasa)\b[^.]{0,40}\b(?:clave|codigo|contrasena|cbu|tarjeta)\b`),
  new RegExp(String.raw`${IMP}(?:paga|pagalo|transferi)\b[^.]{0,40}\b(?:enlace|link|mensaje|ahi|aca)\b`),
  permite('pagar|poner la clave|ingresar la clave|cargar los datos'),
]

const NUNCA = [/\bes seguro\b/, /\bconfiable\b/, /\bgarantizad[oa]s?\b/]

const TITULOS = ['Peligroso', 'Precaución', 'Seguro', 'Sin señales de riesgo', 'No pudimos verificarlo']

export function plano(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

const DELIMITADORES = /contexto_inicio|contexto_fin|datos_inicio|datos_fin/gi

export function datoExterno(valor, tope) {
  return String(valor ?? '')
    .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, ' ')
    .replace(DELIMITADORES, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, tope)
    .trim()
}

export function recortarTexto(texto, tope = TOPE_PREGUNTA) {
  return datoExterno(String(texto ?? '').replace(/https?:\/\/\S+/gi, ' ').replace(/\bwww\.\S+/gi, ' '), tope)
}

function urlExterna(valor) {
  const limpia = datoExterno(valor, 2000)
  if (!/^https?:\/\//i.test(limpia)) return datoExterno(limpia, 300)
  return datoExterno(sinConsulta(limpia), 300)
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
const VINETA = /^[-*•]\s+/

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

const completa = (parte, indice, todas) => /[.!?]$/.test(parte) || (indice === todas.length - 1 && /:$/.test(parte))

export function limitarOraciones(texto, max = 5, maxLineas = Infinity) {
  let quedan = max
  const lineas = []
  for (const linea of separarItems(texto)) {
    if (lineas.length >= maxLineas) break
    if (ITEM.test(linea)) {
      if (!/[.!?]$/.test(linea)) continue
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

export function bloquesRespuesta(texto) {
  const bloques = []
  for (const linea of separarItems(texto)) {
    const item = linea.match(ITEM)
    const vineta = linea.match(VINETA)
    const ultimo = bloques.at(-1)
    if (item && ultimo?.tipo === 'lista') ultimo.items.push(linea.slice(item[0].length))
    else if (item) bloques.push({ tipo: 'lista', items: [linea.slice(item[0].length)] })
    else if (vineta && ultimo?.tipo === 'vinetas') ultimo.items.push(linea.slice(vineta[0].length))
    else if (vineta) bloques.push({ tipo: 'vinetas', items: [linea.slice(vineta[0].length)] })
    else bloques.push({ tipo: 'parrafo', texto: linea })
  }
  return bloques
}

export function partesTexto(texto) {
  const origen = String(texto ?? '')
  const partes = []
  const marca = /\*\*([^*\n]{1,200})\*\*/g
  let cursor = 0
  let hallazgo = marca.exec(origen)
  while (hallazgo) {
    if (hallazgo.index > cursor) partes.push({ tipo: 'texto', texto: origen.slice(cursor, hallazgo.index) })
    partes.push({ tipo: 'fuerte', texto: hallazgo[1] })
    cursor = hallazgo.index + hallazgo[0].length
    hallazgo = marca.exec(origen)
  }
  if (cursor < origen.length) partes.push({ tipo: 'texto', texto: origen.slice(cursor) })
  return partes.length ? partes : [{ tipo: 'texto', texto: '' }]
}

function codigoNivel(nivel) {
  if (nivel === 'rojo' || nivel === 'Peligroso') return 'rojo'
  if (nivel === 'amarillo' || nivel === 'Dudoso' || nivel === 'Precaución') return 'amarillo'
  if (nivel === 'verde' || nivel === 'Seguro' || nivel === 'Sin señales de riesgo') return 'verde'
  if (nivel === 'gris' || nivel === 'No verificado' || nivel === 'No pudimos verificarlo') return 'gris'
  return ''
}

export function nombreNivel(nivel, titulo) {
  const codigo = codigoNivel(nivel)
  if (titulo && TITULOS.includes(titulo) && codigoNivel(titulo) === codigo) return titulo
  if (codigo === 'rojo') return 'Peligroso'
  if (codigo === 'amarillo') return 'Precaución'
  if (codigo === 'verde') return 'Sin señales de riesgo'
  if (codigo === 'gris') return 'No pudimos verificarlo'
  return ''
}

function nivelServidor(codigo) {
  if (codigo === 'rojo') return 'Peligroso'
  if (codigo === 'amarillo') return 'Dudoso'
  if (codigo === 'verde') return 'Seguro'
  return ''
}

export function modoValido(modo) {
  return modo === 'tecnico' || modo === 'avanzado' ? modo : 'simple'
}

export function topesDelModo(modo) {
  if (modo === 'avanzado') return { oraciones: 16, lineas: 40 }
  if (modo === 'tecnico') return { oraciones: 8, lineas: 8 }
  return { oraciones: 3, lineas: 3 }
}

export function pideResumen(pregunta) {
  const p = plano(pregunta)
    .replace(/[¿?¡!.,:;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (p === 'analiza este caso') return 'analizar'
  if (p === 'hace un resumen') return 'resumen'
  if (p === 'por que dio este resultado') return 'porque'
  if (p === 'se puede abrir') return 'abrir'
  if (p === 'que pasa si ya hice clic') return 'clic'
  if (p === 'dame un ejemplo') return 'ejemplo'
  return ''
}

const FUERZA = { fuerte: 'fuerte', media: 'media', debil: 'débil' }
const ORDEN = { fuerte: 0, media: 1, debil: 2 }

function pesoDe(senal) {
  const peso = Number(senal?.peso)
  if (Number.isFinite(peso)) return peso
  const puntos = Number(senal?.puntos)
  return Number.isFinite(puntos) ? puntos : 0
}

function senalesActivas(caso) {
  return (Array.isArray(caso?.senales) ? caso.senales : [])
    .filter((senal) => senal && typeof senal.texto === 'string' && senal.texto && pesoDe(senal) > 0)
    .sort((a, b) => (ORDEN[a.fuerza] ?? 3) - (ORDEN[b.fuerza] ?? 3) || b.peso - a.peso)
}

function conPunto(frase) {
  const limpia = String(frase ?? '').trim()
  return /[.!?]$/.test(limpia) ? limpia : `${limpia}.`
}

function conMayuscula(frase) {
  const texto = String(frase ?? '').trim()
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : ''
}

function unir(partes) {
  if (partes.length <= 1) return partes[0] ?? ''
  if (partes.length === 2) return `${partes[0]}, y ${partes[1]}`
  return `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`
}

function decirSenal(senal, caso) {
  const id = String(senal?.id ?? '')
  const dias = Number.isFinite(caso?.edadDias) ? Math.round(caso.edadDias) : null
  if (id === 'dominio_reciente') {
    if (dias != null && dias < 1) return 'el dominio se registró hoy'
    if (dias === 1) return 'el dominio se registró ayer'
    if (dias != null) return `el dominio tiene ${dias} días`
    return 'el dominio es de los últimos días'
  }
  if (id === 'pide_clave_dominio_nuevo') return 'piden una clave y el dominio todavía no llega a los cuatro meses'
  if (id === 'pide_clave' || id === 'pide_datos') return 'la página pide una clave o un dato de pago'
  if (id === 'virustotal') {
    const n = caso?.virusTotal?.maliciosos
    const total = caso?.virusTotal?.total
    return Number.isFinite(n) && Number.isFinite(total)
      ? `${n} de ${total} motores de VirusTotal lo marcan`
      : 'varios motores de VirusTotal lo marcan'
  }
  if (id === 'tld_barato') return 'el final del dominio aparece seguido en sitios armados para engañar'
  if (id === 'sin_https') return 'la dirección no tiene https'
  if (id.startsWith('marca_')) return 'el nombre imita una marca conocida y el dominio es otro'
  if (id === 'nombre_senuelo') return 'el nombre parece un trámite o un pago'
  if (id === 'denunciado_en_safelink' || id === 'senalado_en_safelink') return 'ese dominio ya figura en la base de SafeLink'
  if (id === 'destino_descarga') return 'el destino es una descarga'
  if (id === 'ip') return 'la dirección es un número, no un nombre de sitio'
  if (id === 'enlace_escondido') return 'la dirección esconde otro enlace'
  if (id === 'formulario_a_otro_sitio') return 'lo que se escribe en el formulario se va a otro sitio'
  if (id === 'certificado_reciente') return 'el certificado es de estos días'
  if (id === 'muchos_guiones') return 'el dominio está armado con muchos guiones'
  if (id === 'muchos_subdominios') return 'hay varios subdominios uno detrás de otro'
  if (id === 'palabras_gancho') return 'la dirección usa una palabra de apuro o de premio'
  if (id === 'esquema_peligroso') return 'la dirección no es una página web común'
  return 'hay otra revisión de la dirección que suma al resultado'
}

function umbralesDe(caso) {
  const u = caso?.umbrales
  return Number.isFinite(u?.precaucion) && Number.isFinite(u?.peligroso) ? u : PUNTAJE.umbrales
}

function notasGuardadas(motivos) {
  return motivosLimpios(motivos).slice(0, 4)
}

function sinDesglose(motivos) {
  const lista = notasGuardadas(motivos)
  if (!lista.length) return 'No hay una señal con peso en este caso.'
  return `El desglose de señales no vino con este resultado. Lo anotado es: ${lista.join(' ')}`
}

function textoSimple(codigo, caso, motivos) {
  const nombre = nombreNivel(codigo, caso?.titulo)
  const dominio = String(caso?.dominio ?? '').trim()
  const cabeza = dominio ? `Revisamos ${dominio} y quedó en ${nombre}.` : `Este caso quedó en ${nombre}.`
  const partes = senalesActivas(caso).slice(0, 2).map((senal) => decirSenal(senal, caso))
  const medio = partes.length ? `Lo que arma ese nivel es que ${unir(partes)}.` : sinDesglose(motivos)
  return `${cabeza} ${medio}`
}

function textoPorque(codigo, caso, modo, motivos) {
  const nombre = nombreNivel(codigo, caso?.titulo)
  const activas = senalesActivas(caso)
  if (modo === 'tecnico' || modo === 'avanzado') {
    const lineas = [`Dio ${nombre} por estas señales:`]
    if (!activas.length) lineas.push(sinDesglose(motivos))
    activas.forEach((senal, indice) => {
      const fuerza = FUERZA[senal.fuerza] ?? 'sin fuerza'
      const detalle = modo === 'avanzado' ? `${senal.id}, ${fuerza}, ${Math.round(pesoDe(senal))} puntos` : `${fuerza}, ${Math.round(pesoDe(senal))} puntos`
      lineas.push(`${indice + 1}. ${detalle}. ${conPunto(conMayuscula(decirSenal(senal, caso)))}`)
    })
    if (modo === 'avanzado') {
      lineas.push(
        Number.isFinite(caso?.puntuacion)
          ? `Puntaje: ${caso.puntuacion} de 100.`
          : 'Puntaje: no se guardó con este resultado.',
      )
    }
    return lineas.join('\n')
  }
  const partes = activas.slice(0, 3).map((senal) => decirSenal(senal, caso))
  if (!partes.length) return `Dio ${nombre}. ${sinDesglose(motivos)}`
  const resto = activas.length - partes.length
  const extra = resto > 0 ? ` Hay ${resto} ${resto === 1 ? 'señal más' : 'señales más'}.` : ''
  return `Dio ${nombre} porque ${unir(partes)}.${extra}`
}

function textoAbrir(codigo, caso) {
  const nombre = nombreNivel(codigo, caso?.titulo)
  if (codigo === 'rojo') return `No. Quedó en ${nombre}, así que este enlace no es para entrar.`
  if (codigo === 'amarillo') return `Mejor no todavía. Quedó en ${nombre}: compará la dirección con la oficial, escrita por vos.`
  if (codigo === 'gris') return `No hay forma de decirlo. Quedó en ${nombre}.`
  return `El nivel es ${nombre}. En la dirección no vimos señales de riesgo, y eso no cierra el caso.`
}

function textoClic(codigo, caso) {
  const nombre = nombreNivel(codigo, caso?.titulo)
  if (codigo === 'rojo') {
    return `Si ya entraste en un caso ${nombre}, no completes nada en esa página. Si escribiste una clave, cambiala desde el sitio oficial, entrando vos.`
  }
  if (codigo === 'amarillo' || codigo === 'gris') {
    return `El nivel es ${nombre}. Si ya entraste, no completes datos. Una clave, si hace falta cambiarla, se cambia en el sitio oficial.`
  }
  return `El nivel es ${nombre}. Si igual escribiste una clave porque el enlace te lo pasó otra persona, cambiala desde el sitio oficial.`
}

function textoEjemplo(codigo, caso) {
  const nombre = nombreNivel(codigo, caso?.titulo)
  return `Un caso parecido es un aviso que usa el nombre de una tienda en un dominio recién creado y pide entrar. Este quedó en ${nombre} por lo que vimos en esta dirección.`
}

function textoTecnico(codigo, caso, motivos) {
  const nombre = nombreNivel(codigo, caso?.titulo)
  const vt = contextoDe(caso, nombre).virustotal
  const conVt = vt.consultado
  const cupo = 8 - 2 - (conVt ? 1 : 0)
  const activas = senalesActivas(caso)
  let extra = 0
  let lista = activas
  if (lista.length > cupo) {
    extra = lista.length - Math.max(cupo - 1, 1)
    lista = lista.slice(0, Math.max(cupo - 1, 1))
  }
  const lineas = [`Quedó en ${nombre}.`]
  if (!lista.length) lineas.push(sinDesglose(motivos))
  lista.forEach((senal, indice) => {
    const fuerza = FUERZA[senal.fuerza] ?? 'sin fuerza'
    lineas.push(`${indice + 1}. ${fuerza}, ${Math.round(pesoDe(senal))} puntos. ${conPunto(conMayuscula(decirSenal(senal, caso)))}`)
  })
  if (extra > 0) lineas.push(`Hay ${extra} ${extra === 1 ? 'señal más' : 'señales más'}, de menor peso.`)
  if (conVt) lineas.push(`VirusTotal: ${vt.motores_que_detectan} de ${vt.motores_totales} motores la marcan.`)
  return lineas.slice(0, 8).join('\n')
}

function textoAvanzado(codigo, caso, motivos) {
  const nombre = nombreNivel(codigo, caso?.titulo)
  const ctx = contextoDe(caso, nombre)
  const u = umbralesDe(caso)
  const vt = ctx.virustotal
  const motores = Array.isArray(vt.ejemplos) && vt.ejemplos.length ? vt.ejemplos.join(', ') : 'no disponible'
  const lineas = [
    `Nivel: ${ctx.nivel}. Puntaje: ${Number.isFinite(ctx.puntaje) ? `${ctx.puntaje} de 100` : 'no se guardó con este resultado'}. Precaución desde ${u.precaucion}, Peligroso desde ${u.peligroso}.`,
    'Desglose:',
  ]
  if (!ctx.senales.length) lineas.push(sinDesglose(motivos))
  ctx.senales.forEach((senal, indice) => {
    lineas.push(
      `${indice + 1}. ${senal.id} | grupo ${senal.grupo || 'sin grupo'} | ${senal.fuerza || 'sin fuerza'} | ${Math.round(pesoDe(senal))} puntos. ${conPunto(conMayuscula(decirSenal(senal, caso)))}`,
    )
  })
  lineas.push(
    ctx.dominio.fecha_registro
      ? `Fecha de registro: ${ctx.dominio.fecha_registro}. Días de antigüedad: ${ctx.dominio.dias_de_antiguedad ?? 'no disponible'}.`
      : 'Fecha de registro: no disponible. Días de antigüedad: no disponible.',
  )
  lineas.push(
    vt.consultado
      ? `VirusTotal: ${vt.motores_que_detectan} de ${vt.motores_totales} motores. Lista de motores: ${motores}.`
      : 'VirusTotal: no se consultó. Lista de motores: no disponible.',
  )
  lineas.push(
    ctx.redireccion
      ? `Redirección: ${ctx.redireccion.destino}. Tipo: ${ctx.redireccion.destino_tipo ?? 'no disponible'}.`
      : 'Redirección: no vimos una. Tipo: no disponible.',
  )
  lineas.push(ctx.contenido_analizado ? 'Límite: lo leído no cubre lo que el sitio haga después.' : `Límite: ${ctx.motivo_sin_contenido}.`)
  lineas.push(`Topes del puntaje: palabras sospechosas hasta ${PUNTAJE.topes.palabras}, rasgos débiles hasta ${PUNTAJE.topes.debiles}.`)
  return lineas.join('\n')
}

function analizarCaso(codigo, caso, modo, motivos) {
  if (modo === 'tecnico') return textoTecnico(codigo, caso, motivos)
  if (modo === 'avanzado') return textoAvanzado(codigo, caso, motivos)
  return textoSimple(codigo, caso, motivos)
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
  const patrones = [...(codigo === 'rojo' ? PELIGROSO : codigo === 'verde' ? SEGURO : DUDOSO), ...NUNCA]
  return oraciones(plano(sinEmojis(texto))).some((frase) => patrones.some((patron) => afirma(frase, patron)))
}

export function revelaInstrucciones(texto) {
  const p = plano(texto)
  return /contexto[_ ]?inicio|contexto[_ ]?fin|datos[_ ]?inicio|datos[_ ]?fin|prompt de sistema|instrucciones del sistema|system prompt/.test(p)
}

export function respuestaLocal(nivel, motivos, pregunta, modo = 'simple', caso = {}) {
  const pedido = pideResumen(pregunta)
  const codigo = codigoNivel(nivel)
  if (!pedido || !codigo) return FALLO_FARO
  const tono = modoValido(modo)
  const tope = topesDelModo(tono)
  const crudo =
    pedido === 'porque'
      ? textoPorque(codigo, caso, tono, motivos)
      : pedido === 'abrir'
        ? textoAbrir(codigo, caso)
        : pedido === 'clic'
          ? textoClic(codigo, caso)
          : pedido === 'ejemplo'
            ? textoEjemplo(codigo, caso)
            : analizarCaso(codigo, caso, tono, motivos)
  return limitarOraciones(crudo, tope.oraciones, tope.lineas)
}

export function prepararRespuesta(nivel, motivos, pregunta, cruda, modo = 'simple', caso) {
  const tope = topesDelModo(modoValido(modo))
  const limpia = conNombreDeTarjeta(limitarOraciones(sinEmojis(cruda), tope.oraciones, tope.lineas), nivel, caso)
  if (!limpia || respuestaContradice(nivel, limpia) || revelaInstrucciones(limpia)) return null
  return limpia
}

export function cerrarConsulta(nivel, motivos, pregunta, cruda, modo, caso, fallo) {
  if (pideResumen(pregunta)) return respuestaLocal(nivel, motivos, pregunta, modo, caso)
  if (fallo) return FALLO_FARO
  return prepararRespuesta(nivel, motivos, pregunta, cruda, modo, caso) ?? FALLO_FARO
}

function conNombreDeTarjeta(texto, nivel, caso) {
  const nombre = nombreNivel(nivel, caso?.titulo)
  return nombre ? texto.replace(/\b(Dudoso|Sospechoso)\b/g, nombre) : texto
}

function casoConsulta(caso) {
  const origen = caso && typeof caso === 'object' ? caso : {}
  const crudo = String(origen.url ?? '').replace(/\s+/g, ' ').trim()
  const url = urlExterna(crudo)
  const dominio = datoExterno(origen.dominio, 120)
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
      peso: Math.round(pesoDe(senal)),
      texto: recortarTexto(senal.texto, 240),
    }))
}

function virusTotalConsulta(caso) {
  const vt = caso?.virusTotal
  if (!vt || !Number.isFinite(vt.maliciosos) || !Number.isFinite(vt.total)) return null
  return { maliciosos: Math.max(0, Math.round(vt.maliciosos)), total: Math.max(0, Math.round(vt.total)) }
}

const MOTIVO_SIN_CONTENIDO = {
  no_resuelve: 'el dominio no existe o no apunta a un servidor',
  dns: 'no pudimos averiguar a qué servidor apunta',
  bloqueado: 'la dirección apunta a una red privada',
  protocolo: 'la redirección no es una página web',
  tls: 'falló el certificado del sitio',
  tiempo: 'el sitio tardó demasiado en responder',
  conexion: 'no se pudo conectar con el sitio',
  saltos: 'el enlace redirige demasiadas veces',
}

function fechaDeContexto(valor) {
  const dia = String(valor ?? '').match(/^(\d{4}-\d{2}-\d{2})/)
  if (!dia) return null
  const fecha = new Date(`${dia[1]}T00:00:00Z`)
  return Number.isNaN(fecha.getTime()) ? null : dia[1]
}

function destinoDeContexto(caso, url) {
  const crudo = String(caso?.destino ?? '').trim()
  if (!/^https?:\/\//i.test(crudo)) return null
  const destino = urlExterna(crudo)
  return destino && destino !== url ? destino : null
}

export function contextoDe(caso, titulo) {
  const ficha = casoConsulta(caso)
  const vt = virusTotalConsulta(caso)
  const destino = destinoDeContexto(caso, ficha.url)
  const contenido = caso?.contenidoRevisado === true
  const dias = Number.isFinite(caso?.edadDias) ? Math.max(0, Math.round(caso.edadDias)) : null
  return {
    url: ficha.url || null,
    dominio_registrable: ficha.dominio || null,
    nivel: titulo,
    puntaje: ficha.puntuacion,
    senales: senalesConsulta(caso).map(({ id, grupo, texto, peso, fuerza }) => ({ id, grupo, texto, peso, fuerza })),
    virustotal: {
      consultado: Boolean(vt),
      motores_que_detectan: vt ? vt.maliciosos : null,
      motores_totales: vt ? vt.total : null,
      ejemplos: null,
    },
    dominio: {
      fecha_registro: fechaDeContexto(caso?.registradoEn),
      dias_de_antiguedad: dias,
    },
    redireccion: destino ? { destino, destino_tipo: null } : null,
    contenido_analizado: contenido,
    motivo_sin_contenido: contenido
      ? null
      : (MOTIVO_SIN_CONTENIDO[caso?.falloAlSeguir] ??
        (ficha.sinContenido ? 'no se pudo abrir el sitio' : 'no se revisó el contenido de la página')),
  }
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
  const titulo = datosCaso.titulo || nombreNivel(codigo)
  return {
    nivel: nombre || titulo,
    titulo,
    motivos: lista,
    senales: senalesConsulta(caso),
    virusTotal: virusTotalConsulta(caso),
    umbrales: { ...PUNTAJE.umbrales },
    pregunta: preguntaLimpia,
    turnos: historial,
    modo: modoValido(modo),
    caso: datosCaso,
    contexto: contextoDe(caso, titulo),
  }
}
