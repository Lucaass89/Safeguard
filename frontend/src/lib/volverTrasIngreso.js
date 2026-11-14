const CLAVE = 'sg-volver'
const POR_DEFECTO = '/panel'

function almacenDeSesion() {
  try {
    return globalThis.sessionStorage ?? null
  } catch {
    return null
  }
}

export function destinoSeguro(valor) {
  if (typeof valor !== 'string') return POR_DEFECTO
  if (!valor.startsWith('/') || valor.startsWith('//') || valor.startsWith('/\\')) return POR_DEFECTO
  return valor
}

export function rutaParaVolver({ pathname = '', search = '', hash = '' } = {}) {
  return `/ingresar?volver=${encodeURIComponent(`${pathname}${search}${hash}`)}`
}

export function guardarVolver(valor, almacen = almacenDeSesion()) {
  if (typeof valor !== 'string' || destinoSeguro(valor) !== valor) return
  try {
    almacen?.setItem(CLAVE, valor)
  } catch {
    return
  }
}

export function leerVolver(almacen = almacenDeSesion()) {
  try {
    return almacen?.getItem(CLAVE) ?? null
  } catch {
    return null
  }
}

export function olvidarVolver(almacen = almacenDeSesion()) {
  try {
    almacen?.removeItem(CLAVE)
  } catch {
    return
  }
}

export function elegirDestino(parametro, guardado) {
  return destinoSeguro(parametro ?? guardado ?? null)
}
