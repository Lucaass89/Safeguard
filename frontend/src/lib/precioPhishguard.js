export const TRAMOS = [
  { desde: 1, hasta: 100, centavos: 100 },
  { desde: 101, hasta: 300, centavos: 85 },
  { desde: 301, hasta: 600, centavos: 70 },
  { desde: 601, hasta: Infinity, centavos: 55 },
]

export const MINIMO_CENTAVOS = 2500
export const PESOS_POR_DOLAR = 1500
export const MIN_PERSONAS = 1
export const MAX_PERSONAS = 10000
export const PERSONAS_POR_DEFECTO = 25

export function leerPersonas(valor) {
  const texto = String(valor ?? '').trim()
  if (!/^\d{1,6}$/.test(texto)) return null
  const numero = Number(texto)
  if (numero < MIN_PERSONAS || numero > MAX_PERSONAS) return null
  return numero
}

export function tramoDe(personas) {
  return TRAMOS.find((tramo) => personas >= tramo.desde && personas <= tramo.hasta) ?? null
}

export function precioPhishguard(personas) {
  const cantidad = leerPersonas(personas)
  if (cantidad === null) return null
  const tramo = tramoDe(cantidad)
  const subtotal = cantidad * tramo.centavos
  const totalCentavos = Math.max(subtotal, MINIMO_CENTAVOS)
  return {
    personas: cantidad,
    tramo,
    porPersonaUsd: tramo.centavos / 100,
    subtotalUsd: subtotal / 100,
    totalUsd: totalCentavos / 100,
    aplicaMinimo: subtotal < MINIMO_CENTAVOS,
    totalPesos: (totalCentavos * PESOS_POR_DOLAR) / 100,
  }
}

export function formatoUsd(valor) {
  return `USD ${valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatoPesos(valor) {
  return `$ ${valor.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
}

export function etiquetaTramo(tramo) {
  if (tramo.hasta === Infinity) return `Más de ${tramo.desde - 1} personas`
  return `${tramo.desde} a ${tramo.hasta} personas`
}

export const MARGEN_PORCENTAJE = 10

export function limitePersonas(contratados) {
  const cupo = leerPersonas(contratados) ?? PERSONAS_POR_DEFECTO
  return Math.floor((cupo * (100 + MARGEN_PORCENTAJE) + 99) / 100)
}

export function estadoPlan(contratados, empleados) {
  const activos = (empleados ?? []).filter((persona) => persona?.estado === 'activo').length
  const guardado = leerPersonas(contratados)
  const cupo = guardado ?? PERSONAS_POR_DEFECTO
  const limite = limitePersonas(cupo)
  return {
    contratados: cupo,
    porDefecto: guardado === null,
    activos,
    limite,
    lugares: Math.max(limite - activos, 0),
    excede: activos > cupo,
    lleno: activos >= limite,
    sugerido: Math.max(activos, cupo, MIN_PERSONAS),
    precio: precioPhishguard(cupo),
  }
}

export function puedeActivar(plan, cantidad) {
  return cantidad <= plan.lugares
}
