import {
  analizar,
  combinarConAmenaza,
  combinarConEnriquecimiento,
  marcarSinVerificar,
  motivosLimpios,
} from './analisis.js'
import { analizarCorreo } from './analisisCorreo.js'
import { analizarWhatsapp } from './analisisWhatsapp.js'
import { dominiosDelRecorrido, sinFragmento } from './enlace.js'
import { guardarFragmento } from './fragmentos.js'
import { supabase } from './supabase.js'
import { SIN_ABRIR, SIN_BASE } from './veredicto.js'

export async function enriquecer(url) {
  if (!url) return null

  try {
    const { data, error } = await supabase.functions.invoke('safelink-enriquecer', {
      body: { url: sinFragmento(url) },
    })

    if (error) return null
    if (data?.fallo) return data
    if (data?.error) return null
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

export function marcarLoQueFalto(final, { abrio, fallo }) {
  let salida = final
  if (!abrio) salida = marcarSinVerificar(salida, SIN_ABRIR)
  if (fallo) salida = marcarSinVerificar(salida, SIN_BASE)
  return salida
}

export function enlaceParaAbrir(enlaces) {
  return enlaces?.find((enlace) => !enlace.sinSitio && !enlace.demasiadoLarga) ?? null
}

export async function cerrarRevisionConDetalle(local, urlEnlace, dominios) {
  if (local.sinSitio) return { final: local, extra: null }
  const extra = urlEnlace ? await enriquecer(urlEnlace) : null
  const { amenaza, fallo } = await consultarPeorAmenaza([...dominios, extra?.dominio, ...dominiosDelRecorrido(extra)])

  const final = combinarConEnriquecimiento(combinarConAmenaza(local, fallo ? null : amenaza), extra)
  return { final: marcarLoQueFalto(final, { abrio: !urlEnlace || Boolean(extra), fallo }), extra }
}

export async function cerrarRevision(local, urlEnlace, dominios) {
  return (await cerrarRevisionConDetalle(local, urlEnlace, dominios)).final
}

export function urlParaRevisar(local) {
  return local.demasiadoLarga ? null : local.url
}

export async function revisarEnlace(entrada) {
  const local = analizar(entrada)
  if (!local) return null
  return cerrarRevision(local, urlParaRevisar(local), [local.dominio])
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