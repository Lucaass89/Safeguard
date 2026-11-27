import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  CLAVE_ACTIVIDAD,
  diasPermitidos,
  leerActividad,
  marcarActividad,
  olvidarActividad,
  sesionVencida,
} from './vencimientoSesion.js'

function memoria() {
  const datos = new Map()
  return {
    getItem: (clave) => (datos.has(clave) ? datos.get(clave) : null),
    setItem: (clave, valor) => datos.set(clave, String(valor)),
    removeItem: (clave) => datos.delete(clave),
  }
}

const DIA = 86_400_000

describe('vencimiento de la sesión', () => {
  test('la web vence a los 7 días y la app a los 30', () => {
    assert.equal(diasPermitidos(false), 7)
    assert.equal(diasPermitidos(true), 30)
  })

  test('vence solo pasado el plazo sin usarla', () => {
    const ahora = 100 * DIA
    assert.equal(sesionVencida(ahora - 6 * DIA, ahora, 7), false)
    assert.equal(sesionVencida(ahora - 8 * DIA, ahora, 7), true)
    assert.equal(sesionVencida(ahora - 29 * DIA, ahora, 30), false)
  })

  test('sin dato guardado no se corta la sesión', () => {
    assert.equal(sesionVencida(null, 100 * DIA, 7), false)
    assert.equal(sesionVencida(0, 100 * DIA, 7), false)
  })

  test('marca la actividad como mucho cada 5 minutos', () => {
    const almacen = memoria()
    assert.equal(leerActividad(almacen), null)
    assert.equal(marcarActividad(1_000_000, almacen), true)
    assert.equal(marcarActividad(1_000_000 + 60_000, almacen), false)
    assert.equal(marcarActividad(1_000_000 + 6 * 60_000, almacen), true)
    assert.equal(leerActividad(almacen), 1_000_000 + 6 * 60_000)
  })

  test('un valor raro se ignora y olvidar lo borra', () => {
    const almacen = memoria()
    almacen.setItem(CLAVE_ACTIVIDAD, '"hola"')
    assert.equal(leerActividad(almacen), null)
    marcarActividad(5_000_000, almacen)
    olvidarActividad(almacen)
    assert.equal(leerActividad(almacen), null)
  })
})
