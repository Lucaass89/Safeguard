export const CANALES_CAMPANA = [
  { id: 'email', etiqueta: 'Correo', detalle: 'Le llega a cada persona a su correo. Se envía solo.' },
  { id: 'whatsapp', etiqueta: 'WhatsApp', detalle: 'Te armamos los mensajes y los mandás vos desde tu WhatsApp.' },
  { id: 'sms', etiqueta: 'SMS', detalle: 'Te armamos los mensajes y los mandás vos por SMS.' },
]

const DIFICULTAD = {
  bajo: 'Fácil de detectar',
  medio: 'Intermedia',
  alto: 'Difícil de detectar',
}

const CATEGORIA = {
  BANCO: 'Banco',
  ORGANISMO: 'Organismo público',
  MERCADOLIBRE: 'Compras',
  RRHH: 'Recursos humanos',
  COLEGIO: 'Colegio',
  PAQUETE: 'Envíos',
  CEO: 'Jefe o director',
  AMENAZA_REAL: 'Engaño real visto en SafeLink',
}

export function etiquetaDificultad(nivel) {
  return DIFICULTAD[nivel] ?? 'Intermedia'
}

export function etiquetaCategoria(categoria, amenaza) {
  if (amenaza) return CATEGORIA.AMENAZA_REAL
  return CATEGORIA[categoria] ?? 'General'
}

export function vistaPrevia(plantilla, largo = 150) {
  const texto = String(plantilla?.cuerpo_html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('{link}', '[enlace]')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (texto.length <= largo) return texto
  return `${texto.slice(0, largo).trimEnd()}…`
}

export function areasDeEmpleados(empleados) {
  const mapa = new Map()
  for (const persona of empleados) {
    const area = persona.departamento?.trim() || 'General'
    if (!mapa.has(area)) mapa.set(area, [])
    mapa.get(area).push(persona.id)
  }
  return [...mapa.entries()]
    .map(([area, ids]) => ({ area, ids }))
    .sort((a, b) => a.area.localeCompare(b.area, 'es'))
}

export function estadoGrupo(ids, elegidos) {
  const marcados = ids.filter((id) => elegidos.includes(id)).length
  if (marcados === 0) return 'nada'
  return marcados === ids.length ? 'todo' : 'parte'
}

export function alternarGrupo(ids, elegidos) {
  if (estadoGrupo(ids, elegidos) === 'todo') return elegidos.filter((id) => !ids.includes(id))
  return [...new Set([...elegidos, ...ids])]
}

export function nombrePorDefecto(plantilla, hoy = new Date()) {
  const mes = hoy.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const base = plantilla?.titulo?.trim() || 'Simulación'
  return `${base} · ${mes}`
}

export function resumenFila(eventos) {
  const total = eventos.length
  const clics = eventos.filter((evento) => evento.hizo_clic).length
  return {
    total,
    clics,
    porcentaje: total > 0 ? Math.round((clics / total) * 100) : 0,
    conResultados: eventos.some((evento) => evento.hizo_clic || evento.vio_reconocimiento || evento.pagina_abierta),
  }
}
