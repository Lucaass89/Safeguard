export const ENTRADA_DE = {
  enlace: 'web',
  mensaje: 'whatsapp',
  correo: 'correo',
  pdf: 'pdf',
}

export const CANAL_DE = {
  enlace: 'enlace',
  mensaje: 'whatsapp',
  correo: 'correo',
  pdf: 'pdf',
  qr: 'qr',
}

export const ENTRADA_A_TIPO = {
  web: 'enlace',
  whatsapp: 'mensaje',
  correo: 'correo',
  pdf: 'pdf',
  qr: 'qr',
}

export function resumenDe(tipo, entrada, archivo) {
  if (tipo === 'pdf') return archivo || 'PDF'
  const linea = entrada.trim().split('\n')[0]
  return linea.length > 72 ? `${linea.slice(0, 72)}…` : linea
}


export function casoDeRevisado(item) {
  const textual = item.entrada === 'whatsapp' || item.entrada === 'pdf' || item.entrada === 'correo'
  return {
    id: item.id,
    caso: {
      nivel: item.nivelRiesgo,
      url: item.url,
      dominio: item.dominio,
      motivos: item.motivos,
      diferencia: item.diferencia,
      sinVerificar: item.nivelRiesgo === 'gris',
    },
    canal: CANAL_DE[ENTRADA_A_TIPO[item.entrada]] ?? 'enlace',
    subtitulo: textual ? item.texto : undefined,
  }
}

export function buscarEnRevisados(items, texto) {
  const buscado = String(texto ?? '').trim().toLowerCase()
  if (!buscado) return items ?? []
  return (items ?? []).filter((item) =>
    [item.texto, item.dominio, item.url, item.tipo].some((campo) => String(campo ?? '').toLowerCase().includes(buscado)),
  )
}

export function partesDeTotales({ seguros = 0, dudosos = 0, peligrosos = 0 } = {}) {
  const total = seguros + dudosos + peligrosos
  if (!total) return []
  return [
    { id: 'verde', etiqueta: 'Seguros', cantidad: seguros },
    { id: 'amarillo', etiqueta: 'Precaución', cantidad: dudosos },
    { id: 'rojo', etiqueta: 'Peligrosos', cantidad: peligrosos },
  ].map((parte) => ({ ...parte, porcentaje: Math.round((parte.cantidad / total) * 1000) / 10 }))
}

export function fechaDeTabla(fecha, hoy = new Date()) {
  const d = new Date(fecha)
  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const mismoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (mismoDia(d, hoy)) return `Hoy, ${hora}`
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)
  if (mismoDia(d, ayer)) return `Ayer, ${hora}`
  const opciones = { day: 'numeric', month: 'short' }
  if (d.getFullYear() !== hoy.getFullYear()) opciones.year = 'numeric'
  return `${d.toLocaleDateString('es-AR', opciones)}, ${hora}`
}
