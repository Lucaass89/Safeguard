export const UMBRAL_VISIBLE = 0.5

export function modoReproduccion({ puedeApuntar, movimientoReducido }) {
  if (movimientoReducido) return 'boton'
  return puedeApuntar ? 'apuntar' : 'pantalla'
}

export function leerModo(ventana = globalThis.window) {
  if (typeof ventana?.matchMedia !== 'function') return 'boton'
  return modoReproduccion({
    puedeApuntar: ventana.matchMedia('(hover: hover) and (pointer: fine)').matches,
    movimientoReducido: ventana.matchMedia('(prefers-reduced-motion: reduce)').matches,
  })
}

export function debeAndar({ modo, visible = false, pedido = false, pausado = false }) {
  if (pausado || !visible) return false
  return modo !== 'boton' || pedido
}

export function elementoVisible(elementos, estilo = (el) => globalThis.getComputedStyle(el)) {
  return elementos.find((el) => el && estilo(el).display !== 'none') ?? null
}
