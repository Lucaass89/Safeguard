import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analizarWhatsapp, extraerNumeros, sinCbu } from './analisisWhatsapp.js'

const CBU = '0000003100012345678901'

test('un CBU no se toma como un teléfono del exterior', () => {
  const resultado = analizarWhatsapp(`Hola ma, cambié de número. Transferime $85.000 urgente. CBU ${CBU}`)
  assert.ok(!resultado.motivos.some((m) => m.includes('no parece de Argentina')))
  assert.ok(resultado.motivos.some((m) => m.includes('CBU')))
  assert.deepEqual(resultado.numeros, [])
  assert.equal(resultado.nivel, 'rojo')
})

test('un CBU escrito con espacios o guiones tampoco cuenta como teléfono', () => {
  assert.deepEqual(extraerNumeros('Pasá a 0000 0031 0001 2345 6789 01'), [])
  assert.deepEqual(extraerNumeros('Pasá a 00000031-00012345678901'), [])
})

test('un CBU sin la palabra CBU sigue marcándose por su largo', () => {
  const resultado = analizarWhatsapp(`Depositá en ${CBU} hoy`)
  assert.ok(resultado.motivos.some((m) => m.includes('22 dígitos')))
  assert.ok(!resultado.motivos.some((m) => m.includes('no parece de Argentina')))
})

test('los teléfonos del exterior se siguen detectando, aunque haya un CBU al lado', () => {
  const resultado = analizarWhatsapp(`Escribime al +1 (555) 201-4433 y pasá a CBU ${CBU}`)
  assert.deepEqual(resultado.numeros, ['+1 (555) 201-4433'])
  assert.ok(resultado.motivos.some((m) => m.includes('+1 (555) 201-4433 no parece de Argentina')))
})

test('los teléfonos de Argentina no se marcan', () => {
  const resultado = analizarWhatsapp('Llamame al +54 9 11 2345-6789')
  assert.deepEqual(resultado.numeros, [])
})

test('un número de más de 15 dígitos no es un teléfono', () => {
  assert.deepEqual(extraerNumeros('Pedido 12345678901234567'), [])
})

test('sinCbu deja intacto el resto del texto', () => {
  assert.equal(sinCbu('Llamá al 011 4321-5678'), 'Llamá al 011 4321-5678')
  assert.equal(sinCbu(`CBU ${CBU} ya`).replace(/\s+/g, ' '), 'CBU ya')
})
