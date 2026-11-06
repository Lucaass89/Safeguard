import { motivosLimpios, nivelDesde } from './analisis.js'
import { nuevaSenal, PUNTAJE, puntajeFinal } from './puntaje.js'


export function conteoVirusTotal(respuesta) {
  const stats = respuesta?.data?.attributes?.last_analysis_stats ?? respuesta?.attributes?.last_analysis_stats
  if (!stats || typeof stats.malicious !== 'number') return null
  const total = Object.values(stats).reduce((suma, valor) => suma + (typeof valor === 'number' ? valor : 0), 0)
  return { maliciosos: stats.malicious, total }
}

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
