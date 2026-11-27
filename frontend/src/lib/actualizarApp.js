export function leerUltimaVersion(datos) {
  if (!datos || typeof datos !== 'object') return null
  const { version, nombre, archivo, novedades, desinstalar, firmaDesde } = datos
  if (!Number.isInteger(version) || version < 1) return null
  if (typeof nombre !== 'string' || !/^\d+(\.\d+)*$/.test(nombre)) return null
  if (typeof archivo !== 'string' || !/^\/app\/[\w.-]+\.apk$/.test(archivo)) return null
  return {
    version,
    nombre,
    archivo,
    novedades: typeof novedades === 'string' ? novedades : '',
    desinstalar: desinstalar === true,
    firmaDesde: Number.isInteger(firmaDesde) && firmaDesde > 0 ? firmaDesde : 0,
  }
}

export function necesitaActualizar(instalada, ultima) {
  return Boolean(ultima) && Number.isFinite(instalada) && instalada > 0 && instalada < ultima.version
}

export function hayQueDesinstalar(instalada, ultima) {
  if (!ultima) return false
  if (ultima.desinstalar) return true
  return ultima.firmaDesde > 0 && Number.isFinite(instalada) && instalada > 0 && instalada < ultima.firmaDesde
}

export function nombreDescarga(ultima) {
  return `SafeGuard-${ultima.nombre}.apk`
}

const NOMBRES = { 1: '1.0', 2: '1.1 o 1.2', 3: '1.3', 4: '1.4', 5: '1.5' }

export function nombreInstalada(numero) {
  if (!Number.isInteger(numero) || numero < 1) return 'desconocida'
  return NOMBRES[numero] ?? `${numero}`
}

export function textoVersion({ instalada, ultima, estado }) {
  if (!Number.isInteger(instalada) || instalada < 1) {
    return 'Estás usando SafeGuard como app web: se actualiza sola. Para recibir avisos al celular, bajá la app de Android.'
  }
  const tuya = `Tenés la ${nombreInstalada(instalada)}.`
  if (estado === 'consultando') return `${tuya} Buscando si hay una nueva…`
  if (estado === 'error' || !ultima) return `${tuya} No pudimos ver si hay una nueva. Revisá la conexión y volvé a abrir Perfil.`
  if (necesitaActualizar(instalada, ultima)) return `${tuya} Hay una nueva: ${ultima.nombre}. ${ultima.novedades}`.trim()
  return `${tuya} Es la última.`
}
