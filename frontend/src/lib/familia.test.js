import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { codigoValido, formatoCodigo, minutosRestantes, normalizarCodigo, textoVinculo } from './familia.js'

describe('cuidar a un familiar', () => {
  test('limpia el código que escriben', () => {
    assert.equal(normalizarCodigo(' abc-234 '), 'ABC234')
    assert.equal(normalizarCodigo('abc 2345 6789'), 'ABC234')
  })

  test('valida el código', () => {
    assert.equal(codigoValido('ABC-234'), true)
    assert.equal(codigoValido('ABC23'), false)
    assert.equal(codigoValido('ABC10O'), false)
  })

  test('lo muestra en dos partes', () => {
    assert.equal(formatoCodigo('abc234'), 'ABC-234')
    assert.equal(formatoCodigo('ab'), 'AB')
  })

  test('cuenta los minutos que le quedan', () => {
    const ahora = new Date('2026-11-18T10:00:00Z')
    assert.equal(minutosRestantes('2026-11-18T10:29:10Z', ahora), 30)
    assert.equal(minutosRestantes('2026-11-18T09:59:00Z', ahora), 0)
  })

  test('explica cada vínculo', () => {
    assert.match(textoVinculo({ rol: 'cuido', nombre: 'Mamá' }), /si Mamá revisa algo peligroso/)
    assert.match(textoVinculo({ rol: 'me_cuida', nombre: 'Lucas' }), /^Lucas recibe un aviso/)
    assert.match(textoVinculo({ rol: 'cuido' }), /Alguien/)
  })
})
