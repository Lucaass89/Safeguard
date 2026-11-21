import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { estadoApp, normalizarAvisos, recibirRespuesta, TEMAS_AVISO, textoEstado, urlAvisos } from './avisos.js'

describe('avisos al celular', () => {
  test('sin nada guardado, no está decidido y los temas arrancan prendidos', () => {
    const estado = normalizarAvisos(null)
    assert.equal(estado.decidido, false)
    assert.equal(estado.activos, false)
    assert.deepEqual(estado.temas, { anuncios: true, estafas: true, phishguard: true })
    assert.equal(textoEstado(estado), 'Apagados')
  })

  test('limpia lo raro', () => {
    const estado = normalizarAvisos({ decidido: 'si', permiso: 'tal vez', token: 5, temas: { estafas: 'no', anuncios: false } })
    assert.equal(estado.decidido, false)
    assert.equal(estado.permiso, null)
    assert.equal(estado.token, null)
    assert.equal(estado.temas.anuncios, false)
    assert.equal(estado.temas.estafas, true)
  })

  test('arma la dirección que entiende la app', () => {
    const estado = normalizarAvisos({ activos: true, temas: { phishguard: false } })
    assert.equal(urlAvisos(estado), 'safeguard://notificaciones?anuncios=1&estafas=1&phishguard=0')
    assert.equal(urlAvisos({ ...estado, activos: false }), 'safeguard://notificaciones?anuncios=0&estafas=0&phishguard=0')
  })

  test('toma el permiso y el token que manda el celular', () => {
    const antes = normalizarAvisos({ decidido: true, activos: true })
    const despues = recibirRespuesta(antes, { permiso: 'si', token: 'abc' })
    assert.equal(despues.permiso, 'si')
    assert.equal(despues.token, 'abc')
    assert.equal(textoEstado(despues), 'Todos prendidos')
  })

  test('si Android no da permiso, quedan apagados', () => {
    const despues = recibirRespuesta(normalizarAvisos({ decidido: true, activos: true }), { permiso: 'no' })
    assert.equal(despues.activos, false)
    assert.equal(textoEstado(despues), 'Android no dio permiso')
  })

  test('cuenta los temas prendidos', () => {
    const estado = normalizarAvisos({ decidido: true, activos: true, permiso: 'si', temas: { estafas: false } })
    assert.equal(textoEstado(estado), `2 de ${TEMAS_AVISO.length} prendidos`)
  })
})

describe('versión de la app', () => {
  test('en la web no hay avisos y en apps viejas hay que actualizar', () => {
    assert.equal(estadoApp(false, 0), 'web')
    assert.equal(estadoApp(true, 2), 'vieja')
    assert.equal(estadoApp(true, 1), 'vieja')
    assert.equal(estadoApp(true, 3), 'lista')
    assert.equal(estadoApp(true, 4), 'lista')
    assert.equal(estadoApp(true, 0), 'pwa')
  })
})
