import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { destinoTrasIngreso } from '../lib/esAppNativa.js'
import Marco from './Marco.jsx'
import './PanelShell.css'

const SECCIONES = [
  {
    titulo: 'General',
    enlaces: [['/panel', 'Inicio', 'inicio', true]],
  },
  {
    titulo: 'SafeLink',
    enlaces: [
      ['/panel/enlaces', 'Enlaces', 'enlace'],
      ['/panel/whatsapp', 'WhatsApp', 'mensaje'],
      ['/panel/pdf', 'PDF', 'archivo'],
      ['/panel/correo', 'Correo', 'correo'],
    ],
  },
  {
    titulo: 'PhishGuard',
    enlaces: [
      ['/panel/empresa', 'Empresa', 'empresa'],
      ['/panel/campanas', 'Campañas', 'campana'],
      ['/panel/tablero', 'Tablero', 'tablero'],
      ['/panel/informe', 'Informe', 'informe'],
    ],
  },
  {
    titulo: 'Cuenta',
    enlaces: [['/panel/perfil', 'Perfil', 'perfil']],
  },
]

const TRAZOS = {
  inicio: ['M4 11.5 12 5l8 6.5', 'M6.5 10v8.5h11V10'],
  enlace: ['M10 13.5 13.5 10', 'M8.4 11.6 7 13a3.4 3.4 0 0 0 4.8 4.8l1.4-1.4', 'M15.6 12.4 17 11a3.4 3.4 0 0 0-4.8-4.8L10.8 7.6'],
  mensaje: ['M5 18.5 6.2 15A7 7 0 1 1 9 17.8L5 18.5Z'],
  archivo: ['M7 3.5h7l4 4v13H7z', 'M14 3.5v4h4', 'M9.5 13h5', 'M9.5 16h5'],
  correo: ['M4 6.5h16v11H4z', 'm4.5 7 7.5 6 7.5-6'],
  empresa: ['M5 20V6.5L12 4l7 2.5V20', 'M9 9.5h1.5M13.5 9.5H15M9 13h1.5M13.5 13H15', 'M10.5 20v-3.5h3V20'],
  campana: ['M4.5 10.5 17 5v14l-12.5-5.5z', 'M7.5 15.5 9 19.5'],
  tablero: ['M4 19.5h16', 'M7 16.5v-4', 'M12 16.5V7.5', 'M17 16.5v-7'],
  informe: ['M6.5 3.5h11v17h-11z', 'M9 8h6M9 11.5h6M9 15h4'],
  perfil: ['M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', 'M5 20a7 7 0 0 1 14 0'],
}

function Icono({ nombre }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

function PanelShell() {
  const { pathname, search, hash } = useLocation()
  const actual = `${pathname}${search}${hash}`
  const destino = destinoTrasIngreso(actual)
  if (destino !== actual) return <Navigate to={destino} replace />

  return (
    <Marco interior>
      <div className="panel-lienzo container panel-con-barra">
        <aside className="panel-barra" aria-label="Secciones del panel">
          <nav>
            {SECCIONES.map((seccion) => (
              <div className="panel-barra-grupo" key={seccion.titulo}>
                <p className="panel-barra-titulo">{seccion.titulo}</p>
                <ul>
                  {seccion.enlaces.map(([ruta, nombre, icono, exacta]) => (
                    <li key={ruta}>
                      <NavLink
                        to={ruta}
                        end={Boolean(exacta)}
                        className={({ isActive }) => (isActive ? 'panel-barra-enlace panel-barra-activo' : 'panel-barra-enlace')}
                      >
                        <Icono nombre={icono} />
                        <span>{nombre}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>
        <div className="panel-contenido">
          <Outlet />
        </div>
      </div>
    </Marco>
  )
}

export default PanelShell
