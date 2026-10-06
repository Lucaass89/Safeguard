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
  const [seccionActiva, setSeccionActiva] = useState('')
  const { pathname, hash } = useLocation()
  const { sesion, cargando } = useSesion()
  const conSesion = Boolean(sesion)
  const navegacion = useRef(null)
  const hamburguesa = useRef(null)

  useEffect(() => {
    if (pathname !== '/') return undefined

    const ids = ['solucion', 'productos', 'proceso']

    function marcar() {
      const headerAlto = document.querySelector('.site-header')?.offsetHeight ?? 83
      const zonaArriba = headerAlto
      const zonaAbajo = window.innerHeight * 0.62
      let mejor = ''
      let maximo = 0

      for (const id of ids) {
        const nodo = document.getElementById(id)
        if (!nodo) continue
        const rect = nodo.getBoundingClientRect()
        const alto = Math.max(0, Math.min(rect.bottom, zonaAbajo) - Math.max(rect.top, zonaArriba))
        if (alto > maximo) {
          maximo = alto
          mejor = id
        }
      }

      setSeccionActiva((actual) => (actual === mejor ? actual : mejor))
    }

    const headerAlto = document.querySelector('.site-header')?.offsetHeight ?? 83
    const observer = new IntersectionObserver(marcar, {
      rootMargin: `-${headerAlto}px 0px -38% 0px`,
      threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
    })

    ids.forEach((id) => {
      const nodo = document.getElementById(id)
      if (nodo) observer.observe(nodo)
    })

    marcar()
    window.addEventListener('scroll', marcar, { passive: true })
    window.addEventListener('resize', marcar)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', marcar)
      window.removeEventListener('resize', marcar)
    }
  }, [pathname])

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

  function alClickAncla(evento) {
    cerrarMenu()
    const enlace = evento.currentTarget.getAttribute('href') ?? ''
    const id = enlace.includes('#') ? enlace.split('#').pop() : ''
    if (!id || pathname !== '/' || hash !== `#${id}`) return
    document.getElementById(id)?.scrollIntoView()
  }

  return (
    <div className="sg-landing">
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
                        className={seccionActiva === 'solucion' ? 'nav-activa' : undefined}
                        to="/#solucion"
                        aria-current={seccionActiva === 'solucion' ? 'true' : undefined}
                        onClick={alClickAncla}
                      >
                        La solución
                      </Link>
                      <Link
                        className={seccionActiva === 'productos' ? 'nav-activa' : undefined}
                        to="/#productos"
                        aria-current={seccionActiva === 'productos' ? 'true' : undefined}
                        onClick={alClickAncla}
                      >
                        Productos
                      </Link>
                      <Link
                        className={seccionActiva === 'proceso' ? 'nav-activa' : undefined}
                        to="/#proceso"
                        aria-current={seccionActiva === 'proceso' ? 'true' : undefined}
                        onClick={alClickAncla}
                      >
                        Cómo funciona
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
