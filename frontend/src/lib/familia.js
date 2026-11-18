const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function normalizarCodigo(texto) {
  return String(texto ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
}

export function codigoValido(texto) {
  const limpio = normalizarCodigo(texto)
  return limpio.length === 6 && [...limpio].every((letra) => ALFABETO.includes(letra))
}

export function formatoCodigo(texto) {
  const limpio = normalizarCodigo(texto)
  return limpio.length > 3 ? `${limpio.slice(0, 3)}-${limpio.slice(3)}` : limpio
}

export function minutosRestantes(vence, ahora = new Date()) {
  const diferencia = new Date(vence) - ahora
  return diferencia > 0 ? Math.ceil(diferencia / 60000) : 0
}

export function textoVinculo(vinculo) {
  const nombre = vinculo.nombre || 'Alguien'
  return vinculo.rol === 'cuido'
    ? `Te avisamos si ${nombre} revisa algo peligroso.`
    : `${nombre} recibe un aviso si revisás algo peligroso.`
}
