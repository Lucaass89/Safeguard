import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { armarRegistro } from './registroSimulacion.js'

describe('registro de la simulación', () => {
  test('una clave inventada no sale en la llamada', () => {
    const clave = 'clave-inventada-NoSalir-4821'
    const llamada = armarRegistro('token-de-prueba', 'datos', clave)
    const texto = JSON.stringify(llamada)
    assert.equal(texto.includes(clave), false)
    assert.equal(texto.includes('escrito'), false)
    assert.deepEqual(llamada, { p_token: 'token-de-prueba', p_evento: 'datos' })
  })

  test('nombre, correo y clave de la tienda tampoco salen', () => {
    const escrito = 'Ana Pérez\nana@ejemplo.com\nclave-inventada-NoSalir-4821'
    const llamada = armarRegistro('token-de-prueba', 'clic', escrito)
    assert.equal(JSON.stringify(llamada).includes('clave-inventada-NoSalir-4821'), false)
    assert.equal(JSON.stringify(llamada).includes('ana@ejemplo.com'), false)
    assert.deepEqual(Object.keys(llamada).sort(), ['p_evento', 'p_token'])
  })
})
