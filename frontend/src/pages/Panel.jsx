import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase.js'
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

function Panel() {
  const { sesion } = useSesion()
  const [tablero, setTablero] = useState(null)
  const [acceso, setAcceso] = useState(null)
  const [fase, setFase] = useState(() => (recibido(sesion.user.id) ? 'elegir' : 'recibiendo'))
  const nombre =
    sesion.user.user_metadata?.full_name ??
    sesion.user.user_metadata?.name ??
    sesion.user.email
  const reducir =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function cerrarRecepcion() {
    sessionStorage.setItem('sg-recibido', sesion.user.id)
    setFase('elegir')
  }

  useEffect(() => {
    let activo = true

    supabase.rpc('phishguard_tablero').then(({ data, error }) => {
      if (!activo) return
      if (error || !data?.organizacion) {
        setAcceso(false)
        return
      }
      setAcceso(true)
      setTablero({
        eventos: Array.isArray(data.eventos) ? data.eventos : [],
        campanas: Array.isArray(data.campanas) ? data.campanas : [],
      })
    }, () => {
      if (activo) setAcceso(false)
    })

    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    if (fase !== 'recibiendo' || reducir) return undefined
    const timer = window.setTimeout(cerrarRecepcion, 3600)
    return () => window.clearTimeout(timer)
  }, [fase, reducir, sesion.user.id])

  const correos = tablero?.eventos.length ?? 0
  const clics = tablero?.eventos.filter((evento) => evento.hizo_clic).length ?? 0
  const datos = tablero?.eventos.filter((evento) => evento.ingreso_datos).length ?? 0
  const campanas = tablero?.campanas.length ?? 0
  const saludo = primerNombre(nombre, sesion.user.email)
  const porcentaje = correos > 0 ? Math.round((clics / correos) * 100) : 0

  return (
    <div className="panel mesa">
      {fase === 'recibiendo' && (
        <div className="recibida" onAnimationEnd={(evento) => {
          if (evento.animationName === 'recibida-sale') cerrarRecepcion()
        }}>
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
        <section className="elegir">
          <h1>¿Qué aplicación querés usar?</h1>
          <div className="elegir-corte">
            <button type="button" className="elegir-lado elegir-safelink" onClick={() => setFase('safelink')}>
              <span>Para personas</span>
              <strong>SafeLink</strong>
              <p>Revisá un enlace, un mensaje, un PDF o un correo.</p>
            </button>
            {acceso ? (
              <button type="button" className="elegir-lado elegir-phish" onClick={() => setFase('phishguard')}>
                <span>Para empresas</span>
                <strong>PhishGuard</strong>
                <p>Cargá al equipo y armá una simulación.</p>
              </button>
            ) : (
              <div className="elegir-lado elegir-phish elegir-cerrado">
                <span>{acceso === false ? 'Plan pago' : 'Para empresas'}</span>
                <strong>PhishGuard</strong>
                <p>
                  {acceso === null
                    ? 'Revisando tu plan…'
                    : 'Esta parte no viene con la cuenta. Se abre cuando el plan está pago.'}
                </p>
                {acceso === false && <Link to="/contacto">Hablar para activarlo</Link>}
              </div>
            )}
          </div>
        </section>
      )}

      {fase !== 'elegir' && fase !== 'recibiendo' && (
        <button type="button" className="elegir-volver" onClick={() => setFase('elegir')}>
          Elegir otra aplicación
        </button>
      )}

      {fase === 'safelink' && (
        <header className="mesa-bienvenida">
          <h1 className="mesa-saludo">SafeLink</h1>
          <p>Revisá lo que te llega antes de abrirlo.</p>
        </header>
      )}

      {fase === 'phishguard' && tablero && (
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

      {(fase === 'safelink' || (fase === 'phishguard' && acceso)) && (
      <div className="mesa-hoja mesa-grupos">
        {grupos.filter((grupo) => (fase === 'safelink' ? grupo.nombre === 'SafeLink' : grupo.nombre === 'PhishGuard')).map((grupo) => (
          <section className={grupo.clase} key={grupo.nombre}>
            {grupo.nombre !== 'SafeLink' && (
              <>
                <h2>{grupo.nombre}</h2>
                <p className="mesa-grupo-lead">{grupo.lead}</p>
              </>
            )}
            <ol>
              {grupo.items.map((item, indice) => (
                <li key={item.to}>
                  <Link to={item.to}>
                    <span>{String(indice + 1).padStart(2, '0')}</span>
                    <strong>{item.titulo}</strong>
                    <span>{item.nota}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      )}
    </div>
  )
}

export default Panel
