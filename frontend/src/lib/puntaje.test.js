import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analizar, combinarConEnriquecimiento } from './analisis.js'
import { habilitaPeligroso, nivelPorPuntaje, nuevaSenal, PUNTAJE, pesoConTope, puntajeFinal } from './puntaje.js'

const activas = (resultado) => resultado.senales.filter((senal) => senal.texto && senal.puntos > 0)

test('cada señal trae id, grupo, peso, texto y fuerza, y el texto es el motivo que se muestra', () => {
  const r = analizar('http://mercadolibre.pagos-seguridad.click/premio')
  for (const senal of activas(r)) {
    assert.ok(senal.id && senal.grupo, JSON.stringify(senal))
    assert.equal(typeof senal.peso, 'number')
    assert.ok(['fuerte', 'media', 'debil'].includes(senal.fuerza), senal.id)
    assert.ok(r.motivos.includes(senal.texto), `${senal.id} no aparece como motivo`)
  }
})

test('las señales débiles juntas nunca llegan a Peligroso', () => {
  const r = analizar('http://cobro-de-pagos-premio.click/premio/ganaste.html?factura=1')
  assert.ok(activas(r).every((senal) => senal.fuerza === 'debil'))
  assert.equal(r.nivel, 'amarillo')
  assert.ok(r.puntuacion < PUNTAJE.umbrales.peligroso)
  const debiles = r.senales.filter((senal) => senal.grupo === 'debiles')
  assert.ok(debiles.reduce((total, senal) => total + senal.puntos, 0) <= PUNTAJE.topes.debiles)
})

test('el final .click es una señal débil y sola no pasa de Precaución', () => {
  const r = analizar('https://stakelotemax7.click/')
  const tld = r.senales.find((senal) => senal.id === 'tld_barato')
  assert.equal(tld.fuerza, 'debil')
  assert.equal(tld.grupo, 'debiles')
  assert.equal(r.nivel, 'amarillo')
})

test('una señal fuerte o dos medias de grupos distintos habilitan Peligroso; una media sola no', () => {
  const media = (grupo) => nuevaSenal({ id: grupo, grupo, peso: 30, texto: grupo, fuerza: 'media' })
  assert.equal(habilitaPeligroso([media('datos')]), false)
  assert.equal(habilitaPeligroso([media('datos'), media('datos')]), false)
  assert.equal(habilitaPeligroso([media('datos'), media('edad')]), true)
  assert.equal(habilitaPeligroso([nuevaSenal({ id: 'x', grupo: 'engano', peso: 40, texto: 'x', fuerza: 'fuerte' })]), true)
  assert.equal(puntajeFinal(80, [media('datos')]), PUNTAJE.umbrales.peligroso - 1)
  assert.equal(puntajeFinal(80, [media('datos'), media('edad')]), 80)
})

test('un dominio con marca imitada y una señal fuerte sigue siendo Peligroso', () => {
  assert.equal(analizar('https://mercadolibre.pagos-seguridad.com/verificar').nivel, 'rojo')
  assert.equal(analizar('http://paypa1.com@1.2.3.4/').nivel, 'rojo')
})

test('los umbrales y los topes se pueden cambiar', () => {
  assert.equal(nivelPorPuntaje(30), 'amarillo')
  assert.equal(nivelPorPuntaje(30, false, { precaucion: 40, peligroso: 70 }), 'verde')
  assert.equal(nivelPorPuntaje(60, false, { precaucion: 40, peligroso: 50 }), 'rojo')
  assert.equal(pesoConTope(20, 'palabras', [], { palabras: 5 }), 5)
  assert.equal(pesoConTope(20, 'otro', [], { palabras: 5 }), 20)
})

test('un dominio de 6 meses no es motivo; uno de 3 días sí, y explica por qué', () => {
  const local = analizar('https://panaderia-del-barrio.com.ar/')
  const viejo = combinarConEnriquecimiento(local, { dominio: 'panaderia-del-barrio.com.ar', edad_dias: 180 })
  assert.equal(viejo.puntuacion, local.puntuacion)
  assert.ok(!viejo.senales.some((senal) => senal.id === 'dominio_reciente'))

  const nuevo = combinarConEnriquecimiento(local, { dominio: 'panaderia-del-barrio.com.ar', edad_dias: 3 })
  const edad = nuevo.senales.find((senal) => senal.id === 'dominio_reciente')
  assert.equal(edad.fuerza, 'media')
  assert.ok(nuevo.motivos.some((motivo) => motivo.includes('los sitios truchos suelen tener pocos días de vida')))
})
