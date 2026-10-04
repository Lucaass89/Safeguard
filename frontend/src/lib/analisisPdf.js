import { analizar, nivelDesde, peorEnlace } from './analisis.js'

const EXT_ADJUNTO = /\.(apk|exe|scr|bat|cmd|msi|dll|hta|lnk|iso|dmg|js|jse|vbs|vbe|ps1|docm|xlsm|html|htm)$/i

export function inspeccionarBytes(datos) {
  const bytes = datos instanceof Uint8Array ? datos : new Uint8Array(datos)
  const fin = Math.min(bytes.length, 1_500_000)
  const texto = new TextDecoder('iso-8859-1').decode(bytes.subarray(0, fin))
  return {
    javascript: /\/JavaScript\b|\/JS\s*(?:\(|<)/.test(texto),
    launch: /\/Launch\b/.test(texto),
    embebido: /\/EmbeddedFile\b/.test(texto),
    envio: /\/SubmitForm\b|\/XFA\b/.test(texto),
  }
}

function listar(coleccion) {
  if (!coleccion) return []
  if (typeof coleccion.forEach === 'function' && typeof coleccion.size === 'number') {
    const lista = []
    coleccion.forEach((valor) => lista.push(valor))
    return lista
  }
  return Object.values(coleccion)
}

function describir(valor) {
  if (!valor) return ''
  if (typeof valor.forEach === 'function' && typeof valor.size === 'number') {
    const partes = []
    valor.forEach((item, clave) => partes.push(`${clave}:${describir(item)}`))
    return partes.join(' ')
  }
  if (typeof valor === 'object') {
    try {
      return JSON.stringify(valor)
    } catch {
      return ''
    }
  }
  return String(valor)
}

let pdfjsCargado = null

async function cargarPdfjs() {
  if (!pdfjsCargado) {
    const [pdfjs, worker] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ])
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    pdfjsCargado = pdfjs
  }
  return pdfjsCargado
}

export async function analizarPdf(archivo) {
  const pdfjs = await cargarPdfjs()
  const datos = await archivo.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: datos }).promise
  const senales = []
  const enlaces = []
  let puntos = 0
  let formulario = false
  let lanzamiento = false
  let javascript = false

  const marcas = inspeccionarBytes(datos)
  if (marcas.javascript) javascript = true
  if (marcas.launch) lanzamiento = true
  if (marcas.envio) formulario = true

  const adjuntos = listar(await doc.getAttachments().catch(() => null))
  if (adjuntos.length > 0 || marcas.embebido) {
    const peligroso = adjuntos.find((adjunto) =>
      EXT_ADJUNTO.test(`${adjunto.filename ?? ''} ${adjunto.rawFilename ?? ''}`.toLowerCase()),
    )
    if (peligroso) {
      puntos += 50
      senales.push(
        `Trae adentro un archivo que puede ejecutarse (${peligroso.filename || 'sin nombre'}).`,
      )
    } else {
      puntos += 25
      senales.push('El PDF trae archivos adjuntos adentro.')
    }
  }

  const accionesDoc = describir(await doc.getJSActions().catch(() => null)).toLowerCase()
  const apertura = describir(await doc.getOpenAction().catch(() => null)).toLowerCase()
  if (accionesDoc) javascript = true
  if (apertura.includes('javascript')) javascript = true
  if (apertura.includes('launch')) lanzamiento = true

  for (let i = 1; i <= doc.numPages; i++) {
    try {
      const pagina = await doc.getPage(i)
      const anotaciones = await pagina.getAnnotations()
      for (const anotacion of anotaciones) {
        if (anotacion.subtype === 'Widget') formulario = true
        if (anotacion.action === 'Launch') lanzamiento = true
        const href = anotacion.url ?? anotacion.unsafeUrl
        if (href) enlaces.push(href)
      }
      if (listar(await pagina.getJSActions()).length > 0) javascript = true
      const texto = await pagina.getTextContent()
      const plano = texto.items.map((it) => it.str).join(' ')
      for (const m of plano.match(/https?:\/\/[^\s]+/g) ?? []) enlaces.push(m)
    } catch {
      continue
    }
  }

  if (lanzamiento) {
    puntos += 45
    senales.push('Intenta abrir un programa de tu computadora.')
  }
  if (javascript) {
    puntos += 35
    senales.push('Ejecuta JavaScript. Un PDF de una factura no lo necesita.')
  }
  if (formulario) {
    puntos += 15
    senales.push('Tiene un formulario: puede pedir datos.')
  }

  const unicos = [...new Set(enlaces)]
  const analizados = unicos
    .map((u) => analizar(u))
    .filter(Boolean)
    .sort((a, b) => b.puntuacion - a.puntuacion)
  const peor = peorEnlace(analizados)

  const puntuacion = Math.min(100, puntos + (peor?.puntuacion ?? 0))
  if (senales.length === 0 && analizados.length === 0) {
    senales.push('No aparecen formularios, scripts ni enlaces raros.')
  }

  return {
    url: archivo.name,
    nombre: archivo.name,
    dominio: analizados[0]?.dominio ?? 'archivo-sin-enlaces',
    puntuacion,
    nivel: nivelDesde(puntuacion),
    motivos: [
      ...senales,
      ...analizados.flatMap((e) => e.motivos.filter((m) => !m.startsWith('No aparecen'))),
    ],
    senales,
    enlaces: analizados,
  }
}
