import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { alternarEnLista, guardarJson, leerJson, leerLista } from './guardadoLocal.js'

function memoria(inicial = {}) {
  const datos = { ...inicial }
  return { getItem: (c) => (c in datos ? datos[c] : null), setItem: (c, v) => { datos[c] = v } }
}

describe('guardado local', () => {
  test('guarda y lee', () => {
    const m = memoria()
    assert.equal(guardarJson('a', { x: 1 }, m), true)
    assert.deepEqual(leerJson('a', null, m), { x: 1 })
  })

  test('sin dato, roto o sin almacenamiento devuelve lo de por defecto', () => {
    assert.equal(leerJson('nada', 7, memoria()), 7)
    assert.equal(leerJson('a', 7, memoria({ a: '{roto' })), 7)
    assert.equal(leerJson('a', 7, null), 7)
    assert.equal(guardarJson('a', 1, { setItem: () => { throw new Error('lleno') } }), false)
  })

  test('las listas solo guardan textos', () => {
    assert.deepEqual(leerLista('l', memoria({ l: '["a",2,"b"]' })), ['a', 'b'])
    assert.deepEqual(leerLista('l', memoria({ l: '{"a":1}' })), [])
  })

  test('alterna un elemento', () => {
    assert.deepEqual(alternarEnLista(['a'], 'b'), ['a', 'b'])
    assert.deepEqual(alternarEnLista(['a', 'b'], 'a'), ['b'])
  })
})
