// Identificador al azar del aparato, sin cuenta: sirve para saber si alguien vuelve a jugar
// y para que un mismo teléfono no mande cientos de reportes.
const DISPOSITIVO = 'sg-dispositivo'

export function dispositivo() {
  try {
    let id = localStorage.getItem(DISPOSITIVO)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(DISPOSITIVO, id)
    }
    return id
  } catch {
    return null
  }
}
