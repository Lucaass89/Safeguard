import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { armarReporteError, claveReporte } from './reporteError.js'

const caso = {
  nivel: 'amarillo',
  url: 'https://www.ejemplo.com.ar/ingresar?token=abc123&dni=30111222#paso-2',
  dominio: 'Ejemplo.com.ar',
  canal: 'enlace',
  motivos: ['El nombre "ejemplo" se parece a algo. Otra frase.'],
}

describe('reportar un error', () => {
  test('la dirección sale sin la consulta ni el fragmento', () => {
    const datos = armarReporteError(caso, 'legitimo', '')
    assert.equal(datos.p_url, 'https://www.ejemplo.com.ar/ingresar')
    assert.equal(datos.p_dominio, 'ejemplo.com.ar')
    assert.equal(datos.p_nivel, 'amarillo')
    assert.equal(datos.p_esperado, 'legitimo')
    assert.equal(datos.p_comentario, null)
    assert.deepEqual(datos.p_motivos, ['El nombre "ejemplo" se parece a algo.', 'Otra frase.'])
  })

  test('el contenido de un QR que no es web no se manda', () => {
    assert.equal(armarReporteError({ ...caso, url: 'WIFI:T:WPA;S:Casa;P:clave;;', canal: 'qr' }, 'otro').p_url, 'wifi:')
    assert.equal(armarReporteError({ ...caso, url: 'hola, mi clave es 1234' }, 'otro').p_url, null)
    assert.equal(armarReporteError({ ...caso, dominio: 'Un código que abre otra app' }, 'otro').p_dominio, null)
  })

  test('sin elegir qué está mal, o con un nivel raro, no arma nada', () => {
    assert.equal(armarReporteError(caso, ''), null)
    assert.equal(armarReporteError({ ...caso, nivel: 'seguro' }, 'legitimo'), null)
  })

  test('recorta el comentario y usa un canal válido', () => {
    const datos = armarReporteError({ ...caso, canal: 'raro' }, 'peligroso', `  ${'x'.repeat(900)}  `)
    assert.equal(datos.p_comentario.length, 500)
    assert.equal(datos.p_canal, 'enlace')
  })

  test('un resultado nuevo cambia la clave del formulario', () => {
    assert.notEqual(claveReporte(caso), claveReporte({ ...caso, nivel: 'rojo' }))
  })
})
