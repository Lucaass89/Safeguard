import { Link } from 'react-router'
import { detalleDe } from '../lib/agruparActividad.js'
import ChipEstado from './ChipEstado.jsx'
import { DominioMarcado, LecturaReal } from './DiferenciaDominio.jsx'
import './FilaActividad.css'

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

  if (nombre === 'qr') {
    return (
      <svg {...trazo}>
        <path d="M4.5 8.5V6.2A1.7 1.7 0 0 1 6.2 4.5H8.5" />
        <path d="M15.5 4.5h2.3A1.7 1.7 0 0 1 19.5 6.2V8.5" />
        <path d="M19.5 15.5v2.3a1.7 1.7 0 0 1-1.7 1.7H15.5" />
        <path d="M8.5 19.5H6.2a1.7 1.7 0 0 1-1.7-1.7V15.5" />
        <path d="M7.5 12h9" />
      </svg>
    )
  }

  if (nombre === 'whatsapp') {
    return (
      <svg {...trazo}>
        <path d="M5 6.5h14v9H8.5L5 18.2V6.5Z" />
      </svg>
    )
  }

  if (nombre === 'pdf') {
    return (
      <svg {...trazo}>
        <path d="M7 3.5h7l4 4v13H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" />
        <path d="M14 3.5v4h4" />
        <path d="M9 13h6M9 16.5h4" />
      </svg>
    )
  }

  if (nombre === 'correo') {
    return (
      <svg {...trazo}>
        <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    )
  }

  if (nombre === 'flecha') {
    return (
      <svg {...trazo}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
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

export function ListaActividad({ children }) {
  return <ul className="lista-actividad">{children}</ul>
}

function FilaActividad({ item, to, onClick }) {
  const esDireccion = item.entrada === 'web' || item.entrada === 'qr'
  const detalle = [item.diferencia && item.veces === 1 ? null : detalleDe(item), item.cuando].filter(Boolean).join(' · ')
  const contenido = (
    <>
      <span className="fila-actividad-icono">
        <Icono nombre={item.entrada} />
      </span>
      <span className="fila-actividad-texto">
        <span className={esDireccion ? 'fila-actividad-titulo' : 'fila-actividad-titulo fila-actividad-titulo-texto'}>
          <strong>{item.diferencia ? <DominioMarcado tramos={item.diferencia.visto} /> : item.titulo}</strong>
          {item.ruta ? <span className="fila-actividad-ruta">{item.ruta}</span> : null}
        </span>
        <span className="fila-actividad-meta">
          <ChipEstado nivel={item.nivel} />
          <span className="fila-actividad-detalle">
            {item.diferencia ? (
              <>
                <LecturaReal diferencia={item.diferencia} />
                {' · '}
              </>
            ) : null}
            {detalle}
          </span>
        </span>
      </span>
      <span className="fila-actividad-ir" aria-hidden="true">
        <Icono nombre="flecha" />
      </span>
    </>
  )

  return (
    <li>
      {to ? (
        <Link className="fila-actividad" to={to}>
          {contenido}
        </Link>
      ) : (
        <button type="button" className="fila-actividad" onClick={onClick}>
          {contenido}
        </button>
      )}
    </li>
  )
}

export default FilaActividad
