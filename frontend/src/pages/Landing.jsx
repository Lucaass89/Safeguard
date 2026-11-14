import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import ElegirPersonas from '../components/ElegirPersonas.jsx'
import IconoFuncion from '../components/IconoFuncion.jsx'
import Logo from '../components/Logo.jsx'
import ProbadorEnlace from '../components/ProbadorEnlace.jsx'
import TemaControl from '../components/TemaControl.jsx'
import { pasosCampana } from '../lib/pasosCampana.js'
import { PERSONAS_POR_DEFECTO, precioPhishguard } from '../lib/precioPhishguard.js'
import { useSesion } from '../lib/useSesion.js'
import './Portada.css'

const accesos = [
  ['enlace', 'Enlace', 'Revisá un link antes de abrirlo.'],
  ['whatsapp', 'WhatsApp', 'Pegá un mensaje sospechoso.'],
  ['pdf', 'PDF', 'Subí un archivo y mirá si esconde algo.'],
  ['correo', 'Correo', 'Comprobá si el remitente es real.'],
]

const beneficios = [
  ['simulacion', 'Práctica con casos reales', 'Campañas de phishing simulado por correo, con plantillas en español de bancos, ARCA, envíos y Mercado Libre.'],
  ['explicacion', 'Aprendizaje en el momento', 'Si alguien cae, ve enseguida qué tenía que mirar. No hay sanciones ni exposición.'],
  ['semaforo', 'Un color y el motivo', 'SafeLink responde verde, amarillo o rojo, y explica por qué, antes de abrir un enlace, un PDF o un correo.'],
  ['nube', 'Sin instalar nada', 'PhishGuard funciona en la nube. SafeLink avisa y no bloquea la navegación.'],
]

const comoTrabaja = [
  {
    icono: 'enlace',
    titulo: 'Enlace',
    como: 'Primero mira la dirección en tu dispositivo: si imita a una marca conocida, si usa letras parecidas o trucos para disfrazarse. Después la abre por vos, sigue a dónde lleva de verdad, se fija hace cuánto existe el sitio y si la página pide claves o datos de tarjeta.',
    con: 'Reglas propias, una lista de 44 marcas argentinas y conocidas, registros públicos de dominios y certificados, y los reportes de otras personas.',
  },
  {
    icono: 'qr',
    titulo: 'Código QR',
    como: 'La cámara lee el código y te muestra qué trae antes de abrirlo: una página, una red WiFi, un contacto o un pago. Si es una página, la revisa como un enlace. Si es un pago, controla que el código y el CBU sean válidos.',
    con: 'La cámara del celular y un lector de QR que funciona dentro de tu dispositivo.',
  },
  {
    icono: 'pdf',
    titulo: 'PDF',
    como: 'Lo revisa sin subirlo: el archivo no sale de tu dispositivo. Busca lo que un PDF común no necesita, como programas escondidos, acciones que se ejecutan solas o archivos adjuntos, y revisa cada enlace que trae.',
    con: 'Un lector de PDF que funciona en tu navegador.',
  },
  {
    icono: 'correo',
    titulo: 'Correo',
    como: 'Mira quién lo mandó de verdad: si el servidor que lo envió está autorizado, si el nombre que ves coincide con la dirección real, si al contestar la respuesta se va a otro lado y si los enlaces llevan a donde dicen.',
    con: 'Los controles que traen los correos para comprobar el remitente y el mismo análisis de enlaces.',
  },
  {
    icono: 'whatsapp',
    titulo: 'WhatsApp',
    como: 'Lee el mensaje buscando los engaños más comunes: el cuento del número nuevo, el pedido del código de verificación, premios, apuro, pedidos de CBU o de instalar una app. Los enlaces se revisan aparte.',
    con: 'Frases y patrones de estafas reales en español y el análisis de enlaces.',
  },
  {
    icono: 'extension',
    titulo: 'Extensión de Chrome',
    como: 'Revisa cada página que abrís y pinta el ícono de la barra con el color. Avisa, no bloquea: vos decidís si seguís.',
    con: 'El mismo detector de SafeLink, adentro de Chrome.',
  },
  {
    icono: 'faro',
    titulo: 'Faro',
    como: 'Si un resultado te deja dudas, le preguntás a Faro y te lo explica con palabras simples. No cambia el color, solo lo explica.',
    con: 'Un asistente de inteligencia artificial (Gemini, de Google).',
  },
]

