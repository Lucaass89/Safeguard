import {
  analizar,
  combinarConAmenaza,
  combinarConEnriquecimiento,
  marcarSinVerificar,
  motivosLimpios,
  queHacer,
} from './analisis.js'
import { dominiosDelRecorrido, sinFragmento } from './enlace.js'
import { SIN_ABRIR, SIN_BASE } from './veredicto.js'

export { analizar }

export const HORAS_LISTA = 6
export const MAX_MOTIVOS = 4
export const MAX_RECORDADAS = 200
export const SITIO = 'https://safeguard-ar.vercel.app'
export const MAX_LARGO_AVISO = 140

const PESO = { rojo: 2, amarillo: 1 }

export function esPagina(url) {
  try {
    const destino = new URL(url)
    return destino.protocol === 'http:' || destino.protocol === 'https:'
  } catch {
    return false
  }
}

export function debeAbrir(local) {
  if (!local || local.sinSitio || local.demasiadoLarga) return false
  return local.nivel !== 'verde'
}

export function urlParaAbrir(local) {
  return debeAbrir(local) ? sinFragmento(local.url) : null
}

export function listaVigente(guardada, ahora = Date.now(), horas = HORAS_LISTA) {
  if (!guardada || !Array.isArray(guardada.filas) || typeof guardada.guardadaEn !== 'number') return false
  const edad = ahora - guardada.guardadaEn
  return edad >= 0 && edad < horas * 60 * 60 * 1000
}

export function indiceDeAmenazas(filas) {
  const indice = new Map()
  for (const fila of filas ?? []) {
    const dominio = String(fila?.dominio ?? '').trim().toLowerCase()
    if (!dominio.includes('.') || !PESO[fila.nivel]) continue
    const previa = indice.get(dominio)
    if (!previa || PESO[fila.nivel] > PESO[previa.nivel]) {
      indice.set(dominio, { nivel: fila.nivel, motivo: fila.motivo ?? null, veces_reportado: fila.veces_reportado ?? 1 })
    }
  }
  return indice
}

export function peorAmenaza(indice, dominios) {
  let peor = null
  for (const dominio of new Set(dominios.filter(Boolean).map((d) => String(d).toLowerCase()))) {
    const amenaza = indice?.get(dominio)
    if (amenaza && (!peor || PESO[amenaza.nivel] > PESO[peor.nivel])) peor = amenaza
  }
  return peor
}

export function dominiosARevisar(local, extra) {
  return [local?.dominio, extra?.dominio, ...dominiosDelRecorrido(extra)]
}

export function estadoDe(local, { indice = null, extra = null, intentoAbrir = false, aviso = '' } = {}) {
  const amenaza = indice ? peorAmenaza(indice, dominiosARevisar(local, extra)) : null
  let final = combinarConEnriquecimiento(combinarConAmenaza(local, amenaza), extra)
  if (intentoAbrir && !extra) final = marcarSinVerificar(final, SIN_ABRIR)
  if (!indice) final = marcarSinVerificar(final, SIN_BASE)
  return {
    nivel: final.nivel,
    dominio: final.dominioDestino ?? final.dominio,
    url: final.url,
    motivos: motivosLimpios(final.motivos).slice(0, MAX_MOTIVOS),
    hacer: queHacer(final.nivel),
    aviso,
  }
}

export function recordar(mapa, clave, valor, maximo = MAX_RECORDADAS) {
  if (mapa.has(clave)) mapa.delete(clave)
  mapa.set(clave, valor)
  while (mapa.size > maximo) mapa.delete(mapa.keys().next().value)
  return valor
}

export function debeAvisar(estado, { activo = true, avisados = new Set() } = {}) {
  if (!activo || estado?.nivel !== 'rojo' || !estado.dominio) return false
  return !avisados.has(estado.dominio)
}

export function textoAviso(estado) {
  const motivo = estado?.motivos?.[0] ?? 'Encontramos señales fuertes de engaño.'
  const corto = motivo.length > MAX_LARGO_AVISO ? `${motivo.slice(0, MAX_LARGO_AVISO - 1).trimEnd()}…` : motivo
  return {
    titulo: `Rojo: ${estado?.dominio ?? 'esta página'}`,
    mensaje: `${corto} No escribas claves ni datos de una tarjeta.`,
  }
}

export function enlaceAlPanel(url, sitio = SITIO) {
  const destino = new URL('/panel/enlaces', sitio)
  if (esPagina(url)) destino.searchParams.set('url', sinFragmento(url))
  return destino.toString()
}

export const ICONOS = {
  verde: { color: '#16a34a', simbolo: 'tilde', titulo: 'Verde' },
  amarillo: { color: '#d97706', simbolo: 'atencion', titulo: 'Amarillo' },
  rojo: { color: '#dc2626', simbolo: 'cruz', titulo: 'Rojo' },
  gris: { color: '#64748b', simbolo: 'pregunta', titulo: 'Gris' },
  neutro: { color: '#1a52be', simbolo: 'logo', titulo: '' },
}

export function iconoDe(nivel) {
  return ICONOS[nivel] ?? ICONOS.neutro
}

export function tituloIcono(estado) {
  const { titulo } = iconoDe(estado?.nivel)
  if (!titulo || !estado?.dominio) return 'SafeLink'
  return `SafeLink · ${titulo} · ${estado.dominio}`
}

export function trazosSimbolo(simbolo, lado) {
  const c = lado / 2
  const r = lado * 0.17
  if (simbolo === 'tilde') return [[[c - r, c], [c - r * 0.25, c + r * 0.75], [c + r, c - r * 0.7]]]
  if (simbolo === 'cruz') return [[[c - r * 0.75, c - r * 0.75], [c + r * 0.75, c + r * 0.75]], [[c + r * 0.75, c - r * 0.75], [c - r * 0.75, c + r * 0.75]]]
  if (simbolo === 'atencion') return [[[c, c - r], [c, c + r * 0.2]], [[c, c + r * 0.85], [c, c + r * 0.9]]]
  if (simbolo === 'pregunta') return [[[c - r * 0.6, c - r * 0.45], [c - r * 0.3, c - r], [c + r * 0.4, c - r], [c + r * 0.7, c - r * 0.45], [c, c + r * 0.1], [c, c + r * 0.3]], [[c, c + r * 0.85], [c, c + r * 0.9]]]
  return []
}

export const LOGO = {
  ancho: 267,
  alto: 269,
  barras: [
    '4,154 5,188 137,262 142,263 142,231',
    '4,89 6,123 201,227 227,193 195,190',
    '4,8 12,8 67,37 46,37 47,40 257,154 233,186 214,177 208,173 214,165 212,163 6,52',
    '30,8 118,8 238,74 240,59 266,73 266,124 109,37 84,37',
  ],
  degradado: [
    [0, '#2ad4ee'],
    [0.34, '#1e8ed4'],
    [0.66, '#1a52be'],
    [1, '#1a1c8c'],
  ],
}

export function barrasLogo(lado, margen = 0.06) {
  const util = lado * (1 - margen * 2)
  const escala = util / Math.max(LOGO.ancho, LOGO.alto)
  const dx = (lado - LOGO.ancho * escala) / 2
  const dy = (lado - LOGO.alto * escala) / 2
  return LOGO.barras.map((barra) =>
    barra.split(' ').map((par) => {
      const [x, y] = par.split(',').map(Number)
      return [dx + x * escala, dy + y * escala]
    }),
  )
}
