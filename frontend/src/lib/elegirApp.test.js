import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { datoPhishGuard, datoSafeLink } from './elegirApp.js'

describe('datoSafeLink', () => {
  test('sin revisiones', () => {
    assert.equal(datoSafeLink({ total: 0 }), 'Todavía no revisaste nada')
  })

  test('cuenta revisiones y engaños en singular y plural', () => {
    assert.equal(datoSafeLink({ total: 39, peligrosos: 4 }), '39 revisiones · 4 engaños frenados')
    assert.equal(datoSafeLink({ total: 1, peligrosos: 1 }), '1 revisión · 1 engaño frenado')
    assert.equal(datoSafeLink({ total: 3, peligrosos: 0 }), '3 revisiones · ningún engaño por ahora')
  })
})

describe('datoPhishGuard', () => {
  test('sin datos todavía no dice nada', () => {
    assert.equal(datoPhishGuard(null), '')
  })

  test('sin campañas ni correos', () => {
    assert.equal(datoPhishGuard({ eventos: [], campanas: [] }), 'Todavía no armaste ninguna campaña')
    assert.equal(datoPhishGuard({ eventos: [], campanas: [{}] }), '1 campaña · todavía no salió ningún correo')
  })

  test('calcula el porcentaje que tocó el enlace', () => {
    const tablero = {
      campanas: [{}, {}],
      eventos: [{ hizo_clic: true }, { hizo_clic: false }, { hizo_clic: false }, { hizo_clic: false }],
    }
    assert.equal(datoPhishGuard(tablero), '2 campañas · 25 % tocó el enlace')
  })
})
