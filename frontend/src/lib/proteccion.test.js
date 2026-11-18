import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { nivelProteccion } from './proteccion.js'

const todo = { dosPasos: true, avisos: true, portapapeles: true, app: true, listaListas: 6, listaTotal: 6 }

describe('nivel de protección', () => {
  test('con todo hecho es 100 y no hay próximo paso', () => {
    const nivel = nivelProteccion(todo)
    assert.equal(nivel.porcentaje, 100)
    assert.equal(nivel.proximo, null)
    assert.match(nivel.frase, /muy bien/)
  })

  test('sin nada es 0 y lo primero es la verificación en dos pasos', () => {
    const nivel = nivelProteccion({ dosPasos: false, avisos: false, portapapeles: false, app: false, listaListas: 0, listaTotal: 6 })
    assert.equal(nivel.porcentaje, 0)
    assert.equal(nivel.proximo.id, 'dosPasos')
  })

  test('la lista suma en partes', () => {
    const nivel = nivelProteccion({ ...todo, listaListas: 3 })
    assert.equal(nivel.porcentaje, 90)
    assert.equal(nivel.proximo.id, 'lista')
    assert.match(nivel.proximo.consejo, /^Completá la lista/)
  })

  test('lo que no aplica no cuenta', () => {
    const nivel = nivelProteccion({ dosPasos: true, avisos: null, portapapeles: null, app: null, listaListas: 6, listaTotal: 6 })
    assert.equal(nivel.porcentaje, 100)
    assert.equal(nivel.pasos.length, 2)
  })

  test('sin dos pasos, con el resto hecho', () => {
    const nivel = nivelProteccion({ ...todo, dosPasos: false })
    assert.equal(nivel.porcentaje, 70)
    assert.equal(nivel.proximo.id, 'dosPasos')
    assert.match(nivel.frase, /se puede mejorar/)
  })
})
