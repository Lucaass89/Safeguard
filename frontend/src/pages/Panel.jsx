import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Bienvenida from '../components/Bienvenida.jsx'
import { supabase } from '../lib/supabase.js'
import { esAdministrador, useMembresia } from '../lib/useMembresia.js'
import { useSesion } from '../lib/useSesion.js'
import SafeLink from './SafeLink.jsx'
import './Panel.css'

function primerNombre(nombre, email) {
  const limpio = (nombre || '').trim()
  if (!limpio || limpio === email) return ''
  return limpio.split(/\s+/)[0]
}

function lectura(campanas, correos, clics, datos) {
  if (campanas === 0) return 'Todavía no hay campañas.'
  if (correos === 0) return `${campanas} campañas. Todavía no salió ningún correo.`
  const clic =
    clics === 0 ? 'nadie hizo clic' : clics === 1 ? '1 persona hizo clic' : `${clics} personas hicieron clic`
  const cargados =
    datos === 0 ? 'nadie cargó datos' : datos === 1 ? '1 persona cargó datos' : `${datos} personas cargaron datos`
  return `De ${correos} correos, ${clic} y ${cargados}.`
}

function ResumenPhishGuard({ acceso }) {
  const { sesion } = useSesion()
  const [tablero, setTablero] = useState(null)

  useEffect(() => {
    if (!acceso) return undefined
    let activo = true
    supabase.rpc('phishguard_tablero').then(
      ({ data, error }) => {
        if (!activo || error || !data?.organizacion) return
        setTablero({
          eventos: Array.isArray(data.eventos) ? data.eventos : [],
          campanas: Array.isArray(data.campanas) ? data.campanas : [],
        })
      },
      () => {},
    )
    return () => {
      activo = false
    }
  }, [acceso, sesion.user.id])

  if (acceso === null) return null

  if (!acceso) {
    return (
      <section className="mesa-phish mesa-phish-cerrado" aria-labelledby="mesa-phish-titulo">
        <div>
          <h2 id="mesa-phish-titulo">PhishGuard, para tu equipo</h2>
          <p>Simulá correos de phishing en tu empresa o escuela y enseñale a cada persona en el momento en que cae.</p>
        </div>
        <Link className="mesa-phish-boton" to="/adquirir">
          Conocer PhishGuard
        </Link>
      </section>
    )
  }

  const correos = tablero?.eventos.length ?? 0
  const clics = tablero?.eventos.filter((evento) => evento.hizo_clic).length ?? 0
  const datos = tablero?.eventos.filter((evento) => evento.ingreso_datos).length ?? 0
  const campanas = tablero?.campanas.length ?? 0
  const porcentaje = correos > 0 ? Math.round((clics / correos) * 100) : 0

  return (
    <section className="mesa-tablero" aria-labelledby="mesa-tablero-titulo">
      <div className="mesa-tablero-cabeza">
        <h2 id="mesa-tablero-titulo">Tu equipo en PhishGuard</h2>
        <Link className="mesa-tablero-ir" to={campanas === 0 ? '/panel/campanas' : '/panel/tablero'}>
          {campanas === 0 ? 'Armar una campaña' : 'Ver el tablero'}
        </Link>
      </div>
      <p className="mesa-tablero-lectura">{tablero ? lectura(campanas, correos, clics, datos) : 'Buscando los datos del equipo…'}</p>
      {correos > 0 && (
        <>
          <ul className="metricas-franja">
            <li>
              <strong>{campanas}</strong>
              <span>Campañas</span>
            </li>
            <li>
              <strong>{correos}</strong>
              <span>Correos</span>
            </li>
            <li>
              <strong>{clics}</strong>
              <span>Clics</span>
            </li>
            <li>
              <strong>{datos}</strong>
              <span>Datos ingresados</span>
            </li>
          </ul>
          <div className="mesa-riesgo">
            <div className="mesa-riesgo-pista" aria-hidden="true">
              <span style={{ width: `${porcentaje}%` }} />
            </div>
            <p>
              {clics} de {correos} correos con clic
            </p>
          </div>
        </>
      )}
    </section>
  )
}

function Panel() {
  const { sesion } = useSesion()
  const { rol, cargando: cargandoMembresia } = useMembresia()
  const acceso = cargandoMembresia ? null : esAdministrador(rol)
  const nombre = sesion.user.user_metadata?.full_name ?? sesion.user.user_metadata?.name ?? sesion.user.email
  const saludo = primerNombre(nombre, sesion.user.email)

  return (
    <div className="panel mesa mesa-inicio">
      <Bienvenida />
      <header className="mesa-bienvenida">
        <p className="mesa-hola">{saludo ? `Hola, ${saludo}` : 'Hola'}</p>
        <h1 className="mesa-saludo">¿Qué te llegó?</h1>
        <p>Pegá un enlace, un WhatsApp o un correo, o subí un PDF. Te decimos si es seguro antes de que lo abras.</p>
      </header>
      <SafeLink variante="web" modo="resumen" />
      <ResumenPhishGuard acceso={acceso} />
    </div>
  )
}

export function PanelHistorial() {
  return (
    <div className="panel mesa mesa-inicio">
      <header className="mesa-bienvenida">
        <h1 className="mesa-saludo">Historial</h1>
        <p>Todo lo que revisaste con SafeLink, en la web y en la app.</p>
      </header>
      <SafeLink variante="web" modo="historial" />
    </div>
  )
}

export default Panel
