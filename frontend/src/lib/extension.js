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
export const SITIO = 'https://safeguardd.vercel.app'
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
