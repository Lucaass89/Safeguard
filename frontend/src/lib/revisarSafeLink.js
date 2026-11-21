import { analizarPdf } from './analisisPdf.js'
import { cerrarRevision, enlaceParaAbrir, revisarCorreo, revisarEnlace, revisarWhatsapp } from './enriquecer.js'

export { CANAL_DE, casoDeRevisado, ENTRADA_A_TIPO, ENTRADA_DE, resumenDe } from './revisados.js'

export async function revisarTipo(tipo, entrada, archivo) {
  if (tipo === 'enlace') return revisarEnlace(entrada)
  if (tipo === 'mensaje') return revisarWhatsapp(entrada)
  if (tipo === 'correo') return revisarCorreo(entrada)
  const analisis = await analizarPdf(archivo)
  const peor = enlaceParaAbrir(analisis.enlaces)
  return cerrarRevision(analisis, peor?.url, [peor?.dominio])
}
