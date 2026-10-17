import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { supabase } from '../lib/supabase.js'
import { useMembresia } from '../lib/useMembresia.js'
import { useSesion } from '../lib/useSesion.js'
import Avatar from './Avatar.jsx'
import TemaControl from './TemaControl.jsx'
import '../pages/Landing.css'

function Marca() {
  return (
    <span className="brand">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>
        Safe<span>Guard</span>
      </span>
    </span>
  )
}

function etiquetaRol(rol) {
  if (rol === 'Admin_Principal') return 'Administrador principal'
  if (rol === 'Tecnico') return 'Técnico'
  if (typeof rol === 'string' && rol.trim()) return rol.trim()
  return ''
}

function nombreVisible(usuario) {
  const meta = usuario.user_metadata ?? {}
  const nombre = (meta.full_name || meta.name || '').trim()
  if (!nombre || nombre === usuario.email) return ''
  return nombre
}

function MenuCuenta({ sesion }) {
  const [abierto, setAbierto] = useState(false)
  const [empresa, setEmpresa] = useState(null)
  const caja = useRef(null)
  const boton = useRef(null)
  const usuario = sesion.user
  const { pathname } = useLocation()
  const { pertenece, rol, organizacionId, cargando: cargandoMembresia } = useMembresia()
  const nombre = nombreVisible(usuario)
  const correo = usuario.email ?? ''
  const empresaLista = !organizacionId || empresa !== null
  const lineaEmpresa = pertenece && !cargandoMembresia && empresaLista
    ? [empresa, etiquetaRol(rol)].filter(Boolean).join(' · ')
    : ''

  useEffect(() => {
    setAbierto(false)
  }, [pathname])

  useEffect(() => {
    if (!organizacionId) {
      setEmpresa(null)
      return undefined
    }

    let activo = true
    supabase
      .from('organizaciones')
      .select('nombre_empresa')
      .eq('id', organizacionId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!activo) return
        if (error) {
          setEmpresa('')
          return
        }
        setEmpresa((data?.nombre_empresa ?? '').trim())
      })

    return () => {
      activo = false
    }
  }, [organizacionId])

  useEffect(() => {
    if (!abierto) return undefined

    function alClick(evento) {
      if (!caja.current?.contains(evento.target)) setAbierto(false)
    }

    function alTecla(evento) {
      if (evento.key !== 'Escape') return
      setAbierto(false)
      boton.current?.focus()
    }

    document.addEventListener('mousedown', alClick)
    document.addEventListener('keydown', alTecla)
    return () => {
      document.removeEventListener('mousedown', alClick)
      document.removeEventListener('keydown', alTecla)
    }
  }, [abierto])

  function moverFoco(evento) {
    if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return
    const items = [...caja.current.querySelectorAll('[role="menuitem"]')]
    if (!items.length) return
    evento.preventDefault()
    const actual = items.indexOf(document.activeElement)
    const delta = evento.key === 'ArrowDown' ? 1 : -1
    const siguiente = actual === -1
      ? (evento.key === 'ArrowDown' ? 0 : items.length - 1)
      : (actual + delta + items.length) % items.length
    items[siguiente].focus()
  }

  function salir() {
    setAbierto(false)
    sessionStorage.removeItem('sg-recibido')
    sessionStorage.removeItem(`sg-acceso:${usuario.id}`)
    supabase.auth.signOut()
  }

  return (
    <div className="nav-cuenta-menu" ref={caja} onKeyDown={moverFoco}>
      <button
        ref={boton}
        className="nav-cuenta-boton"
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls="menu-cuenta"
        aria-label="Abrir menú de cuenta"
        onClick={() => setAbierto((valor) => !valor)}
      >
        <Avatar user={usuario} size={40} />
      </button>
      {abierto && (
        <div className="nav-menu" id="menu-cuenta" role="menu" aria-label="Cuenta">
          <div className="nav-menu-quien">
            {nombre && <strong>{nombre}</strong>}
            {correo && <span>{correo}</span>}
            {lineaEmpresa && <span className="nav-menu-empresa">{lineaEmpresa}</span>}
          </div>
          <hr className="nav-menu-linea" />
          <Link role="menuitem" tabIndex={-1} to="/panel/perfil" onClick={() => setAbierto(false)}>
            Perfil
          </Link>
          <button className="nav-menu-salir" type="button" role="menuitem" tabIndex={-1} onClick={salir}>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

function Marco({ children, interior = false }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { pathname, hash } = useLocation()
  const { sesion, cargando } = useSesion()
  const [noche, setNoche] = useState(
    () => document.documentElement.dataset.tema === 'oscuro',
  )
  const conSesion = Boolean(sesion)
  const navegacion = useRef(null)
  const hamburguesa = useRef(null)

  useEffect(() => {
    function alCambiar() {
      setNoche(document.documentElement.dataset.tema === 'oscuro')
    }
    window.addEventListener('sg-tema', alCambiar)
    return () => window.removeEventListener('sg-tema', alCambiar)
  }, [])

  useEffect(() => {
    if (!noche) return undefined
    const meta = document.querySelector('meta[name="theme-color"]')
    const previo = meta?.getAttribute('content')
    meta?.setAttribute('content', '#070814')
    return () => {
      if (previo) meta?.setAttribute('content', previo)
    }
  }, [noche])

  useEffect(() => {
    const id = hash.startsWith('#') ? decodeURIComponent(hash.slice(1)) : ''
    const destino = id ? document.getElementById(id) : null
    if (destino) {
      destino.scrollIntoView()
      return
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  useEffect(() => {
    setMenuAbierto(false)
  }, [pathname, hash])

  useEffect(() => {
    if (!menuAbierto) return
    navegacion.current?.querySelector('a, button')?.focus()
  }, [menuAbierto])

  useEffect(() => {
    if (!menuAbierto) return undefined

    function alClick(evento) {
      if (navegacion.current?.contains(evento.target) || hamburguesa.current?.contains(evento.target)) return
      setMenuAbierto(false)
    }

    function alTecla(evento) {
      if (evento.key !== 'Escape') return
      setMenuAbierto(false)
      hamburguesa.current?.focus()
    }

    document.addEventListener('mousedown', alClick)
    document.addEventListener('keydown', alTecla)
    return () => {
      document.removeEventListener('mousedown', alClick)
      document.removeEventListener('keydown', alTecla)
    }
  }, [menuAbierto])

  function cerrarMenu() {
    setMenuAbierto(false)
  }

  function alternarMenu() {
    setMenuAbierto((abierto) => !abierto)
  }

  return (
    <div className={noche ? 'sg-landing sg-noche' : 'sg-landing'}>
      <header className="site-header">
        <div className="container nav-wrap">
          <div className="nav-inicio">
            <Link to="/" aria-label="SafeGuard, inicio" onClick={cerrarMenu}>
              <Marca />
            </Link>
            {conSesion && (
              <Link
                className={pathname.startsWith('/panel') ? 'nav-panel nav-panel-fijo nav-activa' : 'nav-panel nav-panel-fijo'}
                to="/panel"
              >
                Panel
              </Link>
            )}
          </div>
          <div className="nav-fin">
            {!cargando && (
              <button
                ref={hamburguesa}
                className="menu-toggle"
                type="button"
                aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={menuAbierto}
                aria-controls="main-nav"
                onClick={alternarMenu}
              >
                <span />
                <span />
              </button>
            )}
            {!cargando && (
              <nav
                ref={navegacion}
                className={
                  conSesion
                    ? `main-nav nav-solo-movil${menuAbierto ? ' open' : ''}`
                    : menuAbierto
                      ? 'main-nav open'
                      : 'main-nav'
                }
                id="main-nav"
              >
                {conSesion ? (
                  <Link
                    className={pathname.startsWith('/panel') ? 'nav-panel nav-activa' : 'nav-panel'}
                    to="/panel"
                    onClick={cerrarMenu}
                  >
                    Panel
                  </Link>
                ) : (
                  <>
                    <div className="nav-publico">
                      <Link
                        className={pathname === '/empresas' ? 'nav-activa' : undefined}
                        to="/empresas"
                        aria-current={pathname === '/empresas' ? 'page' : undefined}
                        onClick={cerrarMenu}
                      >
                        PhishGuard
                      </Link>
                      <Link
                        className={pathname === '/personas' ? 'nav-activa' : undefined}
                        to="/personas"
                        aria-current={pathname === '/personas' ? 'page' : undefined}
                        onClick={cerrarMenu}
                      >
                        SafeLink
                      </Link>
                    </div>
                    <Link className="nav-cta" to="/ingresar" onClick={cerrarMenu}>
                      Ingresar <span>→</span>
                    </Link>
                  </>
                )}
              </nav>
            )}
            <TemaControl icono />
            {conSesion && <MenuCuenta sesion={sesion} />}
          </div>
        </div>
      </header>

      {interior ? <div className="pagina-interior">{children}</div> : children}

      <footer className="site-footer">
        <div className="container footer-wrap">
          <Link to="/" aria-label="SafeGuard, inicio">
            <Marca />
          </Link>
          <p>La seguridad empieza con una mejor decisión.</p>
          <div className="footer-links">
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/contacto">Contacto</Link>
          </div>
          <small>© 2026 SafeGuard</small>
        </div>
      </footer>
    </div>
  )
}

export default Marco
