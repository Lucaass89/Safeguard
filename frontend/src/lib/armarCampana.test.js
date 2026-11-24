import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  alternarGrupo,
  areasDeEmpleados,
  estadoGrupo,
  etiquetaCategoria,
  etiquetaDificultad,
  nombrePorDefecto,
  resumenFila,
  vistaPrevia,
} from './armarCampana.js'

describe('textos de plantilla', () => {
  test('dificultad y categoría en palabras simples', () => {
    assert.equal(etiquetaDificultad('alto'), 'Difícil de detectar')
    assert.equal(etiquetaDificultad('raro'), 'Intermedia')
    assert.equal(etiquetaCategoria('BANCO'), 'Banco')
    assert.equal(etiquetaCategoria('BANCO', 'algo.com'), 'Engaño real visto en SafeLink')
  })

  test('la vista previa saca el HTML, cambia el enlace y recorta', () => {
    assert.equal(vistaPrevia({ cuerpo_html: '<p>Hola,<br>entrá en {link}</p>' }), 'Hola, entrá en [enlace]')
    const largo = vistaPrevia({ cuerpo_html: 'a '.repeat(200) }, 20)
    assert.ok(largo.endsWith('…'))
    assert.ok(largo.length <= 21)
  })
})

describe('destinatarios por área', () => {
  const empleados = [
    { id: '1', departamento: 'Docentes' },
    { id: '2', departamento: 'Administración' },
    { id: '3', departamento: 'Docentes' },
    { id: '4', departamento: '' },
  ]

  test('agrupa y ordena las áreas', () => {
    assert.deepEqual(areasDeEmpleados(empleados), [
      { area: 'Administración', ids: ['2'] },
      { area: 'Docentes', ids: ['1', '3'] },
      { area: 'General', ids: ['4'] },
    ])
  })

  test('marca y desmarca un área entera', () => {
    assert.equal(estadoGrupo(['1', '3'], ['1']), 'parte')
    assert.deepEqual(alternarGrupo(['1', '3'], ['1']), ['1', '3'])
    assert.deepEqual(alternarGrupo(['1', '3'], ['1', '3', '2']), ['2'])
    assert.equal(estadoGrupo(['1'], []), 'nada')
  })
})

describe('nombrePorDefecto y resumenFila', () => {
  test('usa la plantilla y el mes', () => {
    assert.match(nombrePorDefecto({ titulo: 'Bono' }, new Date(2026, 10, 24)), /^Bono · noviembre/)
    assert.match(nombrePorDefecto(null, new Date(2026, 10, 24)), /^Simulación · /)
  })

  test('resume una campaña', () => {
    assert.deepEqual(resumenFila([{ hizo_clic: true }, { hizo_clic: false }, {}, {}]), {
      total: 4,
      clics: 1,
      porcentaje: 25,
      conResultados: true,
    })
    assert.equal(resumenFila([{}]).conResultados, false)
  })
})
