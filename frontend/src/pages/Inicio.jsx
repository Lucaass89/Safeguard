import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase.js'
import { useSesion } from '../lib/useSesion.js'

const ACCESOS = [
  { to: '/safelink/enlaces', titulo: 'Revisar un enlace', nota: 'Pegalo antes de abrirlo', icono: 'enlace' },
  { to: '/safelink/qr', titulo: 'Escanear un QR', nota: 'Leé el código con la cámara', icono: 'qr' },
  { to: '/safelink/whatsapp', titulo: 'Revisar un mensaje', nota: 'WhatsApp o un texto', icono: 'mensaje' },
  { to: '/phishguard/campanas', titulo: 'Campañas', nota: 'Simulaciones del equipo', icono: 'campana' },
]

const INFO = [
  { titulo: 'PhishGuard', nota: 'Simulaciones por correo, WhatsApp o SMS.' },
  { titulo: 'SafeLink', nota: 'Verde, amarillo o rojo antes de abrir.' },
  { titulo: 'Explicación', nota: 'Si alguien cae, ve qué tenía que mirar.' },
]

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

  if (nombre === 'mensaje') {
    return (
      <svg {...trazo}>
        <path d="M5 6.5h14v9H8.5L5 18.2V6.5Z" />
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

  return (
    <svg {...trazo}>
      <path d="M10 13.5 13.5 10" />
      <path d="M8.2 11.4 6.8 12.8a3.2 3.2 0 0 0 4.5 4.5l1.4-1.4" />
      <path d="M15.8 12.6 17.2 11.2a3.2 3.2 0 0 0-4.5-4.5L11.3 8.1" />
    </svg>
  )
}

function numero(valor) {
  if (valor == null) return '–'
  return String(valor)
}

function Inicio() {
  const { sesion, cargando: cargandoSesion } = useSesion()
  const [enlaces, setEnlaces] = useState(null)
  const [campanas, setCampanas] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (cargandoSesion) return undefined
    if (!sesion) {
      setEnlaces(null)
      setCampanas(null)
      setCargando(false)
      return undefined
    }

    let activo = true
    setCargando(true)

    Promise.all([
      supabase.from('safelink_analisis').select('id', { count: 'exact', head: true }),
      supabase.from('campanas').select('id', { count: 'exact', head: true }).eq('estado', 'en_proceso'),
    ]).then(([links, activas]) => {
      if (!activo) return
      setEnlaces(links.error ? null : (links.count ?? 0))
      setCampanas(activas.error ? null : (activas.count ?? 0))
      setCargando(false)
    })

    return () => {
      activo = false
    }
  }, [sesion, cargandoSesion])

  return (
    <section>
      {cargando ? (
        <p className="app-estado">Cargando tu resumen…</p>
      ) : !sesion ? (
        <p className="app-estado">
          <Link to="/ingresar">Entrá</Link> para ver tus números.
        </p>
      ) : null}

      <ul className="app-resumen">
        <li>
          <strong>{cargando ? '…' : numero(enlaces)}</strong>
          <span>Enlaces revisados</span>
        </li>
        <li>
          <strong>{cargando ? '…' : numero(campanas)}</strong>
          <span>Campañas activas</span>
        </li>
      </ul>

      <div className="app-accesos">
        {ACCESOS.map((acceso) => (
          <Link className="app-acceso" key={acceso.to} to={acceso.to}>
            <span className="app-acceso-icono">
              <Icono nombre={acceso.icono} />
            </span>
            <span>
              <strong>{acceso.titulo}</strong>
              <span>{acceso.nota}</span>
            </span>
          </Link>
        ))}
      </div>

      <section className="app-info" aria-label="Qué cubre SafeGuard">
        <h2>Qué cubre</h2>
        <ul>
          {INFO.map((item) => (
            <li key={item.titulo}>
              <strong>{item.titulo}</strong>
              <span>{item.nota}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

export default Inicio
