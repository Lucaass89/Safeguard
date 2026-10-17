const MARCA = 'SafeGuardApp'

const RUTAS_APP = {
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
  return navigator.userAgent.includes(MARCA)
}

export function rutaEnApp(to) {
  if (!esAppNativa()) return to
  return RUTAS_APP[to] ?? to
}
