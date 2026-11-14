import assert from 'node:assert/strict'
import { test } from 'node:test'
import { destinoSeguro, elegirDestino, guardarVolver, leerVolver, olvidarVolver, rutaParaVolver } from './volverTrasIngreso.js'

function almacen() {
  const datos = new Map()
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => datos.set(k, String(v)),
    removeItem: (k) => datos.delete(k),
  }
}

test('solo se vuelve a rutas internas', () => {
  assert.equal(destinoSeguro('/panel/enlaces?url=https%3A%2F%2Fa.com'), '/panel/enlaces?url=https%3A%2F%2Fa.com')
  assert.equal(destinoSeguro('https://otro.com'), '/panel')
  assert.equal(destinoSeguro('//otro.com'), '/panel')
  assert.equal(destinoSeguro('/\\otro.com'), '/panel')
  assert.equal(destinoSeguro(null), '/panel')
})

test('la ruta para ingresar lleva adónde volver', () => {
  const ruta = rutaParaVolver({ pathname: '/panel/enlaces', search: '?url=https://a.com/x' })
  assert.equal(new URL(ruta, 'https://x.ar').searchParams.get('volver'), '/panel/enlaces?url=https://a.com/x')
})

test('el destino guardado sirve cuando el ingreso con Google vuelve sin parámetros', () => {
  const a = almacen()
  guardarVolver('/panel/enlaces?url=https%3A%2F%2Fa.com', a)
  assert.equal(elegirDestino(null, leerVolver(a)), '/panel/enlaces?url=https%3A%2F%2Fa.com')
  assert.equal(elegirDestino('/panel/pdf', leerVolver(a)), '/panel/pdf')
  olvidarVolver(a)
  assert.equal(leerVolver(a), null)
  assert.equal(elegirDestino(null, leerVolver(a)), '/panel')
})

test('no se guarda un destino externo', () => {
  const a = almacen()
  guardarVolver('https://otro.com', a)
  assert.equal(leerVolver(a), null)
})

test('sin almacenamiento disponible no falla', () => {
  const roto = { getItem: () => { throw new Error('x') }, setItem: () => { throw new Error('x') }, removeItem: () => { throw new Error('x') } }
  guardarVolver('/panel', roto)
  assert.equal(leerVolver(roto), null)
  olvidarVolver(roto)
  assert.equal(leerVolver(null), null)
})
