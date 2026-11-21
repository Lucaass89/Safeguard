import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { consejoCorto, datoPhishGuard, datoSafeLink, fechaDeHoy, tarjetasExtra } from '../lib/elegirApp.js'
import { esAppNativa } from '../lib/esAppNativa.js'
import { edicionVigente } from '../lib/estafasSemana.js'
import { saludo } from '../lib/saludo.js'
import { useAnalisisPropios, useTotalesPropios } from '../lib/useAnalisisPropios.js'
import './ElegirApp.css'

const CLAVE_EXTENSION = 'sg-extension-oculta'

function leerOculta() {
  try {
    return localStorage.getItem(CLAVE_EXTENSION) === '1'
  } catch {
    return false
  }
}

function esMovil() {
  return window.matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function DibujoSafeLink() {
  return (
    <div className="ea-dibujo ea-dibujo-safelink" aria-hidden="true">
      <div className="ea-campo-falso">
        <span className="ea-candado" />
        mercadopago-cobro.com/pagar
      </div>
      <div className="ea-semaforo">
        <span className="ea-chip ea-chip-verde">Seguro</span>
        <span className="ea-chip ea-chip-amarillo">Precaución</span>
        <span className="ea-chip ea-chip-rojo ea-chip-activo">Peligroso</span>
      </div>
    </div>
  )
}

function DibujoPhishGuard() {
  return (
    <div className="ea-dibujo ea-dibujo-phish" aria-hidden="true">
      <div className="ea-correo">
        <p className="ea-correo-de">
          <strong>RR. HH.</strong> rrhh@beneficios-empresa.com
        </p>
        <p className="ea-correo-asunto">Actualizá tus datos para cobrar el bono</p>
        <span className="ea-correo-boton">
          Ver mi bono
          <svg className="ea-cursor" viewBox="0 0 24 24" width="22" height="22">
            <path d="M5 3.5 18.5 12l-6 1.6 3.3 6.1-2.6 1.4-3.3-6.1L5 19Z" />
          </svg>
        </span>
      </div>
    </div>
  )
}

function Atajo({ to, onClick, children }) {
  if (to) {
    return (
      <Link className="ea-atajo" to={to}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" className="ea-atajo" onClick={onClick}>
      {children}
    </button>
  )
}

function TarjetaSafeLink({ onElegir }) {
  const totales = useTotalesPropios()
  const ultimo = useAnalisisPropios({ limite: 1 }).items[0]

  return (
    <article className="ea-app ea-app-safelink">
      <div className="ea-app-tope">
        <span className="ea-app-icono" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13.5 13.5 10" />
            <path d="M8.4 11.6 7 13a3.4 3.4 0 0 0 4.8 4.8l1.4-1.4" />
            <path d="M15.6 12.4 17 11a3.4 3.4 0 0 0-4.8-4.8L10.8 7.6" />
          </svg>
        </span>
        <button type="button" className="ea-app-entrar" onClick={() => onElegir('safelink')}>
          <strong>SafeLink</strong>
          <span className="ea-ir" aria-hidden="true">→</span>
        </button>
      </div>
      <p className="ea-app-texto">Revisá un enlace, un mensaje, un PDF o un correo antes de abrirlo.</p>
      <DibujoSafeLink />
      <div className="ea-dato">
        <p>{totales.cargando ? 'Contando tus revisiones…' : datoSafeLink(totales)}</p>
        {ultimo ? (
          <p className="ea-dato-ultimo">
            <span className={`ea-punto ea-punto-${ultimo.nivelRiesgo ?? 'gris'}`} aria-hidden="true" />
            Lo último: {ultimo.dominio || ultimo.titulo} · {ultimo.cuando}
          </p>
        ) : null}
      </div>
      <div className="ea-atajos">
        <Atajo onClick={() => onElegir('safelink')}>Enlace</Atajo>
        <Atajo onClick={() => onElegir('safelink')}>WhatsApp</Atajo>
        <Atajo onClick={() => onElegir('safelink')}>PDF</Atajo>
        <Atajo onClick={() => onElegir('safelink')}>Correo</Atajo>
        <Atajo to="/panel/qr">QR</Atajo>
        <Atajo to="/panel/historial">Historial</Atajo>
      </div>
    </article>
  )
}

function TarjetaPhishGuard({ acceso, tablero, onElegir }) {
  const dato = datoPhishGuard(tablero)
  const cerrada = acceso === false

  return (
    <article className={cerrada ? 'ea-app ea-app-phish ea-app-cerrada' : 'ea-app ea-app-phish'}>
      <div className="ea-app-tope">
        <span className="ea-app-icono" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-2.5Z" />
            <path d="m9 12 2.2 2.2L15.5 10" />
          </svg>
        </span>
        {cerrada ? (
          <span className="ea-app-entrar ea-app-entrar-quieto">
            <strong>PhishGuard</strong>
            <span className="ea-plan">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
              </svg>
              Plan pago
            </span>
          </span>
        ) : (
          <button type="button" className="ea-app-entrar" onClick={() => onElegir('phishguard')} disabled={acceso === null}>
            <strong>PhishGuard</strong>
            <span className="ea-ir" aria-hidden="true">→</span>
          </button>
        )}
      </div>
      <p className="ea-app-texto">
        {cerrada ? 'Entrená a tu equipo con correos de phishing simulados y enseñale en el momento.' : 'Cargá al equipo y armá una simulación.'}
      </p>
      <DibujoPhishGuard />
      <div className="ea-dato">
        {cerrada ? (
          <p>Se abre cuando la empresa tiene el plan pago.</p>
        ) : acceso === null ? (
          <p>Revisando tu plan…</p>
        ) : dato.porcentaje === null ? (
          <p>{dato.texto}</p>
        ) : (
          <>
            <p>
              <strong className="ea-dato-grande">{dato.porcentaje}%</strong> {dato.texto}
            </p>
            <div className="ea-pista" aria-hidden="true">
              <span style={{ width: `${dato.porcentaje}%` }} />
            </div>
          </>
        )}
      </div>
      <div className="ea-atajos">
        {cerrada ? (
          <Link className="ea-atajo ea-atajo-fuerte" to="/adquirir">
            Adquirir PhishGuard
          </Link>
        ) : (
          <>
            <Atajo to="/panel/empresa">Empresa</Atajo>
            <Atajo to="/panel/campanas">Campañas</Atajo>
            <Atajo to="/panel/tablero">Tablero</Atajo>
            <Atajo to="/panel/informe">Informe</Atajo>
          </>
        )}
      </div>
    </article>
  )
}

function Extras() {
  const [oculta, setOculta] = useState(leerOculta)
  const [apk, setApk] = useState('/app/safeguard-1.4.apk')
  const edicion = edicionVigente()
  const lista = tarjetasExtra({
    edicion,
    extensionOculta: oculta,
    movil: esMovil(),
    ios: /iPhone|iPad|iPod/i.test(navigator.userAgent),
    appNativa: esAppNativa(),
  })

  useEffect(() => {
    let activo = true
    fetch('/app/version.json', { cache: 'no-store' })
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((datos) => {
        if (activo && typeof datos?.archivo === 'string' && datos.archivo.startsWith('/app/')) setApk(datos.archivo)
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  function ocultarExtension() {
    try {
      localStorage.setItem(CLAVE_EXTENSION, '1')
    } catch {
      setOculta(true)
      return
    }
    setOculta(true)
  }

  if (lista.length === 0) return null
  const estafa = edicion?.estafas[0]

  return (
    <section className="ea-extras" aria-label="Más de SafeGuard">
      {lista.includes('estafa') && estafa ? (
        <article className="ea-extra ea-extra-estafa">
          <p className="ea-extra-etiqueta">Estafa de la semana</p>
          <h2>{estafa.titulo}</h2>
          <p>
            {estafa.quien} · {estafa.canal}. {estafa.mirar[0]}
          </p>
        </article>
      ) : null}
      {lista.includes('extension') ? (
        <article className="ea-extra">
          <p className="ea-extra-etiqueta">Extensión de Chrome</p>
          <h2>Que SafeLink te avise solo</h2>
          <p>Pone un color en el ícono de la barra según la página que estás viendo.</p>
          <div className="ea-extra-acciones">
            <Link to="/personas#instalar">Instalarla</Link>
            <button type="button" onClick={ocultarExtension}>
              Ya la tengo
            </button>
          </div>
        </article>
      ) : null}
      {lista.includes('app') ? (
        <article className="ea-extra">
          <p className="ea-extra-etiqueta">App para Android</p>
          <h2>SafeGuard en tu celular</h2>
          <p>Escaneá QR con la cámara, revisá lo que te comparten por WhatsApp y recibí avisos.</p>
          <div className="ea-extra-acciones">
            <a href={apk} download>
              Bajar la app
            </a>
          </div>
        </article>
      ) : null}
    </section>
  )
}

function ElegirApp({ nombre, acceso, tablero, onElegir }) {
  const consejo = consejoCorto()
  const hola = nombre ? `${saludo(new Date().getHours())}, ${nombre}` : saludo(new Date().getHours())

  return (
    <section className="ea">
      <header className="ea-cabeza">
        <p className="ea-fecha">{fechaDeHoy()}</p>
        <p className="ea-hola">{hola}</p>
        <h1>¿Qué aplicación querés usar?</h1>
        <p className="ea-consejo">
          <span className="ea-consejo-marca">Consejo del día</span>
          {consejo.titulo}: {consejo.texto}
        </p>
      </header>
      <div className="ea-apps">
        <TarjetaSafeLink onElegir={onElegir} />
        <TarjetaPhishGuard acceso={acceso} tablero={tablero} onElegir={onElegir} />
      </div>
      <Extras />
    </section>
  )
}

export default ElegirApp
