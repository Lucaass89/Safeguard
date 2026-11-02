import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analizar, combinarConEnriquecimiento } from './analisis.js'
import {
  casoGuardado,
  desarmar,
  motivosCortos,
  porQueSinVerificar,
  SIN_ABRIR,
  SIN_BASE,
  textoAlerta,
  veredictoDe,
} from './veredicto.js'

test('"Seguro" solo para el dominio oficial de una marca de la lista', () => {
  assert.equal(veredictoDe(analizar('https://www.google.com/search?q=clima')).titulo, 'Seguro')
  assert.equal(veredictoDe(analizar('https://www.mercadolibre.com.ar')).titulo, 'Seguro')
})

test('un dominio desconocido sin señales no promete seguridad', () => {
  const r = analizar('https://www.panaderiadelbarrio.com.ar')
  assert.equal(r.nivel, 'verde')
  assert.equal(veredictoDe(r).titulo, 'Sin señales de riesgo')
})

test('verde con algo sin verificar o en plataforma de terceros no es "Seguro"', () => {
  assert.equal(veredictoDe({ nivel: 'verde', dominio: 'google.com', sinVerificar: true }).clave, 'sin_senales')
  assert.equal(veredictoDe({ nivel: 'verde', dominio: 'google.com', plataforma: { tipo: 'contenido' } }).clave, 'sin_senales')
  assert.equal(veredictoDe({ nivel: 'verde', dominio: 'g0ogle.com', dominioDestino: 'google.com' }).clave, 'seguro')
})

test('los demás niveles y cualquier valor raro', () => {
  assert.equal(veredictoDe({ nivel: 'amarillo' }).titulo, 'Sospechoso')
  assert.equal(veredictoDe({ nivel: 'rojo' }).titulo, 'Peligroso')
  assert.equal(veredictoDe({ nivel: 'gris' }).titulo, 'No pudimos verificarlo')
  assert.equal(veredictoDe({ nivel: 'otro' }).titulo, 'No pudimos verificarlo')
  assert.equal(veredictoDe(null).titulo, 'No pudimos verificarlo')
})

test('los typosquats de las regresiones nunca salen como "Seguro" ni "Sin señales de riesgo"', () => {
  for (const entrada of ['wwww.tikt0ok.-com', "wwww.tikt'ok.-com", 'www.g0ogle.com', 'tikt0ok.com']) {
    const { clave } = veredictoDe(analizar(entrada))
    assert.ok(!['seguro', 'sin_senales'].includes(clave), `${entrada} salió ${clave}`)
  }
})

test('por qué no se pudo verificar, en una línea', () => {
  assert.equal(porQueSinVerificar(analizar('wwww.tikt0ok.-com')), 'El enlace no es válido.')
  assert.equal(porQueSinVerificar(analizar('intent://algo#Intent;end')), 'No es una dirección web: abre otra aplicación.')
  assert.equal(porQueSinVerificar(analizar('https://bit.ly/abc123')), 'Es un acortador y no pudimos ver a dónde lleva.')
  assert.equal(
    porQueSinVerificar({ nivel: 'gris', sinVerificar: true, motivos: [SIN_ABRIR] }),
    'No pudimos conectarnos con el sitio.',
  )
  assert.equal(
    porQueSinVerificar({ nivel: 'gris', sinVerificar: true, motivos: [SIN_BASE] }),
    'No pudimos consultar la base de amenazas.',
  )
  assert.equal(porQueSinVerificar(analizar('https://www.google.com')), null)
})

test('el fallo al seguir el enlace se explica con su causa', () => {
  const local = analizar('https://bit.ly/abc123')
  const final = combinarConEnriquecimiento(local, { fallo: 'tiempo', cadena: [] })
  assert.equal(final.falloAlSeguir, 'tiempo')
  assert.equal(porQueSinVerificar(final), 'El sitio tardó demasiado en responder.')
  assert.equal(porQueSinVerificar({ nivel: 'gris', falloAlSeguir: 'tls' }), 'La conexión segura con el sitio falló.')
  assert.equal(porQueSinVerificar({ nivel: 'gris', falloAlSeguir: 'inventado' }), 'No pudimos conectarnos con el sitio.')
})

test('motivos cortos: tres a la vista y el resto plegado, sin repetir la causa', () => {
  const motivos = ['Uno.', 'Dos.', 'Tres.', 'Cuatro.', SIN_ABRIR]
  assert.deepEqual(motivosCortos(motivos).visibles, ['Uno.', 'Dos.', 'Tres.'])
  assert.equal(motivosCortos(motivos).ocultos, 2)
  assert.equal(motivosCortos(motivos, { abierto: true }).visibles.length, 5)
  assert.equal(motivosCortos(motivos, { conCausa: true }).lista.includes(SIN_ABRIR), false)
})

test('la alerta lleva el dominio desarmado para que no se vuelva un enlace', () => {
  assert.equal(desarmar('g0ogle.com'), 'g0ogle[.]com')
  const r = analizar('www.g0ogle.com')
  const texto = textoAlerta(r, veredictoDe(r).titulo)
  assert.ok(texto.startsWith(`SafeLink: ${veredictoDe(r).titulo}.`))
  assert.ok(texto.includes('g0ogle[.]com'))
  assert.ok(!texto.includes('g0ogle.com'))
  assert.equal(textoAlerta({ nivel: 'verde', dominio: 'whatsapp', motivos: [] }, 'Sin señales de riesgo'), 'SafeLink: Sin señales de riesgo.')
})

test('un caso del historial rearma la comparación solo con lo que se guardó', () => {
  const r = analizar('www.g0ogle.com')
  const caso = casoGuardado({
    nivel_riesgo: r.nivel,
    url_analizada: r.url,
    dominio: r.dominio,
    explicacion: r.motivos.join(' '),
  })
  assert.equal(caso.nivel, r.nivel)
  assert.ok(caso.diferencia)
  assert.ok(caso.motivos.includes(caso.diferencia.frase))
  assert.equal(casoGuardado({ nivel_riesgo: 'gris', url_analizada: '', dominio: '', explicacion: '' }).sinVerificar, true)
})
