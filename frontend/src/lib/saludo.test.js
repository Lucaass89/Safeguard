import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { primerNombre, saludo, saludoPara } from './saludo.js'

describe('saludo', () => {
  test('cambia según la hora', () => {
    assert.equal(saludo(5), 'Buen día')
    assert.equal(saludo(11), 'Buen día')
    assert.equal(saludo(12), 'Buenas tardes')
    assert.equal(saludo(19), 'Buenas tardes')
    assert.equal(saludo(20), 'Buenas noches')
    assert.equal(saludo(2), 'Buenas noches')
  })

  test('usa el primer nombre cuando lo hay', () => {
    const usuario = { email: 'ana@example.com', user_metadata: { full_name: 'Ana Prueba' } }
    assert.equal(primerNombre(usuario), 'Ana')
    assert.equal(saludoPara(usuario, 9), 'Buen día, Ana')
  })

  test('sin nombre, o con el correo como nombre, saluda sin nombre', () => {
    assert.equal(saludoPara(null, 15), 'Buenas tardes')
    assert.equal(saludoPara({ email: 'x@example.com', user_metadata: { full_name: 'x@example.com' } }, 22), 'Buenas noches')
    assert.equal(saludoPara({ email: 'x@example.com', user_metadata: { name: 'Luz' } }, 22), 'Buenas noches, Luz')
  })
})
