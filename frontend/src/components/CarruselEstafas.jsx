import { useId, useMemo, useRef, useState } from 'react'
import { EJEMPLOS, indiceVisible, siguienteIndice, veredictoEjemplo } from '../lib/carruselEstafas.js'
import './CarruselEstafas.css'

const NIVELES = {
  verde: 'Verde: no aparecen señales de riesgo',
  amarillo: 'Amarillo: hay algo raro',
  rojo: 'Rojo: no lo abras',
  gris: 'Gris: no lo podemos revisar',
}

function Mensaje({ ejemplo }) {
  if (ejemplo.tipo === 'enlace') {
    return (
      <div className="carrusel-barra-url">
        <span className="carrusel-candado" aria-hidden="true" />
        <span>{ejemplo.mensaje}</span>
      </div>
    )
  }

  if (ejemplo.tipo === 'correo') {
    return (
      <div className="carrusel-correo">
        <p className="carrusel-correo-de">
          <span>De:</span> {ejemplo.remitente}
        </p>
        <p className="carrusel-correo-asunto">{ejemplo.asunto}</p>
        <p>{ejemplo.mensaje}</p>
      </div>
    )
  }

  return (
    <div className={`carrusel-chat carrusel-chat-${ejemplo.canal === 'SMS' ? 'sms' : 'wa'}`}>
      <p className="carrusel-chat-de">{ejemplo.remitente}</p>
      <p className="carrusel-burbuja">{ejemplo.mensaje}</p>
    </div>
  )
}

function CarruselEstafas() {
  const id = useId()
  const pista = useRef(null)
  const [actual, setActual] = useState(0)
  const ejemplos = useMemo(
    () => EJEMPLOS.map((ejemplo) => ({ ...ejemplo, veredicto: veredictoEjemplo(ejemplo) })),
    [],
  )
  const total = ejemplos.length

  function anchoTarjeta() {
    const primera = pista.current?.firstElementChild
    if (!primera) return 0
    const separacion = parseFloat(getComputedStyle(pista.current).columnGap) || 0
    return primera.getBoundingClientRect().width + separacion
  }

  function irA(indice) {
    const destino = siguienteIndice(indice, 0, total)
    const tarjeta = pista.current?.children[destino]
    if (!tarjeta) return
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    pista.current.scrollTo({ left: tarjeta.offsetLeft - pista.current.offsetLeft, behavior: quieto ? 'auto' : 'smooth' })
    setActual(destino)
  }

  function alDesplazar() {
    if (!pista.current) return
    setActual(indiceVisible(pista.current.scrollLeft, anchoTarjeta(), total))
  }

  function alTeclear(evento) {
    if (evento.key === 'ArrowRight') {
      evento.preventDefault()
      irA(actual + 1)
    } else if (evento.key === 'ArrowLeft') {
      evento.preventDefault()
      irA(actual - 1)
    }
  }

  return (
    <section className="carrusel" aria-labelledby={`${id}-titulo`} aria-roledescription="carrusel">
      <div className="carrusel-cabeza">
        <div>
          <h2 id={`${id}-titulo`}>Estafas que circulan, revisadas por SafeLink</h2>
          <p>
            Mensajes armados como los que se denuncian en Argentina. El color y los motivos los
            calcula el detector de SafeLink en tu navegador, igual que cuando pegás algo vos. Los
            enlaces son inventados: no los abras.
          </p>
        </div>
        <div className="carrusel-flechas">
          <button type="button" onClick={() => irA(actual - 1)} disabled={actual === 0} aria-label="Ejemplo anterior">
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" onClick={() => irA(actual + 1)} disabled={actual === total - 1} aria-label="Ejemplo siguiente">
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <ul className="carrusel-pista" ref={pista} onScroll={alDesplazar} onKeyDown={alTeclear} tabIndex={0} aria-label="Ejemplos de estafas">
        {ejemplos.map((ejemplo, indice) => (
          <li
            key={ejemplo.id}
            className="carrusel-tarjeta"
            aria-roledescription="ejemplo"
            aria-label={`${indice + 1} de ${total}: ${ejemplo.quien}`}
          >
            <p className="carrusel-etiqueta">
              <span>{ejemplo.canal}</span>
              {ejemplo.quien}
            </p>
            <Mensaje ejemplo={ejemplo} />
            <div className={`carrusel-veredicto carrusel-${ejemplo.veredicto.nivel}`}>
              <p className="carrusel-nivel">
                <span className="carrusel-luz" aria-hidden="true" />
                {NIVELES[ejemplo.veredicto.nivel]}
              </p>
              {ejemplo.veredicto.motivos.length > 0 && (
                <ul>
                  {ejemplo.veredicto.motivos.map((motivo) => (
                    <li key={motivo}>{motivo}</li>
                  ))}
                </ul>
              )}
            </div>
            <p className="carrusel-consejo">
              <strong>Qué hacer:</strong> {ejemplo.consejo}
            </p>
          </li>
        ))}
      </ul>

      <div className="carrusel-puntos">
        {ejemplos.map((ejemplo, indice) => (
          <button
            key={ejemplo.id}
            type="button"
            className={indice === actual ? 'carrusel-punto carrusel-punto-activo' : 'carrusel-punto'}
            onClick={() => irA(indice)}
            aria-label={`Ir al ejemplo ${indice + 1}: ${ejemplo.quien}`}
            aria-current={indice === actual ? 'true' : undefined}
          />
        ))}
      </div>
    </section>
  )
}

export default CarruselEstafas
