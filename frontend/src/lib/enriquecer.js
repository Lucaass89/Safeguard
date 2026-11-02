import {
  analizar,
  combinarConAmenaza,
  combinarConEnriquecimiento,
  marcarSinVerificar,
  motivosLimpios,
} from './analisis.js'
import { analizarCorreo } from './analisisCorreo.js'
import { analizarWhatsapp } from './analisisWhatsapp.js'
import { guardarFragmento } from './fragmentos.js'
import { supabase } from './supabase.js'

export async function enriquecer(url) {
  if (!url) return null

  try {
    const { data, error } = await supabase.functions.invoke('safelink-enriquecer', {
      body: { url },
    })

    if (error || data?.error) return null
    return data
  } catch {
    return null
  }
}

export async function consultarAmenaza(dominio) {
  if (!dominio || !dominio.includes('.')) return { amenaza: null, fallo: null }

  const { data, error } = await supabase
    .from('amenazas')
    .select('nivel, motivo, veces_reportado')
    .eq('dominio', dominio)
    .maybeSingle()

  return { amenaza: data, fallo: error }
}

function peso(nivel) {
  if (nivel === 'rojo') return 2
  if (nivel === 'amarillo') return 1
  return 0
}

export async function consultarPeorAmenaza(dominios) {
  const unicos = [...new Set(dominios.filter((dominio) => dominio && dominio.includes('.')))]
  if (unicos.length === 0) return { amenaza: null, fallo: null }

  const resultados = await Promise.all(unicos.map((dominio) => consultarAmenaza(dominio)))
  const amenazas = resultados.map((resultado) => resultado.amenaza).filter(Boolean)
  amenazas.sort((a, b) => peso(b.nivel) - peso(a.nivel))
  const fallo = resultados.every((resultado) => resultado.fallo) ? resultados[0].fallo : null
  return { amenaza: amenazas[0] ?? null, fallo: amenazas.length ? null : fallo }
}

const SIN_ABRIR = 'No pudimos abrir el sitio para confirmarlo: puede que no exista o que no haya respondido.'
const SIN_BASE = 'No pudimos consultar la base de amenazas.'

export function marcarLoQueFalto(final, { abrio, fallo }) {
  let salida = final
  if (!abrio) salida = marcarSinVerificar(salida, SIN_ABRIR)
  if (fallo) salida = marcarSinVerificar(salida, SIN_BASE)
  return salida
}

export function enlaceParaAbrir(enlaces) {
  return enlaces?.find((enlace) => !enlace.sinSitio && !enlace.demasiadoLarga) ?? null
}

export async function cerrarRevision(local, urlEnlace, dominios) {
  if (local.sinSitio) return local
  const extra = urlEnlace ? await enriquecer(urlEnlace) : null
  const { amenaza, fallo } = await consultarPeorAmenaza([...dominios, extra?.dominio])

  const final = combinarConEnriquecimiento(combinarConAmenaza(local, fallo ? null : amenaza), extra)
  return marcarLoQueFalto(final, { abrio: !urlEnlace || Boolean(extra), fallo })
}

export async function revisarEnlace(entrada) {
  const local = analizar(entrada)
  if (!local) return null
  return cerrarRevision(local, local.demasiadoLarga ? null : local.url, [local.dominio])
}

export async function revisarWhatsapp(texto) {
  const local = analizarWhatsapp(texto)
  if (!local) return null
  const peor = enlaceParaAbrir(local.enlaces)
  return cerrarRevision(local, peor?.url, [local.dominio !== 'whatsapp' ? local.dominio : null])
}

export async function revisarCorreo(texto) {
  const local = analizarCorreo(texto)
  if (!local) return null
  const peor = enlaceParaAbrir(local.enlaces)
  return cerrarRevision(local, peor?.url, [local.dominio, peor?.dominio])
}

export async function guardarAnalisis(sesion, resultado, entrada, texto = null) {
  const consulta = supabase.from('safelink_analisis').insert({
    usuario_id: sesion.user.id,
    url_analizada: resultado.url,
    dominio: resultado.dominioDestino ?? resultado.dominio,
    nivel_riesgo: resultado.nivel,
    explicacion: motivosLimpios(resultado.motivos).join(' '),
    puntuacion_riesgo: resultado.puntuacion,
    entrada,
  })
  if (!texto) return consulta

  const respuesta = await consulta.select('id').single()
  if (!respuesta.error) guardarFragmento(respuesta.data?.id, texto)
  return respuesta
}

export async function reportarDominio(resultado, originType = 'web') {
  return supabase.rpc('safelink_reportar', {
    p_dominio: resultado.dominioDestino ?? resultado.dominio,
    p_motivo: motivosLimpios(resultado.motivos)
      .filter((motivo) => !motivo.startsWith('Este dominio ya fue denunciado'))
      .slice(0, 3)
      .join(' '),
    p_origin_type: originType,
  })
}
