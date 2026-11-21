import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { LECCIONES, leerVistas, marcarVista, ordenarLecciones } from './lecciones.js'

function memoria() {
  const datos = {}
  return { getItem: (c) => datos[c] ?? null, setItem: (c, v) => { datos[c] = v } }
}

describe('lecciones de un minuto', () => {
  test('son cortas', () => {
    for (const leccion of LECCIONES) {
      assert.equal(leccion.partes.length, 3)
      for (const parte of leccion.partes) assert.ok(parte.length <= 140, parte)
    }
  })

  test('marca vistas sin repetir y las guarda', () => {
    const m = memoria()
    let vistas = marcarVista([], 'qr', m)
    vistas = marcarVista(vistas, 'qr', m)
    assert.deepEqual(vistas, ['qr'])
    assert.deepEqual(leerVistas(m), ['qr'])
  })

  test('las no vistas van primero', () => {
    const orden = ordenarLecciones(['direccion']).map((l) => l.id)
    assert.equal(orden.at(-1), 'direccion')
    assert.equal(orden.length, LECCIONES.length)
  })
})
