import { supabase } from './supabase.js'

// Identificador al azar del aparato: sirve para saber si alguien vuelve a jugar, sin cuenta.
const DISPOSITIVO = 'sg-dispositivo'

function dispositivo() {
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

export function registrarRespuesta(mensajeId, acerto) {
  const id = dispositivo()
  if (!id) return
  supabase
    .rpc('entrenamiento_registrar', { p_dispositivo: id, p_mensaje: mensajeId, p_acerto: acerto })
    .then(
      () => {},
      () => {},
    )
}
