import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Bienvenida from '../components/Bienvenida.jsx'
import ElegirApp from '../components/ElegirApp.jsx'
import PhishGuardWeb from '../components/PhishGuardWeb.jsx'
import { HistorialWeb, InicioSafeLinkWeb } from '../components/SafeLinkWeb.jsx'
import { supabase } from '../lib/supabase.js'
import { esAdministrador, useMembresia } from '../lib/useMembresia.js'
import { useSesion } from '../lib/useSesion.js'
import './Panel.css'

function primerNombre(nombre, email) {
  const limpio = (nombre || '').trim()
  if (!limpio || limpio === email) return ''
  return limpio.split(/\s+/)[0]
}

function appPedida() {
  if (typeof window === 'undefined') return null
  const parametros = new URLSearchParams(window.location.search)
  const app = parametros.get('app')
  if (app === 'safelink' || app === 'phishguard') return app
  if (parametros.get('url')) return 'safelink'
  return null
}

function Panel() {
  const { sesion } = useSesion()
  const { rol, cargando: cargandoMembresia } = useMembresia()
  const [tablero, setTablero] = useState(null)
  const acceso = cargandoMembresia ? null : esAdministrador(rol)
  const [faseElegida, setFase] = useState(() => appPedida() ?? 'elegir')
  const fase = faseElegida === 'phishguard' && acceso === false ? 'elegir' : faseElegida
  const nombre = sesion.user.user_metadata?.full_name ?? sesion.user.user_metadata?.name ?? sesion.user.email
  const saludo = primerNombre(nombre, sesion.user.email)

  function marcarRecibido() {
    sessionStorage.setItem('sg-recibido', sesion.user.id)
  }

  function volverAElegir() {
    marcarRecibido()
    setFase('elegir')
    const url = new URL(window.location.href)
    url.searchParams.delete('app')
    url.searchParams.delete('url')
    window.history.replaceState(null, '', `${url.pathname}${url.search}`)
  }

  useEffect(() => {
    let activo = true

    supabase.rpc('phishguard_tablero').then(
      ({ data, error }) => {
        if (!activo || error || !data?.organizacion) return
        setTablero({
          organizacion: data.organizacion,
          empleados: Array.isArray(data.empleados) ? data.empleados : [],
          eventos: Array.isArray(data.eventos) ? data.eventos : [],
          campanas: Array.isArray(data.campanas) ? data.campanas : [],
        })
      },
      () => {},
    )

    return () => {
      activo = false
    }
  }, [sesion.user.id])

  return (
    <div className="panel mesa">
      <Bienvenida />
      {fase === 'elegir' && (
        <ElegirApp
          nombre={saludo}
          acceso={acceso}
          tablero={tablero}
          onElegir={(app) => {
            marcarRecibido()
            setFase(app)
          }}
        />
      )}

      {fase === 'safelink' && <InicioSafeLinkWeb onVolver={volverAElegir} />}

      {fase === 'phishguard' && acceso && <PhishGuardWeb tablero={tablero} onVolver={volverAElegir} />}
    </div>
  )
}

export function PanelHistorial() {
  return (
    <div className="panel mesa mesa-inicio">
      <Link className="elegir-volver" to="/panel?app=safelink">
        ← Volver a SafeLink
      </Link>
      <header className="mesa-bienvenida">
        <h1 className="mesa-saludo">Historial</h1>
        <p>Todo lo que revisaste con SafeLink, en la web y en la app.</p>
      </header>
      <HistorialWeb />
    </div>
  )
}

export default Panel
