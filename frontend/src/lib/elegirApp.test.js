import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { consejoCorto, datoPhishGuard, datoSafeLink, fechaDeHoy, tarjetasExtra } from './elegirApp.js'

describe('fechaDeHoy', () => {
  test('arranca con mayúscula y dice el día', () => {
    const texto = fechaDeHoy(new Date(2026, 10, 21))
    assert.match(texto, /^Sábado 21 de noviembre$/)
  })
})

describe('consejoCorto', () => {
  test('trae un título y una frase', () => {
    const consejo = consejoCorto(new Date(2026, 10, 21))
    assert.ok(consejo.titulo.length > 0)
    assert.ok(consejo.texto.length > 0)
  })
})

describe('datoSafeLink', () => {
  test('sin revisiones invita a probar', () => {
    assert.match(datoSafeLink({ total: 0 }), /^Todavía no revisaste/)
  })

  test('cuenta revisiones y engaños en singular y plural', () => {
    assert.equal(datoSafeLink({ total: 39, peligrosos: 4 }), '39 revisiones · frenaste 4 engaños')
    assert.equal(datoSafeLink({ total: 1, peligrosos: 1 }), '1 revisión · frenaste 1 engaño')
    assert.equal(datoSafeLink({ total: 3, peligrosos: 0 }), '3 revisiones · ningún engaño por ahora')
  })
})

describe('datoPhishGuard', () => {
  test('sin datos todavía', () => {
    assert.equal(datoPhishGuard(null).porcentaje, null)
  })

  test('sin campañas ni correos', () => {
    assert.match(datoPhishGuard({ eventos: [], campanas: [] }).texto, /ninguna campaña/)
    assert.match(datoPhishGuard({ eventos: [], campanas: [{}] }).texto, /ningún correo/)
  })

  test('calcula el porcentaje que tocó el enlace', () => {
    const tablero = {
      campanas: [{}, {}],
      eventos: [{ hizo_clic: true }, { hizo_clic: false }, { hizo_clic: false }, { hizo_clic: false }],
    }
    assert.deepEqual(datoPhishGuard(tablero), { porcentaje: 25, texto: 'tocó el enlace en tus 2 campañas' })
  })
})

describe('tarjetasExtra', () => {
  test('en la compu muestra la extensión y la app', () => {
    assert.deepEqual(tarjetasExtra({}), ['extension', 'app'])
  })

  test('suma la estafa de la semana si hay edición vigente', () => {
    assert.deepEqual(tarjetasExtra({ edicion: { estafas: [{}] } }), ['estafa', 'extension', 'app'])
  })

  test('saca la extensión en el celular o si la ocultaste, y la app en iPhone', () => {
    assert.deepEqual(tarjetasExtra({ movil: true, ios: true }), [])
    assert.deepEqual(tarjetasExtra({ extensionOculta: true }), ['app'])
  })
})
