import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { supabase } from '../lib/supabase.js'
import { useSesion } from '../lib/useSesion.js'
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

function Marco({ children, interior = false }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState('')
  const { pathname, hash } = useLocation()
  const { sesion } = useSesion()

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

  function cerrarMenu() {
    setMenuAbierto(false)
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
          <Link to="/" aria-label="SafeGuard, inicio" onClick={cerrarMenu}>
            <Marca />
          </Link>
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            aria-controls="main-nav"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            <span />
            <span />
          </button>
          <nav className={menuAbierto ? 'main-nav open' : 'main-nav'} id="main-nav">
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
            <div className="nav-app">
              {sesion ? (
                <>
                  <Link to="/panel" onClick={cerrarMenu}>
                    Panel
                  </Link>
                  <button
                    className="nav-cta"
                    type="button"
                    onClick={() => {
                      sessionStorage.removeItem('sg-recibido')
                      supabase.auth.signOut()
                    }}
                  >
                    Salir
                  </button>
                </>
              ) : (
                <Link className="nav-cta" to="/ingresar" onClick={cerrarMenu}>
                  Ingresar <span>↗</span>
                </Link>
              )}
            </div>
          </nav>
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
