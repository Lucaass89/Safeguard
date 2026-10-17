import { supabase } from './supabase.js'
import { armarConsulta, prepararRespuesta, respuestaLocal } from './faro.js'

const SIN_PREGUNTA = 'Escribí la duda en una frase. No hace falta pegar el mensaje ni el enlace.'

export async function consultarFaro(nivel, motivos, pregunta, turnos, modo, caso) {
  const consulta = armarConsulta(nivel, motivos, pregunta, turnos, modo, caso)
  if (!consulta) return SIN_PREGUNTA

  try {
    const { data, error } = await supabase.functions.invoke('safelink-faro', {
      body: consulta,
    })
    if (error || typeof data?.respuesta !== 'string' || !data.respuesta.trim()) {
      return respuestaLocal(nivel, motivos, consulta.pregunta, consulta.modo, consulta.caso)
    }
    return prepararRespuesta(nivel, motivos, consulta.pregunta, data.respuesta, consulta.modo, consulta.caso)
  } catch {
    return respuestaLocal(nivel, motivos, consulta.pregunta, consulta.modo, consulta.caso)
  }
}
