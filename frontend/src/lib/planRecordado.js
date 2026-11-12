import { leerPersonas } from './precioPhishguard.js'

function almacen(propio) {
  if (propio) return propio
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function clave(usuarioId) {
  return `sg-plan-personas:${usuarioId}`
}

export function recordarPersonas(usuarioId, personas, propio) {
  const lugar = almacen(propio)
  if (!lugar || !usuarioId || leerPersonas(personas) === null) return
  try {
    lugar.setItem(clave(usuarioId), String(personas))
  } catch {
    void 0
  }
}

export function personasRecordadas(usuarioId, propio) {
  const lugar = almacen(propio)
  if (!lugar || !usuarioId) return null
  try {
    return leerPersonas(lugar.getItem(clave(usuarioId)))
  } catch {
    return null
  }
}
