import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  estadoPlan,
  etiquetaTramo,
  limitePersonas,
  puedeActivar,
  formatoPesos,
  formatoUsd,
  leerPersonas,
  precioPhishguard,
  tramoDe,
} from './precioPhishguard.js'

test('cada cantidad cae en el tramo publicado', () => {
  assert.equal(tramoDe(1).centavos, 100)
  assert.equal(tramoDe(100).centavos, 100)
  assert.equal(tramoDe(101).centavos, 85)
  assert.equal(tramoDe(300).centavos, 85)
  assert.equal(tramoDe(301).centavos, 70)
  assert.equal(tramoDe(600).centavos, 70)
  assert.equal(tramoDe(601).centavos, 55)
  assert.equal(tramoDe(5000).centavos, 55)
})

test('con pocas personas se cobra el mínimo de USD 25', () => {
  const precio = precioPhishguard(10)
  assert.equal(precio.subtotalUsd, 10)
  assert.equal(precio.totalUsd, 25)
  assert.equal(precio.aplicaMinimo, true)
  assert.equal(precio.totalPesos, 37500)
})

test('con 25 personas el total es justo el mínimo', () => {
  const precio = precioPhishguard(25)
  assert.equal(precio.totalUsd, 25)
  assert.equal(precio.aplicaMinimo, false)
  assert.equal(precio.totalPesos, 37500)
})

test('toda la organización paga la tarifa del tramo en el que cae', () => {
  assert.equal(precioPhishguard(100).totalUsd, 100)
  assert.equal(precioPhishguard(101).totalUsd, 85.85)
  assert.equal(precioPhishguard(150).totalUsd, 127.5)
  assert.equal(precioPhishguard(400).totalUsd, 280)
  assert.equal(precioPhishguard(1000).totalUsd, 550)
})

test('pasa a pesos con USD 1 igual a ARS 1.500 sin errores de redondeo', () => {
  assert.equal(precioPhishguard(150).totalPesos, 191250)
  assert.equal(precioPhishguard(101).totalPesos, 128775)
  assert.equal(precioPhishguard(333).totalPesos, 349650)
})

test('rechaza cantidades que no son un número entero de personas', () => {
  assert.equal(leerPersonas(''), null)
  assert.equal(leerPersonas('0'), null)
  assert.equal(leerPersonas('-5'), null)
  assert.equal(leerPersonas('2.5'), null)
  assert.equal(leerPersonas('abc'), null)
  assert.equal(leerPersonas('10001'), null)
  assert.equal(leerPersonas(' 42 '), 42)
  assert.equal(leerPersonas(42), 42)
  assert.equal(precioPhishguard('cero'), null)
})

test('muestra los montos y los tramos en formato argentino', () => {
  assert.equal(formatoUsd(127.5), 'USD 127,50')
  assert.equal(formatoPesos(191250), '$ 191.250')
  assert.equal(etiquetaTramo(tramoDe(150)), '101 a 300 personas')
  assert.equal(etiquetaTramo(tramoDe(700)), 'Más de 600 personas')
})

test('el límite deja un 10 % por encima de lo contratado, redondeado hacia arriba', () => {
  assert.equal(limitePersonas(1), 2)
  assert.equal(limitePersonas(10), 11)
  assert.equal(limitePersonas(25), 28)
  assert.equal(limitePersonas(100), 110)
  assert.equal(limitePersonas(150), 165)
  assert.equal(limitePersonas(333), 367)
  assert.equal(limitePersonas(null), 28)
})

test('el plan cuenta solo a las personas activas contra lo contratado y el límite', () => {
  const equipo = [
    { estado: 'activo' },
    { estado: 'activo' },
    { estado: 'activo' },
    { estado: 'inactivo' },
    { estado: 'pendiente_aprobacion' },
  ]
  const holgado = estadoPlan(5, equipo)
  assert.equal(holgado.activos, 3)
  assert.equal(holgado.limite, 6)
  assert.equal(holgado.lugares, 3)
  assert.equal(holgado.excede, false)
  assert.equal(holgado.lleno, false)
  assert.equal(holgado.precio.totalUsd, 25)

  const enMargen = estadoPlan(2, equipo)
  assert.equal(enMargen.limite, 3)
  assert.equal(enMargen.excede, true)
  assert.equal(enMargen.lleno, true)
  assert.equal(enMargen.lugares, 0)
  assert.equal(enMargen.sugerido, 3)
})

test('sin cantidad guardada el plan cuenta como 25 personas', () => {
  const plan = estadoPlan(null, [{ estado: 'activo' }, { estado: 'activo' }])
  assert.equal(plan.contratados, 25)
  assert.equal(plan.porDefecto, true)
  assert.equal(plan.limite, 28)
  assert.equal(plan.lugares, 26)
  assert.equal(plan.sugerido, 25)
})

test('solo deja activar a tantas personas como lugares queden', () => {
  const plan = estadoPlan(10, Array.from({ length: 9 }, () => ({ estado: 'activo' })))
  assert.equal(plan.lugares, 2)
  assert.equal(puedeActivar(plan, 2), true)
  assert.equal(puedeActivar(plan, 3), false)
})
