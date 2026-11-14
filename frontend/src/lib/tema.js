const CLAVE = 'sg-tema'
let media = null
let alCambiarSistema = null

export function leerPreferencia() {
  try {
    const valor = localStorage.getItem(CLAVE)
    if (valor === 'claro' || valor === 'oscuro' || valor === 'sistema') return valor
  } catch {
    void 0
  }
  return 'oscuro'
}

function apariencia(preferencia) {
  if (preferencia === 'claro') return 'claro'
  if (preferencia === 'sistema' && !window.matchMedia('(prefers-color-scheme: dark)').matches) return 'claro'
  return 'oscuro'
}

function pintar(preferencia) {
  const siguiente = apariencia(preferencia)
  document.documentElement.dataset.tema = siguiente
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', siguiente === 'oscuro' ? '#070d1a' : '#f5f7fb')
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

export function seguirSistema() {
  vigilar(leerPreferencia())
}

export function aplicarTema(tema) {
  const preferencia = tema === 'claro' || tema === 'sistema' ? tema : 'oscuro'
  try {
    localStorage.setItem(CLAVE, preferencia)
  } catch {
    void 0
  }
  vigilar(preferencia)
  return pintar(preferencia)
}
