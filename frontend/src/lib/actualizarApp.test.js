import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { leerUltimaVersion, necesitaActualizar, nombreDescarga, nombreInstalada, textoVersion } from './actualizarApp.js'

const valida = { version: 3, nombre: '1.3', archivo: '/app/safeguard-1.3.apk', novedades: 'Avisos.', desinstalar: false }

describe('actualizar la app', () => {
  test('acepta un aviso de versión bien armado', () => {
    assert.deepEqual(leerUltimaVersion(valida), valida)
    assert.equal(leerUltimaVersion({ ...valida, novedades: 3 }).novedades, '')
    assert.equal(leerUltimaVersion({ ...valida, desinstalar: true }).desinstalar, true)
    assert.equal(leerUltimaVersion({ ...valida, desinstalar: 'si' }).desinstalar, false)
  })

  test('rechaza lo raro', () => {
    assert.equal(leerUltimaVersion(null), null)
    assert.equal(leerUltimaVersion({ ...valida, version: '3' }), null)
    assert.equal(leerUltimaVersion({ ...valida, nombre: 'nueva' }), null)
    assert.equal(leerUltimaVersion({ ...valida, archivo: 'https://otro.sitio/app.apk' }), null)
    assert.equal(leerUltimaVersion({ ...valida, archivo: '/app/../secreto.apk' }), null)
  })

  test('pide actualizar solo a una app más vieja', () => {
    assert.equal(necesitaActualizar(2, valida), true)
    assert.equal(necesitaActualizar(3, valida), false)
    assert.equal(necesitaActualizar(4, valida), false)
    assert.equal(necesitaActualizar(0, valida), false)
    assert.equal(necesitaActualizar(2, null), false)
  })

  test('el nombre del archivo lleva la versión', () => {
    assert.equal(nombreDescarga(valida), 'SafeGuard-1.3.apk')
  })

  test('el archivo publicado es válido y existe', () => {
    const publicado = JSON.parse(readFileSync(new URL('../../public/app/version.json', import.meta.url), 'utf8'))
    const ultima = leerUltimaVersion(publicado)
    assert.ok(ultima)
    assert.ok(readFileSync(new URL(`../../public${ultima.archivo}`, import.meta.url)).length > 100000)
  })
})

describe('qué versión tenés', () => {
  test('nombra la versión instalada', () => {
    assert.equal(nombreInstalada(2), '1.1 o 1.2')
    assert.equal(nombreInstalada(4), '1.4')
    assert.equal(nombreInstalada(7), '7')
    assert.equal(nombreInstalada(0), 'desconocida')
  })

  test('explica el estado', () => {
    assert.match(textoVersion({ instalada: 3, ultima: null, estado: 'consultando' }), /^Tenés la 1\.3\. Buscando/)
    assert.match(textoVersion({ instalada: 3, ultima: null, estado: 'error' }), /No pudimos ver/)
    assert.match(textoVersion({ instalada: 3, ultima: valida, estado: 'lista' }), /^Tenés la 1\.3\. Es la última\.$/)
    assert.match(textoVersion({ instalada: 2, ultima: valida, estado: 'lista' }), /Hay una nueva: 1\.3\. Avisos\./)
  })
})
