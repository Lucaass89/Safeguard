import { Navigate, Outlet } from 'react-router'
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

  if (vistaLocal()) {
    return (
      <ContextoSesion.Provider value={{ sesion: sesionVista, cargando: false }}>
        <Outlet />
      </ContextoSesion.Provider>
    )
  }

  if (cargando) return <p className="panel-estado">Verificando tu sesión…</p>
  if (!sesion) return <Navigate to="/ingresar" replace />
  return <Outlet />
}

export default RutaPrivada
