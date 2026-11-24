import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { buscarEnRevisados, casoDeRevisado, conteoPorNivel, fechaDeTabla, motivoCorto, partesDeTotales, resumenDe } from './revisados.js'

const enlace = {
  id: 'a1',
  entrada: 'web',
  tipo: 'Enlace',
  texto: 'afterpay-account.com/',
  dominio: 'afterpay-account.com',
  url: 'https://afterpay-account.com/',
  nivelRiesgo: 'rojo',
  motivos: ['Motivo'],
  diferencia: null,
}

describe('casoDeRevisado', () => {
  test('arma el caso de un enlace sin subtítulo', () => {
    const caso = casoDeRevisado(enlace)
    assert.equal(caso.canal, 'enlace')
    assert.equal(caso.caso.nivel, 'rojo')
    assert.equal(caso.subtitulo, undefined)
  })

  test('un mensaje lleva su texto como subtítulo y va por el canal de WhatsApp', () => {
    const caso = casoDeRevisado({ ...enlace, entrada: 'whatsapp', texto: 'Hola ma', nivelRiesgo: 'gris' })
    assert.equal(caso.canal, 'whatsapp')
    assert.equal(caso.subtitulo, 'Hola ma')
    assert.equal(caso.caso.sinVerificar, true)
  })
})

describe('buscarEnRevisados', () => {
  const items = [enlace, { ...enlace, id: 'b', texto: 'mercadolibre.com', dominio: 'mercadolibre.com', tipo: 'Enlace' }]

  test('sin texto devuelve todo', () => {
    assert.equal(buscarEnRevisados(items, '  ').length, 2)
  })

  test('busca sin importar mayúsculas', () => {
    assert.deepEqual(buscarEnRevisados(items, 'MERCADO').map((item) => item.id), ['b'])
  })

  test('aguanta una lista vacía', () => {
    assert.deepEqual(buscarEnRevisados(null, 'x'), [])
  })
})

describe('partesDeTotales', () => {
  test('reparte en porcentajes', () => {
    const partes = partesDeTotales({ seguros: 2, dudosos: 1, peligrosos: 1 })
    assert.deepEqual(partes.map((parte) => parte.porcentaje), [50, 25, 25])
  })

  test('sin revisiones no hay partes', () => {
    assert.deepEqual(partesDeTotales({}), [])
  })
})

describe('fechaDeTabla', () => {
  const hoy = new Date(2026, 10, 21, 15, 0)

  test('dice hoy y ayer', () => {
    assert.match(fechaDeTabla(new Date(2026, 10, 21, 9, 5), hoy), /^Hoy, /)
    assert.match(fechaDeTabla(new Date(2026, 10, 20, 9, 5), hoy), /^Ayer, /)
  })

  test('agrega el año solo si es otro', () => {
    assert.doesNotMatch(fechaDeTabla(new Date(2026, 10, 4, 9, 5), hoy), /2026/)
    assert.match(fechaDeTabla(new Date(2025, 10, 4, 9, 5), hoy), /2025/)
  })
})

describe('resumenDe', () => {
  test('recorta lo largo y usa el nombre del PDF', () => {
    assert.equal(resumenDe('pdf', '', 'aviso.pdf'), 'aviso.pdf')
    assert.equal(resumenDe('mensaje', 'x'.repeat(100), '').length, 73)
  })
})

describe('conteoPorNivel', () => {
  test('cuenta por color y suma las repetidas', () => {
    const conteo = conteoPorNivel([
      { nivelRiesgo: 'rojo', veces: 2 },
      { nivelRiesgo: 'verde' },
      { nivelRiesgo: 'otro' },
    ])
    assert.deepEqual(conteo, { todos: 4, rojo: 2, amarillo: 0, verde: 1, gris: 1 })
  })
})

describe('motivoCorto', () => {
  test('toma la primera oración del primer motivo', () => {
    assert.equal(motivoCorto({ motivos: ['Imita a Afterpay. Además es nuevo.'] }), 'Imita a Afterpay.')
  })

  test('no muestra el texto de sin señales ni nada si no hay motivo', () => {
    assert.equal(motivoCorto({ motivos: ['No aparecen señales fuertes en la dirección.'] }), '')
    assert.equal(motivoCorto({}), '')
  })

  test('recorta lo largo', () => {
    assert.ok(motivoCorto({ motivos: ['x'.repeat(300)] }, 20).endsWith('…'))
  })
})
