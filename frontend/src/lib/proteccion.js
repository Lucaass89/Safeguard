export const PASOS_PROTECCION = [
  { id: 'avisos', titulo: 'Avisos al celular', consejo: 'Activá los avisos al celular.', peso: 30, accion: 'Activarlos', to: '/perfil/avisos' },
  { id: 'lista', titulo: 'Tu cuenta, más segura', consejo: 'Completá la lista "Tu cuenta, más segura".', peso: 30, accion: 'Ver la lista', to: '/perfil#prog-lista' },
  { id: 'portapapeles', titulo: 'Aviso de enlaces copiados', consejo: 'Activá el aviso de enlaces copiados.', peso: 15, accion: 'Activarlo', to: '/perfil/apariencia' },
  { id: 'app', titulo: 'App al día', consejo: 'Actualizá la app.', peso: 15, accion: 'Actualizar', to: '/perfil/version' },
]

function avanceDe(paso, estado) {
  if (paso.id === 'lista') {
    const total = estado.listaTotal || 0
    return total > 0 ? Math.min(1, Math.max(0, (estado.listaListas || 0) / total)) : 0
  }
  return estado[paso.id] ? 1 : 0
}

export function nivelProteccion(estado) {
  const aplican = PASOS_PROTECCION.filter(
    (paso) => paso.id === 'lista' || (estado[paso.id] !== null && estado[paso.id] !== undefined),
  )
  const pesoTotal = aplican.reduce((suma, paso) => suma + paso.peso, 0)
  const logrado = aplican.reduce((suma, paso) => suma + paso.peso * avanceDe(paso, estado), 0)
  const porcentaje = pesoTotal > 0 ? Math.round((logrado / pesoTotal) * 100) : 0
  const pendientes = aplican.filter((paso) => avanceDe(paso, estado) < 1)
  const proximo = pendientes.sort((a, b) => b.peso - a.peso)[0] ?? null
  const frase =
    porcentaje >= 90 ? 'Tu cuenta está muy bien protegida' : porcentaje >= 60 ? 'Vas bien, se puede mejorar' : 'A tu cuenta le falta protección'
  return { porcentaje, proximo, frase, pasos: aplican.map((paso) => ({ ...paso, avance: avanceDe(paso, estado) })) }
}
