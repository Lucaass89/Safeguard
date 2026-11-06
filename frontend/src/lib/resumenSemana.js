const NOMBRES = [
  ['web', 'enlace', 'enlaces'],
  ['qr', 'QR', 'QR'],
  ['whatsapp', 'mensaje', 'mensajes'],
  ['correo', 'correo', 'correos'],
  ['pdf', 'PDF', 'PDF'],
]

export function inicioDeSemana(hoy = new Date()) {
  const lunes = new Date(hoy)
  lunes.setHours(0, 0, 0, 0)
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7))
  return lunes
}

function enumerar(partes) {
  if (partes.length <= 1) return partes.join('')
  return `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`
}

export function resumenSemana(filas) {
  if (filas.length === 0) return 'Esta semana todavía no revisaste nada.'

  const cuenta = {}
  for (const fila of filas) {
    const entrada = NOMBRES.some(([clave]) => clave === fila.entrada) ? fila.entrada : 'web'
    cuenta[entrada] = (cuenta[entrada] ?? 0) + 1
  }
  const revisado = enumerar(
    NOMBRES.filter(([clave]) => cuenta[clave]).map(
      ([clave, uno, varios]) => `${cuenta[clave]} ${cuenta[clave] === 1 ? uno : varios}`,
    ),
  )
  const peligrosos = filas.filter((fila) => fila.nivel_riesgo === 'rojo').length
  const separador = revisado.includes(' y ') ? ', y' : ' y'

  if (peligrosos === 0) {
    return `Esta semana revisaste ${revisado}${separador} ${filas.length === 1 ? 'no salió' : 'ninguno salió'} peligroso.`
  }
  return `Esta semana revisaste ${revisado}${separador} detectaste ${peligrosos} ${peligrosos === 1 ? 'peligroso' : 'peligrosos'}.`
}
