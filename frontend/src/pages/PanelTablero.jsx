import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { rutaEnApp } from '../lib/esAppNativa.js'
import { resumirEquipo } from '../lib/tableroEquipo.js'
import { supabase } from '../lib/supabase.js'
import './Panel.css'

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

  const { porPersona, porArea, resumen } = useMemo(
    () => resumirEquipo(empleados, eventos, campanas),
    [empleados, eventos, campanas],
  )

  const sinEquipo = porPersona.length === 0
  const sinResultados = !porPersona.some((p) => p.participo)

  if (cargando) return <p className="panel-estado">Armando el tablero…</p>

  if (!organizacion) {
    return (
      <div className="panel panel-empresas">
        <Link className="panel-volver" to={rutaEnApp('/panel?app=phishguard')}>
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
        <Link className="panel-volver" to={rutaEnApp('/panel?app=phishguard')}>
          ← Volver a las opciones
        </Link>
        <h1>Vulnerabilidad del equipo</h1>
        <p className="panel-lead">
          {organizacion.nombre_empresa}. Medimos si la persona cayó, si se capacitó y si
          mejoró en el refuerzo.
        </p>
        <p className="panel-acciones">
          <Link className="text-link" to={rutaEnApp('/panel/informe')}>
            Ver el informe para guardar
          </Link>
        </p>
      </header>

      {error && <p className="panel-error">{error}</p>}

      {sinEquipo || sinResultados ? (
        <section className="panel-seccion tablero-vacio">
          {sinEquipo ? (
            <>
              <p>Todavía no cargaste a nadie.</p>
              <p>Cargá a tu equipo y después armá una campaña para ver resultados.</p>
              <Link className="panel-boton" to={rutaEnApp('/panel/empresa')}>
                Cargar empleados
              </Link>
            </>
          ) : (
            <>
              <p>Todavía no hay campañas con resultados.</p>
              <p>Armá una campaña para ver cómo responde tu equipo.</p>
              <Link className="panel-boton" to={rutaEnApp('/panel/campanas')}>
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
