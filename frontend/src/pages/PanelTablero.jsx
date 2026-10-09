import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase.js'
import './Panel.css'

function cayo(ev) {
  return ev.hizo_clic || ev.ingreso_datos
}

function claseResultado(persona) {
  if (persona.cayo) return 'persona-badge persona-badge-rechazado'
  if (persona.participo) return 'persona-badge persona-badge-activo'
  return 'persona-badge persona-badge-inactivo'
}

function ademas(persona) {
  const partes = [
    persona.capacitado && 'capacitado',
    persona.reconocio && 'reconoció el engaño',
    persona.mejoro && 'mejoró',
  ].filter(Boolean)
  if (partes.length === 0) return '–'
  const texto = partes.join(' · ')
  return texto[0].toUpperCase() + texto.slice(1)
}

function PanelTablero() {
  const [organizacion, setOrganizacion] = useState(undefined)
  const [empleados, setEmpleados] = useState([])
  const [eventos, setEventos] = useState([])
  const [campanas, setCampanas] = useState([])
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    async function cargar() {
      supabase.rpc('phishguard_activar_refuerzos').then(
        () => {},
        () => {},
      )

      const { data, error: fallo } = await supabase.rpc('phishguard_tablero')
      if (!activo) return

      if (fallo) {
        setError(fallo.message)
        setOrganizacion(null)
        setCargando(false)
        return
      }

      setOrganizacion(data?.organizacion ?? null)
      setEmpleados(Array.isArray(data?.empleados) ? data.empleados : [])
      setEventos(Array.isArray(data?.eventos) ? data.eventos : [])
      setCampanas(Array.isArray(data?.campanas) ? data.campanas : [])
      setCargando(false)
    }

    cargar().catch((fallo) => {
      if (!activo) return
      setError(fallo.message ?? 'No se pudo armar el tablero.')
      setOrganizacion(null)
      setCargando(false)
    })

    return () => {
      activo = false
    }
  }, [])

  const porPersona = useMemo(() => {
    const refuerzoIds = new Set(campanas.filter((c) => c.es_refuerzo).map((c) => c.id))
    return empleados
      .map((emp) => {
        const propios = eventos.filter((e) => e.empleado_id === emp.id)
        const iniciales = propios.filter((e) => !refuerzoIds.has(e.campana_id))
        const refuerzos = propios.filter((e) => refuerzoIds.has(e.campana_id))
        const cayoAlguno = propios.some(cayo)
        const capacitado = propios.some((e) => e.completo_capacitacion)
        const reconocio = propios.some((e) => e.vio_reconocimiento && !e.hizo_clic)
        const mejoro =
          iniciales.some(cayo) && refuerzos.length > 0 && refuerzos.every((e) => !cayo(e))
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
        const area = (a.departamento || 'General').localeCompare(b.departamento || 'General')
        if (area !== 0) return area
        return (a.nombre || '').localeCompare(b.nombre || '')
      })
  }, [empleados, eventos, campanas])

  const porArea = useMemo(() => {
    const grupos = {}
    for (const p of porPersona) {
      const key = p.departamento || 'General'
      if (!grupos[key]) {
        grupos[key] = { area: key, total: 0, cayo: 0, noCayo: 0, cap: 0, mejoro: 0 }
      }
      grupos[key].total += 1
      if (p.cayo) grupos[key].cayo += 1
      else if (p.participo) grupos[key].noCayo += 1
      if (p.capacitado) grupos[key].cap += 1
      if (p.mejoro) grupos[key].mejoro += 1
    }
    return Object.values(grupos)
  }, [porPersona])

  const resumen = useMemo(
    () => ({
      personas: porPersona.length,
      cayo: porPersona.filter((p) => p.cayo).length,
      noCayo: porPersona.filter((p) => !p.cayo && p.participo).length,
      cap: porPersona.filter((p) => p.capacitado).length,
    }),
    [porPersona],
  )

  const sinEquipo = porPersona.length === 0
  const sinResultados = !porPersona.some((p) => p.participo)

  if (cargando) return <p className="panel-estado">Armando el tablero…</p>

  if (!organizacion) {
    return (
      <div className="panel panel-empresas">
        <Link className="panel-volver" to="/panel?app=phishguard">
          ← Volver a las opciones
        </Link>
        {error && <p className="panel-error">{error}</p>}
        <p className="panel-vacio">
          PhishGuard se paga por persona. Esta cuenta no tiene el plan activo.{' '}
          <Link to="/adquirir">Adquirir PhishGuard</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="panel panel-empresas">
      <header className="panel-header">
        <Link className="panel-volver" to="/panel?app=phishguard">
          ← Volver a las opciones
        </Link>
        <h1>Vulnerabilidad del equipo</h1>
        <p className="panel-lead">
          {organizacion.nombre_empresa}. Medimos si la persona cayó, si se capacitó y si
          mejoró en el refuerzo.
        </p>
      </header>

      {error && <p className="panel-error">{error}</p>}

      {sinEquipo || sinResultados ? (
        <section className="panel-seccion tablero-vacio">
          {sinEquipo ? (
            <>
              <p>Todavía no cargaste a nadie.</p>
              <p>Cargá a tu equipo y después armá una campaña para ver resultados.</p>
              <Link className="panel-boton" to="/panel/empresa">
                Cargar empleados
              </Link>
            </>
          ) : (
            <>
              <p>Todavía no hay campañas con resultados.</p>
              <p>Armá una campaña para ver cómo responde tu equipo.</p>
              <Link className="panel-boton" to="/panel/campanas">
                Armar una campaña
              </Link>
            </>
          )}
        </section>
      ) : (
        <>
          <ul className="metricas-franja">
            <li>
              <strong>{resumen.personas}</strong>
              <span>Personas</span>
            </li>
            <li>
              <strong>{resumen.cayo}</strong>
              <span>Cayeron</span>
            </li>
            <li>
              <strong>{resumen.noCayo}</strong>
              <span>No cayeron</span>
            </li>
            <li>
              <strong>{resumen.cap}</strong>
              <span>Capacitados</span>
            </li>
          </ul>

          <section className="panel-seccion">
            <h2>Por área</h2>
            <div className="tabla-wrap">
              <table className="tabla-equipo">
                <thead>
                  <tr>
                    <th>Área</th>
                    <th>Personas</th>
                    <th>Cayeron</th>
                    <th>No cayeron</th>
                    <th>Se capacitaron</th>
                    <th>Mejoraron</th>
                  </tr>
                </thead>
                <tbody>
                  {porArea.map((a) => (
                    <tr key={a.area}>
                      <td>{a.area}</td>
                      <td>{a.total}</td>
                      <td>{a.cayo}</td>
                      <td>{a.noCayo}</td>
                      <td>{a.cap}</td>
                      <td>{a.mejoro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {!sinEquipo && (
        <section className="panel-seccion">
          <h2>Por persona</h2>
          <div className="tabla-wrap">
            <table className="tabla-equipo tabla-personas">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Área</th>
                  <th>Resultado</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {porPersona.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.departamento || 'General'}</td>
                    <td>
                      <span className={claseResultado(p)}>
                        {p.cayo ? 'Cayó' : p.participo ? 'No cayó' : 'Sin campaña'}
                      </span>
                    </td>
                    <td>{ademas(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

export default PanelTablero
