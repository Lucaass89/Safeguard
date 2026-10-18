import { Link, Outlet } from 'react-router'
import { supabase } from '../lib/supabase.js'
import { useSesion } from '../lib/useSesion.js'
import Logo from './Logo.jsx'
import TemaControl from './TemaControl.jsx'
import './Layout.css'

function ShieldMark() {
  return <Logo className="brand-mark" />
}

function Layout() {
  const { sesion } = useSesion()

  return (
    <div className="page">
      <header className="header">
        <div className="shell header-inner">
          <Link className="brand" to="/">
            <ShieldMark />
            SafeGuard
          </Link>

          <div className="header-acciones">
            {!sesion && <TemaControl />}
            {sesion ? (
              <div className="sesion">
                <Link className="login-link" to="/panel">
                  Mi panel
                </Link>
                <Link className="login-link" to="/panel/perfil">
                  Perfil
                </Link>
                <span className="sesion-correo">{sesion.user.email}</span>
                <button
                  type="button"
                  className="login-link"
                  onClick={() => {
                    sessionStorage.removeItem('sg-recibido')
                    sessionStorage.removeItem(`sg-acceso:${sesion.user.id}`)
                    supabase.auth.signOut()
                  }}
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link className="login-link" to="/ingresar">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="shell main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="shell footer-inner">
          <div>
            <p className="footer-marca">SafeGuard</p>
            <p>
              No reemplaza al antivirus ni al firewall: protege el eslabón
              humano.
            </p>
          </div>
          <div className="footer-contacto">
            <p className="footer-rotulo">Contacto</p>
            <p className="footer-enlaces">
              <Link to="/privacidad">Privacidad</Link>
              <Link to="/contacto">Contacto</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
