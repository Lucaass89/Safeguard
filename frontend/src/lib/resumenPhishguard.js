function porcentaje(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : 0
}

function datosDeCampana(campana, eventos) {
  const propios = eventos.filter((evento) => evento.campana_id === campana.id)
  const recibieron = propios.length
  const clics = propios.filter((evento) => evento.hizo_clic).length
  return {
    id: campana.id,
    nombre: campana.nombre_campana || 'Simulación',
    canal: campana.canal || 'correo',
    fecha: campana.creado_en,
    esRefuerzo: Boolean(campana.es_refuerzo),
    recibieron,
    clics,
    datos: propios.filter((evento) => evento.ingreso_datos).length,
    capacitacion: propios.filter((evento) => evento.completo_capacitacion).length,
    porcentaje: porcentaje(clics, recibieron),
  }
}

export function campanasConDatos(tablero) {
  const eventos = tablero?.eventos ?? []
  return (tablero?.campanas ?? [])
    .map((campana) => datosDeCampana(campana, eventos))
    .filter((campana) => campana.recibieron > 0)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

export function ultimaCampana(tablero) {
  const [ultima, anterior] = campanasConDatos(tablero)
  if (!ultima) return null
  return { ...ultima, diferencia: anterior ? ultima.porcentaje - anterior.porcentaje : null }
}

export function areasParaReforzar(tablero) {
  const areaDe = new Map((tablero?.empleados ?? []).map((persona) => [persona.id, persona.departamento || 'General']))
  const porArea = new Map()
  for (const evento of tablero?.eventos ?? []) {
    const area = areaDe.get(evento.empleado_id)
    if (!area) continue
    const actual = porArea.get(area) ?? { evaluadas: new Set(), cayeron: new Set() }
    actual.evaluadas.add(evento.empleado_id)
    if (evento.hizo_clic) actual.cayeron.add(evento.empleado_id)
    porArea.set(area, actual)
  }
  const lista = [...porArea.entries()]
    .map(([area, { evaluadas, cayeron }]) => ({
      area,
      personas: evaluadas.size,
      cayeron: cayeron.size,
      porcentaje: porcentaje(cayeron.size, evaluadas.size),
    }))
    .sort((a, b) => b.porcentaje - a.porcentaje || b.personas - a.personas || a.area.localeCompare(b.area))
  return lista.map((item, indice) => ({ ...item, reforzar: indice === 0 && item.porcentaje > 0 }))
}

export function pasosPhishguard(tablero) {
  const personas = tablero?.empleados?.length ?? 0
  const campanas = tablero?.campanas?.length ?? 0
  const conDatos = campanasConDatos(tablero).length
  const peor = areasParaReforzar(tablero).find((area) => area.reforzar)
  return [
    {
      id: 'equipo',
      titulo: 'Cargá a tu equipo',
      detalle: personas === 1 ? '1 persona' : `${personas} personas`,
      hecho: personas > 0,
      to: '/panel/empresa',
    },
    {
      id: 'simulacion',
      titulo: 'Mandá una simulación',
      detalle: campanas === 1 ? '1 campaña' : `${campanas} campañas`,
      hecho: campanas > 0,
      to: '/panel/campanas',
    },
    {
      id: 'resultados',
      titulo: 'Mirá cómo les fue',
      detalle: conDatos > 0 ? 'Tablero al día' : 'Cuando salgan los correos',
      hecho: conDatos > 0,
      to: '/panel/tablero',
    },
    {
      id: 'refuerzo',
      titulo: peor ? 'Próximo: un refuerzo' : 'Próximo: otra simulación',
      detalle: peor ? `Para ${peor.area}` : 'En unas semanas, para ver si mejoran',
      hecho: false,
      to: '/panel/campanas',
    },
  ]
}

export function pasoActual(pasos) {
  return pasos.findIndex((paso) => !paso.hecho)
}

export function fraseCampana(ultima) {
  if (!ultima) return 'Todavía no salió ninguna simulación. Cargá a tu equipo y armá la primera campaña.'
  const personas = ultima.recibieron === 1 ? '1 persona' : `${ultima.recibieron} personas`
  const clic = ultima.clics === 1 ? 'tocó' : 'tocaron'
  const datos = ultima.datos === 0 ? 'nadie cargó datos' : ultima.datos === 1 ? '1 cargó datos' : `${ultima.datos} cargaron datos`
  const cierre = ultima.clics > 0 ? ' Quienes tocaron el enlace vieron la explicación en el momento.' : ''
  return `En «${ultima.nombre}», ${ultima.clics} de ${personas} ${clic} el enlace y ${datos}.${cierre}`
}

export function textoDiferencia(diferencia) {
  if (diferencia === null || diferencia === undefined) return null
  if (diferencia === 0) return { texto: 'Igual que la anterior', tono: 'igual' }
  const puntos = Math.abs(diferencia) === 1 ? '1 punto' : `${Math.abs(diferencia)} puntos`
  return diferencia < 0
    ? { texto: `${puntos} menos que la anterior`, tono: 'mejor' }
    : { texto: `${puntos} más que la anterior`, tono: 'peor' }
}
