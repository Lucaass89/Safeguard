import { Link } from 'react-router'
import Marco from '../components/Marco.jsx'
import './Modulo.css'

const pasos = [
  {
    titulo: 'Armás la campaña',
    texto:
      'Elegís destinatarios, fecha de envío y nivel de dificultad, sobre plantillas basadas en estafas reales de la región.',
  },
  {
    titulo: 'Llegan los correos',
    texto:
      'El sistema envía la simulación en el horario programado, imitando engaños que de verdad circulan por acá.',
  },
  {
    titulo: 'Se registra qué pasó',
    texto:
      'Queda guardado si el empleado abrió el correo, hizo clic en el enlace o llegó a ingresar sus datos.',
  },
  {
    titulo: 'Se explica en el momento',
    texto:
      'Si alguien cae, recibe una explicación de 1 a 2 minutos de por qué era riesgoso. Sin exponerlo ni sancionarlo.',
  },
]

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
          <p className="pg-kicker">Para empresas</p>
          <div className="pg-banda-cuerpo">
            <div>
              <h1>PhishGuard entrena el criterio, no el firewall.</h1>
              <p>
                Simulación de phishing para PyMEs e instituciones educativas.
                El ataque apunta a la persona: queda registro de lo que pasó y
                una explicación corta, sin sanciones.
              </p>
            </div>
            <Link className="pg-cta" to="/ingresar">
              Ingresar a PhishGuard
            </Link>
          </div>
        </section>

        <section className="pg-bloque">
          <h2>De la campaña al aprendizaje</h2>
          <ol className="pg-riel">
            {pasos.map((paso, i) => (
              <li key={paso.titulo}>
                <span>{String(i + 1).padStart(2, '0')}</span>
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

        <section className="pg-bloque">
          <div className="pg-precio-cabeza">
            <h2>Precio por persona, por mes</h2>
            <p>
              Facturación mensual, cancelable. Sin contrato anual ni mínimo de
              usuarios. Cargo mínimo de USD 25. Pago anual: 15% de descuento.
            </p>
          </div>
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
        </section>

        <p className="pg-volver">
          <Link to="/">Volver al inicio</Link>
        </p>
      </div>
    </Marco>
  )
}

export default Empresas
