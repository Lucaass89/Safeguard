import { useState } from 'react'
import { Link } from 'react-router'
import ElegirPersonas from '../components/ElegirPersonas.jsx'
import Marco from '../components/Marco.jsx'
import { PERSONAS_POR_DEFECTO, precioPhishguard, TRAMOS } from '../lib/precioPhishguard.js'
import { pasosCampana } from '../lib/pasosCampana.js'
import './Empresas.css'

const PARA_QUIEN = ['PyMEs', 'Colegios e institutos', 'Correo, WhatsApp y SMS', 'Sin instalar nada']

const AREAS_EJEMPLO = [
  ['Administración', 38],
  ['Ventas', 24],
  ['Depósito', 12],
]

const TRAZOS = {
  tablero: ['M4 19.5h16', 'M7 16v-5', 'M12 16V7', 'M17 16v-8'],
  aviso: ['M4 6.5h16v11H4z', 'm4.5 7 7.5 6 7.5-6'],
  informe: ['M7 3.5h7l4 4v13H7z', 'M14 3.5v4h4', 'M10 12h5', 'M10 15.5h5'],
  personas: ['M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M3.5 19.5a5.5 5.5 0 0 1 11 0', 'M16 5.5a3 3 0 0 1 0 5.5', 'M17.5 14.5a5.5 5.5 0 0 1 3 5'],
  plantillas: ['M4 4.5h7v7H4z', 'M13 4.5h7v7h-7z', 'M4 13.5h7v7H4z', 'M13 13.5h7v7h-7z'],
  soporte: ['M6 5.5h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 3v-3a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z', 'M9 11h.01M12 11h.01M15 11h.01'],
}

const incluye = [
  ['tablero', 'Tablero', 'Qué porcentaje tocó el enlace, cómo cambia de una campaña a otra y qué áreas reforzar.'],
  ['aviso', 'Aviso en el momento', 'Te llega un correo corto cuando alguien toca el enlace.'],
  ['informe', 'Informe', 'Quién tocó el enlace, quién se capacitó y quién mejoró. Se guarda o se imprime.'],
  ['personas', 'Tu equipo', 'Sumás o sacás personas de a una o con una planilla de Excel, separadas por área.'],
  ['plantillas', 'Mensajes listos', 'Bancos, ARCA, colegios, envíos y Mercado Libre, escritos como llegan en Argentina.'],
  ['soporte', 'Soporte en español', 'Por WhatsApp Business y correo, para que no te trabes en ningún paso.'],
]

const RANGOS = ['1 a 100', '101 a 300', '301 a 600', 'Más de 600']
const VALORES = ['1,00', '0,85', '0,70', '0,55']

const preguntas = [
  [
    '¿Se sanciona a quien cae?',
    'No. Es un ejercicio de capacitación: la persona ve en el momento por qué era riesgoso y a las 3 semanas recibe un refuerzo. Los resultados no se usan para sancionar.',
  ],
  [
    '¿Hay que instalar algo en las computadoras?',
    'No. Todo funciona en la web. Quien administra entra con su cuenta de SafeGuard.',
  ],
  [
    '¿Se renueva solo?',
    'No. Pagás el primer mes en un pago único con Mercado Pago, en pesos. No hay suscripción automática ni pago anual.',
  ],
  [
    '¿Qué pasa si se suma alguien al equipo?',
    'El plan tiene un margen del 10 % sobre las personas que elegiste, para sumar a alguien de último momento sin cambiar nada.',
  ],
]

