import { consejoDelDia } from './consejoDelDia.js'

const DIA = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

export function fechaDeHoy(hoy = new Date()) {
  const texto = DIA.format(hoy).replace(',', '')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function consejoCorto(hoy = new Date()) {
  const consejo = consejoDelDia(hoy)
  return { titulo: consejo.titulo, texto: consejo.mirar[0] }
}

export function datoSafeLink({ total = 0, peligrosos = 0 } = {}) {
  if (!total) return 'Todavía no revisaste nada. Probá con algo que te llegó.'
  const revisiones = total === 1 ? '1 revisión' : `${total} revisiones`
  if (!peligrosos) return `${revisiones} · ningún engaño por ahora`
  const enganos = peligrosos === 1 ? 'frenaste 1 engaño' : `frenaste ${peligrosos} engaños`
  return `${revisiones} · ${enganos}`
}

export function datoPhishGuard(tablero) {
  if (!tablero) return { porcentaje: null, texto: 'Buscando los datos del equipo…' }
  const correos = tablero.eventos?.length ?? 0
  const campanas = tablero.campanas?.length ?? 0
  if (campanas === 0) return { porcentaje: null, texto: 'Todavía no armaste ninguna campaña.' }
  if (correos === 0) return { porcentaje: null, texto: 'Todavía no salió ningún correo.' }
  const clics = tablero.eventos.filter((evento) => evento.hizo_clic).length
  const porcentaje = Math.round((clics / correos) * 100)
  const enCampanas = campanas === 1 ? 'en tu campaña' : `en tus ${campanas} campañas`
  return { porcentaje, texto: `tocó el enlace ${enCampanas}` }
}

export function tarjetasExtra({ edicion = null, extensionOculta = false, movil = false, ios = false, appNativa = false } = {}) {
  const lista = []
  if (edicion?.estafas?.length) lista.push('estafa')
  if (!movil && !extensionOculta) lista.push('extension')
  if (!ios && !appNativa) lista.push('app')
  return lista
}
