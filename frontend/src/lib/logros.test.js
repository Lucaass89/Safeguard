import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { calcularLogros, resumenLogros } from './logros.js'

describe('logros', () => {
  test('sin nada, ninguno', () => {
    const logros = calcularLogros({})
    assert.equal(logros.filter((l) => l.logrado).length, 0)
    assert.equal(resumenLogros(logros), '0 de 6 logros')
  })

  test('se ganan con lo que hiciste', () => {
    const logros = calcularLogros({ peligrosos: 1, total: 12, mejorRacha: 5, listaCompleta: true, lecciones: 3 })
    assert.equal(resumenLogros(logros), '6 de 6 logros')
  })

  test('los umbrales', () => {
    const por = (estado) => Object.fromEntries(calcularLogros(estado).map((l) => [l.id, l.logrado]))
    assert.equal(por({ total: 9 }).diez, false)
    assert.equal(por({ total: 10 }).diez, true)
    assert.equal(por({ mejorRacha: 4 }).racha, false)
    assert.equal(por({ lecciones: 2 }).lecciones, false)
  })
})
