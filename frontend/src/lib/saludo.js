export function primerNombre(usuario) {
  if (!usuario) return ''
  const meta = usuario.user_metadata ?? {}
  const completo = (meta.full_name || meta.name || '').trim()
  if (!completo || completo === usuario.email) return ''
  return completo.split(/\s+/)[0]
}

export function saludo(hora) {
  if (hora >= 5 && hora < 12) return 'Buen día'
  if (hora >= 12 && hora < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export function saludoPara(usuario, hora = new Date().getHours()) {
  const nombre = primerNombre(usuario)
  return nombre ? `${saludo(hora)}, ${nombre}` : saludo(hora)
}
