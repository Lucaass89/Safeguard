export function leerJson(clave, porDefecto, almacen = globalThis.localStorage) {
  try {
    const crudo = almacen?.getItem(clave)
    return crudo === null || crudo === undefined ? porDefecto : JSON.parse(crudo)
  } catch {
    return porDefecto
  }
}

export function guardarJson(clave, valor, almacen = globalThis.localStorage) {
  try {
    almacen?.setItem(clave, JSON.stringify(valor))
    return true
  } catch {
    return false
  }
}

export function leerLista(clave, almacen = globalThis.localStorage) {
  const valor = leerJson(clave, [], almacen)
  return Array.isArray(valor) ? valor.filter((item) => typeof item === 'string') : []
}

export function alternarEnLista(lista, id) {
  return lista.includes(id) ? lista.filter((item) => item !== id) : [...lista, id]
}
