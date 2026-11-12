import assert from 'node:assert/strict'
import { test } from 'node:test'
import { personasRecordadas, recordarPersonas } from './planRecordado.js'

function memoria() {
  const datos = new Map()
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => datos.set(k, v),
  }
}

test('recuerda la cantidad elegida para cada cuenta', () => {
  const lugar = memoria()
  recordarPersonas('ana', 150, lugar)
  recordarPersonas('beto', 30, lugar)
  assert.equal(personasRecordadas('ana', lugar), 150)
  assert.equal(personasRecordadas('beto', lugar), 30)
  assert.equal(personasRecordadas('carla', lugar), null)
})

test('no guarda cantidades inválidas ni cuentas vacías', () => {
  const lugar = memoria()
  recordarPersonas('ana', 0, lugar)
  recordarPersonas('', 20, lugar)
  assert.equal(personasRecordadas('ana', lugar), null)
  assert.equal(personasRecordadas('', lugar), null)
})

test('si el navegador bloquea el almacenamiento, no rompe', () => {
  const roto = {
    getItem() { throw new Error('bloqueado') },
    setItem() { throw new Error('bloqueado') },
  }
  assert.doesNotThrow(() => recordarPersonas('ana', 20, roto))
  assert.equal(personasRecordadas('ana', roto), null)
})
