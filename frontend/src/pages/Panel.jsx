import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase.js'
import { useMembresia } from '../lib/useMembresia.js'
import { useSesion } from '../lib/useSesion.js'
import './Panel.css'

function primerNombre(nombre, email) {
  const limpio = (nombre || '').trim()
  if (!limpio || limpio === email) return ''
  return limpio.split(/\s+/)[0]
}

function lectura(campanas, correos, clics, datos) {
  if (campanas === 0) return 'Todavía no hay campañas.'
  if (correos === 0) return `${campanas} campañas. Todavía no salió ningún correo.`
  const clic =
    clics === 0 ? 'nadie hizo clic' : clics === 1 ? '1 persona hizo clic' : `${clics} personas hicieron clic`
  const cargados =
    datos === 0 ? 'nadie cargó datos' : datos === 1 ? '1 persona cargó datos' : `${datos} personas cargaron datos`
  return `De ${correos} correos, ${clic} y ${cargados}.`
}

const grupos = [
  {
    nombre: 'SafeLink',
    clase: 'panel-personas',
    lead: 'Revisá lo que te llega antes de abrirlo.',
    items: [
      { to: '/panel/enlaces', icono: 'enlace', titulo: 'Revisar un enlace', nota: 'Pegá un link y te decimos si es seguro' },
      { to: '/panel/whatsapp', icono: 'whatsapp', titulo: 'Pegar un WhatsApp', nota: 'Pegá un mensaje sospechoso y te avisamos' },
      { to: '/panel/pdf', icono: 'pdf', titulo: 'Revisar un PDF', nota: 'Subí un PDF y revisamos si esconde algo' },
      { to: '/panel/correo', icono: 'correo', titulo: 'Revisar un correo', nota: 'Pegá un correo y revisamos si el remitente es real' },
    ],
  },
  {
    nombre: 'PhishGuard',
    clase: 'panel-empresas',
    lead: 'Entrená al equipo con una simulación.',
    items: [
      { to: '/panel/empresa', icono: 'empresa', titulo: 'Tu empresa', nota: 'Cargá a tu equipo' },
      { to: '/panel/campanas', icono: 'campanas', titulo: 'Campañas', nota: 'Armá y programá una simulación' },
      { to: '/panel/tablero', icono: 'tablero', titulo: 'Tablero', nota: 'El detalle del equipo a lo largo del tiempo' },
      { to: '/panel/informe', icono: 'informe', titulo: 'Informe', nota: 'Una página para guardar, sin sancionar a nadie' },
    ],
  },
]

function Icono({ nombre }) {
  const trazo = {
    viewBox: '0 0 24 24',
    width: '22',
    height: '22',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.6',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (nombre === 'enlace') {
    return (
      <svg {...trazo}>
        <path d="M10 13.5 13.5 10" />
        <path d="M8.4 11.6 7 13a3.4 3.4 0 0 0 4.8 4.8l1.4-1.4" />
        <path d="M15.6 12.4 17 11a3.4 3.4 0 0 0-4.8-4.8L10.8 7.6" />
      </svg>
    )
  }

  if (nombre === 'whatsapp') {
    return (
      <svg {...trazo}>
        <path d="M6.2 17.2 5 20l1.1-2.4A7.6 7.6 0 1 1 6.2 17.2Z" />
        <path d="M9.2 11.2h.01M12 11.2h.01M14.8 11.2h.01" />
      </svg>
    )
  }

  if (nombre === 'pdf') {
    return (
      <svg {...trazo}>
        <path d="M7 3.5h7.2L18 7.2V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
        <path d="M14 3.6V8h4.2" />
        <path d="M8.4 13h7.2M8.4 16.2h4.6" />
      </svg>
    )
  }

  if (nombre === 'correo') {
    return (
      <svg {...trazo}>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="m4 7.5 8 5.5 8-5.5" />
      </svg>
    )
  }

  if (nombre === 'empresa') {
    return (
      <svg {...trazo}>
        <path d="M4.5 20.5V7.2L12 4l7.5 3.2v13.3" />
        <path d="M4.5 20.5h15" />
        <path d="M9.5 20.5v-4h5v4" />
        <path d="M9 9.5h.01M12 9.5h.01M15 9.5h.01M9 13h.01M12 13h.01M15 13h.01" />
      </svg>
    )
  }

  if (nombre === 'campanas') {
    return (
      <svg {...trazo}>
        <path d="M4.5 11.5 20 5l-5.8 14.2-2.6-6.1L4.5 11.5Z" />
        <path d="M11.6 13.1 20 5" />
      </svg>
    )
  }

  if (nombre === 'tablero') {
    return (
      <svg {...trazo}>
        <path d="M4 19.5h16" />
        <path d="M7.5 19.5v-6.5" />
        <path d="M12 19.5V7" />
        <path d="M16.5 19.5v-4" />
      </svg>
    )
  }

  return (
    <svg {...trazo}>
      <rect x="6" y="4.5" width="12" height="15.5" rx="2" />
      <path d="M9 4.5h6V7H9z" />
      <path d="M9 11h6M9 14.2h4" />
    </svg>
  )
}

