import { Link } from 'react-router'
import Marco from '../components/Marco.jsx'
import './Modulo.css'

const incluye = [
  ['Tablero', 'Riesgos detectados y cómo evoluciona la seguridad.'],
  ['PDF mensual', 'Gráficos simples, listos para gerencia o directorio.'],
  ['Usuarios', 'Alta, baja y cambio de plan cuando la organización crece.'],
  ['Plantillas', 'En español, pensadas para la región.'],
  ['En la nube', 'Sin instalar software en cada equipo.'],
  ['Soporte', 'WhatsApp Business y correo, en español.'],
]

const precios = [
  ['1 a 100', '1,00'],
  ['101 a 300', '0,85'],
  ['301 a 600', '0,70'],
  ['Más de 600', '0,55'],
]

function Empresas() {
  return (
    <Marco interior>
      <div className="container pg">
        <section className="pg-banda">
          <div className="pg-banda-cuerpo">
            <div>
              <h1>PhishGuard entrena el criterio, no el firewall.</h1>
              <p>
                Simulación de phishing para PyMEs e instituciones educativas.
                El ataque apunta a la persona: queda registro de lo que pasó y
                una explicación corta, sin sanciones.
              </p>
              <div className="pg-acciones">
                <Link className="pg-cta" to="/adquirir">
                  Adquirir PhishGuard
                </Link>
                <a className="pg-cta-secundario" href="#precios">
                  Ver precios
                </a>
              </div>
            </div>
            <aside className="pg-tablero" aria-label="Vista previa del tablero">
              <h2>Tablero del equipo</h2>
              <ul>
                <li>
                  <strong>19</strong>
                  <span>Clics</span>
                </li>
                <li>
                  <strong>4</strong>
                  <span>Datos ingresados</span>
                </li>
              </ul>
              <p>Ejemplo con datos ficticios</p>
            </aside>
          </div>
        </section>

        <section className="pg-bloque" id="pasos">
          <h2>Cómo funciona una campaña</h2>
          <p>Los cuatro pasos están en la página de inicio.</p>
          <Link className="text-link" to="/#proceso">
            Ver los cuatro pasos <span>→</span>
          </Link>
        </section>

        <section className="pg-bloque pg-incluye">
          <h2>Qué queda en la organización</h2>
          <dl>
            {incluye.map(([titulo, texto]) => (
              <div key={titulo}>
                <dt>{titulo}</dt>
                <dd>{texto}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="pg-bloque" id="precios">
          <h2>Precio por persona, por mes</h2>
          <p className="pg-precio-regla">
            Todos los usuarios pagan la tarifa del tramo en el que cae la
            organización. Facturación mensual, cancelable. Sin contrato anual.
            Cargo mínimo de USD 25 por mes. Pago anual opcional: 15% de
            descuento.
          </p>
          <ul className="pg-precios">
            {precios.map(([rango, valor]) => (
              <li key={rango}>
                <strong>
                  <small>USD</small> {valor}
                </strong>
                <span>{rango} usuarios</span>
              </li>
            ))}
          </ul>
          <p className="pg-precio-nota">
            Con 10 usuarios, el mínimo de USD 25 aplica (USD 2,50 por persona).
          </p>
          <p className="pg-precio-nota">
            Con 150 usuarios, la organización cae en 101 a 300: los 150 pagan
            USD 0,85, o sea USD 127,50 al mes.
          </p>
          <p className="pg-precio-nota">
            Con 100 usuarios pagás USD 100; con 101, USD 85,85.
          </p>
          <Link className="pg-cta adquirir-precio" to="/adquirir">
            Adquirir PhishGuard
          </Link>
        </section>
      </div>
    </Marco>
  )
}

export default Empresas
