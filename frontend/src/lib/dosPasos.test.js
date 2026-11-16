import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  codigoValido,
  estadoDosPasos,
  factoresSinTerminar,
  factoresVerificados,
  limpiarCodigo,
  mensajeError,
  secretoLegible,
} from './dosPasos.js'

const verificado = { id: 'a', factor_type: 'totp', status: 'verified' }
const pendiente = { id: 'b', factor_type: 'totp', status: 'unverified' }

test('sin factor verificado hay que activarla, aunque haya uno a medio configurar', () => {
  assert.equal(estadoDosPasos({ nivel: 'aal1', factores: { all: [], totp: [] } }), 'activar')
  assert.equal(estadoDosPasos({ nivel: 'aal1', factores: { all: [pendiente], totp: [] } }), 'activar')
  assert.equal(estadoDosPasos({ nivel: 'aal1', factores: null }), 'activar')
})

test('con factor verificado pide el código hasta que la sesión pase al segundo nivel', () => {
  const factores = { all: [verificado], totp: [verificado] }
  assert.equal(estadoDosPasos({ nivel: 'aal1', factores }), 'codigo')
  assert.equal(estadoDosPasos({ nivel: 'aal2', factores }), 'listo')
})

test('separa los factores verificados de los que quedaron sin terminar', () => {
  const factores = { all: [verificado, pendiente, { id: 'c', factor_type: 'phone', status: 'verified' }] }
  assert.deepEqual(factoresVerificados(factores).map((f) => f.id), ['a'])
  assert.deepEqual(factoresSinTerminar(factores).map((f) => f.id), ['b'])
})

test('el código tiene seis números y se limpia lo que no es número', () => {
  assert.equal(limpiarCodigo('123 456'), '123456')
  assert.equal(limpiarCodigo('12a3-45678'), '123456')
  assert.equal(codigoValido('123456'), true)
  assert.equal(codigoValido('123 456'), true)
  assert.equal(codigoValido('12345'), false)
  assert.equal(codigoValido('abcdef'), false)
  assert.equal(codigoValido(null), false)
})

test('la clave para cargar a mano se muestra en grupos de cuatro', () => {
  assert.equal(secretoLegible('ABCDEFGHIJKL'), 'ABCD EFGH IJKL')
  assert.equal(secretoLegible(''), '')
})

test('los errores se explican en criollo', () => {
  assert.match(mensajeError({ code: 'mfa_verification_failed' }), /no es correcto/)
  assert.match(mensajeError({ message: 'Too many requests' }), /Esperá un minuto/)
  assert.match(mensajeError({ code: 'mfa_totp_enroll_not_enabled' }), /no está habilitada/)
  assert.match(mensajeError(null), /Probá de nuevo/)
})
