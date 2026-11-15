import {
  analizar,
  iconoDe,
  tituloIcono,
  trazosSimbolo,
  debeAvisar,
  enlaceAlPanel,
  esPagina,
  estadoDe,
  indiceDeAmenazas,
  listaVigente,
  recordar,
  textoAviso,
  urlParaAbrir,
} from './detector.js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config.js'


const CLAVE_LISTA = 'amenazas'
const CLAVE_AVISAR = 'avisar'
const CLAVE_AVISADOS = 'avisados'
const PREFIJO_AVISO = 'safelink:'
const abiertas = new Map()
const generacion = new Map()
let indice = null
const avisadosAhora = new Set()
let bajando = null

function estadoNeutro(hacer) {
  return { nivel: 'neutro', dominio: '', url: '', motivos: [], hacer, aviso: '' }
}

function encabezados() {
  return { apikey: SUPABASE_PUBLISHABLE_KEY }
}

const TAMANOS = [16, 32, 48]
const dibujados = new Map()

function dibujar(nivel, lado) {
  const { color, simbolo } = iconoDe(nivel)
  const lienzo = new OffscreenCanvas(lado, lado)
  const ctx = lienzo.getContext('2d')
  const c = lado / 2
  ctx.beginPath()
  ctx.moveTo(c, lado * 0.04)
  ctx.lineTo(lado * 0.9, lado * 0.2)
  ctx.lineTo(lado * 0.9, lado * 0.5)
  ctx.quadraticCurveTo(lado * 0.88, lado * 0.82, c, lado * 0.97)
  ctx.quadraticCurveTo(lado * 0.12, lado * 0.82, lado * 0.1, lado * 0.5)
  ctx.lineTo(lado * 0.1, lado * 0.2)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  if (simbolo === 'punto') {
    ctx.beginPath()
    ctx.arc(c, c, lado * 0.14, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
  } else {
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = Math.max(1.6, lado * 0.12)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const trazo of trazosSimbolo(simbolo, lado)) {
      ctx.beginPath()
      trazo.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
      ctx.stroke()
    }
  }
  return ctx.getImageData(0, 0, lado, lado)
}

function iconos(nivel) {
  if (!dibujados.has(nivel)) {
    dibujados.set(nivel, Object.fromEntries(TAMANOS.map((lado) => [lado, dibujar(nivel, lado)])))
  }
  return dibujados.get(nivel)
}

async function pintar(tabId, estado) {
  await chrome.action.setIcon({ tabId, imageData: iconos(estado.nivel) })
  await chrome.action.setBadgeText({ tabId, text: '' })
  await chrome.action.setTitle({ tabId, title: tituloIcono(estado) })
  await chrome.storage.session.set({ [`tab:${tabId}`]: estado })
}

async function avisarSiHaceFalta(estado) {
  if (!debeAvisar(estado, { avisados: avisadosAhora })) return
  avisadosAhora.add(estado.dominio)
  const { [CLAVE_AVISAR]: activo = true } = await chrome.storage.sync.get(CLAVE_AVISAR)
  const { [CLAVE_AVISADOS]: lista = [] } = await chrome.storage.session.get(CLAVE_AVISADOS)
  const avisados = new Set(lista)
  if (!debeAvisar(estado, { activo, avisados })) return
  avisados.add(estado.dominio)
  await chrome.storage.session.set({ [CLAVE_AVISADOS]: [...avisados] })
  const { titulo, mensaje } = textoAviso(estado)
  const idAviso = `${PREFIJO_AVISO}${Date.now()}`
  await chrome.storage.session.set({ [`url:${idAviso}`]: estado.url })
  chrome.notifications.create(idAviso, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: titulo,
    message: mensaje,
    contextMessage: 'SafeLink avisa, no bloquea.',
    buttons: [{ title: 'Ver el análisis completo' }],
    priority: 2,
  })
}

function abrirAnalisis(idAviso) {
  if (!idAviso.startsWith(PREFIJO_AVISO)) return
  const clave = `url:${idAviso}`
  chrome.storage.session.get(clave).then((guardado) => {
    if (guardado[clave]) chrome.tabs.create({ url: enlaceAlPanel(guardado[clave]) })
    chrome.notifications.clear(idAviso)
    chrome.storage.session.remove(clave)
  })
}

