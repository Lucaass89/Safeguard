import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { DIAS_VIGENCIA, EDICION, MAXIMO_ESTAFAS, edicionVigente, fechaLocal } from './estafasSemana.js'

const FECHA = /^\d{4}-\d{2}-\d{2}$/

describe('estafas de la semana', () => {
  test('se muestra mientras está vigente', () => {
    const hoy = fechaLocal(EDICION.fecha)
    hoy.setDate(hoy.getDate() + DIAS_VIGENCIA - 1)
    assert.equal(edicionVigente(EDICION, hoy), EDICION)
  })

  test('desaparece cuando vence', () => {
    const hoy = fechaLocal(EDICION.fecha)
    hoy.setDate(hoy.getDate() + DIAS_VIGENCIA)
    assert.equal(edicionVigente(EDICION, hoy), null)
  })

  test('sin estafas no hay card', () => {
    assert.equal(edicionVigente({ fecha: EDICION.fecha, estafas: [] }, fechaLocal(EDICION.fecha)), null)
  })

  test('cada estafa trae ejemplo, qué mirar y una fuente con fecha', () => {
    assert.match(EDICION.fecha, FECHA)
    assert.ok(EDICION.estafas.length <= MAXIMO_ESTAFAS)
    const ids = new Set()
    for (const estafa of EDICION.estafas) {
      assert.ok(!ids.has(estafa.id), `id repetido: ${estafa.id}`)
      ids.add(estafa.id)
      for (const campo of ['quien', 'titulo', 'canal', 'ejemplo']) assert.ok(estafa[campo]?.trim(), `${estafa.id}: falta ${campo}`)
      assert.ok(estafa.mirar.length > 0, `${estafa.id}: falta qué mirar`)
      assert.ok(estafa.fuente.nombre?.trim(), `${estafa.id}: falta la fuente`)
      assert.match(estafa.fuente.fecha, FECHA)
      assert.ok(fechaLocal(estafa.fuente.fecha) <= fechaLocal(EDICION.fecha), `${estafa.id}: la fuente es posterior a la edición`)
      assert.equal(new URL(estafa.fuente.url).protocol, 'https:')
    }
  })

  test('los ejemplos no traen enlaces que se puedan tocar', () => {
    for (const estafa of EDICION.estafas) {
      assert.doesNotMatch(estafa.ejemplo, /https?:\/\/|www\.|\.(com|ar|net)\b/i, estafa.id)
    }
  })
})
