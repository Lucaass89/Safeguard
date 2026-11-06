const CLAVE = 'sg-fragmentos'
const MAXIMO = 100
export const LARGO = 80

export function recortar(texto) {
  const plano = (texto ?? '').replace(/\s+/g, ' ').trim()
  if (plano.length <= LARGO) return plano
  const corte = plano.slice(0, LARGO)
  const espacio = corte.lastIndexOf(' ')
  return `${(espacio > LARGO / 2 ? corte.slice(0, espacio) : corte).replace(/[\s.,;:]+$/, '')}…`
}

function leer() {
  try {
    const guardados = JSON.parse(localStorage.getItem(CLAVE) ?? '{}')
    return guardados && typeof guardados === 'object' ? guardados : {}
  } catch {
    return {}
  }
}

export function guardarFragmento(id, texto) {
  const fragmento = recortar(texto)
  if (!id || !fragmento) return
  const guardados = leer()
  delete guardados[id]
  guardados[id] = fragmento
  const claves = Object.keys(guardados)
  for (const vieja of claves.slice(0, Math.max(0, claves.length - MAXIMO))) delete guardados[vieja]
  try {
    localStorage.setItem(CLAVE, JSON.stringify(guardados))
  } catch {
    void 0
  }
}

export function leerFragmento(id) {
  return leer()[id] ?? null
}
