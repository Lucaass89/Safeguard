import { Link } from 'react-router'
import {
  areasParaReforzar,
  fraseCampana,
  pasoActual,
  pasosPhishguard,
  textoDiferencia,
  ultimaCampana,
} from '../lib/resumenPhishguard.js'
import './PhishGuardWeb.css'

const FECHA = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })
const CANALES = { correo: 'Correo', whatsapp: 'WhatsApp', sms: 'SMS' }

const TRAZOS = {
  empresa: ['M4.5 20.5V7.2L12 4l7.5 3.2v13.3', 'M4.5 20.5h15', 'M9.5 20.5v-4h5v4'],
  campanas: ['M4.5 11.5 20 5l-5.8 14.2-2.6-6.1L4.5 11.5Z', 'M11.6 13.1 20 5'],
  tablero: ['M4 19.5h16', 'M7.5 19.5v-6.5', 'M12 19.5V7', 'M16.5 19.5v-4'],
  informe: ['M6.5 3.5h11v17h-11z', 'M9 8h6M9 11.5h6M9 15h4'],
  tilde: ['m6 12.5 4 4L18 8'],
  ir: ['M5 12h14', 'm13 6 6 6-6 6'],
  mas: ['M12 5v14', 'M5 12h14'],
}

function Icono({ nombre, tam = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={tam} height={tam} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

function Anillo({ porcentaje, diferencia }) {
  const radio = 17
  const largo = 2 * Math.PI * radio
  const cambio = textoDiferencia(diferencia)
  return (
    <div className="pgw-anillo">
      <div className="pgw-anillo-circulo">
        <svg viewBox="0 0 42 42" aria-hidden="true">
          <circle cx="21" cy="21" r={radio} className="pgw-anillo-fondo" />
          <circle
            cx="21"
            cy="21"
            r={radio}
            className="pgw-anillo-valor"
            strokeDasharray={`${(largo * porcentaje) / 100} ${largo}`}
          />
        </svg>
        <div className="pgw-anillo-centro">
          <strong>{porcentaje} %</strong>
          <span>tocó el enlace</span>
        </div>
      </div>
      {cambio ? <p className={`pgw-cambio pgw-cambio-${cambio.tono}`}>{cambio.texto}</p> : null}
    </div>
  )
}

function Barra({ etiqueta, valor, total, tono = 'coral' }) {
  const ancho = total > 0 ? Math.round((valor / total) * 100) : 0
  return (
    <div className="pgw-fila">
      <span>{etiqueta}</span>
      <div className="pgw-barra" aria-hidden="true">
        <i className={`pgw-barra-${tono}`} style={{ width: `${ancho}%` }} />
      </div>
      <strong>{valor}</strong>
    </div>
  )
}

function PhishGuardWeb({ tablero, onVolver }) {
  const sinDatos = !tablero
  const ultima = ultimaCampana(tablero)
  const areas = areasParaReforzar(tablero).slice(0, 5)
  const pasos = pasosPhishguard(tablero)
  const actual = pasoActual(pasos)
  const nombre = tablero?.organizacion?.nombre_empresa
  const personas = tablero?.empleados?.length ?? 0
  const cantidadAreas = new Set((tablero?.empleados ?? []).map((persona) => persona.departamento || 'General')).size
  const campanas = tablero?.campanas?.length ?? 0

  const accesos = [
    { to: '/panel/empresa', icono: 'empresa', titulo: 'Tu empresa', nota: sinDatos ? 'Personas y áreas' : `${personas === 1 ? '1 persona' : `${personas} personas`} · ${cantidadAreas === 1 ? '1 área' : `${cantidadAreas} áreas`}` },
    { to: '/panel/campanas', icono: 'campanas', titulo: 'Campañas', nota: sinDatos ? 'Armá una simulación' : campanas === 1 ? '1 hecha' : `${campanas} hechas` },
    { to: '/panel/tablero', icono: 'tablero', titulo: 'Tablero', nota: 'Por área y por mes' },
    { to: '/panel/informe', icono: 'informe', titulo: 'Informe', nota: 'Para guardar, sin sancionar' },
  ]

  return (
    <div className="pgw">
      <section className="pgw-hero" aria-labelledby="pgw-titulo">
        <div className="pgw-hero-adentro">
          <button type="button" className="pgw-volver" onClick={onVolver}>
            ← Elegir otra aplicación
          </button>
          <div className="pgw-hero-grilla">
            <div>
              <p className="pgw-eti">PhishGuard{nombre ? ` · ${nombre}` : ''}</p>
              <h1 id="pgw-titulo">Tu equipo</h1>
              <p className="pgw-lead">
                {sinDatos
                  ? 'Para ver cómo viene tu equipo, entrá a cualquier sección y confirmá la verificación en dos pasos.'
                  : fraseCampana(ultima)}
              </p>
              <div className="pgw-botones">
                <Link className="pgw-boton" to="/panel/campanas">
                  <Icono nombre="mas" tam={18} />
                  Nueva campaña
                </Link>
                <Link className="pgw-boton-sec" to="/panel/tablero">
                  Ver el tablero
                </Link>
                <Link className="pgw-boton-sec" to="/panel/informe">
                  Informe
                </Link>
              </div>
            </div>
            {ultima ? <Anillo porcentaje={ultima.porcentaje} diferencia={ultima.diferencia} /> : null}
          </div>
        </div>
      </section>

      <div className="pgw-cuerpo">
        {!sinDatos ? (
          <ol className="pgw-pasos" aria-label="Tu plan de entrenamiento">
            {pasos.map((paso, indice) => (
              <li key={paso.id} className={paso.hecho ? 'pgw-paso pgw-paso-hecho' : indice === actual ? 'pgw-paso pgw-paso-actual' : 'pgw-paso'}>
                <Link to={paso.to}>
                  <span className="pgw-paso-marca" aria-hidden="true">
                    {paso.hecho ? <Icono nombre="tilde" tam={16} /> : indice + 1}
                  </span>
                  <span>
                    <strong>{paso.titulo}</strong>
                    <small>{paso.detalle}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : null}

        {ultima ? (
          <div className="pgw-dos">
            <section className="pgw-tarjeta" aria-labelledby="pgw-ultima">
              <div className="pgw-cabeza">
                <h2 id="pgw-ultima">Última campaña</h2>
                <small>
                  «{ultima.nombre}» · {FECHA.format(new Date(ultima.fecha))} · {CANALES[ultima.canal] ?? ultima.canal}
                </small>
              </div>
              <div className="pgw-embudo">
                <Barra etiqueta="Recibieron la simulación" valor={ultima.recibieron} total={ultima.recibieron} />
                <Barra etiqueta="Tocaron el enlace" valor={ultima.clics} total={ultima.recibieron} />
                <Barra etiqueta="Cargaron datos" valor={ultima.datos} total={ultima.recibieron} />
                <Barra etiqueta="Hicieron la capacitación" valor={ultima.capacitacion} total={ultima.recibieron} tono="verde" />
              </div>
            </section>
            <section className="pgw-tarjeta" aria-labelledby="pgw-areas">
              <div className="pgw-cabeza">
                <h2 id="pgw-areas">Áreas para reforzar</h2>
                <small>% que tocó el enlace</small>
              </div>
              <ul className="pgw-areas">
                {areas.map((area) => (
                  <li key={area.area}>
                    <span className="pgw-area-nombre">
                      {area.area}
                      {area.reforzar ? <span className="pgw-reforzar">Reforzar</span> : null}
                    </span>
                    <span className="pgw-mini" aria-hidden="true">
                      <i style={{ width: `${area.porcentaje}%` }} />
                    </span>
                    <strong>{area.porcentaje} %</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        <nav className="pgw-accesos" aria-label="Secciones de PhishGuard">
          {accesos.map((acceso) => (
            <Link key={acceso.to} className="pgw-acceso" to={acceso.to}>
              <span className="pgw-acceso-icono">
                <Icono nombre={acceso.icono} />
              </span>
              <span className="pgw-acceso-texto">
                <strong>{acceso.titulo}</strong>
                <small>{acceso.nota}</small>
              </span>
              <span className="pgw-acceso-ir">
                <Icono nombre="ir" tam={18} />
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default PhishGuardWeb
