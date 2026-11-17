export function leerUltimaVersion(datos) {
  if (!datos || typeof datos !== 'object') return null
  const { version, nombre, archivo, novedades, desinstalar } = datos
  if (!Number.isInteger(version) || version < 1) return null
  if (typeof nombre !== 'string' || !/^\d+(\.\d+)*$/.test(nombre)) return null
  if (typeof archivo !== 'string' || !/^\/app\/[\w.-]+\.apk$/.test(archivo)) return null
  return {
    version,
    nombre,
    archivo,
    novedades: typeof novedades === 'string' ? novedades : '',
    desinstalar: desinstalar === true,
  }
}

export function necesitaActualizar(instalada, ultima) {
  return Boolean(ultima) && Number.isFinite(instalada) && instalada > 0 && instalada < ultima.version
}

export function nombreDescarga(ultima) {
  return `SafeGuard-${ultima.nombre}.apk`
}
