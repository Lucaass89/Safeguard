import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { analizarWhatsapp, extraerNumeros, sinCbu } from './analisisWhatsapp.js'

const CBU = '0000003100012345678901'

describe('un CBU o un CVU no se toma como número de teléfono', () => {
  for (const texto of [
    `CBU ${CBU}`,
    `CVU: ${CBU}`,
    `cbu nº ${CBU}`,
    `Pasá a ${CBU}`,
    'CBU 0000 0031 0001 2345 6789 01',
    'CVU 00000031-00012345678901',
  ]) {
    test(texto, () => {
      assert.deepEqual(extraerNumeros(texto), [])
    })
  }

  test('el ejemplo del hijo que cambió de número no culpa a un número extranjero', () => {
    const resultado = analizarWhatsapp(
      `Hola ma, cambié de número. Transferime $85.000 urgente. CBU ${CBU}`,
    )
    assert.ok(!resultado.motivos.some((m) => m.includes('no parece de Argentina')))
    assert.deepEqual(resultado.numeros, [])
    assert.ok(resultado.motivos.some((m) => m.includes('CBU')))
    assert.equal(resultado.nivel, 'rojo')
  })

  test('sin la palabra CBU, los 22 dígitos siguen contando como CBU y no como teléfono', () => {
    const resultado = analizarWhatsapp(`Transferí a ${CBU} ya`)
    assert.deepEqual(resultado.numeros, [])
    assert.ok(resultado.motivos.some((m) => m.includes('22 dígitos')))
  })
})

describe('los teléfonos se siguen detectando', () => {
  test('un número extranjero junto a un CBU se marca igual', () => {
    const resultado = analizarWhatsapp(`Escribime al +1 555 123 4567. CBU ${CBU}`)
    assert.equal(resultado.numeros.length, 1)
    assert.ok(resultado.numeros[0].startsWith('+1'))
  })

  test('un número argentino no se marca', () => {
    const resultado = analizarWhatsapp('Llamame al +54 9 11 2345 6789')
    assert.deepEqual(resultado.numeros, [])
  })

  test('una tira de más de 22 dígitos no se borra como CBU', () => {
    assert.equal(sinCbu('12345678901234567890123'), '12345678901234567890123')
  })

  test('no se come un CBU del medio de una tira más larga', () => {
    const texto = `9${CBU}`
    assert.equal(sinCbu(texto), texto)
  })
})
