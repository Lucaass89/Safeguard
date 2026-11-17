import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { SITUACIONES, situacion } from './mePaso.js'

describe('me pasó algo', () => {
  test('cada situación tiene título y pasos', () => {
    assert.equal(SITUACIONES.length, 4)
    for (const item of SITUACIONES) {
      assert.ok(item.titulo.length > 0)
      assert.ok(item.pasos.length >= 3)
      for (const paso of item.pasos) assert.match(paso, /\.$/)
    }
  })

  test('el primer paso siempre es actuar rápido o cortar', () => {
    assert.match(situacion('clave').pasos[0], /Llamá ya/)
    assert.match(situacion('plata').pasos[0], /Llamá ya/)
    assert.match(situacion('app').pasos[0], /modo avión/)
  })

  test('busca por id', () => {
    assert.equal(situacion('codigo').id, 'codigo')
    assert.equal(situacion('nada'), null)
  })
})