function Carta({ item, orden, onClick }) {
  return (
    <Link to={item.to} onClick={onClick} style={{ '--mesa-orden': orden }}>
      <span className="mesa-carta-icono">
        <Icono nombre={item.icono} />
      </span>
      <strong>{item.titulo}</strong>
      <span className="mesa-carta-nota">{item.nota}</span>
      <span className="mesa-carta-ir" aria-hidden="true">→</span>
    </Link>
  )
}

function recibido(id) {
  return sessionStorage.getItem('sg-recibido') === id
}

function appPedida() {
  if (typeof window === 'undefined') return null
  const app = new URLSearchParams(window.location.search).get('app')
  if (app === 'safelink' || app === 'phishguard') return app
  return null
}

function Panel() {
  const { sesion } = useSesion()
  const { pertenece, cargando: cargandoMembresia } = useMembresia()
  const yaEntro = recibido(sesion.user.id)
  const pedida = appPedida()
  const [tablero, setTablero] = useState(null)
  const acceso = yaEntro || pedida || !cargandoMembresia ? pertenece : null
  const [fase, setFase] = useState(() => pedida ?? 'elegir')
  const [saludoVisible, setSaludoVisible] = useState(!yaEntro)
  const nombre =
    sesion.user.user_metadata?.full_name ??
    sesion.user.user_metadata?.name ??
    sesion.user.email

  const cerrarSaludo = useCallback(() => {
    sessionStorage.setItem('sg-recibido', sesion.user.id)
    setSaludoVisible(false)
  }, [sesion.user.id])

  useEffect(() => {
    let activo = true

    supabase.rpc('phishguard_tablero').then(({ data, error }) => {
      if (!activo || error || !data?.organizacion) return
      setTablero({
        eventos: Array.isArray(data.eventos) ? data.eventos : [],
        campanas: Array.isArray(data.campanas) ? data.campanas : [],
      })
    }, () => {})

    return () => {
      activo = false
    }
  }, [sesion.user.id])

  const correos = tablero?.eventos.length ?? 0
  const clics = tablero?.eventos.filter((evento) => evento.hizo_clic).length ?? 0
  const datos = tablero?.eventos.filter((evento) => evento.ingreso_datos).length ?? 0
  const campanas = tablero?.campanas.length ?? 0
  const saludo = primerNombre(nombre, sesion.user.email)
  const porcentaje = correos > 0 ? Math.round((clics / correos) * 100) : 0
  const lineaSaludo = saludoVisible ? (
    <p className="mesa-hola">{saludo ? `Hola, ${saludo}` : 'Hola'}</p>
  ) : null

  return (
    <div className="panel mesa">
      {fase === 'elegir' && (
        <section className="elegir">
          <header className="elegir-cabeza">
            {lineaSaludo}
            <h1>¿Qué aplicación querés usar?</h1>
            <p>SafeLink revisa lo que te llega. PhishGuard entrena a tu equipo.</p>
          </header>
          <div className="elegir-corte">
            <button type="button" className="elegir-lado elegir-safelink" onClick={() => { cerrarSaludo(); setFase('safelink') }}>
              <span className="elegir-tope">
                <strong>SafeLink</strong>
                <span className="elegir-ir" aria-hidden="true">→</span>
              </span>
              <p>Revisá un enlace, un mensaje, un PDF o un correo.</p>
              <ul className="elegir-usos">
                <li>Enlace</li>
                <li>WhatsApp</li>
                <li>PDF</li>
                <li>Correo</li>
              </ul>
            </button>
            <div
              className={
                acceso === false
                  ? 'elegir-lado elegir-phish elegir-cerrado'
                  : 'elegir-lado elegir-phish'
              }
              role={acceso ? 'button' : undefined}
              tabIndex={acceso ? 0 : undefined}
              onClick={() => {
                if (acceso) {
                  cerrarSaludo()
                  setFase('phishguard')
                }
              }}
              onKeyDown={(evento) => {
                if (!acceso) return
                if (evento.key === 'Enter' || evento.key === ' ') {
                  evento.preventDefault()
                  cerrarSaludo()
                  setFase('phishguard')
                }
              }}
            >
              <span className="elegir-tope">
                <strong>PhishGuard</strong>
                {acceso === false ? (
                  <span className="elegir-plan">Plan pago</span>
                ) : (
                  <span className="elegir-ir" aria-hidden="true">→</span>
                )}
              </span>
              <p>
                {acceso
                  ? 'Cargá al equipo y armá una simulación.'
                  : acceso === false
                    ? 'Esta parte no viene con la cuenta. Se abre cuando el plan está pago.'
                    : 'Revisando tu plan…'}
              </p>
              <ul className="elegir-usos">
                <li>Empresa</li>
                <li>Campañas</li>
                <li>Tablero</li>
              </ul>
              {acceso === false && <Link to="/adquirir">Adquirir PhishGuard</Link>}
            </div>
          </div>
        </section>
      )}

      {fase !== 'elegir' && (
        <button
          type="button"
          className="elegir-volver"
          onClick={() => {
            cerrarSaludo()
            setFase('elegir')
            const url = new URL(window.location.href)
            url.searchParams.delete('app')
            window.history.replaceState(null, '', `${url.pathname}${url.search}`)
          }}
        >
          ← Elegir otra aplicación
        </button>
      )}

      {fase === 'safelink' && (
        <>
          <header className="mesa-bienvenida">
            {lineaSaludo}
            <h1 className="mesa-saludo">SafeLink</h1>
            <p>Revisá lo que te llega antes de abrirlo.</p>
          </header>
          <div className="mesa-cartas">
            {grupos[0].items.map((item, orden) => (
              <Carta key={item.to} item={item} orden={orden} onClick={cerrarSaludo} />
            ))}
          </div>
        </>
      )}

      {fase === 'phishguard' && acceso && (
        <>
          <header className="mesa-bienvenida">
            {lineaSaludo}
            <h1 className="mesa-saludo">PhishGuard</h1>
            <p>{grupos[1].lead}</p>
          </header>
          {tablero && (
            <section className="mesa-tablero" aria-labelledby="mesa-tablero-titulo">
              <div className="mesa-tablero-cabeza">
                <h2 id="mesa-tablero-titulo">Tablero del equipo</h2>
                <Link className="mesa-tablero-ir" to="/panel/tablero">
                  Ver el tablero
                </Link>
              </div>
              <p className="mesa-tablero-lectura">{lectura(campanas, correos, clics, datos)}</p>
              {correos > 0 && (
                <>
                  <ul className="metricas-franja">
                    <li>
                      <strong>{campanas}</strong>
                      <span>Campañas</span>
                    </li>
                    <li>
                      <strong>{correos}</strong>
                      <span>Correos</span>
                    </li>
                    <li>
                      <strong>{clics}</strong>
                      <span>Clics</span>
                    </li>
                    <li>
                      <strong>{datos}</strong>
                      <span>Datos ingresados</span>
                    </li>
                  </ul>
                  <div className="mesa-riesgo">
                    <div className="mesa-riesgo-pista" aria-hidden="true">
                      <span style={{ width: `${porcentaje}%` }} />
                    </div>
                    <p>
                      {clics} de {correos} correos con clic
                    </p>
                  </div>
                </>
              )}
            </section>
          )}
          <div className="mesa-cartas mesa-cartas-empresa">
            {grupos[1].items.map((item, orden) => (
              <Carta key={item.to} item={item} orden={orden} onClick={cerrarSaludo} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Panel
