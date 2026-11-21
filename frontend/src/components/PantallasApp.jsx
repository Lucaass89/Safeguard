import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { avanceDeCapitulo, CAPITULOS, capituloEn } from '../lib/recorridoApp.js'
import { debeAndar, elementoVisible, leerModo, UMBRAL_VISIBLE } from '../lib/reproduccion.js'
import './PantallasApp.css'

const TEMAS = ['claro', 'oscuro']
const ALT =
  'Recorrido por la app de SafeGuard para Android: escanear un QR, revisar un enlace, un mensaje y un PDF, preguntarle a Faro, ingresar y ver el perfil.'

function PantallasApp() {
  const [modo] = useState(() => leerModo())
  const celular = useRef(null)
  const videos = useRef({})
  const [visible, setVisible] = useState(false)
  const [pedido, setPedido] = useState(false)
  const [pausado, setPausado] = useState(false)
  const [andando, setAndando] = useState(false)
  const [tiempo, setTiempo] = useState(0)
  const reproducir = debeAndar({ modo, visible, pedido, pausado })
  const actual = capituloEn(tiempo)

  function videoActivo() {
    return elementoVisible(TEMAS.map((tema) => videos.current[tema]))
  }

  useEffect(() => {
    if (!celular.current || typeof IntersectionObserver !== 'function') return undefined
    const observador = new IntersectionObserver(
      ([entrada]) => setVisible(entrada.isIntersecting && entrada.intersectionRatio >= UMBRAL_VISIBLE),
      { threshold: [0, UMBRAL_VISIBLE, 1] },
    )
    observador.observe(celular.current)
    return () => observador.disconnect()
  }, [])

  useEffect(() => {
    const activo = elementoVisible(TEMAS.map((tema) => videos.current[tema]))
    for (const tema of TEMAS) {
      const video = videos.current[tema]
      if (video && video !== activo) video.pause()
    }
    if (!activo) return
    if (reproducir) activo.play().catch(() => {})
    else activo.pause()
  }, [reproducir])

  function irA(indice) {
    const activo = videoActivo()
    if (activo) activo.currentTime = CAPITULOS[indice].inicio
    setTiempo(CAPITULOS[indice].inicio)
    setPausado(false)
    setPedido(true)
  }

  function alternar() {
    if (andando) {
      setPausado(true)
      return
    }
    setPausado(false)
    setPedido(true)
  }

  return (
    <section className="pantallas recorrido" aria-labelledby="pantallas-titulo">
      <div className="recorrido-texto">
        <h2 id="pantallas-titulo">Así funciona la app en tu celular</h2>
        <p>
          Una grabación real de la app de SafeGuard para Android, de punta a punta. Tocá un paso para
          ir directo a esa parte.
        </p>

        <ol className="recorrido-capitulos">
          {CAPITULOS.map((capitulo, indice) => {
            const activo = indice === actual
            const avance = activo ? avanceDeCapitulo(tiempo, indice) : indice < actual ? 1 : 0
            return (
              <li key={capitulo.id}>
                <button
                  type="button"
                  className={activo ? 'recorrido-capitulo recorrido-capitulo-activo' : 'recorrido-capitulo'}
                  aria-current={activo ? 'step' : undefined}
                  onClick={() => irA(indice)}
                >
                  <span className="recorrido-numero" aria-hidden="true">
                    {indice + 1}
                  </span>
                  <span className="recorrido-capitulo-texto">
                    <strong>{capitulo.titulo}</strong>
                    <span>{capitulo.texto}</span>
                  </span>
                  <span className="recorrido-avance" aria-hidden="true">
                    <span style={{ transform: `scaleX(${avance})` }} />
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <p className="pantallas-pie">
          <Link className="portada-boton" to="/personas">Probar SafeLink gratis</Link>
        </p>
      </div>

      <div className="recorrido-celular">
        <div ref={celular} className={`pantallas-telefono${andando ? ' pantallas-en-movimiento' : ''}`}>
          <span className="pantallas-camara" aria-hidden="true" />
          <div className="pantallas-pantalla">
            {TEMAS.map((tema) => (
              <video
                key={`video-${tema}`}
                ref={(el) => {
                  videos.current[tema] = el
                }}
                className={`pantallas-video pantallas-captura-${tema}`}
                src={`/capturas/recorrido-${tema}.mp4`}
                width="540"
                height="1100"
                muted
                loop
                playsInline
                preload="none"
                aria-hidden="true"
                tabIndex={-1}
                onPlaying={() => setAndando(true)}
                onPause={() => setAndando(false)}
                onTimeUpdate={(evento) => setTiempo(evento.currentTarget.currentTime)}
              />
            ))}
            {TEMAS.map((tema) => (
              <img
                key={`foto-${tema}`}
                className={`pantallas-captura pantallas-captura-${tema}`}
                src={`/capturas/recorrido-${tema}.webp`}
                alt={ALT}
                width="540"
                height="1100"
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </div>
        <div className="recorrido-control">
          <button type="button" className="recorrido-boton" onClick={alternar} aria-pressed={!andando}>
            <span className={andando ? 'pantallas-pista-pausa' : 'pantallas-pista-icono'} aria-hidden="true" />
            {andando ? 'Pausar' : tiempo === 0 ? 'Ver el recorrido' : 'Seguir'}
          </button>
          <span className="recorrido-ahora">
            {actual + 1} de {CAPITULOS.length} · {CAPITULOS[actual].titulo}
          </span>
        </div>
      </div>
    </section>
  )
}

export default PantallasApp
