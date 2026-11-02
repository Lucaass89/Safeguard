function toco(ev) {
  return Boolean(ev.hizo_clic || ev.ingreso_datos)
}

export function historialCaidas(empleados, eventos, campanas) {
  const porEmpleado = new Map(empleados.map((e) => [e.id, e]))
  const porCampana = new Map(campanas.map((c) => [c.id, c]))

  return eventos
    .filter(toco)
    .map((ev) => {
      const persona = porEmpleado.get(ev.empleado_id)
      const campana = porCampana.get(ev.campana_id)
      return {
        id: ev.id,
        nombre: persona?.nombre ?? 'Empleado',
        area: persona?.departamento || 'General',
        campana: campana?.nombre_campana ?? 'Campaña',
        canal: campana?.canal ?? '',
        refuerzo: Boolean(campana?.es_refuerzo),
        accion: ev.ingreso_datos ? 'Ingresó datos' : 'Tocó el enlace',
        fecha: ev.fecha_evento ?? null,
      }
    })
    .sort((a, b) => {
      const fa = a.fecha ? new Date(a.fecha).getTime() : 0
      const fb = b.fecha ? new Date(b.fecha).getTime() : 0
      return fb - fa
    })
}

export function resumirEquipo(empleados, eventos, campanas) {
  const refuerzoIds = new Set(campanas.filter((c) => c.es_refuerzo).map((c) => c.id))

  const porPersona = empleados
    .map((emp) => {
      const propios = eventos.filter((e) => e.empleado_id === emp.id)
      const iniciales = propios.filter((e) => !refuerzoIds.has(e.campana_id))
      const refuerzos = propios.filter((e) => refuerzoIds.has(e.campana_id))
      const cayoAlguno = propios.some(toco)
      const capacitado = propios.some((e) => e.completo_capacitacion)
      const reconocio = propios.some((e) => e.vio_reconocimiento && !e.hizo_clic)
      const mejoro = iniciales.some(toco) && refuerzos.length > 0 && refuerzos.every((e) => !toco(e))
      return {
        ...emp,
        cayo: cayoAlguno,
        capacitado,
        reconocio,
        mejoro,
        participo: propios.length > 0,
      }
    })
    .sort((a, b) => {
      const area = (a.departamento || 'General').localeCompare(b.departamento || 'General', 'es')
      if (area !== 0) return area
      return (a.nombre || '').localeCompare(b.nombre || '', 'es')
    })

  const grupos = {}
  for (const persona of porPersona) {
    const key = persona.departamento || 'General'
    if (!grupos[key]) {
      grupos[key] = { area: key, total: 0, cayo: 0, noCayo: 0, cap: 0, mejoro: 0 }
    }
    grupos[key].total += 1
    if (persona.cayo) grupos[key].cayo += 1
    else if (persona.participo) grupos[key].noCayo += 1
    if (persona.capacitado) grupos[key].cap += 1
    if (persona.mejoro) grupos[key].mejoro += 1
  }

  return {
    porPersona,
    porArea: Object.values(grupos),
    resumen: {
      personas: porPersona.length,
      cayo: porPersona.filter((p) => p.cayo).length,
      noCayo: porPersona.filter((p) => !p.cayo && p.participo).length,
      cap: porPersona.filter((p) => p.capacitado).length,
      mejoro: porPersona.filter((p) => p.mejoro).length,
    },
  }
}
