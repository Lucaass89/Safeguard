import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { rutaEnApp } from '../lib/esAppNativa.js'
import CabeceraPhishGuard from '../components/CabeceraPhishGuard.jsx'
import { nombreEmpresa } from '../lib/formato.js'
import { resumirEquipo } from '../lib/tableroEquipo.js'
import { supabase } from '../lib/supabase.js'
import { Areas, Cifras, ComoLeer, Evolucion, Recomendaciones, TablaPersonas } from '../components/AnalisisEquipo.jsx'
import { areasConPorcentaje, cifrasEquipo, evolucionCampanas, recomendaciones } from '../lib/analisisEquipo.js'
import { ultimaCampana } from '../lib/resumenPhishguard.js'
import './Panel.css'

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

  const { porPersona, porArea } = useMemo(
    () => resumirEquipo(empleados, eventos, campanas),
    [empleados, eventos, campanas],
  )

  const cifras = cifrasEquipo(porPersona)
  const areas = areasConPorcentaje(porArea)
  const evolucion = evolucionCampanas(campanas, eventos)
  const ultima = ultimaCampana({ campanas, eventos })
  const consejos = recomendaciones({ areas, porPersona, evolucion })
  const sinEquipo = porPersona.length === 0
  const sinResultados = !porPersona.some((p) => p.participo)

  if (cargando) return <p className="panel-estado">Armando el tablero…</p>

  if (!organizacion) {
    return (
      <div className="panel panel-empresas">
        <CabeceraPhishGuard seccion="Tablero" titulo="Vulnerabilidad del equipo" texto="Esta cuenta no tiene el plan activo. SafeLink sigue disponible." />
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
      <CabeceraPhishGuard
        seccion="Tablero"
        organizacion={nombreEmpresa(organizacion.nombre_empresa)}
        titulo="Cómo viene tu equipo"
        texto="Quién cayó en las simulaciones, quién terminó la explicación y en qué área conviene reforzar."
      >
        <p className="panel-acciones pgc-acciones">
          <Link className="pgc-boton" to={rutaEnApp('/panel/informe')}>
            Ver el informe para guardar
          </Link>
          <Link className="pgc-boton-sec" to={rutaEnApp('/panel/campanas')}>
            Nueva campaña
          </Link>
        </p>
      </CabeceraPhishGuard>

      {error && <p className="panel-error">{error}</p>}

      {sinEquipo || sinResultados ? (
        <section className="panel-seccion tablero-vacio">
          {sinEquipo ? (
            <>
              <p>Todavía no cargaste a nadie.</p>
              <p>Cargá a tu equipo y después armá una campaña para ver resultados.</p>
              <Link className="panel-boton" to={rutaEnApp('/panel/empresa')}>
                Cargar personas
              </Link>
            </>
          ) : (
            <>
              <p>Todavía no hay campañas con resultados.</p>
              <p>Armá una campaña: cuando la gente reciba el mensaje de prueba, acá vas a ver qué pasó.</p>
              <Link className="panel-boton" to={rutaEnApp('/panel/campanas')}>
                Armar una campaña
              </Link>
            </>
          )}
        </section>
      ) : (
        <div className="ae-bloque">
          <Cifras cifras={cifras} ultima={ultima} />
          <ComoLeer />
          <Recomendaciones lista={consejos} />
          <div className="ae-dos">
            <Evolucion puntos={evolucion} />
            <Areas areas={areas} />
          </div>
          <TablaPersonas porPersona={porPersona} />
        </div>
      )}
    </div>
  )
}

export default PanelTablero
