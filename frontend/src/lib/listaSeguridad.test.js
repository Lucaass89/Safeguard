import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { estadoLista, guardarHechas, leerHechas, TAREAS } from './listaSeguridad.js'

function memoria() {
  const datos = {}
  return { getItem: (c) => datos[c] ?? null, setItem: (c, v) => { datos[c] = v } }
}

describe('lista de seguridad', () => {
  test('cada tarea dice qué hacer', () => {
    for (const tarea of TAREAS) {
      assert.ok(tarea.titulo && tarea.como)
    }
  })

  test('cuenta lo hecho', () => {
    const estado = estadoLista(['whatsapp', 'bloqueo'])
    assert.equal(estado.listas, 2)
    assert.equal(estado.total, TAREAS.length)
    assert.equal(estado.completa, false)
    assert.equal(estado.tareas.find((t) => t.id === 'whatsapp').hecha, true)
  })

  test('el aviso del portapapeles se marca solo si está activo', () => {
    assert.equal(estadoLista([], { portapapeles: true }).listas, 1)
    assert.equal(estadoLista(['portapapeles']).listas, 1)
  })

  test('completa con todo', () => {
    assert.equal(estadoLista(TAREAS.map((t) => t.id)).completa, true)
  })

  test('guarda y descarta ids que no existen', () => {
    const m = memoria()
    guardarHechas(['whatsapp', 'inventada'], m)
    assert.deepEqual(leerHechas(m), ['whatsapp'])
  })
})
