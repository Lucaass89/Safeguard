import { Link } from 'react-router'
import Captura from '../components/Captura.jsx'
import Marco from '../components/Marco.jsx'
import { pasosCampana } from '../lib/pasosCampana.js'

function Landing() {
  return (
    <Marco>
      <main id="inicio">
        <section className="hero">
          <div className="container hero-cuerpo">
            <h1>
              El ataque no rompe tus sistemas: <em>engaña a tu gente.</em>
            </h1>
            <div className="hero-pie">
              <p className="hero-lead">
                SafeGuard tiene dos partes. PhishGuard arma simulaciones de
                phishing para tu equipo y, si alguien cae, le explica en el
                momento qué tenía que mirar. SafeLink revisa un enlace, un
                WhatsApp, un PDF o un correo y te dice con un color si conviene
                abrirlo.
              </p>
              <div className="hero-actions">
                <Link className="button button-primary" to="/adquirir">
                  Adquirir PhishGuard <span>→</span>
                </Link>
                <Link className="button button-ghost" to="/personas">
                  Conocer SafeLink <span>→</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="container">
            <Captura
              className="hero-captura"
              src="/capturas/hero.png"
              alt="Panel de PhishGuard con el tablero del equipo"
            />
          </div>
        </section>

        <section className="solucion section-pad" id="solucion">
          <div className="container">
            <div className="solucion-cabeza">
              <h2>Dónde ayuda SafeGuard</h2>
              <p>
                Los engaños que llegan por correo o WhatsApp dependen de que
                alguien haga clic. SafeGuard actúa justo ahí: antes de abrir, con
                SafeLink, y después de caer en una prueba, con PhishGuard.
              </p>
            </div>
            <div className="solucion-items">
              <article>
                <h3>Antes de abrir un enlace</h3>
                <p>
                  Con una cuenta gratis, pegás un enlace, un WhatsApp, un PDF o un
                  correo, y SafeLink responde verde, amarillo o rojo, con el
                  motivo.
                </p>
                <Link className="text-link" to="/personas">
                  Ver SafeLink <span>→</span>
                </Link>
              </article>
              <article>
                <h3>Explicación en el momento</h3>
                <p>
                  Si alguien hace clic, recibe la explicación en el momento, sin
                  exponerlo ni sancionarlo.
                </p>
                <a className="text-link" href="#proceso">
                  Conocer las simulaciones <span>→</span>
                </a>
              </article>
              <article>
                <h3>Tablero del equipo</h3>
                <p>
                  Muestra quién cayó, quién se capacitó y quién mejoró en el
                  refuerzo, por persona y por área.
                </p>
                <Link className="text-link" to="/empresas">
                  Ver PhishGuard <span>→</span>
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="productos" id="productos">
          <div className="container productos-cabeza">
            <h2>Productos</h2>
            <p>PhishGuard se paga por persona. SafeLink es gratis.</p>
          </div>

          <article className="producto-phish">
            <div className="container producto-cuerpo">
              <div className="producto-texto">
                <h3>PhishGuard</h3>
                <p>
                  Simulaciones de phishing por correo, WhatsApp o SMS para PyMEs e
                  instituciones educativas. Queda registrado quién hizo clic o
                  cargó datos, y quien cae ve una explicación corta.
                </p>
                <ul>
                  <li>Registro de clic y datos ingresados</li>
                  <li>Tablero del equipo</li>
                </ul>
                <Link className="text-link" to="/adquirir">
                  Adquirir PhishGuard <span>→</span>
                </Link>
              </div>
              <Captura src="/capturas/phishguard.png" alt="Campaña de PhishGuard en el panel" />
            </div>
          </article>

          <div className="container">
            <article className="producto-safe">
              <div className="producto-texto">
                <h3>SafeLink</h3>
                <p>
                  Un enlace no dice a dónde lleva hasta que hacés clic. SafeLink
                  lo revisa antes y te explica el riesgo con palabras simples.
                  También revisa mensajes de WhatsApp, PDFs y correos.
                </p>
                <ul>
                  <li>Semáforo ✓ verde, ! amarillo o ✕ rojo</li>
                  <li>La cuenta guarda el historial</li>
                  <li>Próximamente: extensión de Chrome</li>
                </ul>
                <Link className="text-link" to="/personas">
                  Probar SafeLink <span>→</span>
                </Link>
              </div>
              <Captura src="/capturas/safelink.png" alt="Resultado de SafeLink con el semáforo" />
            </article>
          </div>
        </section>

        <section className="proceso section-pad" id="proceso">
          <div className="container proceso-cuerpo">
            <h2>Cómo funciona una campaña</h2>
            <ol className="proceso-pasos">
              {pasosCampana.map((paso, i) => (
                <li key={paso.titulo}>
                  <span>{i + 1}</span>
                  <h3>{paso.titulo}</h3>
                  <p>{paso.texto}</p>
                </li>
              ))}
            </ol>
            <Link className="text-link" to="/empresas">
              Ver PhishGuard <span>→</span>
            </Link>
          </div>
        </section>
      </main>
    </Marco>
  )
}

export default Landing
