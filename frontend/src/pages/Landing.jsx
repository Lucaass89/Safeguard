import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import IconoFuncion from '../components/IconoFuncion.jsx'
import Logo from '../components/Logo.jsx'
import TemaControl from '../components/TemaControl.jsx'
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
  ['enlace', 'Enlace', 'Revisá un link antes de abrirlo.'],
  ['whatsapp', 'WhatsApp', 'Pegá un mensaje sospechoso.'],
  ['pdf', 'PDF', 'Subí un archivo y mirá si esconde algo.'],
  ['correo', 'Correo', 'Comprobá si el remitente es real.'],
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

function Marca() {
  return <Logo className="brand-escudo" />
}

function IconoProducto({ nombre }) {
  const trazo = {
    viewBox: '0 0 24 24',
    width: '22',
    height: '22',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (nombre === 'phish') {
    return (
      <svg {...trazo}>
        <path d="M12 3.5 19 6.4v5.2c0 4.2-2.7 7.1-7 8.9-4.3-1.8-7-4.7-7-8.9V6.4L12 3.5Z" />
        <path d="m9.2 12.1 1.9 1.9 3.7-4" />
      </svg>
    )
  }

  return (
    <svg {...trazo}>
      <path d="M10 13.5 13.5 10" />
      <path d="M8.2 11.4 6.8 12.8a3.2 3.2 0 0 0 4.5 4.5l1.4-1.4" />
      <path d="M15.8 12.6 17.2 11.2a3.2 3.2 0 0 0-4.5-4.5L11.3 8.1" />
    </svg>
  )
}

function MenuProducto({ id, titulo, texto, href, icono, abierto, activo, onAbrir, onCerrar }) {
  return (
    <div
      className="header-menu"
      onMouseEnter={onAbrir}
      onMouseLeave={onCerrar}
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) onCerrar()
      }}
    >
      <button
        type="button"
        className={activo ? 'header-menu-disparador header-activo' : 'header-menu-disparador'}
        aria-expanded={abierto}
        aria-controls={id}
        aria-current={activo ? 'true' : undefined}
        onClick={() => (abierto ? onCerrar() : onAbrir())}
      >
        {titulo}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <div className="header-menu-panel" id={id} hidden={!abierto}>
        <a href={href} onClick={onCerrar}>
          <span className="header-menu-icono">
            <IconoProducto nombre={icono} />
          </span>
          <span>
            <strong>{titulo}</strong>
            <span>{texto}</span>
          </span>
        </a>
      </div>
    </div>
  )
}

function Landing() {
  const { sesion } = useSesion()
  const cabecera = useRef(null)
  const [menu, setMenu] = useState(false)
  const [producto, setProducto] = useState(null)
  const [baja, setBaja] = useState(false)
  const [seccion, setSeccion] = useState(() => window.location.hash)
  const destino = sesion ? '/panel' : '/ingresar'
  const etiqueta = sesion ? 'Mi panel' : 'Ingresar'

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    const previo = meta?.getAttribute('content')

    function pintar() {
      const claro = document.documentElement.dataset.tema !== 'oscuro'
      meta?.setAttribute('content', claro ? '#f3eee6' : '#070b10')
    }

    pintar()
    window.addEventListener('sg-tema', pintar)
    return () => {
      window.removeEventListener('sg-tema', pintar)
      if (previo) meta?.setAttribute('content', previo)
    }
  }, [])

  useEffect(() => {
    function alBajar() {
      setBaja(window.scrollY > 8)
    }
    function alHash() {
      setSeccion(window.location.hash)
    }
    alBajar()
    window.addEventListener('scroll', alBajar, { passive: true })
    window.addEventListener('hashchange', alHash)
    return () => {
      window.removeEventListener('scroll', alBajar)
      window.removeEventListener('hashchange', alHash)
    }
  }, [])

  useEffect(() => {
    function afuera(evento) {
      if (cabecera.current?.contains(evento.target)) return
      setMenu(false)
      setProducto(null)
    }
    function alTecla(evento) {
      if (evento.key !== 'Escape') return
      setMenu(false)
      setProducto(null)
    }
    document.addEventListener('mousedown', afuera)
    window.addEventListener('keydown', alTecla)
    return () => {
      document.removeEventListener('mousedown', afuera)
      window.removeEventListener('keydown', alTecla)
    }
  }, [])

  function cerrar() {
    setMenu(false)
    setProducto(null)
  }

  return (
    <div className="landing-puertas page">
      <header ref={cabecera} className={baja ? 'header header-baja' : 'header'}>
        <div className="shell header-inner">
          <Link className="brand" to="/" aria-label="SafeGuard, ir al inicio" onClick={cerrar}>
            <Marca />
            <span className="brand-nombre">
              <span className="brand-safe">Safe</span>
              <span className="brand-guard">Guard</span>
            </span>
          </Link>
          <nav
            className={menu ? 'header-nav header-nav-abierta' : 'header-nav'}
            id="nav-principal"
            aria-label="Secciones"
          >
            <MenuProducto
              id="menu-phishguard"
              titulo="PhishGuard"
              texto="Simulaciones de phishing para el equipo."
              href="#phishguard"
              icono="phish"
              abierto={producto === 'phish'}
              activo={seccion === '#phishguard'}
              onAbrir={() => setProducto('phish')}
              onCerrar={() => setProducto((actual) => (actual === 'phish' ? null : actual))}
            />
            <MenuProducto
              id="menu-safelink"
              titulo="SafeLink"
              texto="Revisá enlaces y mensajes antes de abrirlos."
              href="#safelink"
              icono="enlace"
              abierto={producto === 'safe'}
              activo={seccion === '#safelink'}
              onAbrir={() => setProducto('safe')}
              onCerrar={() => setProducto((actual) => (actual === 'safe' ? null : actual))}
            />
            <Link to="/contacto" onClick={cerrar}>Contacto</Link>
            <Link className="header-cta header-cta-menu" to={destino} onClick={cerrar}>
              {etiqueta}
            </Link>
          </nav>
          <div className="header-acciones">
            <Link className="header-cta" to={destino}>
              {etiqueta}
            </Link>
            <TemaControl icono />
            <button
              type="button"
              className="header-hamburguesa"
              aria-label={menu ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menu}
              aria-controls="nav-principal"
              onClick={() => {
                setProducto(null)
                setMenu((abierto) => !abierto)
              }}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
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
              <Logo />
            </div>
          </section>

          <section className="pilares" aria-label="Qué cubre SafeGuard">
            {pilares.map(([icono, titulo, texto]) => (
              <Link key={titulo} className="pilar" to={`/funcion/${icono}`}>
                <article>
                  <IconoFuncion nombre={icono} />
                  <h2>{titulo}</h2>
                  <p>{texto}</p>
                </article>
              </Link>
            ))}
          </section>

          <section className="accesos">
            <div className="bloque-cabeza">
              <p className="ceja">A un clic</p>
              <h2>Revisá lo que te llega antes de abrirlo.</h2>
            </div>
            <div className="accesos-grilla">
              {accesos.map(([icono, titulo, texto]) => (
                <Link key={titulo} to={`/funcion/${icono}`}>
                  <IconoFuncion nombre={icono} />
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
            <Link to="/terminos">Términos y condiciones</Link>
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/contacto">Contacto</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
