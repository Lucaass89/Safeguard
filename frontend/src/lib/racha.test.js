import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { guardarRacha, leerRacha, siguienteRacha, textoRacha } from './racha.js'

function almacen(inicial = {}) {
  const datos = { ...inicial }
  return {
    getItem: (clave) => datos[clave] ?? null,
    setItem: (clave, valor) => {
      datos[clave] = valor
    },
  }
}

describe('racha del juego', () => {
  test('suma al acertar y vuelve a cero al errar, sin perder la mejor', () => {
    let estado = { racha: 0, mejor: 0 }
    estado = siguienteRacha(estado, true)
    estado = siguienteRacha(estado, true)
    assert.deepEqual(estado, { racha: 2, mejor: 2 })
    estado = siguienteRacha(estado, false)
    assert.deepEqual(estado, { racha: 0, mejor: 2 })
  })

  test('guarda y lee', () => {
    const memoria = almacen()
    guardarRacha({ racha: 3, mejor: 5 }, memoria)
    assert.deepEqual(leerRacha(memoria), { racha: 3, mejor: 5 })
  })

  test('lo guardado roto o sin almacenamiento empieza de cero', () => {
    assert.deepEqual(leerRacha(almacen({ 'sg-racha': '{roto' })), { racha: 0, mejor: 0 })
    assert.deepEqual(leerRacha(almacen({ 'sg-racha': '{"racha":-2,"mejor":"x"}' })), { racha: 0, mejor: 0 })
    assert.deepEqual(leerRacha(null), { racha: 0, mejor: 0 })
    const falla = { getItem: () => { throw new Error('bloqueado') } }
    assert.deepEqual(leerRacha(falla), { racha: 0, mejor: 0 })
  })

  test('texto para mostrar', () => {
    assert.equal(textoRacha({ racha: 0, mejor: 0 }), '')
    assert.equal(textoRacha({ racha: 0, mejor: 4 }), 'Tu mejor racha: 4 seguidas')
    assert.equal(textoRacha({ racha: 1, mejor: 1 }), '1 bien seguida')
    assert.equal(textoRacha({ racha: 3, mejor: 3 }), '3 bien seguidas')
  })
})
