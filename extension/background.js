import {
  analizar,
  combinarConAmenaza,
  combinarConEnriquecimiento,
  motivosLimpios,
  queHacer,
} from './analisis.js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config.js'

const COLORES = {
  verde: '#2f9e6b',
  amarillo: '#c4922a',
  rojo: '#d16b5a',
  neutro: '#8d98ab',
}

const LETRAS = {
  verde: 'V',
  amarillo: '!',
  rojo: 'X',
  neutro: '',
}

const NOMBRES = {
  verde: 'Verde',
  amarillo: 'Amarillo',
  rojo: 'Rojo',
}

const porUrl = new Map()
const generacion = new Map()
const conectado = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

function esPagina(url) {
  try {
    const destino = new URL(url)
    return destino.protocol === 'http:' || destino.protocol === 'https:'
  } catch {
    return false
  }
}

function estadoNeutro(hacer) {
  return {
    nivel: 'neutro',
    dominio: '',
    url: '',
    motivos: [],
    hacer,
    aviso: '',
  }
}

function encabezados() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  }
}

async function pintar(tabId, estado) {
  const color = COLORES[estado.nivel] ?? COLORES.neutro
  await chrome.action.setBadgeBackgroundColor({ tabId, color })
  await chrome.action.setBadgeText({ tabId, text: LETRAS[estado.nivel] ?? '' })
  const titulo =
    estado.nivel === 'neutro'
      ? 'SafeLink'
      : `SafeLink · ${NOMBRES[estado.nivel]} · ${estado.dominio}`
  await chrome.action.setTitle({ tabId, title: titulo })
  await chrome.storage.session.set({ [`tab:${tabId}`]: estado })
}

async function consultarAmenaza(dominio) {
  if (!conectado || !dominio?.includes('.')) return null
  const consulta = new URL('/rest/v1/amenazas', SUPABASE_URL)
  consulta.searchParams.set('select', 'nivel,motivo,veces_reportado')
  consulta.searchParams.set('dominio', `eq.${dominio}`)
  const respuesta = await fetch(consulta, { headers: encabezados() })
  if (!respuesta.ok) return null
  const filas = await respuesta.json()
  return Array.isArray(filas) ? (filas[0] ?? null) : null
}

async function enriquecer(pagina) {
  if (!conectado) return null
  const respuesta = await fetch(new URL('/functions/v1/safelink-enriquecer', SUPABASE_URL), {
    method: 'POST',
    headers: { ...encabezados(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: pagina }),
  })
  if (!respuesta.ok) return null
  const data = await respuesta.json()
  if (data?.error) return null
  return data
}

function armar(local, amenaza, extra, aviso) {
  let final = combinarConAmenaza(local, amenaza)
  final = combinarConEnriquecimiento(final, extra)
  return {
    nivel: final.nivel,
    dominio: final.dominioDestino ?? final.dominio,
    url: final.url,
    motivos: motivosLimpios(final.motivos).slice(0, 4),
    hacer: queHacer(final.nivel),
    aviso,
  }
}

async function completar(local) {
  const extra = await enriquecer(local.url)
  const amenaza = await consultarAmenaza(extra?.dominio || local.dominio)
  return armar(local, amenaza, extra, '')
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

  await pintar(tabId, armar(local, null, null, ''))
  if (!conectado) return

  let pendiente = porUrl.get(local.url)
  if (!pendiente) {
    pendiente = completar(local).catch(() =>
      armar(local, null, null, 'No se pudo consultar la base. El color sale de la dirección.'),
    )
    porUrl.set(local.url, pendiente)
  }

  const listo = await pendiente
  if (!sigue()) return
  await pintar(tabId, listo)
}

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.url || info.status === 'complete') revisar(tabId, tab.url ?? info.url ?? '')
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId)
    revisar(tabId, tab.url ?? '')
  } catch {
    /* la pestaña se cerró */
  }
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
