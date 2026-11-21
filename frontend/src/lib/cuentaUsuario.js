export const ROLES = {
  Admin_Principal: 'Administrador principal',
  Tecnico: 'Técnico',
}

export function metodosDe(usuario) {
  const identidades = Array.isArray(usuario.identities) ? usuario.identities : null
  const proveedores = identidades
    ? identidades.map((identidad) => identidad.provider)
    : usuario.app_metadata?.providers
  if (!Array.isArray(proveedores)) return null

  const unicos = [...new Set(proveedores.filter((proveedor) => typeof proveedor === 'string'))]
  return {
    clave: unicos.includes('email'),
    google: unicos.includes('google'),
    otros: unicos.filter((proveedor) => proveedor !== 'email' && proveedor !== 'google'),
  }
}

export function textoMetodo(metodos) {
  if (!metodos) return null
  const partes = []
  if (metodos.clave) partes.push('correo y contraseña')
  if (metodos.google) partes.push('Google')
  partes.push(...metodos.otros)
  if (partes.length === 0) return null
  if (partes.length === 1) return `Entrás con ${partes[0]}.`
  const ultimo = partes[partes.length - 1]
  return `Entrás con ${partes.slice(0, -1).join(', ')} y con ${ultimo}.`
}

export function fotoDe(usuario) {
  const meta = usuario?.user_metadata ?? {}
  const url = meta.avatar_url || meta.picture || ''
  return /^https:\/\//.test(url) ? url : null
}

export function etiquetaRol(rol) {
  return ROLES[rol] ?? (typeof rol === 'string' && rol.trim() ? rol.trim() : null)
}
