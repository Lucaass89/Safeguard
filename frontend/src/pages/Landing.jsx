import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import CarruselEstafas from '../components/CarruselEstafas.jsx'
import IconoFuncion from '../components/IconoFuncion.jsx'
import Logo from '../components/Logo.jsx'
import PantallasApp from '../components/PantallasApp.jsx'
import ProbadorEnlace from '../components/ProbadorEnlace.jsx'
import TemaControl from '../components/TemaControl.jsx'
import { useSesion } from '../lib/useSesion.js'
import './Portada.css'

const UTILIDADES = {
  extension: ['M9 4.5h3.5v2a1.5 1.5 0 0 0 3 0v-2H19v4.5h-2a1.5 1.5 0 0 0 0 3h2V19h-4.5v-2a1.5 1.5 0 0 0-3 0v2H5v-4.5h2a1.5 1.5 0 0 0 0-3H5V4.5h4z'],
  precios: ['M4 12.5 12.5 4H20v7.5L11.5 20z', 'M15.5 8.5h.01'],
  contacto: ['M4 6.5h16v11H4z', 'm4.5 7 7.5 6 7.5-6'],
  flecha: ['M5 12h14', 'm13 6 6 6-6 6'],
}

function IconoChico({ nombre, className = 'portada-icono-chico' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {UTILIDADES[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

const semaforo = [
  ['verde', 'Verde', 'No vimos nada raro.'],
  ['amarillo', 'Amarillo', 'Hay algo dudoso. Mirá bien antes de seguir.'],
  ['rojo', 'Rojo', 'Parece un engaño. No lo abras.'],
]

const caminos = [
  {
    id: 'safelink',
    icono: 'semaforo',
    etiqueta: 'Gratis',
    para: 'Para vos',
    titulo: 'SafeLink',
    texto: 'Revisá un enlace, un QR, un PDF, un correo o un mensaje de WhatsApp antes de abrirlo. Lo usás en la web, en el celular o en Chrome.',
    destino: '/personas',
    accion: 'Conocer SafeLink',
  },
  {
    id: 'phishguard',
    icono: 'simulacion',
    etiqueta: 'Desde USD 1 por persona',
    para: 'Para tu empresa o escuela',
    titulo: 'PhishGuard',
    texto: 'Le mandamos a tu equipo correos de práctica que imitan estafas reales. Si alguien cae, ve en el momento qué tenía que mirar, sin retos.',
    destino: '/empresas',
    accion: 'Conocer PhishGuard',
  },
]

function Marca() {
  return <Logo className="portada-escudo" />
}

function Landing() {
  const { sesion } = useSesion()
  const cabecera = useRef(null)
  const [menu, setMenu] = useState(false)
  const [baja, setBaja] = useState(false)
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
    alBajar()
    window.addEventListener('scroll', alBajar, { passive: true })
    return () => {
      window.removeEventListener('scroll', alBajar)
    }
  }, [])

  useEffect(() => {
    function afuera(evento) {
      if (cabecera.current?.contains(evento.target)) return
      setMenu(false)
    }
    function alTecla(evento) {
      if (evento.key !== 'Escape') return
      setMenu(false)
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
  }

  return (
    <div className="portada">
      <div className="portada-utilidades">
        <div className="portada-ancho portada-utilidades-fila">
          <p className="portada-utilidades-lema">Hecho en Argentina para que no caigas en estafas por internet</p>
          <nav className="portada-utilidades-enlaces" aria-label="Accesos rápidos">
            <a href="/safelink.zip" download="safelink.zip">
              <IconoChico nombre="extension" />
              Extensión de Chrome
            </a>
            <Link to="/empresas#precios">
              <IconoChico nombre="precios" />
              Precios
            </Link>
            <Link to="/contacto">
              <IconoChico nombre="contacto" />
              Contacto
            </Link>
          </nav>
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
            <Link to="/personas" onClick={cerrar}>Para vos</Link>
            <Link to="/empresas" onClick={cerrar}>Para empresas</Link>
            <Link className="portada-boton portada-boton-menu" to={destino} onClick={cerrar}>
              {etiqueta}
            </Link>
          </nav>
          <div className="portada-acciones">
            <Link className="portada-boton portada-boton-ingresar" to={destino}>
              {etiqueta}
              <IconoChico nombre="flecha" className="portada-flecha" />
            </Link>
            <TemaControl icono />
            <button
              type="button"
              className="portada-hamburguesa"
              aria-label={menu ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menu}
              aria-controls="nav-principal"
              onClick={() => setMenu((abierto) => !abierto)}
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
              <h1>¿Te llegó algo raro? Revisalo antes de abrirlo.</h1>
              <p>
                Pegá el enlace que te mandaron y te decimos con un color si
                parece seguro y por qué. Es gratis.
              </p>
              <div className="portada-hero-acciones">
                <Link className="portada-boton portada-boton-blanco" to="/personas">Probar gratis</Link>
                <Link className="portada-boton portada-boton-borde-blanco" to="/empresas">Soy una empresa</Link>
              </div>
            </div>
            <ProbadorEnlace />
          </div>
        </section>

        <div className="portada-ancho portada-cuerpo">
          <section className="portada-caja portada-caja-dividida">
            <div>
              <h2>Un color y el motivo</h2>
              <p>
                No hace falta saber de computación. Te mostramos un color y te
                explicamos en pocas palabras qué vimos.
              </p>
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

          <section className="portada-beneficios" aria-labelledby="portada-caminos-titulo">
            <div className="portada-beneficios-cabeza">
              <h2 id="portada-caminos-titulo">Dos formas de cuidarte</h2>
            </div>
            <div className="portada-beneficios-grilla">
              {caminos.map((camino) => (
                <Link key={camino.id} id={camino.id} className="portada-beneficio" to={camino.destino}>
                  <span className="portada-beneficio-arriba">
                    <span className="portada-beneficio-icono">
                      <IconoFuncion nombre={camino.icono} className="portada-icono" />
                    </span>
                    <span className="portada-beneficio-modulo">{camino.etiqueta}</span>
                  </span>
                  <span className="portada-beneficio-para">{camino.para}</span>
                  <strong>{camino.titulo}</strong>
                  <span className="portada-beneficio-texto">{camino.texto}</span>
                  <span className="portada-beneficio-mas">
                    {camino.accion}
                    <IconoChico nombre="flecha" className="portada-flecha" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <CarruselEstafas />

          <PantallasApp />
        </div>
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
            <p>SafeGuard te ayuda a reconocer los engaños antes de hacer clic.</p>
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
          <small>© 2026 SafeGuard</small>
          <p className="portada-pie-lema">Antes de hacer clic, SafeGuard. Personas atentas, organizaciones protegidas.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
