import assert from 'node:assert/strict'
import test from 'node:test'
import { EJEMPLOS, MAXIMO_MOTIVOS, indiceVisible, motivosEnteros, siguienteIndice, veredictoEjemplo } from './carruselEstafas.js'

test('cada ejemplo del carrusel da el color que muestra la portada', () => {
  for (const ejemplo of EJEMPLOS) {
    assert.equal(veredictoEjemplo(ejemplo).nivel, ejemplo.esperado, ejemplo.id)
  }
})

test('los ejemplos que no son verdes explican el motivo', () => {
  for (const ejemplo of EJEMPLOS.filter((e) => e.esperado !== 'verde')) {
    const { motivos } = veredictoEjemplo(ejemplo)
    assert.ok(motivos.length > 0, ejemplo.id)
    assert.ok(motivos.length <= MAXIMO_MOTIVOS, ejemplo.id)
  }
})

test('hay estafas de varios canales y al menos un sitio real', () => {
  const canales = new Set(EJEMPLOS.map((e) => e.canal))
  assert.ok(canales.size >= 3)
  assert.ok(EJEMPLOS.some((e) => e.esperado === 'verde'))
  assert.equal(new Set(EJEMPLOS.map((e) => e.id)).size, EJEMPLOS.length)
})

test('cada ejemplo trae un consejo para seguir', () => {
  for (const ejemplo of EJEMPLOS) assert.ok(ejemplo.consejo.length > 20, ejemplo.id)
})

test('siguienteIndice no se pasa de los bordes', () => {
  assert.equal(siguienteIndice(0, -1, 5), 0)
  assert.equal(siguienteIndice(4, 1, 5), 4)
  assert.equal(siguienteIndice(2, 1, 5), 3)
  assert.equal(siguienteIndice(0, 1, 0), 0)
})

test('indiceVisible redondea a la tarjeta más cercana', () => {
  assert.equal(indiceVisible(0, 300, 5), 0)
  assert.equal(indiceVisible(440, 300, 5), 1)
  assert.equal(indiceVisible(470, 300, 5), 2)
  assert.equal(indiceVisible(9000, 300, 5), 4)
  assert.equal(indiceVisible(100, 0, 5), 0)
})

test('motivosEnteros deja cada motivo completo y sin repetir', () => {
  assert.deepEqual(motivosEnteros(['Promete un premio. Casi nunca es cierto.', 'Promete un premio. Casi nunca es cierto.', 'No aparecen señales de riesgo.']), [
    'Promete un premio. Casi nunca es cierto.',
  ])
  assert.deepEqual(motivosEnteros(undefined), [])
})
