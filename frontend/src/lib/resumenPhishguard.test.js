import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  areasParaReforzar,
  campanasConDatos,
  fraseCampana,
  pasoActual,
  pasosPhishguard,
  textoDiferencia,
  ultimaCampana,
} from './resumenPhishguard.js'

const tablero = {
  empleados: [
    { id: 'a', departamento: 'Administración' },
    { id: 'b', departamento: 'Administración' },
    { id: 'c', departamento: 'Docentes' },
    { id: 'd', departamento: 'Docentes' },
  ],
  campanas: [
    { id: 'c1', nombre_campana: 'Primera', canal: 'correo', creado_en: '2026-10-01T10:00:00Z' },
    { id: 'c2', nombre_campana: 'Bono de fin de año', canal: 'correo', creado_en: '2026-11-12T10:00:00Z' },
    { id: 'c3', nombre_campana: 'Sin enviar', canal: 'correo', creado_en: '2026-11-20T10:00:00Z' },
  ],
  eventos: [
    { campana_id: 'c1', empleado_id: 'a', hizo_clic: true },
    { campana_id: 'c1', empleado_id: 'b', hizo_clic: true },
    { campana_id: 'c1', empleado_id: 'c', hizo_clic: false },
    { campana_id: 'c1', empleado_id: 'd', hizo_clic: false },
    { campana_id: 'c2', empleado_id: 'a', hizo_clic: true, ingreso_datos: true, completo_capacitacion: true },
    { campana_id: 'c2', empleado_id: 'b', hizo_clic: false },
    { campana_id: 'c2', empleado_id: 'c', hizo_clic: false },
    { campana_id: 'c2', empleado_id: 'd', hizo_clic: false },
  ],
}

describe('campanasConDatos y ultimaCampana', () => {
  test('ignora las campañas sin correos y ordena de la más nueva', () => {
    assert.deepEqual(campanasConDatos(tablero).map((campana) => campana.id), ['c2', 'c1'])
  })

  test('arma la última con su comparación contra la anterior', () => {
    const ultima = ultimaCampana(tablero)
    assert.equal(ultima.nombre, 'Bono de fin de año')
    assert.equal(ultima.recibieron, 4)
    assert.equal(ultima.clics, 1)
    assert.equal(ultima.datos, 1)
    assert.equal(ultima.capacitacion, 1)
    assert.equal(ultima.porcentaje, 25)
    assert.equal(ultima.diferencia, -25)
  })

  test('sin datos no hay última campaña', () => {
    assert.equal(ultimaCampana({ campanas: [], eventos: [] }), null)
    assert.equal(ultimaCampana(null), null)
  })
})

describe('areasParaReforzar', () => {
  test('cuenta personas distintas por área y marca la peor', () => {
    const areas = areasParaReforzar(tablero)
    assert.deepEqual(areas[0], { area: 'Administración', personas: 2, cayeron: 2, porcentaje: 100, reforzar: true })
    assert.deepEqual(areas[1], { area: 'Docentes', personas: 2, cayeron: 0, porcentaje: 0, reforzar: false })
  })

  test('si nadie tocó el enlace no marca ninguna', () => {
    const limpio = { ...tablero, eventos: tablero.eventos.map((evento) => ({ ...evento, hizo_clic: false })) }
    assert.ok(areasParaReforzar(limpio).every((area) => !area.reforzar))
  })
})

describe('pasosPhishguard', () => {
  test('marca lo hecho y propone un refuerzo para la peor área', () => {
    const pasos = pasosPhishguard(tablero)
    assert.deepEqual(pasos.map((paso) => paso.hecho), [true, true, true, false])
    assert.equal(pasos[3].detalle, 'Para Administración')
    assert.equal(pasoActual(pasos), 3)
  })

  test('sin equipo el paso actual es el primero', () => {
    assert.equal(pasoActual(pasosPhishguard({ empleados: [], campanas: [], eventos: [] })), 0)
  })
})

describe('fraseCampana y textoDiferencia', () => {
  test('resume la última campaña', () => {
    assert.equal(
      fraseCampana(ultimaCampana(tablero)),
      'En «Bono de fin de año», 1 de 4 personas tocó el enlace y 1 cargó datos. Quienes tocaron el enlace vieron la explicación en el momento.',
    )
  })

  test('sin campañas invita a empezar', () => {
    assert.match(fraseCampana(null), /^Todavía no salió ninguna simulación/)
  })

  test('dice si mejoró o empeoró', () => {
    assert.deepEqual(textoDiferencia(-12), { texto: '12 puntos menos que la anterior', tono: 'mejor' })
    assert.deepEqual(textoDiferencia(1), { texto: '1 punto más que la anterior', tono: 'peor' })
    assert.deepEqual(textoDiferencia(0), { texto: 'Igual que la anterior', tono: 'igual' })
    assert.equal(textoDiferencia(null), null)
  })
})
