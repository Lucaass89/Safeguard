import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { leerUltimaVersion, necesitaActualizar, nombreDescarga } from './actualizarApp.js'

const valida = { version: 3, nombre: '1.3', archivo: '/app/safeguard-1.3.apk', novedades: 'Avisos.' }

describe('actualizar la app', () => {
  test('acepta un aviso de versión bien armado', () => {
    assert.deepEqual(leerUltimaVersion(valida), valida)
    assert.equal(leerUltimaVersion({ ...valida, novedades: 3 }).novedades, '')
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