async function bajarLista() {
  const consulta = new URL('/rest/v1/amenazas', SUPABASE_URL)
  consulta.searchParams.set('select', 'dominio,nivel,motivo,veces_reportado')
  consulta.searchParams.set('limit', '20000')
  const respuesta = await fetch(consulta, { headers: encabezados() })
  if (!respuesta.ok) throw new Error(`amenazas ${respuesta.status}`)
  const filas = await respuesta.json()
  if (!Array.isArray(filas)) throw new Error('amenazas sin filas')
  await chrome.storage.local.set({ [CLAVE_LISTA]: { filas, guardadaEn: Date.now() } })
  return filas
}

async function listaDeAmenazas() {
  const guardado = (await chrome.storage.local.get(CLAVE_LISTA))[CLAVE_LISTA]
  if (listaVigente(guardado)) {
    indice ??= indiceDeAmenazas(guardado.filas)
    return indice
  }
  bajando ??= bajarLista()
    .then((filas) => (indice = indiceDeAmenazas(filas)))
    .catch(() => (guardado?.filas ? (indice = indiceDeAmenazas(guardado.filas)) : null))
    .finally(() => {
      bajando = null
    })
  return bajando
}

async function abrir(url) {
  const respuesta = await fetch(new URL('/functions/v1/safelink-enriquecer', SUPABASE_URL), {
    method: 'POST',
    headers: { ...encabezados(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!respuesta.ok) return null
  const data = await respuesta.json()
  return data?.error ? null : data
}

function abrirUnaVez(url) {
  return abiertas.get(url) ?? recordar(abiertas, url, abrir(url).catch(() => null))
}

async function revisar(tabId, url) {
  const marca = (generacion.get(tabId) ?? 0) + 1
  generacion.set(tabId, marca)
  const sigue = () => generacion.get(tabId) === marca

  if (!esPagina(url)) {
    await pintar(tabId, estadoNeutro('Esta pestaña no es una página web.'))
    return
  }

  const local = analizar(url)
  if (!local) {
    await pintar(tabId, estadoNeutro('No se pudo leer esa dirección.'))
    return
  }

  const lista = await listaDeAmenazas()
  if (!sigue()) return
  const aviso = lista ? '' : 'No se pudo bajar la lista de dominios denunciados. El color sale de la dirección.'
  await pintar(tabId, estadoDe(local, { indice: lista, aviso }))

  const paraAbrir = urlParaAbrir(local)
  if (!paraAbrir) {
    await avisarSiHaceFalta(estadoDe(local, { indice: lista, aviso }))
    return
  }
  const extra = await abrirUnaVez(paraAbrir)
  if (!sigue()) return
  const final = estadoDe(local, { indice: lista, extra, intentoAbrir: true, aviso })
  await pintar(tabId, final)
  await avisarSiHaceFalta(final)
}

chrome.runtime.onInstalled.addListener(() => {
  listaDeAmenazas()
})

chrome.runtime.onStartup.addListener(() => {
  listaDeAmenazas()
})

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.url || info.status === 'complete') revisar(tabId, tab.url ?? info.url ?? '')
})

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs
    .get(tabId)
    .then((tab) => revisar(tabId, tab.url ?? ''))
    .catch(() => {})
})

chrome.notifications.onClicked.addListener(abrirAnalisis)

chrome.notifications.onButtonClicked.addListener((idAviso) => abrirAnalisis(idAviso))

chrome.runtime.onMessage.addListener((mensaje, _emisor, responder) => {
  if (mensaje?.tipo !== 'actual') return
  chrome.tabs.query({ active: true, currentWindow: true }).then(async (tabs) => {
    const tab = tabs[0]
    if (!tab?.id) {
      responder(estadoNeutro('No hay una pestaña activa.'))
      return
    }
    const guardado = await chrome.storage.session.get(`tab:${tab.id}`)
    responder(guardado[`tab:${tab.id}`] ?? estadoNeutro('SafeLink está mirando esta pestaña.'))
  })
  return true
})
