import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAnalisisPropios } from '../lib/useAnalisisPropios.js'
import { useCampanas } from '../lib/useCampanas.js'
import { esAdministrador, useMembresia } from '../lib/useMembresia.js'
import { useSesion } from '../lib/useSesion.js'
import './Inicio.css'

// TODO: reemplazar por el porcentaje real y los mensajes pendientes de la cuenta.
// Hasta que existan, la card solo se ve en desarrollo para que nadie vea números inventados.
const PROTECCION = import.meta.env.DEV
  ? { porcentaje: 72, pendientes: 1, pendienteTo: '/safelink/whatsapp' }
  : null

// TODO: ajustar los cortes cuando exista el cálculo real.
function estadoDe(porcentaje) {
  if (porcentaje >= 80) return { id: 'bien', texto: 'Bien' }
  if (porcentaje >= 50) return { id: 'regular', texto: 'Regular' }
  return { id: 'riesgo', texto: 'En riesgo' }
}

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

  if (nombre === 'info') {
    return (
      <svg {...trazo}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </svg>
    )
  }

  if (nombre === 'bien') {
    return (
      <svg {...trazo}>
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12.2 2.3 2.3 4.7-5" />
      </svg>
    )
  }

  if (nombre === 'regular') {
    return (
      <svg {...trazo}>
        <path d="M12 4.5 20 19H4L12 4.5Z" />
        <path d="M12 10v4.2" />
        <path d="M12 16.8h.01" />
      </svg>
    )
  }

  if (nombre === 'riesgo') {
    return (
      <svg {...trazo}>
        <circle cx="12" cy="12" r="8" />
        <path d="m9 9 6 6M15 9l-6 6" />
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

function Anillo({ porcentaje, estado }) {
  const radio = 52
  const circunferencia = 2 * Math.PI * radio
  const resto = circunferencia * (1 - porcentaje / 100)

  return (
    <div className={`inicio-anillo inicio-anillo-${estado}`} role="img" aria-label={`${porcentaje} por ciento`}>
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

function TarjetaProteccion({ proteccion }) {
  const dialogo = useRef(null)
  const [explicando, setExplicando] = useState(false)
  const estado = estadoDe(proteccion.porcentaje)
  const { pendientes } = proteccion

  useEffect(() => {
    if (!explicando) return undefined
    const nodo = dialogo.current
    nodo?.showModal()
    return () => {
      if (nodo?.open) nodo.close()
    }
  }, [explicando])

  return (
    <section className="inicio-proteccion" aria-labelledby="inicio-proteccion-titulo">
      <div className="inicio-proteccion-cabeza">
        <h2 id="inicio-proteccion-titulo">Tu protección</h2>
        <button
          type="button"
          className="inicio-info"
          aria-label="Qué mide tu protección"
          onClick={() => setExplicando(true)}
        >
          <Icono nombre="info" />
        </button>
      </div>

      <div className="inicio-proteccion-card">
        <div className="inicio-medidor">
          <Anillo porcentaje={proteccion.porcentaje} estado={estado.id} />
          <p className={`inicio-estado inicio-estado-${estado.id}`}>
            <Icono nombre={estado.id} />
            <span>{estado.texto}</span>
          </p>
        </div>
        <div className="inicio-proteccion-texto">
          <p className="inicio-pendiente">
            {pendientes > 0
              ? `Tenés ${pendientes} ${pendientes === 1 ? 'mensaje' : 'mensajes'} sin revisar`
              : 'Todo al día'}
          </p>
          {pendientes > 0 ? (
            <Link className="inicio-revisar-ahora" to={proteccion.pendienteTo}>
              Revisar ahora
            </Link>
          ) : null}
        </div>
      </div>

      {explicando ? (
        <dialog
          ref={dialogo}
          className="inicio-hoja"
          aria-labelledby="inicio-hoja-titulo"
          onCancel={(evento) => {
            evento.preventDefault()
            setExplicando(false)
          }}
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) setExplicando(false)
          }}
        >
          <h2 id="inicio-hoja-titulo">Qué mide tu protección</h2>
          {/* TODO: alinear este texto con el cálculo real del porcentaje. */}
          <p>Muestra qué tan cuidado estás según lo que revisaste con SafeLink.</p>
          <p>Sube cuando revisás lo que te llega antes de abrirlo.</p>
          <button type="button" className="inicio-hoja-cerrar" onClick={() => setExplicando(false)}>
            Entendido
          </button>
        </dialog>
      ) : null}
    </section>
  )
}

function FilaEquipo() {
  const { sesion } = useSesion()
  const membresia = useMembresia()
  const admin = Boolean(sesion) && !membresia.cargando && esAdministrador(membresia.rol)
  const { campanas } = useCampanas(admin ? membresia.organizacionId : null)
  const ultima = campanas[0]

  if (!ultima || ultima.enviados === 0) return null

  return (
    <Link className="inicio-equipo" to="/phishguard">
      <span className="inicio-equipo-icono">
        <Icono nombre="equipo" />
      </span>
      <span className="inicio-equipo-texto">
        Tu equipo: {ultima.completaron} de {ultima.enviados} completaron la simulación
      </span>
      <span className="inicio-ir" aria-hidden="true">
        <Icono nombre="flecha" />
      </span>
    </Link>
  )
}

function Inicio() {
  const navigate = useNavigate()
  const [enlace, setEnlace] = useState('')
  const [aviso, setAviso] = useState('')
  const actividad = useAnalisisPropios({ limite: 5 })

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
      {PROTECCION ? <TarjetaProteccion proteccion={PROTECCION} /> : null}
      <FilaEquipo />

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
        {actividad.cargando ? (
          <p className="inicio-vacio">Buscando tus revisiones…</p>
        ) : actividad.error ? (
          <p className="inicio-vacio">No se pudo leer tu actividad. Probá de nuevo en un rato.</p>
        ) : actividad.items.length === 0 ? (
          <p className="inicio-vacio">
            Todavía no revisaste nada. Pegá un enlace arriba y el resultado aparece acá.
          </p>
        ) : (
          <ul className="inicio-lista">
            {actividad.items.map((item) => (
              <li key={item.id}>
                <Link className="inicio-item" to={item.to}>
                  <span className="inicio-item-icono">
                    <Icono nombre={item.tipo === 'Mensaje' ? 'mensaje' : item.tipo === 'QR' ? 'qr' : 'enlace'} />
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
