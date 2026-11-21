import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Bienvenida from '../components/Bienvenida.jsx'
import { supabase } from '../lib/supabase.js'
import { esAdministrador, useMembresia } from '../lib/useMembresia.js'
import { useSesion } from '../lib/useSesion.js'
import { HistorialWeb, InicioSafeLinkWeb } from '../components/SafeLinkWeb.jsx'
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
      <section className="slw-tarjeta mesa-phish" aria-labelledby="mesa-phish-titulo">
        <div className="slw-tarjeta-cabeza">
          <h2 id="mesa-phish-titulo">PhishGuard</h2>
        </div>
        <p className="slw-nota">Simulá correos de phishing en tu empresa o escuela y enseñale a cada persona en el momento en que cae.</p>
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
    <section className="slw-tarjeta mesa-phish" aria-labelledby="mesa-phish-titulo">
      <div className="slw-tarjeta-cabeza">
        <h2 id="mesa-phish-titulo">Tu equipo</h2>
        <Link to={campanas === 0 ? '/panel/campanas' : '/panel/tablero'}>{campanas === 0 ? 'Armar una campaña' : 'Tablero'}</Link>
      </div>
      {!tablero ? (
        <p className="slw-nota">Buscando los datos del equipo…</p>
      ) : correos === 0 ? (
        <p className="slw-nota">{lectura(campanas, correos, clics, datos)}</p>
      ) : (
        <>
          <p className="mesa-phish-dato">
            <strong>{porcentaje}%</strong> tocó el enlace
          </p>
          <div className="mesa-riesgo-pista" aria-hidden="true">
            <span style={{ width: `${porcentaje}%` }} />
          </div>
          <dl className="mesa-phish-cifras">
            <div>
              <dt>Campañas</dt>
              <dd>{campanas}</dd>
            </div>
            <div>
              <dt>Correos</dt>
              <dd>{correos}</dd>
            </div>
            <div>
              <dt>Clics</dt>
              <dd>{clics}</dd>
            </div>
            <div>
              <dt>Cargaron datos</dt>
              <dd>{datos}</dd>
            </div>
          </dl>
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
        <p>Revisá un enlace, un WhatsApp, un correo o un PDF antes de abrirlo.</p>
      </header>
      <InicioSafeLinkWeb lateral={<ResumenPhishGuard acceso={acceso} />} />
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
      <HistorialWeb />
    </div>
  )
}

export default Panel
