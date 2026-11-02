import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { agruparActividad, detalleDe } from './agruparActividad.js'
import { LARGO, recortar } from './fragmentos.js'

let siguiente = 0
const item = (tipo, texto, nivel, fecha) => ({ id: String(siguiente++), tipo, texto, nivel, fecha })

describe('actividad reciente', () => {
  test('junta lo repetido del mismo día', () => {
    const grupos = agruparActividad([
      item('Mensaje', 'Hola, soy del banco', 'peligroso', '2026-10-06T15:00:00'),
      item('Mensaje', 'Hola, soy del banco', 'peligroso', '2026-10-06T10:00:00'),
      item('Enlace', 'ejemplo.com', 'seguro', '2026-10-06T09:00:00'),
    ])
    assert.equal(grupos.length, 2)
    assert.equal(grupos[0].veces, 2)
    assert.equal(detalleDe(grupos[0]), '2 mensajes')
    assert.equal(detalleDe(grupos[1]), 'Enlace')
  })

  test('no junta días ni resultados distintos', () => {
    const grupos = agruparActividad([
      item('Enlace', 'ejemplo.com', 'seguro', '2026-10-07T10:00:00'),
      item('Enlace', 'ejemplo.com', 'seguro', '2026-10-06T10:00:00'),
      item('Enlace', 'ejemplo.com', 'peligroso', '2026-10-06T09:00:00'),
    ])
    assert.equal(grupos.length, 3)
  })

  test('corta en el máximo pero sigue contando repetidos', () => {
    const lista = [
      ...Array.from({ length: 6 }, (_, i) => item('Enlace', `sitio${i}.com`, 'seguro', '2026-10-06T10:00:00')),
      item('Enlace', 'sitio0.com', 'seguro', '2026-10-06T08:00:00'),
    ]
    const grupos = agruparActividad(lista, 5)
    assert.equal(grupos.length, 5)
    assert.equal(grupos[0].veces, 2)
  })

  test('plural de cada tipo', () => {
    assert.equal(detalleDe({ tipo: 'QR', veces: 3 }), '3 QR')
    assert.equal(detalleDe({ tipo: 'PDF', veces: 2 }), '2 PDF')
    assert.equal(detalleDe({ tipo: 'Correo', veces: 2 }), '2 correos')
  })

  test('el fragmento es corto y de una línea', () => {
    assert.equal(recortar('  Hola,\n\nte escribo   del banco  '), 'Hola, te escribo del banco')
    const largo = recortar('Estimado cliente, por una actualización de seguridad tu clave de home banking vence hoy a las 18 horas.')
    assert.ok(largo.length <= LARGO + 1)
    assert.ok(largo.endsWith('…'))
    assert.doesNotMatch(largo, /\s…$/)
  })
})
