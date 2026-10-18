import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import './Inicio.css'

// TODO: reemplazar por el porcentaje real de protección.
const PROTECCION = {
  porcentaje: 72,
  frase: 'Revisá el mensaje que te reenviaron. Es lo que más te baja la protección.',
}

// TODO: reemplazar por el avance real de la campaña activa.
const CAMPANA = {
  nombre: 'Campaña de octubre',
  hecho: 18,
  total: 24,
}

// TODO: reemplazar por los últimos análisis reales.
const ACTIVIDAD = [
  { id: '1', titulo: 'promo-banco.example', ruta: '/ingreso', tipo: 'Enlace', nivel: 'peligroso', cuando: 'Hace 12 min', to: '/safelink/enlaces' },
  { id: '2', titulo: 'Mensaje de un número desconocido', tipo: 'Mensaje', nivel: 'sospechoso', cuando: 'Hace 2 h', to: '/safelink/whatsapp' },
  { id: '3', titulo: 'maps.google.com', ruta: '/lugar', tipo: 'Enlace', nivel: 'seguro', cuando: 'Ayer', to: '/safelink/enlaces' },
  { id: '4', titulo: 'factura-afip.example', ruta: '/pago', tipo: 'Enlace', nivel: 'peligroso', cuando: 'Hace 2 días', to: '/safelink/enlaces' },
  { id: '5', titulo: 'youtube.com', ruta: '/watch', tipo: 'Enlace', nivel: 'seguro', cuando: 'Hace 4 días', to: '/safelink/enlaces' },
]

// TODO: reemplazar por el consejo del día.
const CONSEJO = {
  titulo: 'Consejo del día',
  texto: 'Si un enlace te apura para pagar o te pide la clave, no lo abras. Pegalo acá y mirá el color.',
}

const CHIP = {
  seguro: 'Seguro',
  sospechoso: 'Sospechoso',
  peligroso: 'Peligroso',
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

  if (nombre === 'mensaje') {
    return (
      <svg {...trazo}>
        <path d="M5 6.5h14v9H8.5L5 18.2V6.5Z" />
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

  if (nombre === 'consejo') {
    return (
      <svg {...trazo}>
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M12 3.5a6.2 6.2 0 0 0-3.2 11.5c.5.4.8 1 .8 1.6V17h4.8v-.4c0-.6.3-1.2.8-1.6A6.2 6.2 0 0 0 12 3.5Z" />
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

function Anillo({ porcentaje }) {
  const radio = 52
  const circunferencia = 2 * Math.PI * radio
  const resto = circunferencia * (1 - porcentaje / 100)

  return (
    <div className="inicio-anillo" role="img" aria-label={`Protección ${porcentaje} por ciento`}>
      <svg viewBox="0 0 120 120">
        <circle className="inicio-anillo-pista" cx="60" cy="60" r={radio} />
        <circle
          className="inicio-anillo-valor"
          cx="60"
          cy="60"
          r={radio}
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          strokeDashoffset={resto}
        />
      </svg>
      <p className="inicio-porcentaje">
        <strong>{porcentaje}</strong>
        <span>%</span>
      </p>
    </div>
  )
}

function Inicio() {
  const navigate = useNavigate()
  const [enlace, setEnlace] = useState('')
  const [aviso, setAviso] = useState('')
  const avance = Math.round((CAMPANA.hecho / CAMPANA.total) * 100)

  function revisar(evento) {
    evento.preventDefault()
    const valor = enlace.trim()
    if (!valor) {
      setAviso('Pegá una dirección para revisarla.')
      return
    }
    navigate('/safelink/enlaces', { state: { entrada: valor } })
  }

  return (
    <div className="inicio">
      <section className="inicio-hero" aria-label="Estado de protección">
        <Anillo porcentaje={PROTECCION.porcentaje} />
        <div className="inicio-hero-texto">
          <p className="inicio-kicker">Protección</p>
          <p className="inicio-frase">{PROTECCION.frase}</p>
          <Link className="inicio-revisar-ahora" to="/safelink/whatsapp">
            Revisar ahora
          </Link>
        </div>
        <div className="inicio-campana">
          <p className="inicio-campana-titulo">{CAMPANA.nombre}</p>
          <div
            className="inicio-barra"
            role="progressbar"
            aria-valuenow={CAMPANA.hecho}
            aria-valuemin={0}
            aria-valuemax={CAMPANA.total}
            aria-label={`${CAMPANA.nombre}: ${CAMPANA.hecho} de ${CAMPANA.total} ya la completaron`}
            style={{ '--avance': `${avance}%` }}
          >
            <span />
          </div>
          <p>
            {CAMPANA.hecho} de {CAMPANA.total} ya la completaron
          </p>
        </div>
      </section>

      <form className="inicio-revisar" onSubmit={revisar}>
        <label className="inicio-campo">
          <span className="inicio-etiqueta">Pegá un enlace para revisarlo</span>
          <input
            type="text"
            name="enlace"
            value={enlace}
            onChange={(evento) => {
              setEnlace(evento.target.value)
              if (aviso) setAviso('')
            }}
            placeholder="ejemplo.com/promo"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            inputMode="url"
            enterKeyHint="go"
          />
          <button type="submit" className="inicio-enviar" aria-label="Revisar el enlace">
            <Icono nombre="flecha" />
          </button>
        </label>
        <Link className="inicio-qr" to="/safelink/qr" aria-label="Escanear un QR">
          <Icono nombre="qr" />
        </Link>
      </form>
      {aviso ? <p className="inicio-aviso">{aviso}</p> : null}

      <section className="inicio-bloque" aria-labelledby="inicio-actividad">
        <h2 id="inicio-actividad">Actividad reciente</h2>
        {ACTIVIDAD.length === 0 ? (
          <p className="inicio-vacio">
            Todavía no revisaste nada. Pegá un enlace arriba y el resultado aparece acá.
          </p>
        ) : (
          <ul className="inicio-lista">
            {ACTIVIDAD.map((item) => (
              <li key={item.id}>
                <Link className="inicio-item" to={item.to}>
                  <span className="inicio-item-icono">
                    <Icono nombre={item.tipo === 'Mensaje' ? 'mensaje' : 'enlace'} />
                  </span>
                  <span className="inicio-item-texto">
                    <strong className="inicio-dominio">{item.titulo}</strong>
                    {item.ruta ? <span className="inicio-ruta">{item.ruta}</span> : null}
                    <span>
                      {item.tipo} · {item.cuando}
                    </span>
                  </span>
                  <span className={`inicio-chip inicio-chip-${item.nivel}`}>{CHIP[item.nivel]}</span>
                  <span className="inicio-ir" aria-hidden="true">
                    <Icono nombre="flecha" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="inicio-consejo">
        <span className="inicio-consejo-icono">
          <Icono nombre="consejo" />
        </span>
        <div>
          <h2>{CONSEJO.titulo}</h2>
          <p>{CONSEJO.texto}</p>
        </div>
      </aside>
    </div>
  )
}

export default Inicio
