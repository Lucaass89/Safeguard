import assert from 'node:assert/strict'
import { test } from 'node:test'
import { debeAndar, elementoVisible, leerModo, modoReproduccion } from './reproduccion.js'

test('con mouse se reproduce al apuntar, en el celular al verse y con movimiento reducido solo con el botón', () => {
  assert.equal(modoReproduccion({ puedeApuntar: true, movimientoReducido: false }), 'apuntar')
  assert.equal(modoReproduccion({ puedeApuntar: false, movimientoReducido: false }), 'pantalla')
  assert.equal(modoReproduccion({ puedeApuntar: true, movimientoReducido: true }), 'boton')
  assert.equal(modoReproduccion({ puedeApuntar: false, movimientoReducido: true }), 'boton')
})

test('leerModo usa las consultas del navegador y sin navegador queda en botón', () => {
  const ventana = (consultas) => ({ matchMedia: (q) => ({ matches: Boolean(consultas[q]) }) })
  assert.equal(leerModo(ventana({ '(hover: hover) and (pointer: fine)': true })), 'apuntar')
  assert.equal(leerModo(ventana({})), 'pantalla')
  assert.equal(
    leerModo(ventana({ '(hover: hover) and (pointer: fine)': true, '(prefers-reduced-motion: reduce)': true })),
    'boton',
  )
  assert.equal(leerModo(undefined), 'boton')
})

test('el recorrido anda solo si se ve, no está en pausa y no se pidió menos movimiento', () => {
  assert.equal(debeAndar({ modo: 'apuntar', visible: true }), true)
  assert.equal(debeAndar({ modo: 'pantalla', visible: true }), true)
  assert.equal(debeAndar({ modo: 'pantalla', visible: false }), false)
  assert.equal(debeAndar({ modo: 'apuntar', visible: true, pausado: true }), false)
  assert.equal(debeAndar({ modo: 'boton', visible: true }), false)
  assert.equal(debeAndar({ modo: 'boton', visible: true, pedido: true }), true)
  assert.equal(debeAndar({ modo: 'boton', visible: false, pedido: true }), false)
})

test('elementoVisible elige el que no está oculto por el tema', () => {
  const claro = { id: 'claro', display: 'none' }
  const oscuro = { id: 'oscuro', display: 'block' }
  const estilo = (el) => ({ display: el.display })
  assert.equal(elementoVisible([claro, oscuro], estilo), oscuro)
  assert.equal(elementoVisible([claro, null], estilo), null)
})
