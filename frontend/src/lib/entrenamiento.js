import { dispositivo } from './dispositivo.js'
import { supabase } from './supabase.js'

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
