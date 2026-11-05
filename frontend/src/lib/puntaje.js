// Todo lo que decide cuánto pesa cada cosa está acá, para poder ajustarlo y medirlo con la evaluación.
export const PUNTAJE = {
  // Desde cuántos puntos se pasa a Precaución y a Peligroso.
  umbrales: { precaucion: 20, peligroso: 55 },
  // Señales que se solapan cuentan como un solo grupo: juntas no suman más que esto.
  topes: { palabras: 15, debiles: 30 },
  // Una imitación evidente (letras cambiadas, otro alfabeto, la marca como subdominio o una marca de nombre largo)
  // alcanza sola para Peligroso. La lista de oficiales está incompleta (amazon.de, google.co.uk) y las marcas cortas
  // se parecen a palabras comunes (mail.ru y gmail), así que el resto queda en Precaución si no hay otra señal.
  marca: { pesoEvidente: 55, pesoDudoso: 35, largoEvidente: 9, pesoEnRutaConContexto: 55, pesoEnRuta: 25 },
  punycode: { peso: 10 },
  edad: { recienteDias: 30, muyRecienteDias: 7, pesoReciente: 25, pesoMuyReciente: 45 },
  virustotal: { motoresMedia: 1, motoresFuerte: 5, pesoMedia: 25, pesoFuerte: 60 },
}

// fuerte: alcanza sola para habilitar Peligroso (marca imitada, dominio engañoso, VirusTotal con varios motores).
// media: suma con peso propio; dos de grupos distintos también habilitan Peligroso.
// debil: palabras sueltas y rasgos comunes; solas nunca pasan de Precaución.
export const FUERZAS = ['fuerte', 'media', 'debil']

export function nuevaSenal({ id, grupo, peso, texto, fuerza }) {
  return { id, grupo, fuerza, peso, puntos: peso, texto }
}

export function habilitaPeligroso(senales) {
  const activas = (senales ?? []).filter((senal) => senal.puntos > 0)
  if (activas.some((senal) => senal.fuerza === 'fuerte')) return true
  return new Set(activas.filter((senal) => senal.fuerza === 'media').map((senal) => senal.grupo)).size >= 2
}

// Sin una señal fuerte o una combinación, el puntaje queda justo debajo de Peligroso.
export function puntajeFinal(puntos, senales, umbrales = PUNTAJE.umbrales) {
  const tope = habilitaPeligroso(senales) ? 100 : umbrales.peligroso - 1
  return Math.min(100, tope, puntos)
}

export function nivelPorPuntaje(puntos, sinVerificar = false, umbrales = PUNTAJE.umbrales) {
  if (puntos >= umbrales.peligroso) return 'rojo'
  if (puntos >= umbrales.precaucion) return 'amarillo'
  return sinVerificar ? 'gris' : 'verde'
}

// Las señales que vienen de otra dirección (el destino de una redirección) ya sumaron en su propio puntaje.
export function usadoEnGrupo(senales, grupo) {
  return (senales ?? [])
    .filter((senal) => senal.grupo === grupo && !senal.origen)
    .reduce((total, senal) => total + senal.puntos, 0)
}

// Recorta el peso de una señal para que su grupo no pase el tope.
export function pesoConTope(peso, grupo, senales, topes = PUNTAJE.topes) {
  if (!(grupo in topes)) return peso
  return Math.max(0, Math.min(peso, topes[grupo] - usadoEnGrupo(senales, grupo)))
}
