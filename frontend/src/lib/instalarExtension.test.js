import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DURACION, PASOS_INSTALAR } from './instalarExtension.js'
import { capituloEn, finDeCapitulo } from './recorridoApp.js'

test('cada paso tiene título, texto y un inicio dentro del video', () => {
  assert.equal(PASOS_INSTALAR.length, 6)
  for (const paso of PASOS_INSTALAR) {
    assert.ok(paso.titulo.length > 0)
    assert.ok(paso.texto.length > 0)
    assert.ok(Number.isFinite(paso.inicio))
    assert.ok(paso.inicio >= 0 && paso.inicio < DURACION)
  }
})

test('los pasos arrancan en orden y el primero en cero', () => {
  assert.equal(PASOS_INSTALAR[0].inicio, 0)
  for (let i = 1; i < PASOS_INSTALAR.length; i += 1) {
    assert.ok(PASOS_INSTALAR[i].inicio > PASOS_INSTALAR[i - 1].inicio)
  }
})

test('el paso actual sale del segundo del video', () => {
  assert.equal(capituloEn(0, PASOS_INSTALAR), 0)
  assert.equal(capituloEn(PASOS_INSTALAR[3].inicio + 1, PASOS_INSTALAR), 3)
  assert.equal(capituloEn(DURACION, PASOS_INSTALAR), PASOS_INSTALAR.length - 1)
  assert.equal(finDeCapitulo(PASOS_INSTALAR.length - 1, PASOS_INSTALAR, DURACION), DURACION)
})

test('los pasos nombran lo que se ve en Chrome', () => {
  const textos = PASOS_INSTALAR.map((paso) => paso.texto).join(' ')
  assert.match(textos, /chrome:\/\/extensions/)
  assert.match(textos, /Cargar descomprimida/)
  assert.match(textos, /safelink\.zip/)
})
