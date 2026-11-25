import assert from 'node:assert/strict'
import test from 'node:test'
import { CONTACTO, enlaceCorreo, enlaceWhatsapp, MOTIVOS_CONTACTO, numeroWhatsapp } from './contacto.js'

test('numeroWhatsapp deja solo los dígitos', () => {
  assert.equal(numeroWhatsapp('+54 9 11 1234-5678'), '5491112345678')
  assert.equal(numeroWhatsapp(null), '')
})

test('enlaceWhatsapp arma wa.me con el texto codificado', () => {
  assert.equal(enlaceWhatsapp('', '+54 9 11 1234-5678'), 'https://wa.me/5491112345678')
  assert.equal(enlaceWhatsapp('Hola, ¿cómo va?', '+54 9 11 1234-5678'), 'https://wa.me/5491112345678?text=Hola%2C%20%C2%BFc%C3%B3mo%20va%3F')
})

test('enlaceCorreo agrega el asunto solo si hay', () => {
  assert.equal(enlaceCorreo('', 'a@b.com'), 'mailto:a@b.com')
  assert.equal(enlaceCorreo('Consulta PhishGuard', 'a@b.com'), 'mailto:a@b.com?subject=Consulta%20PhishGuard')
})

test('los datos y los motivos están completos', () => {
  assert.match(CONTACTO.correo, /^[^@\s]+@[^@\s]+\.[a-z]+$/)
  assert.ok(numeroWhatsapp(CONTACTO.whatsapp).length >= 10)
  for (const motivo of MOTIVOS_CONTACTO) {
    assert.ok(motivo.titulo && motivo.texto && motivo.mensaje)
    assert.ok(motivo.pagina.ruta.startsWith('/'))
  }
  assert.equal(new Set(MOTIVOS_CONTACTO.map((m) => m.id)).size, MOTIVOS_CONTACTO.length)
})
