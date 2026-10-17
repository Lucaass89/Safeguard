let pendiente = null
let instalada = false
const oyentes = new Set()

function avisar() {
  oyentes.forEach((fn) => fn(pendiente))
}

export function instalarPendiente() {
  return pendiente
}

export function instalacionHecha() {
  return instalada
}

export function escucharInstalacion(fn) {
  oyentes.add(fn)
  return () => oyentes.delete(fn)
}

export async function pedirInstalacion() {
  const evento = pendiente
  if (!evento || typeof evento.prompt !== 'function') return 'dismissed'
  pendiente = null
  avisar()
  evento.prompt()
  const eleccion = await evento.userChoice
  if (eleccion.outcome === 'accepted') instalada = true
  return eleccion.outcome
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (evento) => {
    if (!window.matchMedia('(max-width: 850px)').matches) return
    evento.preventDefault()
    pendiente = evento
    avisar()
  })

  window.addEventListener('appinstalled', () => {
    instalada = true
    pendiente = null
    avisar()
  })
}
