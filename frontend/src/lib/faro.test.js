import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analizar } from './analisis.js'
import { armarConsulta, bloquesRespuesta, limitarOraciones, nombreNivel, respuestaContradice, respuestaLocal } from './faro.js'
import { veredictoDe } from './veredicto.js'
import { combinarConVirusTotal } from './virustotal.js'

function casoDe(url, extra) {
  const r = extra ? combinarConVirusTotal(analizar(url), extra) : analizar(url)
  return {
    r,
    caso: {
      url: r.url,
      dominio: r.dominio,
      puntuacion: r.puntuacion,
      canal: 'enlace',
      titulo: veredictoDe(r).titulo,
      senales: r.senales,
      virusTotal: r.virusTotal ?? null,
    },
  }
}

const todas = (r, caso) =>
  ['simple', 'tecnico', 'avanzado'].flatMap((modo) =>
    ['Analizá este caso', 'Dame un ejemplo', '¿Se puede abrir?', '¿Qué pasa si ya hice clic?'].map((pregunta) =>
      respuestaLocal(r.nivel, r.motivos, pregunta, modo, caso),
    ),
  )

test('usa los mismos nombres de nivel que la tarjeta', () => {
  assert.equal(nombreNivel('amarillo'), 'Precaución')
  assert.equal(nombreNivel('verde'), 'Sin señales de riesgo')
  assert.equal(nombreNivel('verde', 'Seguro'), 'Seguro')
  assert.equal(nombreNivel('gris'), 'No pudimos verificarlo')
  const { r, caso } = casoDe('https://stakelotemax7.click/')
  for (const texto of todas(r, caso)) assert.ok(!/dudoso/i.test(texto), texto)
  assert.match(respuestaLocal(r.nivel, r.motivos, 'Analizá este caso', 'simple', caso), /Precaución/)
})

test('Simple, Técnico y Avanzado dan contenido distinto', () => {
  const { r, caso } = casoDe('http://mercadolibre.pagos-seguridad.click/premio')
  const simple = respuestaLocal(r.nivel, r.motivos, 'Analizá este caso', 'simple', caso)
  const tecnico = respuestaLocal(r.nivel, r.motivos, 'Analizá este caso', 'tecnico', caso)
  const avanzado = respuestaLocal(r.nivel, r.motivos, 'Analizá este caso', 'avanzado', caso)
  assert.notEqual(simple, tecnico)
  assert.notEqual(tecnico, avanzado)
  assert.ok(!/puntaje|\d+ puntos/i.test(simple))
  assert.match(tecnico, /Puntaje: \d+ de 100/)
  assert.match(tecnico, /marca_subdominio, fuerte, \d+ puntos/)
  assert.match(avanzado, /tope/)
  assert.match(avanzado, /habilita llegar a Peligroso/)
})

test('recibe el puntaje y el resumen de VirusTotal', () => {
  const vt = { data: { attributes: { last_analysis_stats: { malicious: 13, undetected: 80 } } } }
  const { r, caso } = casoDe('https://stakelotemax7.click/', vt)
  assert.match(respuestaLocal(r.nivel, r.motivos, 'Analizá este caso', 'tecnico', caso), /VirusTotal: 13 de 93 motores/)

  const consulta = armarConsulta(r.nivel, r.motivos, '¿Por qué?', [], 'avanzado', caso)
  assert.deepEqual(consulta.virusTotal, { maliciosos: 13, total: 93 })
  assert.equal(consulta.nivel, 'Peligroso')
  assert.equal(consulta.titulo, 'Peligroso')
  assert.equal(consulta.caso.puntuacion, r.puntuacion)
  assert.ok(consulta.senales.some((senal) => senal.id === 'virustotal' && senal.fuerza === 'fuerte'))
  assert.deepEqual(Object.keys(consulta.senales[0]).sort(), ['fuerza', 'grupo', 'id', 'peso', 'texto'])
})

test('el backend ya desplegado sigue recibiendo un nivel que entiende', () => {
  const { r, caso } = casoDe('https://stakelotemax7.click/')
  const consulta = armarConsulta(r.nivel, r.motivos, '¿Por qué?', [], 'simple', caso)
  assert.equal(consulta.nivel, 'Dudoso')
  assert.equal(consulta.titulo, 'Precaución')
})

test('la lista numerada sale como lista, aunque venga pegada en un párrafo', () => {
  assert.deepEqual(bloquesRespuesta('Señales:\n1. Uno.\n2. Dos.\nCierre.'), [
    { tipo: 'parrafo', texto: 'Señales:' },
    { tipo: 'lista', items: ['Uno.', 'Dos.'] },
    { tipo: 'parrafo', texto: 'Cierre.' },
  ])
  const pegada = bloquesRespuesta('Hay dos señales: 1. La marca. 2. El final .click. Fin.')
  assert.equal(pegada[1].tipo, 'lista')
  assert.equal(pegada[1].items.length, 2)
  assert.equal(limitarOraciones('A.\n1. Uno.\n2. Dos.', 1), 'A.\n1. Uno.\n2. Dos.')
  assert.equal(limitarOraciones('Hay dos: 1. Uno. 2. Dos.', 4), 'Hay dos:\n1. Uno.\n2. Dos.')
})

test('nunca dice "es seguro", "garantizado" ni que no abre el archivo', () => {
  for (const url of ['https://www.mercadolibre.com.ar/', 'https://panaderiadelbarrio.com.ar/', 'https://stakelotemax7.click/', 'https://mercad0libre.com/']) {
    const { r, caso } = casoDe(url)
    for (const texto of todas(r, caso)) {
      assert.ok(!/\bes seguro\b|garantizad|abre el archivo|ejecuta nada/i.test(texto), `${url}: ${texto}`)
    }
  }
  assert.equal(respuestaContradice('verde', 'El sitio es seguro.'), true)
  assert.equal(respuestaContradice('verde', 'Esto no garantiza que el sitio sea seguro.'), false)
  assert.equal(respuestaContradice('amarillo', 'Está garantizado.'), true)
})
