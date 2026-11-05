import { motivosLimpios, nivelDesde } from './analisis.js'
import { nuevaSenal, PUNTAJE, puntajeFinal } from './puntaje.js'

// TODO(VT_API_KEY): todavía no hay consulta a VirusTotal. Esto solo combina una respuesta ya obtenida
// (en el set de evaluación, una guardada en eval/virustotal/). La API pública no permite uso comercial.

// Acepta la respuesta de la API v3 (data.attributes.last_analysis_stats) o solo los atributos.
export function conteoVirusTotal(respuesta) {
  const stats = respuesta?.data?.attributes?.last_analysis_stats ?? respuesta?.attributes?.last_analysis_stats
  if (!stats || typeof stats.malicious !== 'number') return null
  const total = Object.values(stats).reduce((suma, valor) => suma + (typeof valor === 'number' ? valor : 0), 0)
  return { maliciosos: stats.malicious, total }
}

// Pocas detecciones son una señal media; varias, una fuerte que sola alcanza para Peligroso.
export function senalVirusTotal(conteo, config = PUNTAJE.virustotal) {
  if (!conteo || conteo.maliciosos < config.motoresMedia) return null
  const { maliciosos, total } = conteo
  const fuerte = maliciosos >= config.motoresFuerte
  const texto = fuerte
    ? `${maliciosos} de ${total} antivirus de VirusTotal la marcan como peligrosa o de phishing.`
    : `${maliciosos} de ${total} antivirus de VirusTotal la marcan como peligrosa. Son pocos para confirmarlo, pero suma sospecha.`
  return nuevaSenal({
    id: 'virustotal',
    grupo: 'virustotal',
    peso: fuerte ? config.pesoFuerte : config.pesoMedia,
    texto,
    fuerza: fuerte ? 'fuerte' : 'media',
  })
}

// VirusTotal es una señal más: suma su peso, nunca baja el puntaje, y que no conozca un sitio no lo vuelve seguro.
export function combinarConVirusTotal(resultado, respuesta) {
  const conteo = conteoVirusTotal(respuesta)
  const senal = senalVirusTotal(conteo)
  if (!resultado || !senal) return resultado

  const senales = [...(resultado.senales ?? []).filter((s) => s.id !== 'tope_sin_senal_fuerte'), senal]
  const puntuacion = Math.max(resultado.puntuacion, puntajeFinal(resultado.puntuacion + senal.peso, senales))
  return {
    ...resultado,
    puntuacion,
    nivel: nivelDesde(puntuacion, resultado.sinVerificar),
    senales,
    virusTotal: conteo,
    motivos: motivosLimpios(senal.fuerza === 'fuerte' ? [senal.texto, ...resultado.motivos] : [...resultado.motivos, senal.texto]),
  }
}
