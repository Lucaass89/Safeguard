import { campanasConDatos } from './resumenPhishguard.js'

function porcentaje(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : 0
}

function personas(cantidad) {
  return cantidad === 1 ? '1 persona' : `${cantidad} personas`
}

export function cifrasEquipo(porPersona) {
  const evaluadas = porPersona.filter((persona) => persona.participo).length
  const cayeron = porPersona.filter((persona) => persona.cayo).length
  const capacitados = porPersona.filter((persona) => persona.cayo && persona.capacitado).length
  const mejoraron = porPersona.filter((persona) => persona.mejoro).length
  return {
    personas: porPersona.length,
    evaluadas,
    cayeron,
    pctCayeron: porcentaje(cayeron, evaluadas),
    capacitados,
    pctCapacitados: porcentaje(capacitados, cayeron),
    mejoraron,
  }
}

export function areasConPorcentaje(porArea) {
  const lista = porArea
    .map((area) => {
      const evaluadas = area.cayo + area.noCayo
      return { ...area, evaluadas, porcentaje: porcentaje(area.cayo, evaluadas) }
    })
    .filter((area) => area.evaluadas > 0)
    .sort((a, b) => b.porcentaje - a.porcentaje || b.evaluadas - a.evaluadas || a.area.localeCompare(b.area, 'es'))
  return lista.map((area, indice) => ({ ...area, reforzar: indice === 0 && area.porcentaje > 0 }))
}

export function evolucionCampanas(campanas, eventos, maximo = 8) {
  return campanasConDatos({ campanas, eventos })
    .slice(0, maximo)
    .reverse()
    .map((campana) => ({
      id: campana.id,
      nombre: campana.nombre,
      fecha: campana.fecha,
      esRefuerzo: campana.esRefuerzo,
      porcentaje: campana.porcentaje,
      recibieron: campana.recibieron,
    }))
}

export function recomendaciones({ areas, porPersona, evolucion }) {
  const lista = []
  const peor = areas.find((area) => area.reforzar)
  if (peor) {
    lista.push({
      id: 'refuerzo',
      titulo: `Mandá un refuerzo a ${peor.area}.`,
      texto: `Es el área donde más gente cayó: ${peor.cayo} de ${peor.evaluadas} (${peor.porcentaje} %).`,
    })
  }
  const sinCapacitar = porPersona.filter((persona) => persona.cayo && !persona.capacitado).length
  if (sinCapacitar > 0) {
    lista.push({
      id: 'capacitacion',
      titulo:
        sinCapacitar === 1
          ? '1 persona cayó y no terminó la explicación.'
          : `${sinCapacitar} personas cayeron y no terminaron la explicación.`,
      texto: 'Hablá con ellas en persona o incluilas en la próxima campaña: así aprenden a reconocer el engaño.',
    })
  }
  if (evolucion.length >= 2) {
    const primera = evolucion[0]
    const ultima = evolucion[evolucion.length - 1]
    const campanas = `${evolucion.length} campañas`
    if (ultima.porcentaje < primera.porcentaje) {
      lista.push({
        id: 'evolucion',
        titulo: 'Vas bien.',
        texto: `Pasaron de ${primera.porcentaje} % a ${ultima.porcentaje} % en ${campanas}. Repetí una simulación en un mes para que no se olviden.`,
      })
    } else if (ultima.porcentaje > primera.porcentaje) {
      lista.push({
        id: 'evolucion',
        titulo: 'Subió la cantidad de gente que cae.',
        texto: `Pasaron de ${primera.porcentaje} % a ${ultima.porcentaje} % en ${campanas}. Charlalo con el equipo y probá con una plantilla más conocida.`,
      })
    }
  }
  if (evolucion.length > 0 && evolucion[evolucion.length - 1].porcentaje === 0) {
    lista.push({
      id: 'dificil',
      titulo: 'Nadie cayó en la última campaña.',
      texto: 'Probá con una plantilla más difícil para seguir entrenando al equipo.',
    })
  }
  return lista
}

export const FILTROS_PERSONAS = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'cayo', etiqueta: 'Cayó' },
  { id: 'nocayo', etiqueta: 'No cayó' },
  { id: 'falta', etiqueta: 'Le falta la explicación' },
  { id: 'sin', etiqueta: 'Sin campaña' },
]

export function filtrarPersonas(porPersona, filtro = 'todos', busqueda = '') {
  const texto = busqueda.trim().toLowerCase()
  return porPersona.filter((persona) => {
    if (filtro === 'cayo' && !persona.cayo) return false
    if (filtro === 'nocayo' && (persona.cayo || !persona.participo)) return false
    if (filtro === 'falta' && !(persona.cayo && !persona.capacitado)) return false
    if (filtro === 'sin' && persona.participo) return false
    if (!texto) return true
    return [persona.nombre, persona.email, persona.departamento].some((campo) =>
      String(campo ?? '').toLowerCase().includes(texto),
    )
  })
}

export function iniciales(nombre) {
  const partes = String(nombre ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
}

export function resultadoPersona(persona) {
  if (persona.cayo) return { etiqueta: 'Cayó', tono: 'rojo' }
  if (persona.participo) return { etiqueta: 'No cayó', tono: 'verde' }
  return { etiqueta: 'Sin campaña', tono: 'gris' }
}

export function despuesPersona(persona) {
  if (!persona.participo) return 'Todavía no recibió ninguna simulación'
  if (persona.cayo && persona.capacitado && persona.mejoro) return 'Terminó la explicación y no cayó en el refuerzo'
  if (persona.cayo && persona.capacitado) return 'Terminó la explicación'
  if (persona.cayo) return 'Le falta terminar la explicación'
  if (persona.reconocio) return 'Reconoció el engaño'
  return '—'
}

export function textoPersonas(cantidad) {
  return personas(cantidad)
}
