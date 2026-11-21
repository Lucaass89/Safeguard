import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  agruparPorDia,
  destinoPanel,
  destinoSafeLink,
  enlaceTraido,
  filtrarPorNivel,
  fraseDeNivel,
  pasoEn,
  pasosRevision,
  textoProtegido,
  tipoDeEntrada,
  tituloDelDia,
} from './safelinkApp.js'

describe('qué pegaron', () => {
  test('un enlace solo es un enlace', () => {
    assert.equal(tipoDeEntrada('https://mercadolibre-pagos.com/login'), 'enlace')
    assert.equal(tipoDeEntrada('  bit.ly/abc123 '), 'enlace')
  })

  test('un texto con espacios es un mensaje, aunque traiga un enlace', () => {
    assert.equal(tipoDeEntrada('Hola ma, cambié de número. Entrá a bit.ly/abc'), 'mensaje')
    assert.equal(tipoDeEntrada('hola'), 'mensaje')
  })

  test('las cabeceras de un correo lo marcan como correo', () => {
    assert.equal(tipoDeEntrada('From: Banco <avisos@banco.com>\nSubject: Validá tu cuenta\n\nHola'), 'correo')
    assert.equal(tipoDeEntrada('Asunto: Factura\nDe: proveedor@x.com'), 'correo')
    assert.equal(tipoDeEntrada('Received: from mail.x.com'), 'correo')
  })

  test('vacío no es nada', () => {
    assert.equal(tipoDeEntrada(''), null)
    assert.equal(tipoDeEntrada('   '), null)
    assert.equal(tipoDeEntrada(undefined), null)
  })
})

describe('pasos mientras revisa', () => {
  test('cada tipo tiene sus pasos y lo desconocido usa los de enlace', () => {
    assert.equal(pasosRevision('pdf')[0], 'Abriendo el PDF en tu celular')
    assert.deepEqual(pasosRevision('otro'), pasosRevision('enlace'))
  })

  test('avanza con el tiempo y se queda en el último', () => {
    assert.equal(pasoEn('enlace', 0).indice, 0)
    assert.equal(pasoEn('enlace', 1300).indice, 1)
    assert.equal(pasoEn('enlace', 99999).indice, 3)
    assert.equal(pasoEn('enlace', -5).indice, 0)
    assert.equal(pasoEn('mensaje', 2700).texto, 'Revisando los enlaces')
  })
})

describe('historial', () => {
  const items = [
    { id: 1, nivelRiesgo: 'rojo', fecha: '2026-11-17T10:00:00' },
    { id: 2, nivelRiesgo: 'verde', fecha: '2026-11-17T08:00:00' },
    { id: 3, nivelRiesgo: 'amarillo', fecha: '2026-11-16T22:00:00' },
    { id: 4, nivelRiesgo: 'verde', fecha: '2026-11-10T09:00:00' },
  ]
  const hoy = new Date('2026-11-17T15:00:00')

  test('filtra por color', () => {
    assert.deepEqual(filtrarPorNivel(items, 'verde').map((item) => item.id), [2, 4])
    assert.equal(filtrarPorNivel(items, 'todos'), items)
    assert.equal(filtrarPorNivel(items, null), items)
  })

  test('nombra los días', () => {
    assert.equal(tituloDelDia('2026-11-17T01:00:00', hoy), 'Hoy')
    assert.equal(tituloDelDia('2026-11-16T23:59:00', hoy), 'Ayer')
    assert.match(tituloDelDia('2026-11-10T09:00:00', hoy), /^Martes.*10.*noviembre/)
  })

  test('agrupa seguidos por día', () => {
    const grupos = agruparPorDia(items, hoy)
    assert.deepEqual(
      grupos.map((grupo) => [grupo.titulo.split(',')[0], grupo.items.map((item) => item.id)]),
      [
        ['Hoy', [1, 2]],
        ['Ayer', [3]],
        ['Martes', [4]],
      ],
    )
  })
})

describe('textos', () => {
  test('lo que llevás protegido', () => {
    assert.equal(textoProtegido({ total: 0, peligrosos: 0 }), '')
    assert.equal(textoProtegido({ total: 1, peligrosos: 0 }), 'Revisaste 1 cosa y ninguna era peligrosa.')
    assert.equal(textoProtegido({ total: 23, peligrosos: 4 }), 'Revisaste 23 cosas y frenaste 4 engaños.')
    assert.equal(textoProtegido({ total: 5, peligrosos: 1 }), 'Revisaste 5 cosas y frenaste 1 engaño.')
  })

  test('la frase grande del resultado', () => {
    assert.equal(fraseDeNivel('peligroso'), 'No lo abras')
    assert.equal(fraseDeNivel('seguro'), 'Podés seguir')
    assert.equal(fraseDeNivel('cualquiera'), 'No lo pudimos revisar del todo')
  })
})

describe('destinoSafeLink', () => {
  test('sin nada va a SafeLink', () => {
    assert.equal(destinoSafeLink(''), '/safelink')
    assert.equal(destinoSafeLink('?url=%20%20'), '/safelink')
  })

  test('pasa el enlace para revisarlo', () => {
    assert.equal(
      destinoSafeLink('?url=https%3A%2F%2Fejemplo.com%2Fpromo'),
      '/safelink?compartido=https%3A%2F%2Fejemplo.com%2Fpromo',
    )
  })

  test('recorta lo muy largo', () => {
    const largo = 'https://a.com/' + 'x'.repeat(3000)
    const destino = destinoSafeLink(`?url=${encodeURIComponent(largo)}`)
    assert.equal(decodeURIComponent(destino.split('=')[1]).length, 2048)
  })
})

describe('destinoPanel', () => {
  test('sin enlace va al inicio del panel', () => {
    assert.equal(destinoPanel(''), '/panel')
  })

  test('conserva el enlace que manda la extensión', () => {
    assert.equal(destinoPanel('?url=https%3A%2F%2Fejemplo.com%2Fa'), '/panel?url=https%3A%2F%2Fejemplo.com%2Fa')
  })
})

describe('enlaceTraido', () => {
  test('toma solo direcciones web', () => {
    assert.equal(enlaceTraido('?url=https%3A%2F%2Fejemplo.com%2Fa'), 'https://ejemplo.com/a')
    assert.equal(enlaceTraido('?url=javascript%3Aalert(1)'), '')
    assert.equal(enlaceTraido('?url=hola%20mundo'), '')
    assert.equal(enlaceTraido(''), '')
  })
})
