export function puntosLinea(valores, { ancho, alto, maximo, izquierda = 0, arriba = 0 }) {
  if (!Array.isArray(valores) || valores.length === 0 || !(maximo > 0)) return []
  const paso = valores.length > 1 ? ancho / (valores.length - 1) : 0
  return valores.map((valor, indice) => {
    const acotado = Math.min(Math.max(Number(valor) || 0, 0), maximo)
    return {
      x: Math.round((izquierda + paso * indice) * 10) / 10,
      y: Math.round((arriba + alto - (acotado / maximo) * alto) * 10) / 10,
    }
  })
}

export function caminoLinea(puntos) {
  return puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
}

export function caminoArea(puntos, base) {
  if (puntos.length === 0) return ''
  const primero = puntos[0]
  const ultimo = puntos[puntos.length - 1]
  return `${caminoLinea(puntos)} L${ultimo.x} ${base} L${primero.x} ${base} Z`
}

export function marcasEje(maximo, cantidad = 3) {
  if (!(maximo > 0) || cantidad < 2) return [0]
  const paso = maximo / (cantidad - 1)
  return Array.from({ length: cantidad }, (_, i) => Math.round(paso * i))
}

export function porcentaje(parte, total) {
  if (!(total > 0)) return 0
  return Math.round((parte / total) * 100)
}
