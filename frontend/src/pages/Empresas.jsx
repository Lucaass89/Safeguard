import { useState } from 'react'
import { Link } from 'react-router'
import ElegirPersonas from '../components/ElegirPersonas.jsx'
import Marco from '../components/Marco.jsx'
import { PERSONAS_POR_DEFECTO, precioPhishguard, TRAMOS } from '../lib/precioPhishguard.js'
import { pasosCampana } from '../lib/pasosCampana.js'
import './Modulo.css'

const incluye = [
  ['Tablero', 'Riesgos detectados y cómo evoluciona la seguridad.'],
  ['Aviso', 'Un correo corto cuando alguien toca el enlace.'],
  ['Informe', 'Quién tocó el enlace, quién se capacitó y quién mejoró. Se guarda o se imprime.'],
  ['Usuarios', 'Alta, baja y cambio de plan cuando la organización crece.'],
  ['Plantillas', 'Bancos, ARCA, colegios, envíos y Mercado Libre, en español.'],
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
  const [personas, setPersonas] = useState(String(PERSONAS_POR_DEFECTO))
  const precio = precioPhishguard(personas)
  const destino = `/adquirir?personas=${precio ? precio.personas : PERSONAS_POR_DEFECTO}`

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
          <ol className="pg-riel">
            {pasosCampana.map((paso, i) => (
              <li key={paso.titulo}>
                <span>{i + 1}</span>
                <h3>{paso.titulo}</h3>
                <p>{paso.texto}</p>
              </li>
            ))}
          </ol>
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
            organización, con un mínimo de USD 25 por mes. No hay suscripción
            automática ni pago anual. El plan cubre la cantidad de personas que
            elegís, con un margen del 10 % para sumar a alguien de último momento.
          </p>
          <ul className="pg-precios">
            {precios.map(([rango, valor], i) => (
              <li key={rango} className={precio?.tramo === TRAMOS[i] ? 'pg-precio-activo' : undefined}>
                <strong>
                  <small>USD</small> {valor}
                </strong>
                <span>{rango} usuarios</span>
              </li>
            ))}
          </ul>
          <h3 className="pg-calcular">Calculá cuánto pagás</h3>
          <ElegirPersonas valor={personas} onCambiar={setPersonas} />
          <p className="pg-precio-pago">
            Mercado Pago cobra en pesos el primer mes del plan que elegís, con
            USD 1 = $ 1.500, en un pago único. Con ese pago se desbloquea
            PhishGuard en tu cuenta.
          </p>
          <p className="pg-precio-nota">
            Al adquirir PhishGuard aceptás los{' '}
            <Link to="/terminos">términos y condiciones de servicio</Link>. El
            ejercicio es de capacitación: los resultados no se usan para sancionar.
          </p>
          <Link className="pg-cta adquirir-precio" to={destino}>
            Adquirir PhishGuard
          </Link>
        </section>
      </div>
    </Marco>
  )
}

export default Empresas
