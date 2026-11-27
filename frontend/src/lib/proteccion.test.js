import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { nivelProteccion, PASOS_PROTECCION } from './proteccion.js'

const todo = { avisos: true, portapapeles: true, app: true, listaListas: 5, listaTotal: 5 }

describe('nivel de protección', () => {
  test('ya no cuenta la verificación en dos pasos', () => {
    assert.ok(!PASOS_PROTECCION.some((paso) => paso.id === 'dosPasos'))
  })

  test('con todo hecho es 100 y no hay próximo paso', () => {
    const nivel = nivelProteccion(todo)
    assert.equal(nivel.porcentaje, 100)
    assert.equal(nivel.proximo, null)
    assert.match(nivel.frase, /muy bien/)
  })

  test('sin nada es 0 y lo primero son los avisos al celular', () => {
    const nivel = nivelProteccion({ avisos: false, portapapeles: false, app: false, listaListas: 0, listaTotal: 5 })
    assert.equal(nivel.porcentaje, 0)
    assert.equal(nivel.proximo.id, 'avisos')
  })

  test('la lista suma en partes y lleva al Perfil', () => {
    const nivel = nivelProteccion({ ...todo, listaListas: 2.5 })
    assert.equal(nivel.porcentaje, 83)
    assert.equal(nivel.proximo.id, 'lista')
    assert.match(nivel.proximo.consejo, /^Completá la lista/)
    assert.equal(nivel.proximo.to, '/perfil#prog-lista')
  })

  test('lo que no aplica no cuenta', () => {
    const nivel = nivelProteccion({ avisos: null, portapapeles: null, app: null, listaListas: 5, listaTotal: 5 })
    assert.equal(nivel.porcentaje, 100)
    assert.equal(nivel.pasos.length, 1)
  })

  test('sin avisos, con el resto hecho', () => {
    const nivel = nivelProteccion({ ...todo, avisos: false })
    assert.equal(nivel.porcentaje, 67)
    assert.equal(nivel.proximo.id, 'avisos')
    assert.match(nivel.frase, /se puede mejorar/)
  })
})
