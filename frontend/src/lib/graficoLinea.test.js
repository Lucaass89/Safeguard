import assert from 'node:assert/strict'
import { test } from 'node:test'
import { caminoArea, caminoLinea, marcasEje, porcentaje, puntosLinea } from './graficoLinea.js'

test('los puntos se reparten a lo ancho y el máximo queda arriba', () => {
  const puntos = puntosLinea([20, 10, 0], { ancho: 200, alto: 100, maximo: 20, izquierda: 30, arriba: 10 })
  assert.deepEqual(puntos, [
    { x: 30, y: 10 },
    { x: 130, y: 60 },
    { x: 230, y: 110 },
  ])
})

test('los valores fuera de rango se acotan y lo vacío no rompe', () => {
  const [alto, bajo] = puntosLinea([99, -5], { ancho: 10, alto: 10, maximo: 20 })
  assert.equal(alto.y, 0)
  assert.equal(bajo.y, 10)
  assert.deepEqual(puntosLinea([], { ancho: 10, alto: 10, maximo: 20 }), [])
  assert.deepEqual(puntosLinea([1], { ancho: 10, alto: 10, maximo: 0 }), [])
  assert.deepEqual(puntosLinea([5], { ancho: 10, alto: 10, maximo: 10 }), [{ x: 0, y: 5 }])
})

test('la línea y el área se arman con los puntos', () => {
  const puntos = [
    { x: 0, y: 5 },
    { x: 10, y: 2 },
  ]
  assert.equal(caminoLinea(puntos), 'M0 5 L10 2')
  assert.equal(caminoArea(puntos, 20), 'M0 5 L10 2 L10 20 L0 20 Z')
  assert.equal(caminoArea([], 20), '')
})

test('las marcas del eje son redondas y arrancan en cero', () => {
  assert.deepEqual(marcasEje(20), [0, 10, 20])
  assert.deepEqual(marcasEje(30, 4), [0, 10, 20, 30])
  assert.deepEqual(marcasEje(0), [0])
})

test('el porcentaje se redondea y no divide por cero', () => {
  assert.equal(porcentaje(9, 40), 23)
  assert.equal(porcentaje(1, 3), 33)
  assert.equal(porcentaje(3, 0), 0)
})
