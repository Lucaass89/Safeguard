import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cuitValido,
  empresaDesdeOrganizacion,
  formatoCuit,
  guardarBorrador,
  leerAreas,
  leerBorrador,
  validarEmpresa,
} from './datosEmpresa.js'

const base = {
  nombre_empresa: '  Colegio   San Martín ',
  tipo_organizacion: 'educativa',
  cuit: '',
  contacto_nombre: 'Ana Pérez',
  contacto_cargo: 'Directora',
  contacto_email: ' Ana@Colegio.edu.ar ',
  contacto_telefono: '+54 11 4567-8900',
  areas: 'Administración, Docentes, administración',
}

test('acepta un CUIT con el dígito verificador correcto', () => {
  assert.equal(cuitValido('20-12345678-6'), true)
  assert.equal(cuitValido('30712345671'), true)
  assert.equal(formatoCuit('30712345671'), '30-71234567-1')
})

test('rechaza un CUIT con otro dígito, otro largo o un prefijo que no existe', () => {
  assert.equal(cuitValido('20-12345678-5'), false)
  assert.equal(cuitValido('2012345678'), false)
  assert.equal(cuitValido('99-12345678-0'), false)
  assert.equal(cuitValido(''), false)
})

test('deja las áreas sin repetir, sin importar mayúsculas ni separador', () => {
  assert.deepEqual(leerAreas('Ventas; ventas\nSistemas , , Ventas'), ['Ventas', 'Sistemas'])
  assert.deepEqual(leerAreas(['  RRHH ', 'rrhh', 'Legales']), ['RRHH', 'Legales'])
})

test('normaliza los datos de una empresa válida', () => {
  const { datos, valido, errores } = validarEmpresa(base)
  assert.equal(valido, true, JSON.stringify(errores))
  assert.equal(datos.nombre_empresa, 'Colegio San Martín')
  assert.equal(datos.contacto_email, 'ana@colegio.edu.ar')
  assert.deepEqual(datos.areas, ['Administración', 'Docentes'])
  assert.equal(datos.cuit, '')
})

test('marca cada campo obligatorio que falta', () => {
  const { valido, errores } = validarEmpresa({})
  assert.equal(valido, false)
  assert.ok(errores.nombre_empresa)
  assert.ok(errores.tipo_organizacion)
  assert.ok(errores.contacto_nombre)
  assert.ok(errores.contacto_email)
  assert.equal(errores.cuit, undefined)
  assert.equal(errores.contacto_telefono, undefined)
})

test('rechaza un CUIT mal escrito, un teléfono con letras y texto que arranca como fórmula', () => {
  const { errores } = validarEmpresa({
    ...base,
    nombre_empresa: '=HYPERLINK("x")',
    cuit: '20-12345678-5',
    contacto_telefono: 'llamame',
    areas: ['@Ventas'],
  })
  assert.ok(errores.nombre_empresa)
  assert.ok(errores.cuit)
  assert.ok(errores.contacto_telefono)
  assert.ok(errores.areas)
})

test('no acepta más de 30 áreas', () => {
  const areas = Array.from({ length: 31 }, (_, i) => `Área ${i + 1}`)
  assert.ok(validarEmpresa({ ...base, areas }).errores.areas)
})

test('arma el formulario desde la organización guardada', () => {
  const form = empresaDesdeOrganizacion(
    { nombre_empresa: 'Acme SRL', tipo_organizacion: 'pyme', cuit: '30712345671', contacto_nombre: 'Juan' },
    [{ nombre: 'Ventas' }, { nombre: 'Sistemas' }],
    'juan@acme.com',
  )
  assert.equal(form.nombre_empresa, 'Acme SRL')
  assert.equal(form.cuit, '30-71234567-1')
  assert.equal(form.contacto_email, 'juan@acme.com')
  assert.equal(form.areas, 'Ventas, Sistemas')
})

test('no muestra el nombre provisorio de las organizaciones creadas sin datos', () => {
  const form = empresaDesdeOrganizacion({ nombre_empresa: 'Prueba PhishGuard' }, [], 'ana@x.com')
  assert.equal(form.nombre_empresa, '')
  assert.equal(form.contacto_email, 'ana@x.com')
})

test('guarda y recupera el borrador, y no rompe si el almacenamiento falla', () => {
  const datos = new Map()
  const lugar = { getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, v) }
  guardarBorrador({ nombre_empresa: 'Acme', areas: 'Ventas', extra: 'x' }, lugar)
  const borrador = leerBorrador(lugar)
  assert.equal(borrador.nombre_empresa, 'Acme')
  assert.equal(borrador.areas, 'Ventas')
  assert.equal(borrador.extra, undefined)
  const roto = { getItem() { throw new Error('no') }, setItem() { throw new Error('no') } }
  assert.equal(leerBorrador(roto), null)
  assert.doesNotThrow(() => guardarBorrador({}, roto))
})
