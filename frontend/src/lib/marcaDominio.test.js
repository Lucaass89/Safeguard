import assert from 'node:assert/strict'
import { test } from 'node:test'
import datos from '../data/marcas.json' with { type: 'json' }
import { analizar } from './analisis.js'
import { dominioRegistrable } from './enlace.js'

const ids = (resultado) => resultado.senales.filter((senal) => senal.puntos > 0).map((senal) => senal.id)

test('el dominio registrable sale de la lista de sufijos incluida, sin red', () => {
  assert.equal(dominioRegistrable('mercadolibre.com.ar.verificar-pago.xyz'), 'verificar-pago.xyz')
  assert.equal(dominioRegistrable('ayuda.mercadolibre.com.ar'), 'mercadolibre.com.ar')
  assert.equal(dominioRegistrable('www.pagos-seguridad.com'), 'pagos-seguridad.com')
  assert.equal(dominioRegistrable('servicios.arca.gob.ar'), 'arca.gob.ar')
})

test('cada marca está marcada para verificar a mano, y las no pedidas tienen su TODO', () => {
  const pedidas = {
    mercadolibre: ['mercadolibre.com.ar', 'mercadolibre.com'],
    mercadopago: ['mercadopago.com.ar', 'mercadopago.com'],
    arca: ['arca.gob.ar', 'afip.gob.ar'],
    correoargentino: ['correoargentino.com.ar'],
  }
  for (const marca of datos.marcas) {
    assert.equal(marca.revision, 'verificar a mano antes de usar', marca.id)
    if (pedidas[marca.id]) {
      for (const dominio of pedidas[marca.id]) assert.ok(marca.oficiales.includes(dominio), `${marca.id}: ${dominio}`)
      assert.equal(marca.todo, undefined, marca.id)
    } else {
      assert.match(marca.todo, /^TODO: verificar dominios oficiales a mano/, marca.id)
    }
  }
})

test('en un dominio oficial no se aplican señales de marca ni de palabras', () => {
  for (const url of [
    'https://ayuda.mercadolibre.com.ar/ayuda/seguridad',
    'https://www.mercadopago.com.ar/verificar-cuenta',
    'https://auth.afip.gob.ar/contribuyente_/login.xhtml',
    'https://seguimiento.correoargentino.com.ar/premio',
  ]) {
    const r = analizar(url)
    assert.equal(r.nivel, 'verde', url)
    assert.deepEqual(ids(r), [], url)
  }
})

test('un dominio oficial usado como subdominio de otro sí se marca', () => {
  const r = analizar('https://mercadolibre.com.ar.verificar-pago.xyz/')
  assert.equal(r.dominio, 'verificar-pago.xyz')
  assert.equal(r.nivel, 'rojo')
  assert.ok(ids(r).includes('marca_subdominio'))
})

test('las letras cambiadas se deshacen antes de comparar (0→o, 1→l, 3→e, rn→m)', () => {
  for (const url of ['https://mercad0libre.com/', 'https://mercadol1bre.com.ar/', 'https://mercadolibr3.com.ar/', 'https://rnercadopago.com/']) {
    const r = analizar(url)
    assert.equal(r.nivel, 'rojo', url)
    assert.ok(ids(r).includes('marca_letras'), url)
  }
})

test('uno o dos errores de tipeo en una marca de nombre largo es Peligroso', () => {
  for (const url of ['https://mercadollibre.com/', 'https://mercadolibe.com.ar/', 'https://correoargentno.com.ar/']) {
    assert.equal(analizar(url).nivel, 'rojo', url)
  }
})

test('la marca en la ruta es fuerte con un dominio de trámite o una página para entrar, y no cuenta en una nota', () => {
  for (const url of ['https://pagos-seguridad.com/mercadopago', 'https://ejemplo.com.ar/mercadolibre/login']) {
    const r = analizar(url)
    assert.equal(r.nivel, 'rojo', url)
    assert.equal(r.senales.find((senal) => senal.id === 'marca_en_camino').fuerza, 'fuerte', url)
  }
  assert.equal(analizar('https://www.infobae.com/economia/2026/11/01/mercadolibre-ganancias/').nivel, 'verde')
})

test('un dominio con xn-- es una señal débil: solo no pasa de Sin señales', () => {
  const r = analizar('https://xn--espaa-rta.com/')
  const senal = r.senales.find((s) => s.id === 'punycode')
  assert.equal(senal.fuerza, 'debil')
  assert.equal(senal.grupo, 'debiles')
  assert.equal(r.nivel, 'verde')
  assert.ok(r.motivos.some((motivo) => motivo.includes('españa.com')))
  assert.equal(analizar('https://xn--espaa-rta.click/').nivel, 'amarillo')
})
