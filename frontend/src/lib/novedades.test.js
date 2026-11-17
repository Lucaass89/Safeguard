import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { cerrarNovedad, leerCerradas, NOVEDADES, novedadesPendientes } from './novedades.js'

const lista = [
  { id: 'a', fecha: '2026-11-01', titulo: 'A', texto: 'a' },
  { id: 'b', fecha: '2026-11-15', titulo: 'B', texto: 'b' },
  { id: 'c', fecha: '2026-11-16', titulo: 'C', texto: 'c' },
  { id: 'vieja', fecha: '2026-09-01', titulo: 'V', texto: 'v' },
  { id: 'futura', fecha: '2026-12-01', titulo: 'F', texto: 'f' },
]
const hoy = new Date('2026-11-17T10:00:00')

describe('novedades', () => {
  test('las del archivo están completas', () => {
    for (const item of NOVEDADES) {
      assert.ok(item.id && item.titulo && item.texto)
      assert.match(item.fecha, /^\d{4}-\d{2}-\d{2}$/)
    }
  })

  test('muestra las más nuevas, sin viejas ni futuras', () => {
    assert.deepEqual(novedadesPendientes(lista, [], hoy).map((n) => n.id), ['c', 'b'])
    assert.deepEqual(novedadesPendientes(lista, [], hoy, 5).map((n) => n.id), ['c', 'b', 'a'])
  })

  test('no muestra las cerradas', () => {
    assert.deepEqual(novedadesPendientes(lista, ['c'], hoy).map((n) => n.id), ['b', 'a'])
  })

  test('guarda las cerradas', () => {
    const datos = {}
    const m = { getItem: (c) => datos[c] ?? null, setItem: (c, v) => { datos[c] = v } }
    const cerradas = cerrarNovedad([], 'b', m)
    assert.deepEqual(cerrarNovedad(cerradas, 'b', m), ['b'])
    assert.deepEqual(leerCerradas(m), ['b'])
  })
})
