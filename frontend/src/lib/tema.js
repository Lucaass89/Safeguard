const CLAVE = 'sg-tema'

export function aplicarTema(tema) {
  const siguiente = tema === 'oscuro' ? 'oscuro' : 'claro'
  document.documentElement.dataset.tema = siguiente
  try {
    localStorage.setItem(CLAVE, siguiente)
  } catch {
    /* el modo privado puede bloquear el almacenamiento */
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', siguiente === 'oscuro' ? '#1b2836' : '#f3efe6')
  window.dispatchEvent(new CustomEvent('sg-tema', { detail: siguiente }))
  return siguiente
}
