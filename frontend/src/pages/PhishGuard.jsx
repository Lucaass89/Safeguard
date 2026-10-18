import { Link } from 'react-router'
import { PhishGuardPago } from '../components/PhishGuardAcceso.jsx'
import { esAdministrador, useMembresia } from '../lib/useMembresia.js'
import { useSesion } from '../lib/useSesion.js'
import './PhishGuard.css'

// TODO: reemplazar por la campaña en curso. null si no hay ninguna.
const CAMPANA = {
  nombre: 'Factura de AFIP',
  canal: 'Correo',
  enviados: 48,
  abiertos: 31,
  clics: 9,
  reportados: 6,
}

// TODO: reemplazar por las tasas reales de la última simulación.
const METRICAS = [
  { id: 'clic', etiqueta: 'Tasa de clic', valor: '19%', delta: '4 pts', direccion: 'sube', mejora: false },
  { id: 'reporte', etiqueta: 'Tasa de reporte', valor: '28%', delta: '6 pts', direccion: 'sube', mejora: true },
  { id: 'riesgo', etiqueta: 'En riesgo', valor: '9', delta: '2', direccion: 'baja', mejora: true },
]

// TODO: reemplazar por quienes cayeron en la última simulación.
const REFORZAR = [
  { id: '1', nombre: 'Marina López', detalle: 'Administración', nivel: 'alto', equipo: false },
  { id: '2', nombre: 'Equipo de ventas', detalle: '4 personas', nivel: 'alto', equipo: true },
  { id: '3', nombre: 'Julián Pereyra', detalle: 'Sistemas', nivel: 'medio', equipo: false },
  { id: '4', nombre: 'Lucía Benítez', detalle: 'Recepción', nivel: 'medio', equipo: false },
]

const NIVEL = {
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
}

