import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  anteriorCircular,
  debeAvanzarSolo,
  EJEMPLOS,
  indiceVisible,
  INTERVALO_MS,
  siguienteCircular,
  tarjetasVisibles,
  ultimaPosicion,
  veredictoEjemplo,
} from '../lib/carruselEstafas.js'
import './CarruselEstafas.css'

const NIVELES = {
  verde: { titulo: 'Verde', texto: 'No aparecen señales de riesgo' },
  amarillo: { titulo: 'Amarillo', texto: 'Hay algo raro' },
  rojo: { titulo: 'Rojo', texto: 'No lo abras' },
  gris: { titulo: 'Gris', texto: 'No lo podemos revisar' },
}

function quieto() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function Mensaje({ ejemplo }) {
  if (ejemplo.tipo === 'enlace') {
    return (
      <div className="carrusel-mensaje carrusel-barra-url">
        <span className="carrusel-candado" aria-hidden="true" />
        <span>{ejemplo.mensaje}</span>
      </div>
    )
  }

  if (ejemplo.tipo === 'correo') {
    return (
      <div className="carrusel-mensaje carrusel-correo">
        <p className="carrusel-correo-de">
          <span>De:</span> {ejemplo.remitente}
        </p>
        <p className="carrusel-correo-asunto">{ejemplo.asunto}</p>
        <p>{ejemplo.mensaje}</p>
      </div>
    )
  }

  return (
    <div className={`carrusel-mensaje carrusel-chat carrusel-chat-${ejemplo.canal === 'SMS' ? 'sms' : 'wa'}`}>
      <p className="carrusel-chat-de">{ejemplo.remitente}</p>
      <p className="carrusel-burbuja">{ejemplo.mensaje}</p>
    </div>
  )
}

