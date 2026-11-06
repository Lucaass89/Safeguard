export const PUNTAJE = {
  umbrales: { precaucion: 20, peligroso: 55 },
  topes: { palabras: 15, debiles: 30 },
  marca: { pesoEvidente: 55, pesoDudoso: 35, largoEvidente: 9, pesoEnRutaConContexto: 55, pesoEnRuta: 25 },
  punycode: { peso: 10 },
  edad: { recienteDias: 30, muyRecienteDias: 7, pesoReciente: 25, pesoMuyReciente: 45 },
  virustotal: { motoresMedia: 1, motoresFuerte: 5, pesoMedia: 25, pesoFuerte: 60 },
}

export const FUERZAS = ['fuerte', 'media', 'debil']

export function nuevaSenal({ id, grupo, peso, texto, fuerza }) {
  return { id, grupo, fuerza, peso, puntos: peso, texto }
}

export function habilitaPeligroso(senales) {
  const activas = (senales ?? []).filter((senal) => senal.puntos > 0)
  if (activas.some((senal) => senal.fuerza === 'fuerte')) return true
  return new Set(activas.filter((senal) => senal.fuerza === 'media').map((senal) => senal.grupo)).size >= 2
}

export function puntajeFinal(puntos, senales, umbrales = PUNTAJE.umbrales) {
  const tope = habilitaPeligroso(senales) ? 100 : umbrales.peligroso - 1
  return Math.min(100, tope, puntos)
}

export function nivelPorPuntaje(puntos, sinVerificar = false, umbrales = PUNTAJE.umbrales) {
  if (puntos >= umbrales.peligroso) return 'rojo'
  if (puntos >= umbrales.precaucion) return 'amarillo'
  return sinVerificar ? 'gris' : 'verde'
}

export function usadoEnGrupo(senales, grupo) {
  return (senales ?? [])
    .filter((senal) => senal.grupo === grupo && !senal.origen)
    .reduce((total, senal) => total + senal.puntos, 0)
}

export function pesoConTope(peso, grupo, senales, topes = PUNTAJE.topes) {
  if (!(grupo in topes)) return peso
  return Math.max(0, Math.min(peso, topes[grupo] - usadoEnGrupo(senales, grupo)))
}
