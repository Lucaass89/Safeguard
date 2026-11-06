const MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'en'])

export function nombreEmpresa(texto) {
  const limpio = typeof texto === 'string' ? texto.trim().replace(/\s+/g, ' ') : ''
  if (!limpio || limpio !== limpio.toLowerCase()) return limpio
  return limpio
    .split(' ')
    .map((palabra, indice) =>
      indice > 0 && MENORES.has(palabra) ? palabra : palabra.charAt(0).toUpperCase() + palabra.slice(1),
    )
    .join(' ')
}
