import { analizar } from './analisis.js'

const CABECERA_CORREO =
  /^(from|de|to|para|subject|asunto|return-path|received|reply-to|responder a|authentication-results|delivered-to|message-id|dkim-signature):/im

export function tipoDeEntrada(texto) {
  const limpio = (texto ?? '').trim()
  if (!limpio) return null
  if (CABECERA_CORREO.test(limpio)) return 'correo'
  if (!/\s/.test(limpio) && limpio.includes('.') && analizar(limpio)) return 'enlace'
  return 'mensaje'
}

export const NOMBRE_TIPO = {
  enlace: 'un enlace',
  mensaje: 'un mensaje',
  correo: 'un correo',
  pdf: 'un PDF',
}

const PASOS = {
  enlace: ['Mirando la dirección', 'Siguiendo a dónde lleva', 'Revisando la página', 'Armando el resultado'],
  mensaje: ['Leyendo el mensaje', 'Buscando engaños comunes', 'Revisando los enlaces', 'Armando el resultado'],
  correo: ['Mirando quién lo mandó', 'Comprobando el remitente', 'Revisando los enlaces', 'Armando el resultado'],
  pdf: ['Abriendo el PDF en tu celular', 'Buscando lo que esconde', 'Revisando los enlaces', 'Armando el resultado'],
}

export function pasosRevision(tipo) {
  return PASOS[tipo] ?? PASOS.enlace
}

export function pasoEn(tipo, milisegundos, cadaUno = 1300) {
  const pasos = pasosRevision(tipo)
  const indice = Math.min(Math.floor(Math.max(milisegundos, 0) / cadaUno), pasos.length - 1)
  return { indice, texto: pasos[indice], total: pasos.length }
}

export const FILTROS = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'rojo', etiqueta: 'Peligrosos' },
  { id: 'amarillo', etiqueta: 'Precaución' },
  { id: 'verde', etiqueta: 'Seguros' },
]

export function filtrarPorNivel(items, filtro) {
  if (!filtro || filtro === 'todos') return items
  return items.filter((item) => item.nivelRiesgo === filtro)
}

function inicioDelDia(fecha) {
  const dia = new Date(fecha)
  dia.setHours(0, 0, 0, 0)
  return dia
}

export function tituloDelDia(fecha, hoy = new Date()) {
  const dias = Math.round((inicioDelDia(hoy) - inicioDelDia(fecha)) / 86400000)
  if (dias <= 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  const texto = new Date(fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function agruparPorDia(items, hoy = new Date()) {
  const grupos = []
  for (const item of items) {
    const titulo = tituloDelDia(item.fecha, hoy)
    const ultimo = grupos.at(-1)
    if (ultimo && ultimo.titulo === titulo) ultimo.items.push(item)
    else grupos.push({ titulo, items: [item] })
  }
  return grupos
}

export function textoProtegido({ total, peligrosos }) {
  if (!total) return ''
  const cosas = total === 1 ? '1 cosa' : `${total} cosas`
  if (!peligrosos) return `Revisaste ${cosas} y ninguna era peligrosa.`
  const engano = peligrosos === 1 ? '1 engaño' : `${peligrosos} engaños`
  return `Revisaste ${cosas} y frenaste ${engano}.`
}

const FRASES = {
  peligroso: 'No lo abras',
  sospechoso: 'Mirá bien antes de seguir',
  seguro: 'Podés seguir',
  sin_senales: 'No vimos señales de riesgo',
  sin_verificar: 'No lo pudimos revisar del todo',
}

export function fraseDeNivel(clave) {
  return FRASES[clave] ?? FRASES.sin_verificar
}

export function destinoSafeLink(busqueda = '') {
  const parametros = new URLSearchParams(busqueda)
  const traido = (parametros.get('url') ?? parametros.get('texto') ?? '').trim().slice(0, 2048)
  if (!traido) return '/safelink'
  return `/safelink?compartido=${encodeURIComponent(traido)}`
}

export function destinoPanel(busqueda = '') {
  const traido = new URLSearchParams(busqueda).get('url')?.trim().slice(0, 2048)
  if (!traido) return '/panel'
  return `/panel?url=${encodeURIComponent(traido)}`
}

export function enlaceTraido(busqueda = '') {
  const traido = new URLSearchParams(busqueda).get('url')?.trim() ?? ''
  if (!/^https?:\/\/\S+$/i.test(traido)) return ''
  return traido.slice(0, 2048)
}
