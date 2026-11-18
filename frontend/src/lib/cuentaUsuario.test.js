import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { etiquetaRol, fotoDe, metodosDe, textoMetodo } from './cuentaUsuario.js'

describe('datos de la cuenta', () => {
  test('cómo entrás', () => {
    const conGoogle = { identities: [{ provider: 'google' }] }
    assert.equal(textoMetodo(metodosDe(conGoogle)), 'Entrás con Google.')
    const ambos = { identities: [{ provider: 'email' }, { provider: 'google' }] }
    assert.equal(textoMetodo(metodosDe(ambos)), 'Entrás con correo y contraseña y con Google.')
    assert.equal(textoMetodo(metodosDe({})), null)
  })

  test('foto de Google solo si es https', () => {
    assert.equal(fotoDe({ user_metadata: { avatar_url: 'https://lh3.googleusercontent.com/a/x' } }), 'https://lh3.googleusercontent.com/a/x')
    assert.equal(fotoDe({ user_metadata: { picture: 'http://inseguro/x.png' } }), null)
    assert.equal(fotoDe(null), null)
  })

  test('nombre del rol', () => {
    assert.equal(etiquetaRol('Admin_Principal'), 'Administrador principal')
    assert.equal(etiquetaRol('Tecnico'), 'Técnico')
    assert.equal(etiquetaRol(' Otro '), 'Otro')
    assert.equal(etiquetaRol(null), null)
  })
})
