import { Link, NavLink, Outlet, useLocation } from 'react-router'
import Bienvenida from './Bienvenida.jsx'
import Logo from './Logo.jsx'
import { esAdministrador, useMembresia } from '../lib/useMembresia.js'
import '../lib/portapapeles.js'
import { useRegistrarAvisos } from '../lib/useAvisos.js'
import { useSesion } from '../lib/useSesion.js'
import './AppShell.css'

const DESTINOS = [
  { to: '/', fin: true, etiqueta: 'Inicio', icono: 'inicio' },
  { to: '/phishguard', etiqueta: 'PhishGuard', icono: 'phish' },
  { to: '/safelink', etiqueta: 'SafeLink', icono: 'enlace', excepto: '/safelink/qr' },
  { to: '/perfil', etiqueta: 'Perfil', icono: 'perfil' },
]

function tituloDe(pathname) {
  if (pathname.startsWith('/phishguard')) return 'PhishGuard'
  if (pathname.startsWith('/safelink')) return 'SafeLink'
  if (pathname.startsWith('/perfil')) return 'Perfil'
  return 'Inicio'
}

function Icono({ nombre, relleno = false }) {
  const trazo = {
    viewBox: '0 0 24 24',
    width: '24',
    height: '24',
    fill: relleno ? 'currentColor' : 'none',
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
        <path d="m9.2 12.1 1.9 1.9 3.7-4" fill="none" stroke={relleno ? '#ffffff' : 'currentColor'} />
      </svg>
    )
  }

  if (nombre === 'qr') {
    return (
      <svg {...trazo}>
        <path d="M4.5 8.5V6.2A1.7 1.7 0 0 1 6.2 4.5H8.5" />
        <path d="M15.5 4.5h2.3A1.7 1.7 0 0 1 19.5 6.2V8.5" />
        <path d="M19.5 15.5v2.3a1.7 1.7 0 0 1-1.7 1.7H15.5" />
        <path d="M8.5 19.5H6.2a1.7 1.7 0 0 1-1.7-1.7V15.5" />
        <path d="M7.5 12h9" />
      </svg>
    )
  }

  if (nombre === 'empresa') {
    return (
      <svg {...trazo}>
        <path d="M4 20V6.5A1.5 1.5 0 0 1 5.5 5H11v15" />
        <path d="M11 9.5h7.5A1.5 1.5 0 0 1 20 11V20" />
        <path d="M4 20h16M7.5 8.5h1.5M7.5 12h1.5M14 13h1.5M14 16.5h1.5" />
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

const RELLENABLES = new Set(['inicio', 'phish'])

function ItemNav({ destino }) {
  const { pathname } = useLocation()
  const fuera = Boolean(destino.excepto) && pathname.startsWith(destino.excepto)

  return (
    <NavLink
      to={destino.to}
      end={destino.fin}
      className={({ isActive }) => (isActive && !fuera ? 'app-nav-item app-nav-activa' : 'app-nav-item')}
      aria-current={fuera ? 'false' : undefined}
    >
      {({ isActive }) => (
        <>
          <span className="app-nav-icono">
            <Icono nombre={destino.icono} relleno={isActive && !fuera && RELLENABLES.has(destino.icono)} />
          </span>
          <span>{destino.etiqueta}</span>
        </>
      )}
    </NavLink>
  )
}

function AppShell({ children }) {
  const { pathname } = useLocation()
  const { sesion, cargando } = useSesion()
  const membresia = useMembresia()
  const admin = Boolean(sesion) && !cargando && !membresia.cargando && esAdministrador(membresia.rol)
  useRegistrarAvisos(sesion)

  return (
    <div className="app-shell">
      <header className="app-top">
        {pathname === '/' ? (
          <p className="app-top-titulo app-top-marca">
            <Logo className="app-top-logo" />
            <span>
              Safe<span>Guard</span>
            </span>
          </p>
        ) : (
          <p className="app-top-titulo">{tituloDe(pathname)}</p>
        )}
        <div className="app-top-acciones">
          {pathname === '/phishguard' && admin && (
            <Link className="app-top-equipo" to="/phishguard/empresa">
              <Icono nombre="empresa" />
              <span>Tu empresa</span>
            </Link>
          )}
        </div>
      </header>
      <main className="app-cuerpo">
        {children ?? <Outlet />}
      </main>
      <Bienvenida />
      <nav className="app-nav" aria-label="Secciones">
        {DESTINOS.slice(0, 2).map((destino) => (
          <ItemNav key={destino.to} destino={destino} />
        ))}
        <NavLink
          to="/safelink/qr"
          className={({ isActive }) => (isActive ? 'app-nav-qr app-nav-qr-activo' : 'app-nav-qr')}
          aria-label="Escanear un QR"
        >
          <span className="app-nav-qr-boton">
            <Icono nombre="qr" />
          </span>
          <span>QR</span>
        </NavLink>
        {DESTINOS.slice(2).map((destino) => (
          <ItemNav key={destino.to} destino={destino} />
        ))}
      </nav>
    </div>
  )
}

export default AppShell
