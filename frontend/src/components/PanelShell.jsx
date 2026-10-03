import { Outlet } from 'react-router'
import Marco from './Marco.jsx'

function PanelShell() {
  return (
    <Marco interior>
      <div className="panel-lienzo container">
        <Outlet />
      </div>
    </Marco>
  )
}

export default PanelShell
