import {
  analizar,
  esPagina,
  estadoDe,
  indiceDeAmenazas,
  listaVigente,
  recordar,
  urlParaAbrir,
} from './detector.js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config.js'

const COLORES = {
  verde: '#2f9e6b',
  amarillo: '#c4922a',
  rojo: '#d16b5a',
  gris: '#8d98ab',
  neutro: '#8d98ab',
}

const LETRAS = {
  verde: 'V',
  amarillo: '!',
  rojo: 'X',
  gris: '?',
  neutro: '',
}

const NOMBRES = {
  verde: 'Verde',
  amarillo: 'Amarillo',
  rojo: 'Rojo',
  gris: 'Gris',
}

const CLAVE_LISTA = 'amenazas'
const abiertas = new Map()
const generacion = new Map()
let indice = null
let bajando = null

function estadoNeutro(hacer) {
  return { nivel: 'neutro', dominio: '', url: '', motivos: [], hacer, aviso: '' }
}

function encabezados() {
  return { apikey: SUPABASE_PUBLISHABLE_KEY }
}

async function pintar(tabId, estado) {
  const color = COLORES[estado.nivel] ?? COLORES.neutro
  await chrome.action.setBadgeBackgroundColor({ tabId, color })
  await chrome.action.setBadgeText({ tabId, text: LETRAS[estado.nivel] ?? '' })
  const titulo = NOMBRES[estado.nivel] ? `SafeLink · ${NOMBRES[estado.nivel]} · ${estado.dominio}` : 'SafeLink'
  await chrome.action.setTitle({ tabId, title: titulo })
  await chrome.storage.session.set({ [`tab:${tabId}`]: estado })
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
  if (!paraAbrir) return
  const extra = await abrirUnaVez(paraAbrir)
  if (!sigue()) return
  await pintar(tabId, estadoDe(local, { indice: lista, extra, intentoAbrir: true, aviso }))
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