function Icono({ nombre }) {
  const trazo = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (nombre === 'correo') {
    return (
      <svg {...trazo}>
        <path d="M4 7.5h16v10H4v-10Z" />
        <path d="m4.5 8 7.5 5.5L19.5 8" />
      </svg>
    )
  }

  if (nombre === 'whatsapp') {
    return (
      <svg {...trazo}>
        <path d="M6 18.5 7.2 15A6.5 6.5 0 1 1 9 16.8L6 18.5Z" />
      </svg>
    )
  }

  if (nombre === 'sms') {
    return (
      <svg {...trazo}>
        <path d="M5 6.5h14v9H8.5L5 18.2V6.5Z" />
      </svg>
    )
  }

  if (nombre === 'equipo') {
    return (
      <svg {...trazo}>
        <circle cx="8" cy="9" r="2.2" />
        <circle cx="16" cy="9" r="2.2" />
        <path d="M4.8 17.2c.7-2 2.2-3 4-3s3.3 1 4 3M12.8 17.2c.5-1.4 1.6-2.3 3.2-2.3 1.8 0 3.3 1 4 3" />
      </svg>
    )
  }

  if (nombre === 'persona') {
    return (
      <svg {...trazo}>
        <circle cx="12" cy="8.2" r="3.1" />
        <path d="M5.6 19.2c1.2-2.8 3.4-4.2 6.4-4.2s5.2 1.4 6.4 4.2" />
      </svg>
    )
  }

  if (nombre === 'informe') {
    return (
      <svg {...trazo}>
        <path d="M7 3.5h7l4 4V20.5H7v-17Z" />
        <path d="M14 3.5V8h4M9.5 12.5h5M9.5 16h5" />
      </svg>
    )
  }

  if (nombre === 'sube') {
    return (
      <svg {...trazo}>
        <path d="M12 19V6" />
        <path d="m7 10 5-5 5 5" />
      </svg>
    )
  }

  if (nombre === 'baja') {
    return (
      <svg {...trazo}>
        <path d="M12 5v13" />
        <path d="m7 14 5 5 5-5" />
      </svg>
    )
  }

  return (
    <svg {...trazo}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function iconoCanal(canal) {
  if (canal === 'WhatsApp') return 'whatsapp'
  if (canal === 'SMS') return 'sms'
  return 'correo'
}

function CampanaActiva({ campana }) {
  const avance = Math.round((campana.abiertos / campana.enviados) * 100)
  const conteos = [
    ['Enviados', campana.enviados],
    ['Abiertos', campana.abiertos],
    ['Clics', campana.clics],
    ['Reportados', campana.reportados],
  ]

  return (
    <section className="phish-campana" aria-labelledby="phish-campana-titulo">
      <div className="phish-campana-cabeza">
        <h2 id="phish-campana-titulo">{campana.nombre}</h2>
        <p className="phish-canal">
          <Icono nombre={iconoCanal(campana.canal)} />
          <span>{campana.canal}</span>
        </p>
      </div>
      <div
        className="phish-barra"
        role="progressbar"
        aria-valuenow={campana.abiertos}
        aria-valuemin={0}
        aria-valuemax={campana.enviados}
        aria-label={`${campana.abiertos} de ${campana.enviados} lo abrieron`}
        style={{ '--avance': `${avance}%` }}
      >
        <span />
      </div>
      <p className="phish-avance">
        {campana.abiertos} de {campana.enviados} lo abrieron
      </p>
      <ul className="phish-conteos">
        {conteos.map(([etiqueta, valor]) => (
          <li key={etiqueta}>
            <strong>{valor}</strong>
            <span>{etiqueta}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PhishGuard() {
  const { sesion, cargando } = useSesion()
  const membresia = useMembresia()
  const admin = Boolean(sesion) && esAdministrador(membresia.rol)
  const listo = !cargando && !membresia.cargando

  if (!listo) return <p className="phish-estado">Revisando tu plan…</p>

  if (!admin) {
    return (
      <div className="phish">
        <PhishGuardPago />
      </div>
    )
  }

  return (
    <div className="phish">
      {CAMPANA ? (
        <CampanaActiva campana={CAMPANA} />
      ) : (
        <section className="phish-vacio" aria-label="Sin campaña activa">
          <h2>No hay una simulación en curso</h2>
          <p>Armá una y mirá quién abre, quién hace clic y quién la reporta.</p>
          <Link className="phish-armar" to="/phishguard/campanas">
            Armar una simulación
          </Link>
        </section>
      )}

      <ul className="phish-metricas">
        {METRICAS.map((metrica) => (
          <li key={metrica.id}>
            <strong>{metrica.valor}</strong>
            <span className="phish-metrica-etiqueta">{metrica.etiqueta}</span>
            <span className={metrica.mejora ? 'phish-tendencia phish-mejora' : 'phish-tendencia phish-empeora'}>
              <Icono nombre={metrica.direccion} />
              <span>{metrica.delta}</span>
              <span className="phish-solo">{metrica.direccion === 'sube' ? 'sube' : 'baja'}</span>
            </span>
          </li>
        ))}
      </ul>

      <section className="phish-bloque" aria-labelledby="phish-reforzar">
        <h2 id="phish-reforzar">Para reforzar</h2>
        {REFORZAR.length === 0 ? (
          <p className="phish-lista-vacia">En la última simulación no hubo que reforzar.</p>
        ) : (
          <ul className="phish-lista">
            {REFORZAR.map((item) => (
              <li className="phish-item" key={item.id}>
                <span className="phish-item-icono">
                  <Icono nombre={item.equipo ? 'equipo' : 'persona'} />
                </span>
                <span className="phish-item-texto">
                  <strong>{item.nombre}</strong>
                  <span>{item.detalle}</span>
                </span>
                <span className={`phish-chip phish-chip-${item.nivel}`}>{NIVEL[item.nivel]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link className="phish-exportar" to="/phishguard/informe">
        <Icono nombre="informe" />
        <span>Exportar informe</span>
      </Link>

      <Link className="phish-fab" to="/phishguard/campanas">
        <Icono nombre="mas" />
        <span>Nueva campaña</span>
      </Link>
    </div>
  )
}

export default PhishGuard
