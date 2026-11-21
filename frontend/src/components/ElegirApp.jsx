import { Link } from 'react-router'
import { datoPhishGuard, datoSafeLink } from '../lib/elegirApp.js'
import { saludo } from '../lib/saludo.js'
import { useTotalesPropios } from '../lib/useAnalisisPropios.js'
import './ElegirApp.css'

function IconoEnlace() {
  return (
    <svg className="ea-fondo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true">
      <path d="M10 13.5 13.5 10" />
      <path d="M8.4 11.6 7 13a3.4 3.4 0 0 0 4.8 4.8l1.4-1.4" />
      <path d="M15.6 12.4 17 11a3.4 3.4 0 0 0-4.8-4.8L10.8 7.6" />
    </svg>
  )
}

function IconoEscudo() {
  return (
    <svg className="ea-fondo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-2.5Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </svg>
  )
}

function ElegirApp({ nombre, acceso, tablero, onElegir }) {
  const totales = useTotalesPropios()
  const hora = new Date().getHours()
  const hola = nombre ? `${saludo(hora)}, ${nombre}` : saludo(hora)
  const datoPhish = acceso ? datoPhishGuard(tablero) : ''

  const phishContenido = (
    <>
      <IconoEscudo />
      <span className="ea-etiqueta">Para tu equipo</span>
      <strong className="ea-nombre">PhishGuard</strong>
      <span className="ea-texto">Simulá correos de phishing y enseñale a cada persona en el momento.</span>
      <span className="ea-dato">
        {acceso === false ? 'Se abre con el plan pago de la empresa' : acceso === null ? 'Revisando tu plan…' : datoPhish}
      </span>
      <span className="ea-entrar">{acceso === false ? 'Conocer PhishGuard' : 'Entrar a PhishGuard'} →</span>
    </>
  )

  return (
    <section className="ea" aria-label="Elegí una aplicación">
      <h1 className="visualmente-oculto">¿Qué aplicación querés usar?</h1>
      <button type="button" className="ea-lado ea-safelink" onClick={() => onElegir('safelink')}>
        <span className="ea-hola">{hola} · elegí una aplicación</span>
        <IconoEnlace />
        <span className="ea-etiqueta">Para vos</span>
        <strong className="ea-nombre">SafeLink</strong>
        <span className="ea-texto">Revisá lo que te llega antes de abrirlo: enlaces, mensajes, PDF y correos.</span>
        <span className="ea-dato">{totales.cargando ? 'Contando tus revisiones…' : datoSafeLink(totales)}</span>
        <span className="ea-entrar">Entrar a SafeLink →</span>
      </button>
      {acceso === false ? (
        <Link className="ea-lado ea-phish" to="/adquirir">
          {phishContenido}
        </Link>
      ) : (
        <button type="button" className="ea-lado ea-phish" onClick={() => onElegir('phishguard')} disabled={acceso === null}>
          {phishContenido}
        </button>
      )}
    </section>
  )
}

export default ElegirApp
