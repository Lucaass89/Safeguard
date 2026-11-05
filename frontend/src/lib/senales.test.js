import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analizar, combinarConEnriquecimiento, riesgoPorCertificado, riesgoPorEdad } from './analisis.js'

const ids = (resultado) => resultado.senales.map((senal) => senal.id)

test('una marca sobre un dominio con nombre de trámite es Peligroso, con dos motivos y sin doble conteo', () => {
  const r = analizar('https://mercadolibre.pagos-seguridad.com/verificar')
  assert.equal(r.nivel, 'rojo')
  assert.deepEqual(ids(r).filter((id) => id !== 'piso_marca_mas_senal_fuerte'), ['marca_subdominio', 'nombre_senuelo'])
  assert.ok(r.motivos.some((motivo) => motivo.includes('"pagos"')))
  assert.ok(!r.motivos.some((motivo) => motivo.includes('urgencia')))
})

test('"verificar" ya no cuenta como palabra de urgencia', () => {
  assert.ok(!ids(analizar('https://www.pagos360.com/blog/como-verificar-un-pago')).includes('palabras_gancho'))
})

test('las palabras de urgencia se buscan en el camino, no en el nombre del sitio', () => {
  assert.ok(!ids(analizar('https://urgente-noticias.com.ar/')).includes('palabras_gancho'))
  const r = analizar('https://www.ejemplo.com.ar/premio')
  assert.ok(ids(r).includes('palabras_gancho'))
  assert.ok(r.motivos.some((motivo) => motivo.includes('"premio"')))
})

test('las palabras sueltas, juntas, nunca pasan de verde', () => {
  const r = analizar('https://pagos-seguridad.com.ar/premio?factura=1')
  const palabras = r.senales.filter((senal) => senal.grupo === 'palabras')
  assert.ok(palabras.length >= 2)
  assert.ok(palabras.reduce((total, senal) => total + senal.puntos, 0) <= 15)
  assert.equal(r.nivel, 'verde')
})

test('sin una marca imitada, el nombre de trámite no es señal fuerte', () => {
  assert.equal(analizar('https://pagos-seguridad.click/').nivel, 'amarillo')
})

test('una ruta para entrar a una cuenta no suma además como urgencia', () => {
  const r = analizar('https://ejemplo.com.ar/actualizar-datos')
  assert.ok(ids(r).includes('ruta_sensible'))
  assert.ok(!ids(r).includes('palabras_gancho'))
})

test('la edad solo es motivo cuando el dominio es muy reciente, y dice por qué', () => {
  assert.equal(riesgoPorEdad(180), null)
  assert.equal(riesgoPorEdad(45), null)
  assert.equal(riesgoPorEdad(30), null)
  assert.equal(riesgoPorEdad(29).puntos, 25)
  assert.equal(riesgoPorEdad(3).puntos, 45)
  assert.equal(riesgoPorEdad(3).fuerza, 'media')
  assert.match(riesgoPorEdad(3).frase, /muy reciente \(se registró hace 3 días\): los sitios truchos suelen tener pocos días de vida/)
  assert.match(riesgoPorEdad(0).frase, /se registró hoy/)
  assert.equal(riesgoPorEdad(10, { recienteDias: 7, muyRecienteDias: 2, pesoReciente: 20, pesoMuyReciente: 40 }), null)

  const local = analizar('https://stakelotemax7.click/')
  const final = combinarConEnriquecimiento(local, {
    dominio: 'stakelotemax7.click',
    edad_dias: 180,
    frase_edad: 'Este dominio se registró hace 6 meses.',
  })
  assert.ok(!final.motivos.some((motivo) => motivo.includes('meses')))
  assert.equal(final.puntuacion, local.puntuacion)
})

test('el certificado solo es motivo cuando es muy nuevo', () => {
  assert.equal(riesgoPorCertificado(30), null)
  assert.equal(riesgoPorCertificado(5).puntos, 15)
  assert.match(riesgoPorCertificado(1).frase, /hace menos de dos días/)
})
