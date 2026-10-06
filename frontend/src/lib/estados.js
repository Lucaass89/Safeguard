const ESTADOS = {
  campana: [
    ['borrador', 'Borrador'],
    ['programada', 'Programada'],
    ['en_proceso', 'En proceso'],
    ['finalizada', 'Finalizada'],
  ],
  empleado: [
    ['activo', 'Activo'],
    ['inactivo', 'Inactivo'],
    ['pendiente_verificacion', 'Pendiente de verificación'],
    ['pendiente_aprobacion', 'Pendiente de aprobación'],
    ['rechazado', 'Rechazado'],
  ],
  reporte: [
    ['pendiente', 'Pendiente'],
    ['revisado', 'Revisado'],
    ['descartado', 'Descartado'],
  ],
}

export function estadosDe(tipo) {
  return ESTADOS[tipo] ?? []
}

export function etiquetaEstado(tipo, valor) {
  const conocida = estadosDe(tipo).find(([clave]) => clave === valor)?.[1]
  if (conocida) return conocida
  const texto = String(valor ?? '').replaceAll('_', ' ').trim()
  return texto ? texto[0].toUpperCase() + texto.slice(1) : ''
}
