import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { analizar } from './analisis.js'
import { CANALES, MENSAJES, elegirMensaje } from './estafaOReal.js'

describe('¿estafa o real?', () => {
  test('cada mensaje está completo y su id entra en la base', () => {
    const ids = new Set()
    for (const mensaje of MENSAJES) {
      assert.match(mensaje.id, /^[a-z0-9-]{1,80}$/)
      assert.ok(!ids.has(mensaje.id), `id repetido: ${mensaje.id}`)
      ids.add(mensaje.id)
      assert.ok(CANALES[mensaje.canal], `${mensaje.id}: canal desconocido`)
      assert.ok(mensaje.remitente && mensaje.texto, `${mensaje.id}: falta remitente o texto`)
      assert.ok(mensaje.leccion?.titulo && mensaje.leccion?.cuerpo, `${mensaje.id}: falta la lección`)
    }
  })

  test('hay estafas y mensajes reales', () => {
    assert.ok(MENSAJES.some((mensaje) => mensaje.estafa))
    assert.ok(MENSAJES.some((mensaje) => !mensaje.estafa))
  })

  test('SafeLink nunca da Seguro el enlace de una estafa', () => {
    for (const mensaje of MENSAJES.filter((m) => m.estafa)) {
      assert.ok(mensaje.texto.includes(mensaje.enlace), `${mensaje.id}: el enlace no está en el texto`)
      assert.notEqual(analizar(mensaje.enlace).nivel, 'verde', `${mensaje.id}: SafeLink no lo marca`)
    }
  })

  test('los mensajes reales no traen enlaces para tocar', () => {
    for (const mensaje of MENSAJES.filter((m) => !m.estafa)) {
      assert.equal(mensaje.enlace, undefined, mensaje.id)
      assert.doesNotMatch(mensaje.texto, /https?:\/\/|\{link\}/, mensaje.id)
    }
  })

  test('elige uno que no viste y nunca repite el actual', () => {
    const vistos = MENSAJES.slice(1).map((mensaje) => mensaje.id)
    assert.equal(elegirMensaje(vistos, null, () => 0.5).id, MENSAJES[0].id)
    const todos = MENSAJES.map((mensaje) => mensaje.id)
    for (const azar of [0, 0.5, 0.99]) {
      assert.notEqual(elegirMensaje(todos, MENSAJES[0].id, () => azar).id, MENSAJES[0].id)
    }
  })
})
