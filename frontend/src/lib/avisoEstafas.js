export function fechaDeEdicion(fuente) {
  const hallada = /fecha:\s*'(\d{4}-\d{2}-\d{2})'/.exec(fuente ?? '')
  return hallada ? hallada[1] : null
}

export function hayEdicionNueva(anterior, actual) {
  return Boolean(actual) && actual !== anterior
}

export function avisoEstafas(edicion) {
  const estafas = edicion?.estafas ?? []
  if (estafas.length === 0) return null
  const primera = estafas[0].titulo
  const resto = estafas.length - 1
  return {
    titulo: 'Estafas de la semana',
    texto: resto > 0 ? `${primera} y ${resto} más. Mirá cómo reconocerlas.` : `${primera}. Mirá cómo reconocerla.`,
    ruta: '/',
  }
}
