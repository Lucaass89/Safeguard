const MARCA = 'SafeGuardApp'

const RUTAS_APP = {
  '/panel': '/',
  '/panel?app=safelink': '/safelink',
  '/panel?app=phishguard': '/phishguard',
  '/panel/enlaces': '/safelink/enlaces',
  '/panel/whatsapp': '/safelink/whatsapp',
  '/panel/pdf': '/safelink/pdf',
  '/panel/correo': '/safelink/correo',
  '/panel/qr': '/safelink/qr',
  '/panel/empresa': '/phishguard/empresa',
  '/panel/campanas': '/phishguard/campanas',
  '/panel/tablero': '/phishguard/tablero',
  '/panel/informe': '/phishguard/informe',
  '/panel/perfil': '/perfil',
}

export function esAppNativa() {
  if (navigator.userAgent.includes(MARCA)) return true
  if (navigator.standalone === true) return true
  return window.matchMedia('(display-mode: standalone)').matches
}

export function rutaEnApp(to) {
  if (!esAppNativa()) return to
  return RUTAS_APP[to] ?? to
}

// En la app, /panel es la web. El inicio de sesión vuelve a la pantalla de la app.
export function destinoTrasIngreso(to) {
  if (!esAppNativa()) return to
  if (typeof to !== 'string' || !to.startsWith('/')) return '/'

  const hashAt = to.indexOf('#')
  const hash = hashAt >= 0 ? to.slice(hashAt) : ''
  const sinHash = hashAt >= 0 ? to.slice(0, hashAt) : to
  const queryAt = sinHash.indexOf('?')
  const path = queryAt >= 0 ? sinHash.slice(0, queryAt) : sinHash
  const query = queryAt >= 0 ? sinHash.slice(queryAt) : ''

  const conQuery = rutaEnApp(`${path}${query}`)
  if (conQuery !== `${path}${query}`) return `${conQuery}${hash}`

  const solo = rutaEnApp(path)
  if (solo !== path) return `${solo}${query}${hash}`

  if (path === '/panel' || path.startsWith('/panel/')) return `/${hash}`
  return to
}
