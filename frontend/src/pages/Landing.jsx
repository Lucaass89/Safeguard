import { useEffect } from 'react'
import { Link } from 'react-router'
import { pasosCampana } from '../lib/pasosCampana.js'
import { useSesion } from '../lib/useSesion.js'
import './LandingInicio.css'

const pilares = [
  ['simulacion', 'Simulación', 'Campañas de phishing por correo, WhatsApp o SMS, con plantillas en español.'],
  ['explicacion', 'Explicación', 'Si alguien cae, ve en el momento qué tenía que mirar. Sin sanciones.'],
  ['semaforo', 'Semáforo', 'SafeLink responde verde, amarillo o rojo antes de abrir un enlace, un PDF o un correo.'],
  ['nube', 'En la nube', 'PhishGuard no se instala en cada equipo. SafeLink avisa: no bloquea la navegación.'],
]

const accesos = [
  ['enlace', 'Enlace', 'Revisá un link antes de abrirlo.', '/panel/enlaces'],
  ['whatsapp', 'WhatsApp', 'Pegá un mensaje sospechoso.', '/panel/whatsapp'],
  ['pdf', 'PDF', 'Subí un archivo y mirá si esconde algo.', '/panel/pdf'],
  ['correo', 'Correo', 'Comprobá si el remitente es real.', '/panel/correo'],
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

function IconoPaso({ indice }) {
  const comunes = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.6',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  if (indice === 0) {
    return (
      <svg className="paso-icono" {...comunes}>
        <path d="m4.2 3 11.2 8.2H11L8.6 16.4 6.8 15.6 9.2 11.2 6.4 13.6 4.2 3Z" />
        <path d="M16.4 4.6a2.6 2.6 0 0 1 0 3.4" />
        <path d="M18.6 2.8a5 5 0 0 1 0 7" />
      </svg>
    )
  }
  if (indice === 1) {
    return (
      <svg className="paso-icono" {...comunes}>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="m4.5 7 7.5 5.5L19.5 7" />
      </svg>
    )
  }
  if (indice === 2) {
    return (
      <svg className="paso-icono" {...comunes}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 16v-3" />
        <path d="M12 16V9" />
        <path d="M16 16v-6" />
      </svg>
    )
  }
  return (
    <svg className="paso-icono" {...comunes}>
      <path d="M6 5.5h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 3v-3H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
      <path d="M12 13.4h.01" />
      <path d="M12 8.2a1.8 1.8 0 0 1 1.8 1.8c0 1.3-1.8 1.6-1.8 2.8" />
    </svg>
  )
}

function IconoLinea({ nombre }) {
  const comunes = {
    className: 'tarjeta-icono',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.6',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  if (nombre === 'simulacion') {
    return (
      <svg {...comunes}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5" />
      </svg>
    )
  }
  if (nombre === 'explicacion') {
    return (
      <svg {...comunes}>
        <path d="M9 18h6M10 21h4" />
        <path d="M8.2 14.2A5.5 5.5 0 1 1 15.8 14c-.8.7-1.3 1.4-1.5 2.4h-4.6c-.2-1-.7-1.7-1.5-2.2Z" />
      </svg>
    )
  }
  if (nombre === 'semaforo') {
    return (
      <svg {...comunes}>
        <rect x="8" y="2.5" width="8" height="19" rx="3" />
        <circle cx="12" cy="7" r="1.3" />
        <circle cx="12" cy="12" r="1.3" />
        <circle cx="12" cy="17" r="1.3" />
      </svg>
    )
  }
  if (nombre === 'nube') {
    return (
      <svg {...comunes}>
        <path d="M7 18h9.2a3.8 3.8 0 0 0 .6-7.6 5 5 0 0 0-9.6-1.2A3.4 3.4 0 0 0 7 18Z" />
      </svg>
    )
  }
  if (nombre === 'enlace') {
    return (
      <svg {...comunes}>
        <path d="M10 13a4 4 0 0 0 5.7.4l2.3-2.3a4 4 0 0 0-5.7-5.6L11 6.8" />
        <path d="M14 11a4 4 0 0 0-5.7-.4L6 12.9a4 4 0 0 0 5.7 5.6L13 17.2" />
      </svg>
    )
  }
  if (nombre === 'whatsapp') {
    return (
      <svg {...comunes}>
        <path d="M6.5 17.5 5 20l2.6-1.2A8 8 0 1 0 6.5 17.5Z" />
        <path d="M9 10.2c.2 1.6 1.6 3 3.2 3.4" />
      </svg>
    )
  }
  if (nombre === 'pdf') {
    return (
      <svg {...comunes}>
        <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
        <path d="M14 3.5V8h4.5M9 13h6M9 16.5h4" />
      </svg>
    )
  }
  return (
    <svg {...comunes}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </svg>
  )
}

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
    meta?.setAttribute('content', '#070b10')
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
                  stroke="#22d3ee"
                  strokeWidth="2.4"
                />
                <path
                  d="M100 40 152 62v42c0 34-22 58-52 72-30-14-52-38-52-72V62L100 40Z"
                  stroke="#3b82f6"
                  strokeWidth="1.4"
                  opacity="0.85"
                />
                <circle cx="100" cy="112" r="26" stroke="#67e8f9" strokeWidth="1.2" opacity="0.9" />
              </svg>
              <span>SG</span>
            </div>
          </section>

          <section className="pilares" aria-label="Qué cubre SafeGuard">
            {pilares.map(([icono, titulo, texto]) => (
              <article key={titulo}>
                <IconoLinea nombre={icono} />
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
              {accesos.map(([icono, titulo, texto, ruta]) => (
                <Link key={titulo} to={sesion ? ruta : '/ingresar'}>
                  <IconoLinea nombre={icono} />
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
                  <div className="paso-cabeza">
                    <IconoPaso indice={i} />
                    <span>{i + 1}</span>
                  </div>
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
