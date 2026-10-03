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
  const { pathname, hash } = useLocation()
  const { sesion } = useSesion()

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
            <Link to="/#solucion" onClick={alClickAncla}>
              La solución
            </Link>
            <Link to="/#productos" onClick={alClickAncla}>
              Productos
            </Link>
            <Link to="/#proceso" onClick={alClickAncla}>
              Cómo funciona
            </Link>
            {sesion ? (
              <>
                <Link to="/panel" onClick={cerrarMenu}>
                  Panel
                </Link>
                <button
                  className="nav-cta"
                  type="button"
                  onClick={() => supabase.auth.signOut()}
                >
                  Salir
                </button>
              </>
            ) : (
              <Link className="nav-cta" to="/ingresar" onClick={cerrarMenu}>
                Ingresar <span>↗</span>
              </Link>
            )}
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
            <Link to="/#solucion" onClick={alClickAncla}>
              Solución
            </Link>
            <Link to="/#productos" onClick={alClickAncla}>
              Productos
            </Link>
            <Link to="/ingresar">Ingresar</Link>
          </div>
          <small>© 2026 SafeGuard</small>
        </div>
      </footer>
    </div>
  )
}

export default Marco
