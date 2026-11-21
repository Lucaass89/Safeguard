import { Navigate, Outlet, useLocation } from 'react-router'
import { destinoTrasIngreso } from '../lib/esAppNativa.js'
import Marco from './Marco.jsx'
import './PanelShell.css'

function PanelShell() {
  const { pathname, search, hash } = useLocation()
  const actual = `${pathname}${search}${hash}`
  const destino = destinoTrasIngreso(actual)
  if (destino !== actual) return <Navigate to={destino} replace />

  return (
    <Marco interior>
      <div className="panel-lienzo container">
        <div className="panel-contenido">
          <Outlet />
        </div>
      </div>
    </Marco>
  )
}

export default PanelShell
