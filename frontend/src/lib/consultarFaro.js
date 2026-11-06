import { supabase } from './supabase.js'
import { armarConsulta, cerrarConsulta, LIMITE_FARO, pideResumen } from './faro.js'

const SIN_PREGUNTA = 'Escribí la duda en una frase. No hace falta pegar el mensaje ni el enlace.'

function entero(valor) {
  return Number.isInteger(valor) && valor >= 0 ? valor : null
}

export async function consultarFaro(nivel, motivos, pregunta, turnos, modo, caso) {
  const consulta = armarConsulta(nivel, motivos, pregunta, turnos, modo, caso)
  if (!consulta) return { texto: SIN_PREGUNTA, tokens: null, tokensUsuario: null }
  if (pideResumen(consulta.pregunta)) {
    return { texto: cerrarConsulta(nivel, motivos, consulta.pregunta, '', consulta.modo, caso, false), tokens: null, tokensUsuario: null }
  }

  try {
    const { data, error } = await supabase.functions.invoke('safelink-faro', {
      body: consulta,
    })
    if (data?.motivo === 'limite') return { texto: LIMITE_FARO, tokens: null, tokensUsuario: null }
    const cruda = typeof data?.respuesta === 'string' ? data.respuesta : ''
    const fallo = Boolean(error) || !cruda.trim()
    return {
      texto: cerrarConsulta(nivel, motivos, consulta.pregunta, cruda, consulta.modo, caso, fallo),
      tokens: entero(data?.tokens),
      tokensUsuario: entero(data?.tokensUsuario),
    }
  } catch {
    return { texto: cerrarConsulta(nivel, motivos, consulta.pregunta, '', consulta.modo, caso, true), tokens: null, tokensUsuario: null }
  }
}
