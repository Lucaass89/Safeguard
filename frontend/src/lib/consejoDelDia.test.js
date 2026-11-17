import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { CONSEJOS, consejoDelDia } from './consejoDelDia.js'

describe('consejo del día', () => {
  test('cada consejo está completo', () => {
    const ids = new Set()
    for (const consejo of CONSEJOS) {
      assert.ok(consejo.titulo && consejo.quien && consejo.canal && consejo.ejemplo)
      assert.equal(consejo.mirar.length, 2)
      assert.ok(!ids.has(consejo.id))
      ids.add(consejo.id)
    }
  })

  test('el mismo día da el mismo consejo y al otro día cambia', () => {
    const lunes = consejoDelDia(new Date(2026, 10, 16, 8))
    assert.equal(consejoDelDia(new Date(2026, 10, 16, 23)), lunes)
    assert.notEqual(consejoDelDia(new Date(2026, 10, 17, 8)), lunes)
  })

  test('recorre todos en una semana', () => {
    const vistos = new Set()
    for (let dia = 0; dia < CONSEJOS.length; dia += 1) vistos.add(consejoDelDia(new Date(2026, 0, 1 + dia)).id)
    assert.equal(vistos.size, CONSEJOS.length)
  })
})
