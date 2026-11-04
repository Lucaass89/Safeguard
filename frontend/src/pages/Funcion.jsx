import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import IconoFuncion from '../components/IconoFuncion.jsx'
import Marco from '../components/Marco.jsx'
import { funciones, partes } from '../lib/funciones.js'
import { useSesion } from '../lib/useSesion.js'
import './Funcion.css'

const coloresSemaforo = [
  ['verde', 'Verde', 'Seguí'],
  ['amarillo', 'Amarillo', 'Revisá'],
  ['rojo', 'Rojo', 'No lo abras'],
]

const claseColor = { Verde: 'fn-verde', Amarillo: 'fn-amarillo', Rojo: 'fn-rojo' }

function Muestra({ muestra }) {
  if (muestra.semaforo) {
    return (
      <figure className="fn-muestra" aria-label={muestra.etiqueta}>
        <figcaption>{muestra.etiqueta}</figcaption>
        <ul className="fn-luces">
          {coloresSemaforo.map(([color, nombre, accion]) => (
            <li key={color} className={`fn-luz fn-${color}`}>
              <span className="fn-punto" aria-hidden="true" />
              <strong>{nombre}</strong>
              <span>{accion}</span>
            </li>
          ))}
        </ul>
      </figure>
    )
  }

  return (
    <figure className="fn-muestra" aria-label={muestra.etiqueta}>
      <figcaption>{muestra.etiqueta}</figcaption>
      <dl className="fn-entrada">
        {muestra.entrada.map(([clave, valor]) => (
          <div key={clave}>
            <dt>{clave}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>
      <div className={`fn-veredicto fn-${muestra.color}`}>
        <span className="fn-punto" aria-hidden="true" />
        <strong>{muestra.veredicto}</strong>
      </div>
      <ul className="fn-motivos">
        {muestra.motivos.map((motivo) => (
          <li key={motivo}>{motivo}</li>
        ))}
      </ul>
    </figure>
  )
}

function Funcion() {
  const { id } = useParams()
  const { sesion } = useSesion()
  const funcion = funciones[id]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (!funcion) return <Navigate to="/" replace />

  const parte = partes[funcion.parte]
  const { accion } = funcion
  const pideCuenta = accion.cuenta && !sesion
  const destino = pideCuenta ? '/ingresar' : accion.ruta
  const textoAccion = pideCuenta ? 'Ingresar para usarlo' : accion.texto

  return (
    <Marco interior>
      <div className="container fn">
        <nav className="fn-migas" aria-label="Estás en">
          <Link to="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link to={parte.ruta}>{funcion.parte}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{funcion.titulo}</span>
        </nav>

        <header className="fn-hero">
          <div className="fn-hero-texto">
            <div className="fn-sello">
              <span className="fn-icono">
                <IconoFuncion nombre={id} className="fn-icono-svg" />
              </span>
              <span>
                <strong>{funcion.parte}</strong>
                <span>{parte.texto}</span>
              </span>
            </div>
            <h1>{funcion.titulo}</h1>
            <p className="fn-bajada">{funcion.bajada}</p>
            <div className="fn-acciones">
              <Link className="fn-cta" to={destino}>
                {textoAccion}
              </Link>
              <a className="fn-cta-secundario" href="#como-funciona">
                Ver cómo funciona
              </a>
            </div>
          </div>
          <Muestra muestra={funcion.muestra} />
        </header>

        <ul className="fn-datos" aria-label="En pocas palabras">
          {funcion.datos.map(([valor, etiqueta]) => (
            <li key={valor}>
              <strong>{valor}</strong>
              <span>{etiqueta}</span>
            </li>
          ))}
        </ul>

        <section className="fn-bloque fn-dos">
          <div>
            <p className="fn-ceja">Para qué sirve</p>
            <h2>Por qué te conviene</h2>
            {funcion.paraQue.map((parrafo) => (
              <p key={parrafo}>{parrafo}</p>
            ))}
          </div>
          <aside className="fn-cuando">
            <h3>Cuándo usarlo</h3>
            <ul>
              {funcion.cuando.map((caso) => (
                <li key={caso}>{caso}</li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="fn-bloque" id="como-funciona">
          <p className="fn-ceja">Paso a paso</p>
          <h2>Cómo funciona</h2>
          <ol className="fn-pasos">
            {funcion.pasos.map(([titulo, texto], indice) => (
              <li key={titulo}>
                <span className="fn-numero" aria-hidden="true">
                  {indice + 1}
                </span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="fn-bloque">
          <p className="fn-ceja">Por dentro</p>
          <h2>{funcion.revisa.titulo}</h2>
          <ul className="fn-revisa">
            {funcion.revisa.items.map(([titulo, texto]) => (
              <li key={titulo} className={claseColor[titulo]}>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="fn-bloque fn-consejos">
          <div>
            <p className="fn-ceja">Para recordar</p>
            <h2>Tres reglas simples</h2>
          </div>
          <ul>
            {funcion.consejos.map((consejo) => (
              <li key={consejo}>{consejo}</li>
            ))}
          </ul>
        </section>

        <section className="fn-bloque">
          <p className="fn-ceja">Dudas</p>
          <h2>Preguntas frecuentes</h2>
          <div className="fn-preguntas">
            {funcion.preguntas.map(([pregunta, respuesta]) => (
              <details key={pregunta}>
                <summary>{pregunta}</summary>
                <p>{respuesta}</p>
              </details>
            ))}
          </div>
          <p className="fn-nota">{funcion.nota}</p>
        </section>

        <section className="fn-bloque">
          <p className="fn-ceja">Seguí explorando</p>
          <h2>Otras funciones</h2>
          <ul className="fn-relacionadas">
            {funcion.relacionadas.map((clave) => {
              const otra = funciones[clave]
              return (
                <li key={clave}>
                  <Link to={`/funcion/${clave}`}>
                    <IconoFuncion nombre={clave} className="fn-icono-svg" />
                    <span>
                      <small>{otra.parte}</small>
                      <strong>{otra.titulo}</strong>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="fn-cierre">
          <div>
            <h2>¿Lo probás ahora?</h2>
            <p>
              {accion.cuenta
                ? 'Probalo con algo que te haya llegado hoy. Tarda menos de un minuto.'
                : 'Conocé el resto de la plataforma y elegí por dónde empezar.'}
            </p>
          </div>
          <div className="fn-acciones">
            <Link className="fn-cta" to={destino}>
              {textoAccion}
            </Link>
            <Link className="fn-cta-secundario" to="/">
              Volver al inicio
            </Link>
          </div>
        </section>
      </div>
    </Marco>
  )
}

export default Funcion
