import assert from 'node:assert/strict'
import { test } from 'node:test'
import { avanceDeCapitulo, CAPITULOS, capituloEn, DURACION, finDeCapitulo, formatoTiempo } from './recorridoApp.js'

test('los capítulos arrancan en cero, van en orden y entran en el video', () => {
  assert.equal(CAPITULOS[0].inicio, 0)
  assert.equal(CAPITULOS[0].id, 'qr')
  for (let i = 1; i < CAPITULOS.length; i += 1) assert.ok(CAPITULOS[i].inicio > CAPITULOS[i - 1].inicio)
  assert.ok(CAPITULOS[CAPITULOS.length - 1].inicio < DURACION)
  assert.deepEqual(CAPITULOS.map((c) => c.id), ['qr', 'enlace', 'mensaje', 'pdf', 'faro', 'ingreso', 'perfil'])
})

test('capituloEn ubica el momento del video', () => {
  assert.equal(capituloEn(0), 0)
  assert.equal(capituloEn(9.89), 1)
  assert.equal(capituloEn(12), 1)
  assert.equal(capituloEn(52), 6)
  assert.equal(capituloEn(NaN), 0)
  assert.equal(capituloEn(5, []), 0)
})

test('el avance va de 0 a 1 dentro de cada capítulo', () => {
  assert.equal(avanceDeCapitulo(9.9, 1), 0)
  assert.equal(avanceDeCapitulo(12.9, 1), 0.5)
  assert.equal(avanceDeCapitulo(99, 1), 1)
  assert.equal(avanceDeCapitulo(1, 1), 0)
  assert.equal(finDeCapitulo(6), DURACION)
  assert.equal(avanceDeCapitulo(5, 9), 0)
})

test('formatoTiempo muestra minutos y segundos', () => {
  assert.equal(formatoTiempo(0), '0:00')
  assert.equal(formatoTiempo(59.7), '0:59')
  assert.equal(formatoTiempo(75), '1:15')
  assert.equal(formatoTiempo(-3), '0:00')
})
