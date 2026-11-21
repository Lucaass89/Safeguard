const TRAMOS = [
  { hasta: 100, centavos: 100 },
  { hasta: 300, centavos: 85 },
  { hasta: 600, centavos: 70 },
  { hasta: Infinity, centavos: 55 },
]

const MINIMO_CENTAVOS = 2500
const PESOS_POR_DOLAR = 1500
const MAX_PERSONAS = 10000

export const PRECIO_ANTERIOR = 37500
export const PERSONAS_PRECIO_ANTERIOR = 25

export function leerPersonas(valor: unknown): number | null {
  const texto = String(valor ?? '').trim()
  if (!/^\d{1,6}$/.test(texto)) return null
  const numero = Number(texto)
  if (numero < 1 || numero > MAX_PERSONAS) return null
  return numero
}

export function precioPesos(personas: number): number {
  const tramo = TRAMOS.find((t) => personas <= t.hasta) ?? TRAMOS[TRAMOS.length - 1]
  const totalCentavos = Math.max(personas * tramo.centavos, MINIMO_CENTAVOS)
  return (totalCentavos * PESOS_POR_DOLAR) / 100
}

export function referencia(usuarioId: string, personas: number): string {
  return `${usuarioId}|${personas}`
}

export function personasDeReferencia(valor: unknown, usuarioId: string): number | null {
  if (typeof valor !== 'string') return null
  if (valor === usuarioId) return PERSONAS_PRECIO_ANTERIOR
  const [id, cantidad, ...resto] = valor.split('|')
  if (id !== usuarioId || resto.length) return null
  return leerPersonas(cantidad)
}
