import { Navigate, Outlet, useLocation } from 'react-router'
import { esAppNativa } from '../lib/esAppNativa.js'
import { ContextoSesion, useSesion } from '../lib/useSesion.js'
import '../pages/Panel.css'

const sesionVista = {
  user: {
    id: 'vista',
    email: 'vista@safeguard.local',
    user_metadata: { full_name: 'Vista previa' },
  },
}

function vistaLocal() {
  if (!import.meta.env.DEV) return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('vista') === '1') sessionStorage.setItem('sg-vista', '1')
  return sessionStorage.getItem('sg-vista') === '1'
}

function RutaPrivada() {
  const { sesion, cargando } = useSesion()
  const { pathname, search, hash } = useLocation()

  if (vistaLocal()) {
    return (
      <ContextoSesion.Provider value={{ sesion: sesionVista, cargando: false }}>
        <Outlet />
      </ContextoSesion.Provider>
    )
  }

  if (cargando) return <p className="panel-estado">Verificando tu sesión…</p>
  if (!sesion) {
    if (!esAppNativa()) return <Navigate to="/ingresar" replace />
    const volver = encodeURIComponent(`${pathname}${search}${hash}`)
    return <Navigate to={`/ingresar?volver=${volver}`} replace />
  }
  return <Outlet />
}

export default RutaPrivada