function Icono({ nombre }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

function Ejemplo() {
  const porcentaje = 24
  const radio = 34
  const vuelta = 2 * Math.PI * radio
  return (
    <aside className="em-ejemplo" aria-label="Ejemplo de lo que ves en el tablero">
      <p className="em-ejemplo-eti">Así se ve tu tablero</p>
      <h2>Campaña «Aviso del banco»</h2>
      <div className="em-ejemplo-anillo">
        <svg viewBox="0 0 80 80" width="96" height="96" aria-hidden="true">
          <circle cx="40" cy="40" r={radio} className="em-anillo-fondo" />
          <circle
            cx="40"
            cy="40"
            r={radio}
            className="em-anillo-valor"
            strokeDasharray={`${(vuelta * porcentaje) / 100} ${vuelta}`}
            transform="rotate(-90 40 40)"
          />
        </svg>
        <div>
          <strong>{porcentaje} %</strong>
          <span>tocó el enlace</span>
          <span className="em-ejemplo-mejora">12 puntos menos que la campaña anterior</span>
        </div>
      </div>
      <ul className="em-ejemplo-areas">
        {AREAS_EJEMPLO.map(([area, valor]) => (
          <li key={area}>
            <span>{area}</span>
            <span className="em-barra" aria-hidden="true">
              <span style={{ width: `${valor}%` }} />
            </span>
            <b>{valor} %</b>
          </li>
        ))}
      </ul>
      <p className="em-ejemplo-nota">Ejemplo con datos ficticios</p>
    </aside>
  )
}

function Empresas() {
  const [personas, setPersonas] = useState(String(PERSONAS_POR_DEFECTO))
  const precio = precioPhishguard(personas)
  const destino = `/adquirir?personas=${precio ? precio.personas : PERSONAS_POR_DEFECTO}`

  return (
    <Marco interior>
      <div className="em">
        <section className="em-hero" aria-labelledby="em-titulo">
          <div className="em-ancho em-hero-cuerpo">
            <div>
              <p className="em-eti">PhishGuard · Para empresas e instituciones</p>
              <h1 id="em-titulo">Que tu equipo aprenda a reconocer la estafa antes de que llegue la de verdad.</h1>
              <p className="em-sub">
                Le mandás a tu equipo un mensaje de phishing simulado. Si alguien cae, ve en el momento por qué era
                riesgoso, y vos ves en el tablero quién necesita reforzar. Sin sanciones.
              </p>
              <div className="em-acciones">
                <Link className="em-boton" to={destino}>
                  Adquirir PhishGuard
                </Link>
                <a className="em-boton-sec" href="#precios">
                  Ver precios
                </a>
              </div>
              <ul className="em-chips" aria-label="Para quién es">
                {PARA_QUIEN.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <Ejemplo />
          </div>
        </section>

        <div className="em-ancho em-cuerpo">
          <section aria-labelledby="em-pasos">
            <h2 id="em-pasos">Cómo funciona una campaña</h2>
            <ol className="em-pasos">
              {pasosCampana.map((paso, i) => (
                <li key={paso.titulo}>
                  <span className="em-paso-numero">{i + 1}</span>
                  <h3>{paso.titulo}</h3>
                  <p>{paso.texto}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="em-incluye">
            <h2 id="em-incluye">Qué tenés en el panel</h2>
            <div className="em-incluye">
              {incluye.map(([icono, titulo, texto]) => (
                <article key={titulo} className="em-item">
                  <span className="em-item-icono">
                    <Icono nombre={icono} />
                  </span>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="precios" className="em-precios" aria-labelledby="em-precios-titulo">
            <div className="em-precios-texto">
              <p className="em-eti">Precio</p>
              <h2 id="em-precios-titulo">Pagás por persona, por mes</h2>
              <p>
                Todas las personas pagan la tarifa del tramo en el que cae tu organización, con un mínimo de USD 25 por
                mes. El plan cubre la cantidad que elegís, con un margen del 10 %.
              </p>
              <ul className="em-tramos">
                {RANGOS.map((rango, i) => (
                  <li key={rango} className={precio?.tramo === TRAMOS[i] ? 'em-tramo-activo' : undefined}>
                    <span>{rango} personas</span>
                    <strong>
                      <small>USD</small> {VALORES[i]}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
            <div className="em-calculadora">
              <ElegirPersonas valor={personas} onCambiar={setPersonas} />
              <p className="em-pago">
                Mercado Pago cobra en pesos el primer mes, en un pago único. Con ese pago se activa PhishGuard en tu
                cuenta.
              </p>
              <Link className="em-boton" to={destino}>
                Adquirir PhishGuard
              </Link>
              <p className="em-terminos">
                Al adquirirlo aceptás los <Link to="/terminos">términos y condiciones de servicio</Link>.
              </p>
            </div>
          </section>

          <section aria-labelledby="em-preguntas">
            <h2 id="em-preguntas">Preguntas frecuentes</h2>
            <div className="em-preguntas">
              {preguntas.map(([pregunta, respuesta]) => (
                <details key={pregunta}>
                  <summary>{pregunta}</summary>
                  <p>{respuesta}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="em-cierre" aria-labelledby="em-cierre-titulo">
            <h2 id="em-cierre-titulo">¿Tenés dudas antes de empezar?</h2>
            <p>Contanos cuántas personas son y cómo se comunican, y te ayudamos a armar la primera campaña.</p>
            <div className="em-acciones em-acciones-centro">
              <Link className="em-boton" to={destino}>
                Adquirir PhishGuard
              </Link>
              <Link className="em-boton-sec" to="/contacto">
                Escribinos
              </Link>
            </div>
          </section>
        </div>
      </div>
    </Marco>
  )
}

export default Empresas