function CarruselEstafas() {
  const id = useId()
  const caja = useRef(null)
  const pista = useRef(null)
  const [actual, setActual] = useState(0)
  const [visibles, setVisibles] = useState(3)
  const [reproduciendo, setReproduciendo] = useState(() => !quieto())
  const [pidioReproducir, setPidioReproducir] = useState(false)
  const [apuntado, setApuntado] = useState(false)
  const [enfocado, setEnfocado] = useState(false)
  const [enPantalla, setEnPantalla] = useState(false)
  const [pestanaVisible, setPestanaVisible] = useState(true)
  const ejemplos = useMemo(
    () => EJEMPLOS.map((ejemplo) => ({ ...ejemplo, veredicto: veredictoEjemplo(ejemplo) })),
    [],
  )
  const total = ejemplos.length
  const ultima = ultimaPosicion(total, visibles)
  const posiciones = ultima + 1
  const andando = debeAvanzarSolo({
    reproduciendo,
    apuntado,
    enfocado,
    visible: enPantalla,
    pestanaVisible,
    movimientoReducido: quieto() && !pidioReproducir,
  })

  useEffect(() => {
    const elemento = caja.current
    if (!elemento) return undefined
    const medir = () => setVisibles(tarjetasVisibles(elemento.clientWidth))
    medir()
    if (typeof ResizeObserver !== 'function') return undefined
    const observador = new ResizeObserver(medir)
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  useEffect(() => {
    const elemento = caja.current
    if (!elemento || typeof IntersectionObserver !== 'function') return undefined
    const observador = new IntersectionObserver(([entrada]) => setEnPantalla(entrada.isIntersecting), {
      threshold: 0.35,
    })
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  useEffect(() => {
    const alCambiar = () => setPestanaVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', alCambiar)
    return () => document.removeEventListener('visibilitychange', alCambiar)
  }, [])

  function irA(indice) {
    const destino = Math.min(Math.max(indice, 0), ultima)
    const tarjeta = pista.current?.children[destino]
    if (!tarjeta) return
    pista.current.scrollTo({
      left: tarjeta.offsetLeft - pista.current.offsetLeft,
      behavior: quieto() ? 'auto' : 'smooth',
    })
    setActual(destino)
  }

  const irARef = useRef(irA)
  useEffect(() => {
    irARef.current = irA
  })

  useEffect(() => {
    if (!andando) return undefined
    const espera = window.setTimeout(() => irARef.current(siguienteCircular(actual, total, visibles)), INTERVALO_MS)
    return () => window.clearTimeout(espera)
  }, [andando, actual, total, visibles])

  function anchoTarjeta() {
    const primera = pista.current?.firstElementChild
    if (!primera) return 0
    const separacion = parseFloat(getComputedStyle(pista.current).columnGap) || 0
    return primera.getBoundingClientRect().width + separacion
  }

  function alDesplazar() {
    if (!pista.current) return
    setActual(Math.min(indiceVisible(pista.current.scrollLeft, anchoTarjeta(), total), ultima))
  }

  function alTeclear(evento) {
    if (evento.key === 'ArrowRight') {
      evento.preventDefault()
      irA(siguienteCircular(actual, total, visibles))
    } else if (evento.key === 'ArrowLeft') {
      evento.preventDefault()
      irA(anteriorCircular(actual, total, visibles))
    }
  }

  function alternar() {
    if (reproduciendo) {
      setReproduciendo(false)
      return
    }
    setPidioReproducir(true)
    setReproduciendo(true)
  }

  return (
    <section
      ref={caja}
      className="carrusel"
      aria-labelledby={`${id}-titulo`}
      aria-roledescription="carrusel"
      onMouseEnter={() => setApuntado(true)}
      onMouseLeave={() => setApuntado(false)}
      onFocus={() => setEnfocado(true)}
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) setEnfocado(false)
      }}
    >
      <div className="carrusel-cabeza">
        <div>
          <p className="carrusel-ceja">Casos reales, revisados</p>
          <h2 id={`${id}-titulo`}>Estafas que circulan, revisadas por SafeLink</h2>
          <p>
            Mensajes armados como los que se denuncian en Argentina. El color y los motivos los calcula el detector de
            SafeLink en tu navegador, igual que cuando pegás algo vos. Los enlaces son inventados: no los abras.
          </p>
        </div>
        <div className="carrusel-controles">
          <button
            type="button"
            className="carrusel-control"
            onClick={() => irA(anteriorCircular(actual, total, visibles))}
            aria-label="Ejemplo anterior"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            className="carrusel-control carrusel-pausa"
            onClick={alternar}
            aria-label={reproduciendo ? 'Pausar el carrusel' : 'Reproducir el carrusel'}
          >
            <span className={reproduciendo ? 'carrusel-icono-pausa' : 'carrusel-icono-play'} aria-hidden="true" />
            <span className="carrusel-pausa-texto">{reproduciendo ? 'Pausar' : 'Reproducir'}</span>
          </button>
          <button
            type="button"
            className="carrusel-control"
            onClick={() => irA(siguienteCircular(actual, total, visibles))}
            aria-label="Ejemplo siguiente"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <ul
        className="carrusel-pista"
        ref={pista}
        onScroll={alDesplazar}
        onKeyDown={alTeclear}
        tabIndex={0}
        aria-label="Ejemplos de estafas"
        aria-live={andando ? 'off' : 'polite'}
      >
        {ejemplos.map((ejemplo, indice) => {
          const nivel = NIVELES[ejemplo.veredicto.nivel] ?? NIVELES.gris
          return (
            <li
              key={ejemplo.id}
              className={`carrusel-tarjeta carrusel-${ejemplo.veredicto.nivel}`}
              aria-roledescription="ejemplo"
              aria-label={`${indice + 1} de ${total}: ${ejemplo.quien}, ${nivel.titulo}`}
            >
              <div className="carrusel-tarjeta-cabeza">
                <span className="carrusel-canal">{ejemplo.canal}</span>
                <span className="carrusel-quien">{ejemplo.quien}</span>
              </div>
              <Mensaje ejemplo={ejemplo} />
              <div className="carrusel-veredicto">
                <p className="carrusel-nivel">
                  <span className="carrusel-luz" aria-hidden="true" />
                  <strong>{nivel.titulo}</strong>
                  <span>{nivel.texto}</span>
                </p>
                {ejemplo.veredicto.motivos.length > 0 && (
                  <ul>
                    {ejemplo.veredicto.motivos.map((motivo) => (
                      <li key={motivo}>{motivo}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="carrusel-consejo">
                <span className="carrusel-consejo-titulo">Qué hacer</span>
                <p>{ejemplo.consejo}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="carrusel-pie">
        <div className="carrusel-puntos">
          {Array.from({ length: posiciones }, (_, indice) => (
            <button
              key={indice}
              type="button"
              className={indice === actual ? 'carrusel-punto carrusel-punto-activo' : 'carrusel-punto'}
              onClick={() => irA(indice)}
              aria-label={`Ir a la posición ${indice + 1} de ${posiciones}`}
              aria-current={indice === actual ? 'true' : undefined}
            >
              {indice === actual && (
                <span
                  key={`${actual}-${andando}`}
                  className={andando ? 'carrusel-progreso carrusel-progreso-andando' : 'carrusel-progreso'}
                  style={{ animationDuration: `${INTERVALO_MS}ms` }}
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
        <p className="carrusel-contador" aria-hidden="true">
          {String(actual + 1).padStart(2, '0')} / {String(posiciones).padStart(2, '0')}
        </p>
      </div>
    </section>
  )
}

export default CarruselEstafas
