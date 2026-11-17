import lista from '../data/novedades.json' with { type: 'json' }
import { guardarJson, leerLista } from './guardadoLocal.js'

const CLAVE = 'sg-novedades-cerradas'
const DIAS = 30

export const NOVEDADES = lista

export function novedadesPendientes(novedades, cerradas, hoy = new Date(), maximo = 2) {
  const limite = new Date(hoy)
  limite.setDate(limite.getDate() - DIAS)
  return novedades
    .filter((item) => !cerradas.includes(item.id))
    .filter((item) => new Date(`${item.fecha}T00:00:00`) >= limite && new Date(`${item.fecha}T00:00:00`) <= hoy)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, maximo)
}

export function leerCerradas(almacen) {
  return leerLista(CLAVE, almacen)
}

export function cerrarNovedad(cerradas, id, almacen) {
  const nuevas = cerradas.includes(id) ? cerradas : [...cerradas, id]
  guardarJson(CLAVE, nuevas, almacen)
  return nuevas
}
