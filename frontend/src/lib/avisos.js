export const VERSION_CON_AVISOS = 3

export const TEMAS_AVISO = [
  {
    id: 'anuncios',
    titulo: 'Mantenimientos y novedades',
    nota: 'Cuando SafeGuard va a estar en mantenimiento o suma algo nuevo.',
  },
  {
    id: 'estafas',
    titulo: 'Estafas de la semana',
    nota: 'Cuando publicamos las estafas que más circulan.',
  },
  {
    id: 'phishguard',
    titulo: 'Avisos de PhishGuard',
    nota: 'Si administrás una empresa: cuando alguien del equipo toca el enlace de una simulación.',
  },
]

const TEMAS_INICIALES = { anuncios: true, estafas: true, phishguard: true }

export function normalizarAvisos(valor) {
  const crudo = valor && typeof valor === 'object' ? valor : {}
  const temas = {}
  for (const tema of TEMAS_AVISO) {
    temas[tema.id] = typeof crudo.temas?.[tema.id] === 'boolean' ? crudo.temas[tema.id] : TEMAS_INICIALES[tema.id]
  }
  return {
    decidido: crudo.decidido === true,
    activos: crudo.activos === true,
    permiso: crudo.permiso === 'si' || crudo.permiso === 'no' ? crudo.permiso : null,
    token: typeof crudo.token === 'string' && crudo.token.length <= 4096 ? crudo.token : null,
    temas,
  }
}

export function urlAvisos(estado) {
  const parametros = TEMAS_AVISO.map(({ id }) => `${id}=${estado.activos && estado.temas[id] ? 1 : 0}`)
  return `safeguard://notificaciones?${parametros.join('&')}`
}

export function recibirRespuesta(estado, detalle) {
  const permiso = detalle?.permiso === 'si' ? 'si' : detalle?.permiso === 'no' ? 'no' : estado.permiso
  const token = typeof detalle?.token === 'string' && detalle.token ? detalle.token : estado.token
  return { ...estado, permiso, token, activos: permiso === 'no' ? false : estado.activos }
}

export function textoEstado(estado) {
  if (!estado.decidido) return 'Apagados'
  if (estado.permiso === 'no') return 'Android no dio permiso'
  if (!estado.activos) return 'Apagados'
  const prendidos = TEMAS_AVISO.filter(({ id }) => estado.temas[id]).length
  return prendidos === TEMAS_AVISO.length ? 'Todos prendidos' : `${prendidos} de ${TEMAS_AVISO.length} prendidos`
}

export function estadoApp(esApp, version) {
  if (!esApp) return 'web'
  return version >= VERSION_CON_AVISOS ? 'lista' : 'vieja'
}
