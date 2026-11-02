import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { rutaEnApp } from '../lib/esAppNativa.js'
import { nombreEmpresa } from '../lib/formato.js'
import { historialCaidas, resumirEquipo } from '../lib/tableroEquipo.js'
import { supabase } from '../lib/supabase.js'
import './Panel.css'

const CANAL_ETIQUETA = { email: 'Mail', whatsapp: 'WhatsApp', sms: 'SMS' }

function etiquetaCanal(canal) {
  return CANAL_ETIQUETA[canal] ?? canal ?? ''
}

function fechaHora(valor) {
  if (!valor) return 'Sin fecha'
  return new Date(valor).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function despues(persona) {
  const partes = [
    persona.capacitado && 'se capacitó',
    persona.reconocio && 'reconoció el mensaje',
    persona.mejoro && 'mejoró en el refuerzo',
  ].filter(Boolean)
  if (partes.length === 0) return '—'
  const texto = partes.join(' · ')
  return texto[0].toUpperCase() + texto.slice(1)
}

function quePaso(persona) {
  if (persona.cayo) return 'Tocó el enlace'
  if (persona.participo) return 'No lo tocó'
  return 'Sin campaña'
}

function fraseArea(area) {
  const tocaron =
    area.cayo === 1 ? '1 persona tocó el enlace' : `${area.cayo} personas tocaron el enlace`
  const capacitaron =
    area.cap === 1 ? '1 se capacitó' : `${area.cap} se capacitaron`
  const mejoraron =
    area.mejoro === 1 ? '1 mejoró en el refuerzo' : `${area.mejoro} mejoraron en el refuerzo`
  return `En ${area.area}, ${tocaron} de ${area.total}. ${capacitaron} y ${mejoraron}.`
}

function PanelInforme() {
  const [organizacion, setOrganizacion] = useState(undefined)
  const [empleados, setEmpleados] = useState([])
  const [eventos, setEventos] = useState([])
  const [campanas, setCampanas] = useState([])
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    async function cargar() {
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
      setError(fallo.message ?? 'No se pudo armar el informe.')
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

  const historial = useMemo(
    () => historialCaidas(empleados, eventos, campanas),
    [empleados, eventos, campanas],
  )

  const fecha = new Date().toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const sinEquipo = porPersona.length === 0
  const sinResultados = !porPersona.some((p) => p.participo)

  if (cargando) return <p className="panel-estado">Armando el informe…</p>

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
    <div className="panel panel-empresas informe">
      <header className="panel-header">
        <Link className="panel-volver informe-no-imprimir" to={rutaEnApp('/panel?app=phishguard')}>
          ← Volver a las opciones
        </Link>
        <p className="informe-fecha">{fecha}</p>
        <h1>Informe de {nombreEmpresa(organizacion.nombre_empresa)}</h1>
        <p className="panel-lead">
          Quién tocó el enlace, quién se capacitó y quién mejoró en el refuerzo. Es para
          la empresa o la escuela. No es una sanción.
        </p>
        <div className="panel-acciones informe-no-imprimir">
          <button type="button" className="panel-boton" onClick={() => window.print()}>
            Guardar o imprimir
          </button>
          <Link className="text-link" to={rutaEnApp('/panel/tablero')}>
            Ver el tablero
          </Link>
        </div>
      </header>

      {error && <p className="panel-error">{error}</p>}

      {sinEquipo || sinResultados ? (
        <section className="panel-seccion tablero-vacio">
          {sinEquipo ? (
            <>
              <p>Todavía no cargaste a nadie.</p>
              <p>Cargá al equipo y armá una campaña para tener un informe.</p>
              <Link className="panel-boton" to={rutaEnApp('/panel/empresa')}>
                Cargar empleados
              </Link>
            </>
          ) : (
            <>
              <p>Todavía no hay campañas con resultados.</p>
              <p>Cuando alguien reciba la simulación, el informe muestra qué pasó.</p>
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
              <span>Tocaron el enlace</span>
            </li>
            <li>
              <strong>{resumen.cap}</strong>
              <span>Se capacitaron</span>
            </li>
            <li>
              <strong>{resumen.mejoro}</strong>
              <span>Mejoraron</span>
            </li>
          </ul>

          <section className="panel-seccion">
            <h2>Por área</h2>
            <ul className="informe-areas">
              {porArea.map((area) => (
                <li key={area.area}>{fraseArea(area)}</li>
              ))}
            </ul>
          </section>

          <section className="panel-seccion">
            <h2>Por persona</h2>
            <div className="tabla-wrap">
              <table className="tabla-equipo tabla-personas">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Área</th>
                    <th>Qué pasó</th>
                    <th>Después</th>
                  </tr>
                </thead>
                <tbody>
                  {porPersona.map((persona) => (
                    <tr key={persona.id}>
                      <td>{persona.nombre}</td>
                      <td>{persona.departamento || 'General'}</td>
                      <td>{quePaso(persona)}</td>
                      <td>{despues(persona)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {historial.length > 0 && (
            <section className="panel-seccion">
              <h2>Historial de caídas</h2>
              <p className="panel-lead">
                Cada vez que alguien tocó el enlace o cargó datos, con la fecha y la campaña.
                De lo más reciente a lo más viejo.
              </p>
              <div className="tabla-wrap">
                <table className="tabla-equipo">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Nombre</th>
                      <th>Área</th>
                      <th>Campaña</th>
                      <th>Canal</th>
                      <th>Qué hizo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((caida) => (
                      <tr key={caida.id}>
                        <td>{fechaHora(caida.fecha)}</td>
                        <td>{caida.nombre}</td>
                        <td>{caida.area}</td>
                        <td>
                          {caida.campana}
                          {caida.refuerzo ? ' · refuerzo' : ''}
                        </td>
                        <td>{etiquetaCanal(caida.canal)}</td>
                        <td>{caida.accion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      <p className="informe-cierre">
        Quien administra ve los nombres para saber a quién acompañar. No se publica ni se
        usa para sancionar.
      </p>
    </div>
  )
}

export default PanelInforme
