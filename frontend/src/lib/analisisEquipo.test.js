import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  areasConPorcentaje,
  cifrasEquipo,
  despuesPersona,
  evolucionCampanas,
  filtrarPersonas,
  iniciales,
  recomendaciones,
  resultadoPersona,
} from './analisisEquipo.js'

const porPersona = [
  { id: 'a', nombre: 'Ana Gómez', departamento: 'Administración', participo: true, cayo: true, capacitado: true, mejoro: true },
  { id: 'b', nombre: 'Bruno Paz', departamento: 'Administración', participo: true, cayo: true, capacitado: false },
  { id: 'c', nombre: 'Carla Ruiz', departamento: 'Docentes', participo: true, cayo: false, reconocio: true },
  { id: 'd', nombre: 'Dante', departamento: 'Docentes', participo: false, cayo: false },
]

const porArea = [
  { area: 'Docentes', total: 2, cayo: 0, noCayo: 1, cap: 0, mejoro: 0 },
  { area: 'Administración', total: 2, cayo: 2, noCayo: 0, cap: 1, mejoro: 1 },
]

describe('cifrasEquipo', () => {
  test('cuenta solo a quienes recibieron una simulación', () => {
    assert.deepEqual(cifrasEquipo(porPersona), {
      personas: 4,
      evaluadas: 3,
      cayeron: 2,
      pctCayeron: 67,
      capacitados: 1,
      pctCapacitados: 50,
      mejoraron: 1,
    })
  })
})

describe('areasConPorcentaje', () => {
  test('ordena de la peor a la mejor y marca la peor', () => {
    const areas = areasConPorcentaje(porArea)
    assert.equal(areas[0].area, 'Administración')
    assert.equal(areas[0].porcentaje, 100)
    assert.equal(areas[0].reforzar, true)
    assert.equal(areas[1].reforzar, false)
  })

  test('saca las áreas que todavía no recibieron nada', () => {
    assert.equal(areasConPorcentaje([{ area: 'Nueva', total: 3, cayo: 0, noCayo: 0 }]).length, 0)
  })
})

describe('evolucionCampanas', () => {
  test('va de la más vieja a la más nueva', () => {
    const campanas = [
      { id: 'c2', nombre_campana: 'Segunda', creado_en: '2026-11-01T00:00:00Z' },
      { id: 'c1', nombre_campana: 'Primera', creado_en: '2026-10-01T00:00:00Z' },
    ]
    const eventos = [
      { campana_id: 'c1', hizo_clic: true },
      { campana_id: 'c1', hizo_clic: false },
      { campana_id: 'c2', hizo_clic: false },
      { campana_id: 'c2', hizo_clic: false },
    ]
    assert.deepEqual(evolucionCampanas(campanas, eventos).map((c) => [c.nombre, c.porcentaje]), [
      ['Primera', 50],
      ['Segunda', 0],
    ])
  })
})

describe('recomendaciones', () => {
  test('propone refuerzo, explicación pendiente y cómo viene', () => {
    const lista = recomendaciones({
      areas: areasConPorcentaje(porArea),
      porPersona,
      evolucion: [{ porcentaje: 50 }, { porcentaje: 25 }],
    })
    assert.deepEqual(lista.map((item) => item.id), ['refuerzo', 'capacitacion', 'evolucion'])
    assert.equal(lista[0].titulo, 'Mandá un refuerzo a Administración.')
    assert.match(lista[1].titulo, /^1 persona cayó/)
    assert.match(lista[2].texto, /de 50 % a 25 %/)
  })

  test('si nadie cayó en la última, sugiere algo más difícil', () => {
    const lista = recomendaciones({ areas: [], porPersona: [], evolucion: [{ porcentaje: 0 }] })
    assert.deepEqual(lista.map((item) => item.id), ['dificil'])
  })
})

describe('filtrarPersonas', () => {
  test('filtra por resultado', () => {
    assert.deepEqual(filtrarPersonas(porPersona, 'cayo').map((p) => p.id), ['a', 'b'])
    assert.deepEqual(filtrarPersonas(porPersona, 'nocayo').map((p) => p.id), ['c'])
    assert.deepEqual(filtrarPersonas(porPersona, 'falta').map((p) => p.id), ['b'])
    assert.deepEqual(filtrarPersonas(porPersona, 'sin').map((p) => p.id), ['d'])
  })

  test('busca por nombre o área sin importar mayúsculas', () => {
    assert.deepEqual(filtrarPersonas(porPersona, 'todos', 'DOCEN').map((p) => p.id), ['c', 'd'])
  })
})

describe('textos por persona', () => {
  test('iniciales', () => {
    assert.equal(iniciales('Ana María Gómez'), 'AG')
    assert.equal(iniciales('dante'), 'DA')
    assert.equal(iniciales(''), '?')
  })

  test('resultado y lo que pasó después', () => {
    assert.equal(resultadoPersona(porPersona[0]).etiqueta, 'Cayó')
    assert.equal(despuesPersona(porPersona[0]), 'Terminó la explicación y no cayó en el refuerzo')
    assert.equal(despuesPersona(porPersona[1]), 'Le falta terminar la explicación')
    assert.equal(despuesPersona(porPersona[2]), 'Reconoció el engaño')
    assert.equal(despuesPersona(porPersona[3]), 'Todavía no recibió ninguna simulación')
  })
})
