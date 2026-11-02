import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { REGRESIONES, typosquats } from '../../eval/casos.js'
import { evaluar, leerUmbrales, verificarUmbrales } from '../../eval/evaluar.js'
import { analizar } from './analisis.js'

describe('regresiones', () => {
  for (const { url, nivel, marca } of REGRESIONES) {
    test(`${JSON.stringify(url)} queda en ${nivel} e imita a ${marca}`, () => {
      const resultado = analizar(url)
      assert.equal(resultado.nivel, nivel)
      assert.equal(resultado.parecido?.marca, marca)
    })
  }
})

describe('regla dura', () => {
  test('ningún typosquat generado sobre la lista de marcas sale como Sin señales', () => {
    const verdes = typosquats().filter(({ url }) => {
      const resultado = analizar(url)
      return !resultado || resultado.nivel === 'verde'
    })
    assert.deepEqual(
      verdes.map(({ url }) => url),
      [],
    )
  })
})

describe('set de evaluación', () => {
  const resultado = evaluar()

  test('cumple los umbrales guardados', () => {
    assert.deepEqual(verificarUmbrales(resultado, leerUmbrales()), [])
  })

  test('una tasa peor que el umbral hace fallar la verificación', () => {
    const estricto = { falsosPositivosMax: 0, deteccionMin: 1, maliciososSinVerificarMax: 0 }
    assert.equal(verificarUmbrales(resultado, estricto).length, 3)
  })

  test('cada veredicto con puntos dice qué señal los sumó', () => {
    const sinSenal = resultado.filas.filter((fila) => fila.puntuacion > 0 && fila.senales.length === 0)
    assert.deepEqual(
      sinSenal.map((fila) => fila.url),
      [],
    )
  })
})

describe('señales nuevas del set', () => {
  test('una marca que es palabra común cuenta si viene escrita con trucos', () => {
    assert.equal(analizar('https://c1aro.com.ar/').parecido?.marca, 'claro')
    assert.equal(analizar('https://rnacro.com.ar/').parecido?.marca, 'macro')
    assert.equal(analizar('https://claro.com.ar/').nivel, 'verde')
    assert.equal(analizar('https://www.lanacion.com.ar/').nivel, 'verde')
  })

  test('se compara también la forma literal del nombre', () => {
    assert.equal(analizar('https://narnjax.com/').parecido?.marca, 'naranjax')
    assert.equal(analizar('https://ofice365.com/').parecido?.marca, 'microsoft')
  })

  test('las coordenadas de Google Maps no cuentan como una arroba sospechosa', () => {
    const mapa = analizar('https://www.google.com/maps/place/Obelisco/@-34.6037389,-58.3815704,17z')
    assert.equal(mapa.nivel, 'verde')
    assert.ok(analizar('https://sitio-ejemplo.com/ingresar/@evil.com/').senales.some((senal) => senal.id === 'arroba_en_camino'))
  })
})
