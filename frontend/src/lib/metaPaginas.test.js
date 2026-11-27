import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { esPrivada, metaDe, normalizarRuta, PAGINAS, robots, sitemap, SITIO } from './metaPaginas.js'

describe('meta de cada página', () => {
  test('cada página pública tiene título y descripción de largo razonable', () => {
    for (const [ruta, pagina] of Object.entries(PAGINAS)) {
      assert.ok(pagina.titulo.length > 10 && pagina.titulo.length <= 70, ruta)
      assert.ok(pagina.descripcion.length >= 50 && pagina.descripcion.length <= 170, ruta)
    }
  })

  test('normaliza la ruta', () => {
    assert.equal(normalizarRuta('/personas/'), '/personas')
    assert.equal(normalizarRuta('/empresas?x=1#y'), '/empresas')
    assert.equal(normalizarRuta(''), '/')
  })

  test('las privadas no se indexan y la canónica va a la portada', () => {
    assert.equal(esPrivada('/panel/historial'), true)
    assert.equal(esPrivada('/simulacion/abc'), true)
    assert.equal(esPrivada('/personas'), false)
    assert.equal(esPrivada('/panelito'), false)
    assert.deepEqual(
      [metaDe('/panel').indexar, metaDe('/panel').canonica],
      [false, `${SITIO}/`],
    )
    assert.equal(metaDe('/empresas/').canonica, `${SITIO}/empresas`)
    assert.equal(metaDe('/').canonica, `${SITIO}/`)
  })

  test('el sitemap y el robots publicados coinciden con la lista', () => {
    const publicado = readFileSync(new URL('../../public/sitemap.xml', import.meta.url), 'utf8')
    const fecha = publicado.match(/<lastmod>([^<]+)<\/lastmod>/)[1]
    assert.equal(publicado, sitemap(fecha))
    assert.equal(readFileSync(new URL('../../public/robots.txt', import.meta.url), 'utf8'), robots())
    assert.match(robots(), /Disallow: \/panel\//)
  })
})
