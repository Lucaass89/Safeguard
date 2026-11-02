import assert from 'node:assert/strict'
import { test } from 'node:test'
import { nombreEmpresa } from './formato.js'

test('pone mayúscula inicial a un nombre cargado en minúscula', () => {
  assert.equal(nombreEmpresa('safeguard'), 'Safeguard')
  assert.equal(nombreEmpresa('  colegio   san martín '), 'Colegio San Martín')
  assert.equal(nombreEmpresa('escuela de la costa'), 'Escuela de la Costa')
})

test('respeta las mayúsculas que eligió quien lo cargó', () => {
  assert.equal(nombreEmpresa('SafeGuard'), 'SafeGuard')
  assert.equal(nombreEmpresa('YPF'), 'YPF')
  assert.equal(nombreEmpresa('acme SRL'), 'acme SRL')
})

test('devuelve vacío si no hay nombre', () => {
  assert.equal(nombreEmpresa(''), '')
  assert.equal(nombreEmpresa('   '), '')
  assert.equal(nombreEmpresa(null), '')
})
