export function armarRegistro(token, evento, escrito = '') {
  const llamada = {
    p_token: String(token),
    p_evento: String(evento),
  }
  if (escrito !== '' && (llamada.p_token === escrito || llamada.p_evento === escrito)) {
    throw new Error('El valor escrito no puede viajar como token ni como evento')
  }
  return llamada
}
