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
      { to: '/panel/enlaces', titulo: 'Revisar un enlace', nota: 'Pegá un link y te decimos si es seguro' },
      { to: '/panel/whatsapp', titulo: 'Pegar un WhatsApp', nota: 'Pegá un mensaje sospechoso y te avisamos' },
      { to: '/panel/pdf', titulo: 'Revisar un PDF', nota: 'Subí un PDF y revisamos si esconde algo' },
      { to: '/panel/correo', titulo: 'Revisar un correo', nota: 'Pegá un correo y revisamos si el remitente es real' },
    ],
  },
  {
    nombre: 'PhishGuard',
    clase: 'panel-empresas',
    lead: 'Entrená al equipo con una simulación.',
    items: [
      { to: '/panel/empresa', titulo: 'Tu empresa', nota: 'Cargá a tu equipo' },
      { to: '/panel/campanas', titulo: 'Campañas', nota: 'Armá y programá una simulación' },
    ],
  },
]

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
  const [fase, setFase] = useState(() => {
    if (pedida) return pedida
    return yaEntro ? 'elegir' : 'recibiendo'
  })
  const [saliendo, setSaliendo] = useState(false)
  const [entradaLista, setEntradaLista] = useState(yaEntro || Boolean(pedida))
  const nombre =
    sesion.user.user_metadata?.full_name ??
    sesion.user.user_metadata?.name ??
    sesion.user.email
  const reducir =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const cerrarRecepcion = useCallback(() => {
    sessionStorage.setItem('sg-recibido', sesion.user.id)
    setFase('elegir')
    setSaliendo(true)
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

  useEffect(() => {
    if (fase !== 'recibiendo' || reducir || saliendo) return undefined
    const timer = window.setTimeout(cerrarRecepcion, 3600)
    return () => window.clearTimeout(timer)
  }, [fase, reducir, saliendo, cerrarRecepcion])

  useEffect(() => {
    if (!saliendo) return undefined
    const timer = window.setTimeout(() => {
      setSaliendo(false)
      setFase('elegir')
    }, 360)
    return () => window.clearTimeout(timer)
  }, [saliendo])

  useEffect(() => {
    if (fase !== 'elegir' || entradaLista) return undefined
    const timer = window.setTimeout(() => setEntradaLista(true), 800)
    return () => window.clearTimeout(timer)
  }, [fase, entradaLista])

  const correos = tablero?.eventos.length ?? 0
  const clics = tablero?.eventos.filter((evento) => evento.hizo_clic).length ?? 0
  const datos = tablero?.eventos.filter((evento) => evento.ingreso_datos).length ?? 0
  const campanas = tablero?.campanas.length ?? 0
  const saludo = primerNombre(nombre, sesion.user.email)
  const porcentaje = correos > 0 ? Math.round((clics / correos) * 100) : 0

  return (
    <div className="panel mesa">
      {(fase === 'recibiendo' || saliendo) && (
        <div
          className={saliendo ? 'recibida saliendo' : 'recibida'}
          onAnimationEnd={(evento) => {
            if (evento.animationName === 'recibida-sale') {
              setSaliendo(false)
              setFase('elegir')
            }
          }}
        >
          <div>
            <p>SafeGuard</p>
            <h1>{saludo ? `Hola, ${saludo}` : 'Hola'}</h1>
            <p>Bienvenido al panel de SafeGuard</p>
            <button type="button" onClick={cerrarRecepcion}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {fase === 'elegir' && (
        <section
          className={entradaLista ? 'elegir elegir-lista' : 'elegir'}
          onAnimationEnd={(evento) => {
            if (evento.animationName !== 'elegir-entra') return
            if (!evento.target.classList?.contains('elegir-phish')) return
            setEntradaLista(true)
          }}
        >
          <header className="elegir-cabeza">
            <p className="mesa-kicker">Tu panel</p>
            <h1>¿Qué aplicación querés usar?</h1>
            <p>SafeLink revisa lo que te llega. PhishGuard entrena a tu equipo.</p>
          </header>
          <div className="elegir-corte">
            <button type="button" className="elegir-lado elegir-safelink" onClick={() => setFase('safelink')}>
              <span className="elegir-tope">
                <span className="elegir-indice">01</span>
                <span className="elegir-ir" aria-hidden="true">→</span>
              </span>
              <span>Para personas</span>
              <strong>SafeLink</strong>
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
                if (acceso) setFase('phishguard')
              }}
              onKeyDown={(evento) => {
                if (!acceso) return
                if (evento.key === 'Enter' || evento.key === ' ') {
                  evento.preventDefault()
                  setFase('phishguard')
                }
              }}
            >
              <span className="elegir-tope">
                <span className="elegir-indice">02</span>
                {acceso !== false && <span className="elegir-ir" aria-hidden="true">→</span>}
              </span>
              <span>{acceso === false ? 'Plan pago' : 'Para empresas'}</span>
              <strong>PhishGuard</strong>
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
              {acceso === false && <Link to="/contacto">Hablar para activarlo</Link>}
            </div>
          </div>
        </section>
      )}

      {fase !== 'elegir' && fase !== 'recibiendo' && (
        <button
          type="button"
          className="elegir-volver"
          onClick={() => {
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
            <p className="mesa-kicker">Para personas</p>
            <h1 className="mesa-saludo">SafeLink</h1>
            <p>Revisá lo que te llega antes de abrirlo.</p>
          </header>
          <div className="mesa-cartas">
            {grupos[0].items.map((item, indice) => (
              <Link key={item.to} to={item.to}>
                <span>{String(indice + 1).padStart(2, '0')}</span>
                <strong>{item.titulo}</strong>
                <span>{item.nota}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {fase === 'phishguard' && acceso && (
        <>
          <header className="mesa-bienvenida">
            <p className="mesa-kicker">Para empresas</p>
            <h1 className="mesa-saludo">PhishGuard</h1>
            <p>{grupos[1].lead}</p>
          </header>
          {tablero && (
            <Link className="mesa-tablero" to="/panel/tablero">
              <div className="mesa-tablero-cuerpo">
                <div>
                  <p className="mesa-tablero-kicker">PhishGuard</p>
                  <h2>Tablero del equipo</h2>
                  <p className="mesa-tablero-lectura">{lectura(campanas, correos, clics, datos)}</p>
                  {correos > 0 && (
                    <div className="mesa-riesgo">
                      <div className="mesa-riesgo-pista" aria-hidden="true">
                        <span style={{ width: `${porcentaje}%` }} />
                      </div>
                      <p>
                        {clics} de {correos} correos con clic
                      </p>
                    </div>
                  )}
                  <span className="mesa-tablero-ir">Ver el tablero</span>
                </div>
                {campanas > 0 && (
                  <ul>
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
                )}
              </div>
            </Link>
          )}
          <div className="mesa-cartas mesa-cartas-empresa">
            {grupos[1].items.map((item, indice) => (
              <Link key={item.to} to={item.to}>
                <span>{String(indice + 1).padStart(2, '0')}</span>
                <strong>{item.titulo}</strong>
                <span>{item.nota}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Panel
