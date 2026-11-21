const CLAVE = 'sg-racha'

export function siguienteRacha(actual, acerto) {
  const racha = acerto ? actual.racha + 1 : 0
  return { racha, mejor: Math.max(actual.mejor, racha) }
}

export function leerRacha(almacen = globalThis.localStorage) {
  try {
    const guardado = JSON.parse(almacen?.getItem(CLAVE) ?? 'null')
    const racha = Number.isInteger(guardado?.racha) && guardado.racha >= 0 ? guardado.racha : 0
    const mejor = Number.isInteger(guardado?.mejor) && guardado.mejor >= racha ? guardado.mejor : racha
    return { racha, mejor }
  } catch {
    return { racha: 0, mejor: 0 }
  }
}

export function guardarRacha(valor, almacen = globalThis.localStorage) {
  try {
    almacen?.setItem(CLAVE, JSON.stringify(valor))
  } catch {
    return
  }
}

export function textoRacha({ racha, mejor }) {
  if (racha === 0) return mejor > 0 ? `Tu mejor racha: ${mejor} seguidas` : ''
  if (racha === 1) return '1 bien seguida'
  return `${racha} bien seguidas`
}
