import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { analizarFilas } from './csvPersonas.js'

describe('nómina desde CSV', () => {
  test('un correo sin arroba no entra en las filas válidas', () => {
    const resultado = analizarFilas([
      { fila: 2, nombre: 'Ana', correo: 'ana-sin-arroba', area: 'Ventas' },
    ])
    assert.equal(resultado.validas.length, 0)
    assert.equal(resultado.invalidas.length, 1)
    assert.equal(resultado.invalidas[0].resultado, 'invalida')
    assert.equal(resultado.invalidas[0].motivo, 'El correo no es válido.')
  })
})
