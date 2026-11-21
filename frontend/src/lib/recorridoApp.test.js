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
  for (let i = 1; i < CAPITULOS.length; i += 1) {
    const inicio = CAPITULOS[i].inicio
    assert.equal(capituloEn(inicio), i)
    assert.equal(capituloEn(inicio - 0.01), i)
    assert.equal(capituloEn(inicio - 0.5), i - 1)
  }
  assert.equal(capituloEn(DURACION), CAPITULOS.length - 1)
  assert.equal(capituloEn(NaN), 0)
  assert.equal(capituloEn(5, []), 0)
})

test('el avance va de 0 a 1 dentro de cada capítulo', () => {
  const { inicio } = CAPITULOS[1]
  const fin = finDeCapitulo(1)
  assert.equal(fin, CAPITULOS[2].inicio)
  assert.equal(avanceDeCapitulo(inicio, 1), 0)
  assert.ok(Math.abs(avanceDeCapitulo((inicio + fin) / 2, 1) - 0.5) < 1e-9)
  assert.equal(avanceDeCapitulo(fin + 10, 1), 1)
  assert.equal(avanceDeCapitulo(inicio - 1, 1), 0)
  assert.equal(finDeCapitulo(CAPITULOS.length - 1), DURACION)
  assert.equal(avanceDeCapitulo(5, 99), 0)
})

test('con otros capítulos y duración se calcula igual', () => {
  const propios = [{ inicio: 0 }, { inicio: 10 }, { inicio: 20 }]
  assert.equal(capituloEn(15, propios), 1)
  assert.equal(avanceDeCapitulo(25, 2, propios, 30), 0.5)
})

test('formatoTiempo muestra minutos y segundos', () => {
  assert.equal(formatoTiempo(0), '0:00')
  assert.equal(formatoTiempo(59.7), '0:59')
  assert.equal(formatoTiempo(75), '1:15')
  assert.equal(formatoTiempo(-3), '0:00')
})
