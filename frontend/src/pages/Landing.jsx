import { Link } from 'react-router'
import { useSesion } from '../lib/useSesion.js'
import './LandingInicio.css'

function Marca() {
  return (
    <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5 4.5 5.6v6.1c0 4.6 3.1 8.4 7.5 9.8 4.4-1.4 7.5-5.2 7.5-9.8V5.6L12 2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m8.6 12.2 2.4 2.4 4.4-4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Landing() {
  const { sesion } = useSesion()

  return (
    <div className="landing-puertas page">
      <header className="header">
        <div className="shell header-inner">
          <Link className="brand" to="/" aria-label="SafeGuard, inicio">
            <Marca />
            SafeGuard
          </Link>
          <Link className="login-link" to={sesion ? '/panel' : '/ingresar'}>
            {sesion ? 'Mi panel' : 'Ingresar'}
          </Link>
        </div>
      </header>

      <main className="main">
        <div className="shell">
          <section className="hero">
            <h1>
              El ataque no rompe tus sistemas: <span>engaña a tu gente.</span>
            </h1>
            <p className="hero-text">
              SafeGuard tiene dos partes. PhishGuard arma simulaciones de
              phishing para tu equipo y, si alguien cae, le explica en el
              momento qué tenía que mirar. SafeLink revisa un enlace, un
              WhatsApp, un PDF o un correo y te dice con un color si conviene
              abrirlo.
            </p>
            <div className="hero-shield" aria-hidden="true">
              <svg viewBox="0 0 200 220" fill="none">
                <path
                  d="M100 16 172 46v62c0 46-30 78-72 96-42-18-72-50-72-96V46L100 16Z"
                  stroke="#2864e8"
                  strokeWidth="3"
                />
                <path
                  d="M100 40 152 62v42c0 34-22 58-52 72-30-14-52-38-52-72V62L100 40Z"
                  stroke="#35bea8"
                  strokeWidth="1.6"
                  opacity="0.85"
                />
                <circle cx="100" cy="112" r="26" stroke="#2864e8" strokeWidth="1.4" opacity="0.55" />
              </svg>
              <span>SG</span>
            </div>
          </section>

          <section className="doors">
            <article className="door door-empresas">
              <p className="door-tag">Empresas</p>
              <h2 className="door-title">PhishGuard</h2>
              <p className="door-text">
                Simulaciones de phishing por correo, WhatsApp o SMS. Queda
                registrado quién hizo clic y quien cae ve una explicación corta,
                sin sanciones.
              </p>
              <p className="door-meta">Se paga por persona</p>
              <Link className="door-cta" to="/empresas">
                Ver PhishGuard
              </Link>
            </article>
            <article className="door door-personas">
              <p className="door-tag">Personas</p>
              <h2 className="door-title">SafeLink</h2>
              <p className="door-text">
                Pegá un enlace, un WhatsApp, un PDF o un correo. SafeLink
                responde verde, amarillo o rojo, con el motivo, antes de que lo
                abras.
              </p>
              <p className="door-meta">Gratis</p>
              <Link className="door-cta" to="/personas">
                Conocer SafeLink
              </Link>
            </article>
          </section>
        </div>
      </main>

      <footer className="footer">
        <div className="shell footer-linea">
          <p>SafeGuard no reemplaza al antivirus ni al firewall: protege el eslabón humano.</p>
          <p className="footer-enlaces">
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/contacto">Contacto</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
