import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { armarAnuncio } from './anuncio.js'

describe('anuncio a mano', () => {
  test('arma el aviso con lo de por defecto', () => {
    assert.deepEqual(armarAnuncio({ titulo: ' Prueba ', texto: ' Hola ' }), {
      tema: 'anuncios',
      aviso: { titulo: 'Prueba', texto: 'Hola', ruta: '/' },
    })
  })

  test('respeta el tema y la ruta', () => {
    const { tema, aviso } = armarAnuncio({ titulo: 'a', texto: 'b', tema: 'estafas', ruta: '/perfil' })
    assert.equal(tema, 'estafas')
    assert.equal(aviso.ruta, '/perfil')
  })

  test('rechaza lo que no sirve', () => {
    assert.ok(armarAnuncio({ titulo: '', texto: 'b' }).error)
    assert.ok(armarAnuncio({ titulo: 'x'.repeat(66), texto: 'b' }).error)
    assert.ok(armarAnuncio({ titulo: 'a', texto: '' }).error)
    assert.ok(armarAnuncio({ titulo: 'a', texto: 'b', tema: 'todos' }).error)
    assert.ok(armarAnuncio({ titulo: 'a', texto: 'b', ruta: 'https://otro.sitio' }).error)
    assert.ok(armarAnuncio({ titulo: 'a', texto: 'b', ruta: '//otro.sitio' }).error)
  })
})
