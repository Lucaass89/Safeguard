import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { esperadoDe, evaluarFila, evaluarUrls, leerCsv, leerVirusTotal } from '../../eval/evaluar_urls.js'
import { analizar } from './analisis.js'
import { combinarConVirusTotal, conteoVirusTotal } from './virustotal.js'

const filas = leerCsv(readFileSync(new URL('../../eval/urls_eval.csv', import.meta.url), 'utf8'))
const lineaBase = JSON.parse(readFileSync(new URL('../../eval/linea_base_urls.json', import.meta.url), 'utf8'))

const vt = (malicious, undetected = 90) => ({
  data: { attributes: { last_analysis_stats: { malicious, suspicious: 0, harmless: 0, undetected, timeout: 0 } } },
})

test('el CSV tiene las columnas pedidas y unas 15 URLs de cada tipo', () => {
  assert.ok(filas.filter((f) => f.label === 'legit').length >= 15)
  assert.ok(filas.filter((f) => f.label === 'phishing' && f.source === 'synthetic').length >= 15)
  assert.ok(filas.some((f) => f.source === 'real' && f.url === 'https://stakelotemax7.click/'))
  assert.throws(() => leerCsv('url,label,source,notes\nhttps://a.com,dudoso,manual,'), /label/)
  assert.throws(() => leerCsv('url,label\nhttps://a.com,legit'), /empezar con/)
})

test('los legítimos difíciles nunca salen Precaución ni Peligroso', () => {
  for (const fila of filas.filter((f) => f.label === 'legit')) {
    const resultado = evaluarFila(fila)
    assert.equal(resultado.predicho, 'legit', `${fila.url} salió ${resultado.veredicto}`)
  }
})

test('ninguna variante sintética sale como Seguro o Sin señales de riesgo', () => {
  for (const fila of filas.filter((f) => f.source === 'synthetic')) {
    const { veredicto } = evaluarFila(fila)
    assert.ok(!['Seguro', 'Sin señales de riesgo'].includes(veredicto), `${fila.url} salió ${veredicto}`)
  }
})

test('stakelotemax7.click: Precaución solo por la dirección, Peligroso con la respuesta guardada de VirusTotal', () => {
  const fila = filas.find((f) => f.url === 'https://stakelotemax7.click/')
  assert.equal(esperadoDe(fila.notes), 'Peligroso')
  assert.equal(evaluarFila(fila).veredicto, 'Precaución')
  const conVt = evaluarFila(fila, { virusTotal: leerVirusTotal(fila.url) })
  assert.equal(conVt.veredicto, 'Peligroso')
  assert.equal(conVt.cumpleEsperado, true)
  assert.ok(conVt.motivos[0].startsWith('13 de 93 antivirus de VirusTotal'))
})

test('VirusTotal es una señal: de 1 a 4 motores es media, 5 o más es fuerte y sola lleva a Peligroso', () => {
  const local = analizar('https://panaderiadelbarrio.com.ar/')
  const cinco = combinarConVirusTotal(local, vt(5))
  assert.equal(cinco.nivel, 'rojo')
  assert.equal(cinco.senales.at(-1).fuerza, 'fuerte')

  const cuatro = combinarConVirusTotal(local, vt(4))
  assert.equal(cuatro.nivel, 'amarillo')
  assert.equal(cuatro.senales.at(-1).fuerza, 'media')
  assert.ok(cuatro.motivos.some((motivo) => motivo.includes('Son pocos para confirmarlo')))
  assert.equal(combinarConVirusTotal(local, vt(1)).nivel, 'amarillo')

  assert.equal(combinarConVirusTotal(local, vt(0)), local)
  assert.equal(combinarConVirusTotal(local, null), local)
  assert.equal(conteoVirusTotal({ algo: 1 }), null)
})

test('VirusTotal nunca baja un veredicto', () => {
  const local = analizar('https://mercadolibre.pagos-seguridad.com/verificar')
  assert.equal(combinarConVirusTotal(local, vt(0, 93)).nivel, 'rojo')
})

test('no empeora la línea base guardada', () => {
  for (const [corrida, guardada] of [
    [evaluarUrls(filas), lineaBase.sinVirusTotal],
    [evaluarUrls(filas, { conVirusTotal: true }), lineaBase.conVirusTotal],
  ]) {
    for (const [fuente, medida] of Object.entries(corrida.porFuente)) {
      const base = guardada.porFuente[fuente]
      if (base.deteccion !== null && medida.deteccion !== null) assert.ok(medida.deteccion >= base.deteccion, `detección ${fuente}`)
      if (base.falsosPositivos !== null && medida.falsosPositivos !== null) {
        assert.ok(medida.falsosPositivos <= base.falsosPositivos, `falsos positivos ${fuente}`)
      }
    }
  }
})
