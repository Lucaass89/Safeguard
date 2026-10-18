const CLAVE = 'sg-tema'
let media = null
let alCambiarSistema = null

export function leerPreferencia() {
  try {
    const valor = localStorage.getItem(CLAVE)
    if (valor === 'oscuro' || valor === 'sistema') return valor
  } catch {
    /* el modo privado puede bloquear el almacenamiento */
  }
  return 'claro'
}

function apariencia(preferencia) {
  if (preferencia === 'oscuro') return 'oscuro'
  if (preferencia === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'oscuro'
  return 'claro'
}

function pintar(preferencia) {
  const siguiente = apariencia(preferencia)
  document.documentElement.dataset.tema = siguiente
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', siguiente === 'oscuro' ? '#1b2836' : '#f3eee6')
  window.dispatchEvent(new CustomEvent('sg-tema', { detail: siguiente }))
  return siguiente
}

function vigilar(preferencia) {
  if (!media) media = window.matchMedia('(prefers-color-scheme: dark)')
  if (alCambiarSistema) media.removeEventListener('change', alCambiarSistema)
  alCambiarSistema = null
  if (preferencia !== 'sistema') return
  alCambiarSistema = () => pintar('sistema')
  media.addEventListener('change', alCambiarSistema)
}

export function aplicarTema(tema) {
  const preferencia = tema === 'oscuro' || tema === 'sistema' ? tema : 'claro'
  try {
    localStorage.setItem(CLAVE, preferencia)
  } catch {
    /* el modo privado puede bloquear el almacenamiento */
  }
  vigilar(preferencia)
  return pintar(preferencia)
}
