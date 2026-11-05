import './ChipEstado.css'

const ESTADOS = {
  seguro: { texto: 'Seguro', tono: 'verde', icono: 'bien' },
  sospechoso: { texto: 'Precaución', tono: 'amarillo', icono: 'alerta' },
  peligroso: { texto: 'Peligroso', tono: 'rojo', icono: 'mal' },
  sin_verificar: { texto: 'No verificado', tono: 'gris', icono: 'duda' },
}

function IconoChip({ nombre }) {
  const trazo = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (nombre === 'bien') {
    return (
      <svg {...trazo}>
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12.2 2.3 2.3 4.7-5" />
      </svg>
    )
  }

  if (nombre === 'alerta') {
    return (
      <svg {...trazo}>
        <path d="M12 4.5 20 19H4L12 4.5Z" />
        <path d="M12 10v4.2M12 16.8h.01" />
      </svg>
    )
  }

  if (nombre === 'mal') {
    return (
      <svg {...trazo}>
        <circle cx="12" cy="12" r="8" />
        <path d="m9 9 6 6M15 9l-6 6" />
      </svg>
    )
  }

  return (
    <svg {...trazo}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.8 9.6a2.3 2.3 0 0 1 4.4.9c0 1.5-2.2 2-2.2 3.3M12 16.8h.01" />
    </svg>
  )
}

export function Chip({ tono = 'gris', icono = 'duda', children }) {
  return (
    <span className={`sg-chip sg-chip-${tono}`}>
      <IconoChip nombre={icono} />
      {children}
    </span>
  )
}

function ChipEstado({ nivel }) {
  const estado = ESTADOS[nivel] ?? ESTADOS.sin_verificar
  return (
    <Chip tono={estado.tono} icono={estado.icono}>
      {estado.texto}
    </Chip>
  )
}

export default ChipEstado
