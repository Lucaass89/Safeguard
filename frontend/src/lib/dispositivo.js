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
