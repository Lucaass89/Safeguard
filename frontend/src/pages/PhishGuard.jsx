import { Link } from 'react-router'
import { PhishGuardPago } from '../components/PhishGuardAcceso.jsx'
import { cayo, useCampanas } from '../lib/useCampanas.js'
import { esAdministrador, useMembresia } from '../lib/useMembresia.js'
import { useSesion } from '../lib/useSesion.js'
import './PhishGuard.css'

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

function porcentaje(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : 0
}

function tendencia(actual, anterior) {
  if (anterior === null) return null
  const diferencia = actual - anterior
  if (diferencia === 0) return null
  return {
    delta: `${Math.abs(diferencia)} pts`,
    direccion: diferencia > 0 ? 'sube' : 'baja',
    mejora: diferencia < 0,
  }
}

function armarMetricas(ultima, previa) {
  const clic = porcentaje(ultima.clics, ultima.enviados)
  const datos = porcentaje(ultima.datos, ultima.enviados)
  return [
    {
      id: 'clic',
      etiqueta: 'Tasa de clic',
      valor: `${clic}%`,
      tendencia: tendencia(clic, previa ? porcentaje(previa.clics, previa.enviados) : null),
    },
    {
      id: 'datos',
      etiqueta: 'Cargaron datos',
      valor: `${datos}%`,
      tendencia: tendencia(datos, previa ? porcentaje(previa.datos, previa.enviados) : null),
    },
    { id: 'capacitados', etiqueta: 'Se capacitaron', valor: String(ultima.capacitados), tendencia: null },
  ]
}

function armarReforzar(ultima) {
  return ultima.eventos
    .filter(cayo)
    .map((evento, indice) => ({
      id: evento.empleados?.id ?? `${ultima.id}-${indice}`,
      nombre: evento.empleados?.nombre || 'Sin nombre',
      detalle: evento.empleados?.departamento || 'General',
      nivel: evento.ingreso_datos ? 'alto' : 'medio',
    }))
    .sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'alto' ? -1 : 1))
}

function CampanaActiva({ campana }) {
  const avance = porcentaje(campana.clics, campana.enviados)
  const conteos = [
    ['Enviados', campana.enviados],
    ['Clics', campana.clics],
    ['Cargaron datos', campana.datos],
    ['Lo reconocieron', campana.reconocieron],
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
        aria-valuenow={campana.clics}
        aria-valuemin={0}
        aria-valuemax={campana.enviados}
        aria-label={`${campana.clics} de ${campana.enviados} hicieron clic`}
        style={{ '--avance': `${avance}%` }}
      >
        <span />
      </div>
      <p className="phish-avance">
        {campana.clics} de {campana.enviados} hicieron clic
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
  const datos = useCampanas(listo && admin ? membresia.organizacionId : null)

  if (!listo) return <p className="phish-estado">Revisando tu plan…</p>

  if (!admin) {
    return (
      <div className="phish">
        <PhishGuardPago />
      </div>
    )
  }

  if (datos.cargando) return <p className="phish-estado">Buscando tus campañas…</p>

  const [ultima, previa] = datos.campanas
  const metricas = ultima ? armarMetricas(ultima, previa) : []
  const reforzar = ultima ? armarReforzar(ultima) : []

  return (
    <div className="phish">
      {datos.error ? (
        <p className="phish-estado">No se pudieron leer tus campañas. Probá de nuevo en un rato.</p>
      ) : null}
      {ultima ? (
        <CampanaActiva campana={ultima} />
      ) : (
        <section className="phish-vacio" aria-label="Sin campaña activa">
          <h2>No hay una simulación en curso</h2>
          <p>Armá una y mirá quién abre, quién hace clic y quién la reporta.</p>
          <Link className="phish-armar" to="/phishguard/campanas">
            Armar una simulación
          </Link>
        </section>
      )}

      {ultima ? (
        <>
          <ul className="phish-metricas">
            {metricas.map((metrica) => (
              <li key={metrica.id}>
                <strong>{metrica.valor}</strong>
                <span className="phish-metrica-etiqueta">{metrica.etiqueta}</span>
                {metrica.tendencia ? (
                  <span
                    className={
                      metrica.tendencia.mejora
                        ? 'phish-tendencia phish-mejora'
                        : 'phish-tendencia phish-empeora'
                    }
                  >
                    <Icono nombre={metrica.tendencia.direccion} />
                    <span>{metrica.tendencia.delta}</span>
                    <span className="phish-solo">
                      {metrica.tendencia.direccion === 'sube' ? 'sube' : 'baja'}
                    </span>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>

          <section className="phish-bloque" aria-labelledby="phish-reforzar">
            <h2 id="phish-reforzar">Para reforzar</h2>
            {reforzar.length === 0 ? (
              <p className="phish-lista-vacia">En la última simulación no hubo que reforzar.</p>
            ) : (
              <ul className="phish-lista">
                {reforzar.map((item) => (
                  <li className="phish-item" key={item.id}>
                    <span className="phish-item-icono">
                      <Icono nombre="persona" />
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
        </>
      ) : null}

      <Link className="phish-fab" to="/phishguard/campanas">
        <Icono nombre="mas" />
        <span>Nueva campaña</span>
      </Link>
    </div>
  )
}

export default PhishGuard