const semaforo = [
  ['verde', 'Verde', 'No aparecieron señales de riesgo.'],
  ['amarillo', 'Amarillo', 'Hay algo raro. Revisá antes de seguir.'],
  ['rojo', 'Rojo', 'Hay señales fuertes de engaño. No lo abras.'],
]

const lugares = [
  'En la computadora: la extensión de Chrome marca la pestaña con un color.',
  'En el celular: la cámara lee el QR y revisa el enlace antes de abrirlo.',
  'En el portapapeles: si copiás un enlace peligroso, te avisa antes del clic.',
  'Con cuenta: cada análisis queda guardado en Mis enlaces.',
]

const cifras = [
  ['5', 'formatos que revisa SafeLink: enlace, QR, PDF, correo y WhatsApp'],
  ['4', 'colores posibles en el semáforo, cada uno con su motivo'],
  ['USD 1', 'por persona por mes en PhishGuard, con un mínimo de USD 25'],
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
  return <Logo className="portada-escudo" />
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
      className="portada-menu"
      onMouseEnter={onAbrir}
      onMouseLeave={onCerrar}
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) onCerrar()
      }}
    >
      <button
        type="button"
        className={activo ? 'portada-menu-disparador portada-menu-activo' : 'portada-menu-disparador'}
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
      <div className="portada-menu-panel" id={id} hidden={!abierto}>
        <a href={href} onClick={onCerrar}>
          <span className="portada-menu-icono">
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
      meta?.setAttribute('content', claro ? '#ffffff' : '#070d1a')
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

  const [personas, setPersonas] = useState(String(PERSONAS_POR_DEFECTO))
  const precio = precioPhishguard(personas)
  const destinoPago = `/adquirir?personas=${precio ? precio.personas : PERSONAS_POR_DEFECTO}`

  return (
    <div className="portada">
      <div className="portada-utilidades">
        <div className="portada-ancho portada-utilidades-fila">
          <a href="/safelink.zip" download="safelink.zip">Extensión de Chrome</a>
          <Link to="/empresas#precios">Precios</Link>
          <Link to="/contacto">Contacto</Link>
        </div>
      </div>

      <header ref={cabecera} className={baja ? 'portada-cabecera portada-cabecera-baja' : 'portada-cabecera'}>
        <div className="portada-ancho portada-cabecera-fila">
          <Link className="portada-marca" to="/" aria-label="SafeGuard, ir al inicio" onClick={cerrar}>
            <Marca />
            <span>
              Safe<span>Guard</span>
            </span>
          </Link>
          <nav
            className={menu ? 'portada-nav portada-nav-abierta' : 'portada-nav'}
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
            <Link to="/empresas" onClick={cerrar}>Empresas</Link>
            <Link to="/personas" onClick={cerrar}>Personas</Link>
            <Link className="portada-boton portada-boton-menu" to={destino} onClick={cerrar}>
              {etiqueta}
            </Link>
          </nav>
          <div className="portada-acciones">
            <Link className="portada-boton" to={destino}>
              {etiqueta}
            </Link>
            <TemaControl icono />
            <button
              type="button"
              className="portada-hamburguesa"
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

      <main>
        <section className="portada-hero">
          <div className="portada-ancho portada-hero-grilla">
            <div className="portada-hero-texto">
              <h1>El ataque no rompe tus sistemas. Engaña a tu gente.</h1>
              <p>
                SafeGuard tiene dos partes. PhishGuard entrena al equipo con
                simulaciones de phishing. SafeLink revisa lo que te llega antes
                de abrirlo.
              </p>
              <div className="portada-hero-acciones">
                <a className="portada-boton portada-boton-blanco" href="#phishguard">Ver PhishGuard</a>
                <a className="portada-boton portada-boton-borde-blanco" href="#safelink">Conocer SafeLink</a>
              </div>
            </div>
            <ProbadorEnlace />
          </div>
        </section>

        <div className="portada-ancho portada-cuerpo">
          <section className="portada-caja portada-caja-dividida" id="safelink">
            <div>
              <h2>Sabemos dónde engaña el phishing</h2>
              <p>
                Un enlace que imita a tu banco, un QR pegado en la calle, un PDF
                con un link escondido. SafeLink los revisa con un detector
                propio y responde con un color y el motivo.
              </p>
              <Link className="portada-boton" to="/personas">Conocer SafeLink</Link>
            </div>
            <ul className="portada-luces" aria-label="Los colores del semáforo">
              {semaforo.map(([nivel, titulo, texto]) => (
                <li key={nivel} className={`portada-luz portada-luz-${nivel}`}>
                  <strong>{titulo}</strong>
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="portada-como" aria-labelledby="portada-como-titulo">
            <div className="portada-como-cabeza">
              <h2 id="portada-como-titulo">Cómo trabaja SafeLink</h2>
              <p>
                Cada señal sospechosa suma puntos y el total da el color. Para
                llegar a rojo hace falta al menos una señal fuerte, así no te
                asustamos por un detalle. El color lo decide nuestro propio
                detector, que probamos con más de 3.000 direcciones entre sitios
                conocidos e imitaciones de marcas.
              </p>
            </div>
            <div className="portada-como-grilla">
              {comoTrabaja.map((funcion) => (
                <article key={funcion.titulo} className="portada-como-tarjeta">
                  <span className="portada-beneficio-icono">
                    <IconoFuncion nombre={funcion.icono} className="portada-icono" />
                  </span>
                  <h3>{funcion.titulo}</h3>
                  <p>{funcion.como}</p>
                  <p className="portada-como-con">
                    <strong>Con qué:</strong> {funcion.con}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="portada-dos-columnas" aria-label="Qué es SafeGuard">
            <p>
              SafeGuard es una plataforma argentina contra el phishing. Parte de
              una idea simple: el antivirus y el firewall no frenan a una
              persona apurada que hace clic. Por eso trabaja sobre el criterio
              de la gente, en el momento en que decide.
            </p>
            <ul>
              <li>Para la persona, SafeLink es gratis y la cuenta es opcional.</li>
              <li>Para la empresa, PhishGuard se paga por persona, sin contrato anual.</li>
              <li>Todo en español rioplatense, con casos de la región.</li>
            </ul>
          </section>

          <section className="portada-servicio" id="phishguard">
            <div>
              <h2>PhishGuard entrena el criterio, no el firewall</h2>
              <p>
                Simulación de phishing para PyMEs e instituciones educativas.
                Queda registro de lo que pasó y quien cae ve una explicación
                corta, sin sanciones.
              </p>
              <Link className="portada-boton" to="/empresas">Ver PhishGuard</Link>
            </div>
            <aside className="portada-tablero" aria-label="Vista previa del tablero">
              <h3>Tablero del equipo</h3>
              <div className="portada-tablero-barras" aria-hidden="true">
                <span style={{ height: '42%' }} />
                <span style={{ height: '68%' }} />
                <span style={{ height: '50%' }} />
                <span style={{ height: '84%' }} />
                <span style={{ height: '60%' }} />
              </div>
              <ul>
                <li><strong>19</strong><span>Clics</span></li>
                <li><strong>4</strong><span>Datos ingresados</span></li>
              </ul>
              <p>Ejemplo con datos ficticios</p>
            </aside>
          </section>

          <section className="portada-beneficios">
            <h2>¿Qué obtenés con SafeGuard?</h2>
            <div className="portada-beneficios-grilla">
              {beneficios.map(([icono, titulo, texto]) => (
                <Link key={titulo} className="portada-beneficio" to={`/funcion/${icono}`}>
                  <span className="portada-beneficio-icono">
                    <IconoFuncion nombre={icono} className="portada-icono" />
                  </span>
                  <span>
                    <strong>{titulo}</strong>
                    <span>{texto}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="portada-caja portada-caja-dividida">
            <div>
              <h2>Te cuida donde estés</h2>
              <ul className="portada-lista">
                {lugares.map((texto) => (
                  <li key={texto}>{texto}</li>
                ))}
              </ul>
            </div>
            <div className="portada-accesos">
              {accesos.map(([icono, titulo, texto]) => (
                <Link key={titulo} to={`/funcion/${icono}`}>
                  <IconoFuncion nombre={icono} className="portada-icono" />
                  <strong>{titulo}</strong>
                  <span>{texto}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="portada-pasos">
            <h2>Una campaña, de punta a punta</h2>
            <ol>
              {pasosCampana.map((paso, i) => (
                <li key={paso.titulo}>
                  <span className="portada-paso-icono">
                    <IconoPaso indice={i} />
                  </span>
                  <span>
                    <strong>{i + 1}. {paso.titulo}</strong>
                    <span>{paso.texto}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="portada-cifras" aria-label="SafeGuard en números">
          <div className="portada-ancho portada-cifras-fila">
            {cifras.map(([valor, texto]) => (
              <p key={valor}>
                <strong>{valor}</strong>
                <span>{texto}</span>
              </p>
            ))}
          </div>
        </section>

        <section className="portada-cierre">
          <div className="portada-ancho">
            <div className="portada-cierre-tarjeta">
              <div>
                <h2>Probá PhishGuard en tu empresa</h2>
                <p>
                  Elegí cuántas personas va a cubrir el plan y mirá el precio.
                  Se paga una vez por el primer mes, sin suscripción automática.
                </p>
                <Link className="portada-enlace" to="/empresas#precios">Ver todos los tramos</Link>
              </div>
              <div>
                <ElegirPersonas valor={personas} onCambiar={setPersonas} />
                <Link className="portada-boton portada-boton-ancho" to={destinoPago}>
                  Adquirir PhishGuard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="portada-pie">
        <div className="portada-ancho portada-pie-grilla">
          <div>
            <Link className="portada-marca portada-marca-pie" to="/" aria-label="SafeGuard, ir al inicio">
              <Marca />
              <span>
                Safe<span>Guard</span>
              </span>
            </Link>
            <p>SafeGuard no reemplaza al antivirus ni al firewall: protege el eslabón humano.</p>
          </div>
          <nav aria-label="Productos">
            <h2>Productos</h2>
            <Link to="/empresas">PhishGuard</Link>
            <Link to="/personas">SafeLink</Link>
            <a href="/safelink.zip" download="safelink.zip">Extensión de Chrome</a>
          </nav>
          <nav aria-label="Cuenta">
            <h2>Cuenta</h2>
            <Link to={destino}>{etiqueta}</Link>
            <Link to="/empresas#precios">Precios</Link>
            <Link to="/contacto">Contacto</Link>
          </nav>
          <nav aria-label="Legales">
            <h2>Legales</h2>
            <Link to="/terminos">Términos y condiciones</Link>
            <Link to="/privacidad">Privacidad</Link>
          </nav>
        </div>
        <div className="portada-ancho portada-pie-final">
          <small>© 2026 SafeGuard. Trabajo final de Analista de Sistemas.</small>
        </div>
      </footer>
    </div>
  )
}

export default Landing
