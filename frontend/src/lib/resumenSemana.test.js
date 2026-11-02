import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { inicioDeSemana, resumenSemana } from './resumenSemana.js'

const fila = (entrada, nivel_riesgo = 'verde') => ({ entrada, nivel_riesgo })
const varias = (n, entrada, nivel) => Array.from({ length: n }, () => fila(entrada, nivel))

describe('resumen de la semana', () => {
  test('cuenta enlaces y peligrosos', () => {
    assert.equal(
      resumenSemana([...varias(10, 'web'), ...varias(2, 'web', 'rojo')]),
      'Esta semana revisaste 12 enlaces y detectaste 2 peligrosos.',
    )
  })

  test('singular', () => {
    assert.equal(resumenSemana([fila('web', 'rojo')]), 'Esta semana revisaste 1 enlace y detectaste 1 peligroso.')
    assert.equal(resumenSemana([fila('web')]), 'Esta semana revisaste 1 enlace y no salió peligroso.')
  })

  test('sin peligrosos', () => {
    assert.equal(resumenSemana(varias(3, 'web')), 'Esta semana revisaste 3 enlaces y ninguno salió peligroso.')
  })

  test('separa por tipo', () => {
    assert.equal(
      resumenSemana([...varias(2, 'web'), fila('whatsapp', 'rojo'), ...varias(2, 'qr', 'amarillo')]),
      'Esta semana revisaste 2 enlaces, 2 QR y 1 mensaje, y detectaste 1 peligroso.',
    )
  })

  test('sospechosos y sin verificar no cuentan como peligrosos', () => {
    assert.equal(
      resumenSemana([fila('web', 'amarillo'), fila('web', 'gris')]),
      'Esta semana revisaste 2 enlaces y ninguno salió peligroso.',
    )
  })

  test('sin revisiones', () => {
    assert.equal(resumenSemana([]), 'Esta semana todavía no revisaste nada.')
  })

  test('no infla lo que hace la app', () => {
    const texto = resumenSemana([...varias(4, 'web', 'rojo'), fila('pdf')])
    assert.doesNotMatch(texto, /fren|bloque|proteg|evit/i)
  })

  test('la semana empieza el lunes', () => {
    const domingo = new Date(2026, 9, 18, 15)
    assert.deepEqual(inicioDeSemana(domingo), new Date(2026, 9, 12))
    assert.deepEqual(inicioDeSemana(new Date(2026, 9, 12, 0, 5)), new Date(2026, 9, 12))
  })
})
