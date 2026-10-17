import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import PanelPerfil from './PanelPerfil.jsx'

const OPCIONES = {
  phishguard: [
    { to: '/phishguard/empresa', titulo: 'Tu empresa', nota: 'Cargá a tu equipo', icono: 'empresa' },
    { to: '/phishguard/campanas', titulo: 'Campañas', nota: 'Armá una simulación', icono: 'campana' },
    { to: '/phishguard/tablero', titulo: 'Tablero', nota: 'Cómo viene el equipo', icono: 'tablero' },
    { to: '/phishguard/informe', titulo: 'Informe', nota: 'Una página para guardar', icono: 'informe' },
  ],
  safelink: [
    { to: '/safelink/enlaces', titulo: 'Revisar un enlace', nota: 'Pegalo antes de abrirlo', icono: 'enlace' },
    { to: '/safelink/whatsapp', titulo: 'Pegar un WhatsApp', nota: 'Un mensaje sospechoso', icono: 'mensaje' },
    { to: '/safelink/pdf', titulo: 'Revisar un PDF', nota: 'Si el archivo esconde algo', icono: 'pdf' },
    { to: '/safelink/correo', titulo: 'Revisar un correo', nota: 'Si el remitente es real', icono: 'correo' },
    { to: '/safelink/qr', titulo: 'Escanear un QR', nota: 'Leé el código con la cámara', icono: 'qr' },
  ],
  perfil: [
    { to: '/perfil/cuenta#perfil-cuenta-titulo', titulo: 'Cuenta', nota: 'Nombre y correo', icono: 'perfil' },
    { to: '/perfil/cuenta#perfil-actividad-titulo', titulo: 'Actividad', nota: 'Lo que revisaste', icono: 'actividad' },
    { to: '/perfil/cuenta#perfil-seguridad-titulo', titulo: 'Seguridad', nota: 'Cómo entrás', icono: 'escudo' },
    { to: '/perfil/cuenta#perfil-datos-titulo', titulo: 'Tus datos', nota: 'Exportar o eliminar la cuenta', icono: 'datos' },
  ],
}

function Icono({ nombre }) {
  const trazo = {
    viewBox: '0 0 24 24',
    width: '22',
    height: '22',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (nombre === 'empresa') {
    return (
      <svg {...trazo}>
        <path d="M4 20V6.5A1.5 1.5 0 0 1 5.5 5H11v15" />
        <path d="M11 9.5h7.5A1.5 1.5 0 0 1 20 11V20" />
        <path d="M4 20h16M7.5 8.5h1.5M7.5 12h1.5M14 13h1.5M14 16.5h1.5" />
      </svg>
    )
  }

  if (nombre === 'campana') {
    return (
      <svg {...trazo}>
        <path d="M4.5 11.5 20 5l-5.8 14.2-2.6-6.1L4.5 11.5Z" />
      </svg>
    )
  }

  if (nombre === 'tablero') {
    return (
      <svg {...trazo}>
        <path d="M4 19V5M4 19h16" />
        <path d="M8 15v-4M12 15V8M16 15v-2" />
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

  if (nombre === 'mensaje') {
    return (
      <svg {...trazo}>
        <path d="M5 6.5h14v9H8.5L5 18.2V6.5Z" />
      </svg>
    )
  }

  if (nombre === 'pdf') {
    return (
      <svg {...trazo}>
        <path d="M7 3.5h7l4 4V20.5H7v-17Z" />
        <path d="M14 3.5V8h4" />
      </svg>
    )
  }

  if (nombre === 'correo') {
    return (
      <svg {...trazo}>
        <path d="M4 7.5h16v10H4v-10Z" />
        <path d="m4.5 8 7.5 5.5L19.5 8" />
      </svg>
    )
  }

  if (nombre === 'qr') {
    return (
      <svg {...trazo}>
        <path d="M4.5 9V6.5A2 2 0 0 1 6.5 4.5H9" />
        <path d="M15 4.5h2.5A2 2 0 0 1 19.5 6.5V9" />
        <path d="M19.5 15v2.5a2 2 0 0 1-2 2H15" />
        <path d="M9 19.5H6.5a2 2 0 0 1-2-2V15" />
        <path d="M8 12h8" />
      </svg>
    )
  }

  if (nombre === 'actividad') {
    return (
      <svg {...trazo}>
        <path d="M4 12h4l2-5 4 10 2-5h4" />
      </svg>
    )
  }

  if (nombre === 'escudo') {
    return (
      <svg {...trazo}>
        <path d="M12 3.5 19 6.4v5.2c0 4.2-2.7 7.1-7 8.9-4.3-1.8-7-4.7-7-8.9V6.4L12 3.5Z" />
      </svg>
    )
  }

  if (nombre === 'datos') {
    return (
      <svg {...trazo}>
        <path d="M12 4c4.5 0 7 1.6 7 2.8S16.5 9.6 12 9.6 5 8 5 6.8 7.5 4 12 4Z" />
        <path d="M5 6.8v4.4c0 1.2 2.5 2.8 7 2.8s7-1.6 7-2.8V6.8" />
        <path d="M5 11.2v4.4c0 1.2 2.5 2.8 7 2.8s7-1.6 7-2.8v-4.4" />
      </svg>
    )
  }

  if (nombre === 'perfil') {
    return (
      <svg {...trazo}>
        <circle cx="12" cy="8.2" r="3.1" />
        <path d="M5.6 19.2c1.2-2.8 3.4-4.2 6.4-4.2s5.2 1.4 6.4 4.2" />
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

function OpcionesApp({ id }) {
  const opciones = OPCIONES[id]

  return (
    <ul className="app-opciones">
      {opciones.map((opcion) => (
        <li key={opcion.titulo}>
          <Link className="app-opcion" to={opcion.to}>
            <span className="app-acceso-icono">
              <Icono nombre={opcion.icono} />
            </span>
            <span>
              <strong>{opcion.titulo}</strong>
              <span>{opcion.nota}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function PerfilSeccion() {
  const { hash } = useLocation()

  useEffect(() => {
    const id = hash.replace('#', '')
    if (!id) return undefined
    const destino = document.getElementById(id)
    destino?.scrollIntoView({ block: 'start' })
    return undefined
  }, [hash])

  return <PanelPerfil />
}

export default OpcionesApp
