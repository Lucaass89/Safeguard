import { guardarJson, leerJson } from './guardadoLocal.js'

export const CLAVE_ACTIVIDAD = 'sg-ultima-actividad'
export const DIAS_WEB = 7
export const DIAS_APP = 30
const DIA_MS = 86_400_000
const CADA_MS = 5 * 60_000

export function diasPermitidos(enApp) {
  return enApp ? DIAS_APP : DIAS_WEB
}

export function leerActividad(almacen) {
  const valor = leerJson(CLAVE_ACTIVIDAD, null, almacen)
  return Number.isFinite(valor) && valor > 0 ? valor : null
}

export function sesionVencida(ultima, ahora, dias) {
  if (!Number.isFinite(ultima) || ultima <= 0) return false
  return ahora - ultima > dias * DIA_MS
}

export function marcarActividad(ahora, almacen) {
  const ultima = leerActividad(almacen)
  if (ultima !== null && ahora - ultima < CADA_MS && ahora >= ultima) return false
  guardarJson(CLAVE_ACTIVIDAD, ahora, almacen)
  return true
}

export function olvidarActividad(almacen = globalThis.localStorage) {
  try {
    almacen?.removeItem(CLAVE_ACTIVIDAD)
  } catch {
    void 0
  }
}
