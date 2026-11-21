const ESTADOS = {
  pendiente: { etiqueta: 'En revisión', nivel: 'amarillo' },
  revisado: { etiqueta: 'Revisado', nivel: 'verde' },
  descartado: { etiqueta: 'No era un engaño', nivel: 'gris' },
}

export function estadoReporte(estado) {
  return ESTADOS[estado] ?? ESTADOS.pendiente
}

export function textoInvitacion(nombre) {
  const quien = (nombre ?? '').trim().split(/\s+/)[0]
  const firma = quien ? ` Te lo recomienda ${quien}.` : ''
  return `Yo uso SafeGuard para revisar enlaces, QR y mensajes antes de abrirlos. Es gratis: https://safeguardd.vercel.app/personas${firma}`
}
