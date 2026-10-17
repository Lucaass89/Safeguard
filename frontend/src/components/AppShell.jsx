import { NavLink, Outlet, useLocation } from 'react-router'
import './AppShell.css'

const DESTINOS = [
  { to: '/', fin: true, etiqueta: 'Inicio', icono: 'inicio' },
  { to: '/phishguard', etiqueta: 'PhishGuard', icono: 'phish' },
  { to: '/safelink', etiqueta: 'SafeLink', icono: 'enlace' },
  { to: '/perfil', etiqueta: 'Perfil', icono: 'perfil' },
]

const TITULOS = {
  '/': 'Inicio',
  '/phishguard': 'PhishGuard',
  '/safelink': 'SafeLink',
  '/perfil': 'Perfil',
}

function Icono({ nombre }) {
  const trazo = {
    viewBox: '0 0 24 24',
    width: '24',
    height: '24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (nombre === 'inicio') {
    return (
      <svg {...trazo}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    )
  }

  if (nombre === 'phish') {
    return (
      <svg {...trazo}>
        <path d="M12 3.5 19 6.4v5.2c0 4.2-2.7 7.1-7 8.9-4.3-1.8-7-4.7-7-8.9V6.4L12 3.5Z" />
        <path d="m9.2 12.1 1.9 1.9 3.7-4" />
      </svg>
    )
  }

  if (nombre === 'enlace') {
    return (
      <svg {...trazo}>
        <path d="M10 13.5 13.5 10" />
        <path d="M8.2 11.4 6.8 12.8a3.2 3.2 0 0 0 4.5 4.5l1.4-1.4" />
        <path d="M15.8 12.6 17.2 11.2a3.2 3.2 0 0 0-4.5-4.5L11.3 8.1" />
      </svg>
    )
  }

  return (
    <svg {...trazo}>
      <circle cx="12" cy="8.2" r="3.1" />
      <path d="M5.6 19.2c1.2-2.8 3.4-4.2 6.4-4.2s5.2 1.4 6.4 4.2" />
    </svg>
  )
}

function AppShell({ children }) {
  const { pathname } = useLocation()

  return (
    <div className="app-shell">
      <header className="app-top">
        <p className="app-top-titulo">{TITULOS[pathname] ?? 'SafeGuard'}</p>
      </header>
      <main className="app-cuerpo">
        {children ?? <Outlet />}
      </main>
      <nav className="app-nav" aria-label="Secciones">
        {DESTINOS.map((destino) => (
          <NavLink
            key={destino.to}
            to={destino.to}
            end={destino.fin}
            className={({ isActive }) => (isActive ? 'app-nav-item app-nav-activa' : 'app-nav-item')}
          >
            <span className="app-nav-icono">
              <Icono nombre={destino.icono} />
            </span>
            <span>{destino.etiqueta}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default AppShell
