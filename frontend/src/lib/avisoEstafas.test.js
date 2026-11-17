import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { avisoEstafas, fechaDeEdicion, hayEdicionNueva } from './avisoEstafas.js'
import { EDICION } from './estafasSemana.js'

describe('aviso de las estafas de la semana', () => {
  test('lee la fecha de la edición del archivo', () => {
    assert.equal(fechaDeEdicion("export const EDICION = {\n  fecha: '2026-10-18',"), '2026-10-18')
    assert.equal(fechaDeEdicion('nada'), null)
    assert.equal(fechaDeEdicion(undefined), null)
  })

  test('avisa solo si cambió la fecha', () => {
    assert.equal(hayEdicionNueva('2026-10-18', '2026-10-25'), true)
    assert.equal(hayEdicionNueva('2026-10-18', '2026-10-18'), false)
    assert.equal(hayEdicionNueva(null, '2026-10-25'), true)
    assert.equal(hayEdicionNueva('2026-10-18', null), false)
  })

  test('arma el texto', () => {
    const una = avisoEstafas({ estafas: [{ titulo: 'Bono falso' }] })
    assert.equal(una.texto, 'Bono falso. Mirá cómo reconocerla.')
    const tres = avisoEstafas({ estafas: [{ titulo: 'Bono falso' }, { titulo: 'b' }, { titulo: 'c' }] })
    assert.equal(tres.texto, 'Bono falso y 2 más. Mirá cómo reconocerlas.')
    assert.equal(avisoEstafas({ estafas: [] }), null)
  })

  test('funciona con la edición publicada', () => {
    assert.ok(avisoEstafas(EDICION).texto.length > 10)
  })
})
