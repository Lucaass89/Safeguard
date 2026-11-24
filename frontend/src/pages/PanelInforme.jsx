import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { rutaEnApp } from '../lib/esAppNativa.js'
import CabeceraPhishGuard from '../components/CabeceraPhishGuard.jsx'
import { nombreEmpresa } from '../lib/formato.js'
import { historialCaidas, resumirEquipo } from '../lib/tableroEquipo.js'
import { supabase } from '../lib/supabase.js'
import { Areas, Cifras, Recomendaciones, TablaPersonas } from '../components/AnalisisEquipo.jsx'
import { areasConPorcentaje, cifrasEquipo, evolucionCampanas, recomendaciones } from '../lib/analisisEquipo.js'
import { ultimaCampana } from '../lib/resumenPhishguard.js'
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

  const { porPersona, porArea } = useMemo(
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
  const cifras = cifrasEquipo(porPersona)
  const areas = areasConPorcentaje(porArea)
  const evolucion = evolucionCampanas(campanas, eventos)
  const ultima = ultimaCampana({ campanas, eventos })
  const consejos = recomendaciones({ areas, porPersona, evolucion })
  const sinEquipo = porPersona.length === 0
  const sinResultados = !porPersona.some((p) => p.participo)

  if (cargando) return <p className="panel-estado">Armando el informe…</p>

  if (!organizacion) {
    return (
      <div className="panel panel-empresas">
        <CabeceraPhishGuard seccion="Informe" titulo="Informe" texto="Esta cuenta no tiene el plan activo. SafeLink sigue disponible." />
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
      <CabeceraPhishGuard
        seccion={`Informe · ${fecha}`}
        titulo={`Informe de ${nombreEmpresa(organizacion.nombre_empresa)}`}
        texto="Quién tocó el enlace, quién se capacitó y quién mejoró en el refuerzo. Es para la empresa o la escuela. No es una sanción."
      >
        <div className="panel-acciones pgc-acciones informe-no-imprimir">
          <button type="button" className="pgc-boton" onClick={() => window.print()}>
            Guardar o imprimir
          </button>
          <Link className="pgc-boton-sec" to={rutaEnApp('/panel/tablero')}>
            Ver el tablero
          </Link>
        </div>
      </CabeceraPhishGuard>

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
          <div className="ae-bloque">
            <Cifras cifras={cifras} ultima={ultima} />
            <Recomendaciones lista={consejos} />
            <Areas areas={areas} />
            <TablaPersonas porPersona={porPersona} conFiltros={false} />
          </div>

          {historial.length > 0 && (
            <section className="panel-seccion">
              <h2>Cada vez que alguien cayó</h2>
              <p className="panel-lead">
                Fecha, persona y campaña de cada vez que alguien tocó el enlace o cargó datos.
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
