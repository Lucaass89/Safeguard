import { useEffect } from 'react'
import { Link } from 'react-router'
import { pasosCampana } from '../lib/pasosCampana.js'
import { useSesion } from '../lib/useSesion.js'
import './LandingInicio.css'

const pilares = [
  ['Simulación', 'Campañas de phishing por correo, WhatsApp o SMS, con plantillas en español.'],
  ['Explicación', 'Si alguien cae, ve en el momento qué tenía que mirar. Sin sanciones.'],
  ['Semáforo', 'SafeLink responde verde, amarillo o rojo antes de abrir un enlace, un PDF o un correo.'],
  ['En la nube', 'PhishGuard no se instala en cada equipo. SafeLink avisa: no bloquea la navegación.'],
]

const accesos = [
  ['Enlace', 'Revisá un link antes de abrirlo.', '/panel/enlaces'],
  ['WhatsApp', 'Pegá un mensaje sospechoso.', '/panel/whatsapp'],
  ['PDF', 'Subí un archivo y mirá si esconde algo.', '/panel/pdf'],
  ['Correo', 'Comprobá si el remitente es real.', '/panel/correo'],
]

const semaforo = [
  ['verde', 'Verde', 'No aparecieron señales de riesgo. Podés continuar.'],
  ['amarillo', 'Amarillo', 'Hay algo raro. Revisá antes de seguir.'],
  ['rojo', 'Rojo', 'Fuentes de reputación marcaron esto como peligroso. No lo abras.'],
]

const lugares = [
  ['En la computadora', 'La extensión de Chrome marca la pestaña con un color. Avisa, no bloquea.'],
  ['En el celular', 'La cámara lee el QR y analiza el enlace antes de abrirlo.'],
  ['En el portapapeles', 'Si copiás un enlace peligroso, SafeLink te avisa antes del clic.'],
  ['Con cuenta', 'Cada análisis queda en Mis enlaces. Sin cuenta, el chequeo no se guarda.'],
]

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

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    const previo = meta?.getAttribute('content')
    meta?.setAttribute('content', '#0B0F17')
    return () => {
      if (previo) meta.setAttribute('content', previo)
    }
  }, [])

  return (
    <div className="landing-puertas page">
      <header className="header">
        <div className="shell header-inner">
          <Link className="brand" to="/" aria-label="SafeGuard, inicio">
            <Marca />
            SafeGuard
          </Link>
          <nav className="header-nav" aria-label="Secciones">
            <a href="#phishguard">PhishGuard</a>
            <a href="#safelink">SafeLink</a>
            <Link to="/contacto">Contacto</Link>
          </nav>
          <Link className="login-link" to={sesion ? '/panel' : '/ingresar'}>
            {sesion ? 'Mi panel' : 'Ingresar'}
          </Link>
        </div>
      </header>

      <main className="main">
        <div className="shell">
          <section className="hero">
            <p className="ceja">Protegé el clic</p>
            <h1>
              El ataque no rompe tus sistemas: <span>engaña a tu gente.</span>
            </h1>
            <p className="hero-text">
              SafeGuard tiene dos partes. PhishGuard entrena al equipo con
              simulaciones. SafeLink revisa lo que te llega antes de abrirlo.
            </p>
            <div className="hero-acciones">
              <a className="door-cta" href="#phishguard">Ver PhishGuard</a>
              <a className="door-cta door-cta-ghost" href="#safelink">Conocer SafeLink</a>
            </div>
            <div className="hero-shield" aria-hidden="true">
              <svg viewBox="0 0 200 220" fill="none">
                <path
                  d="M100 16 172 46v62c0 46-30 78-72 96-42-18-72-50-72-96V46L100 16Z"
                  stroke="#60A5FA"
                  strokeWidth="3"
                />
                <path
                  d="M100 40 152 62v42c0 34-22 58-52 72-30-14-52-38-52-72V62L100 40Z"
                  stroke="#2563EB"
                  strokeWidth="1.6"
                  opacity="0.9"
                />
                <circle cx="100" cy="112" r="26" stroke="#3B82F6" strokeWidth="1.4" opacity="0.9" />
              </svg>
              <span>SG</span>
            </div>
          </section>

          <section className="pilares" aria-label="Qué cubre SafeGuard">
            {pilares.map(([titulo, texto]) => (
              <article key={titulo}>
                <h2>{titulo}</h2>
                <p>{texto}</p>
              </article>
            ))}
          </section>

          <section className="accesos">
            <div className="bloque-cabeza">
              <p className="ceja">A un clic</p>
              <h2>Revisá lo que te llega antes de abrirlo.</h2>
            </div>
            <div className="accesos-grilla">
              {accesos.map(([titulo, texto, ruta]) => (
                <Link key={titulo} to={sesion ? ruta : '/ingresar'}>
                  <strong>{titulo}</strong>
                  <span>{texto}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="banda" id="phishguard">
            <div className="banda-texto">
              <p className="ceja">Empresas</p>
              <h2>PhishGuard entrena el criterio, no el firewall.</h2>
              <p>
                Simulación de phishing para PyMEs e instituciones educativas.
                Queda registro de lo que pasó y una explicación corta, sin
                sanciones. Se paga por persona.
              </p>
              <Link className="door-cta" to="/empresas">Ver PhishGuard</Link>
            </div>
            <aside className="tablero" aria-label="Vista previa del tablero">
              <h3>Tablero del equipo</h3>
              <ul>
                <li><strong>19</strong><span>Clics</span></li>
                <li><strong>4</strong><span>Datos ingresados</span></li>
              </ul>
              <p>Ejemplo con datos ficticios</p>
            </aside>
          </section>

          <section className="pasos">
            <div className="bloque-cabeza">
              <p className="ceja">Cómo funciona</p>
              <h2>Una campaña, de punta a punta.</h2>
            </div>
            <ol>
              {pasosCampana.map((paso, i) => (
                <li key={paso.titulo}>
                  <span>{i + 1}</span>
                  <h3>{paso.titulo}</h3>
                  <p>{paso.texto}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="banda banda-inversa" id="safelink">
            <div className="banda-texto">
              <p className="ceja">Personas</p>
              <h2>SafeLink responde con un color, no con un informe.</h2>
              <p>
                Pegá un enlace, un WhatsApp, un PDF o un correo. El semáforo
                dice si conviene abrirlo, y por qué. La cuenta es opcional.
              </p>
              <Link className="door-cta door-cta-ghost" to="/personas">Conocer SafeLink</Link>
            </div>
            <div className="semaforo">
              {semaforo.map(([nivel, titulo, texto]) => (
                <article className={`luz luz-${nivel}`} key={nivel}>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="lugares">
            <div className="bloque-cabeza">
              <p className="ceja">Dónde aparece</p>
              <h2>El aviso llega antes del clic.</h2>
            </div>
            <div className="lugares-grilla">
              {lugares.map(([titulo, texto]) => (
                <article key={titulo}>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="portal">
            <p className="ceja">Tu cuenta</p>
            <h2>Todas las revisiones, en un solo lugar.</h2>
            <p>
              Con cuenta, SafeLink guarda el historial. PhishGuard abre el
              tablero, las campañas y el informe del equipo.
            </p>
            <Link className="door-cta" to={sesion ? '/panel' : '/ingresar'}>
              {sesion ? 'Ir a mi panel' : 'Ingresar'}
            </Link>
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
