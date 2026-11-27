import { useState } from 'react'
import { resumenLogros } from '../lib/logros.js'
import { elegirPortapapeles } from '../lib/portapapeles.js'
import './MiProgreso.css'

function Tilde() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

export function CuidadosCuenta({ estado, onAlternar }) {
  const avance = Math.round((estado.listas / estado.total) * 100)
  const [abierta, setAbierta] = useState(false)

  return (
    <details id="prog-lista" className="prog prog-caja prog-plegable" open={abierta} onToggle={(evento) => setAbierta(evento.currentTarget.open)}>
      <summary className="prog-cabeza">
        <span>
          <span className="prog-titulo">Tu cuenta, más segura</span>
          <span className="prog-bajada">{abierta ? 'Tocá cada punto para ver cómo hacerlo.' : 'Cuidados simples para tus cuentas. Tocá para verlos.'}</span>
        </span>
        <span className="prog-cuenta">
          {estado.listas} de {estado.total}
        </span>
      </summary>
      <div
        className="prog-barra"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={estado.total}
        aria-valuenow={estado.listas}
        aria-label="Avance de la lista"
      >
        <span style={{ width: `${avance}%` }} />
      </div>
      <ul className="prog-tareas">
        {estado.tareas.map((tarea) => (
          <li key={tarea.id} className={tarea.hecha ? 'prog-tarea prog-tarea-hecha' : 'prog-tarea'}>
            <details>
              <summary>
                <span className="prog-tarea-marca" aria-hidden="true">
                  {tarea.hecha ? <Tilde /> : null}
                </span>
                <span>{tarea.titulo}</span>
              </summary>
              <p>{tarea.como}</p>
              {tarea.automatica ? (
                tarea.hecha ? null : (
                  <button type="button" className="prog-tarea-boton" onClick={() => elegirPortapapeles(true)}>
                    Activarlo
                  </button>
                )
              ) : (
                <button type="button" className="prog-tarea-boton" onClick={() => onAlternar(tarea.id)}>
                  {tarea.hecha ? 'Desmarcar' : 'Ya lo hice'}
                </button>
              )}
            </details>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function Logros({ logros }) {
  return (
    <section className="prog prog-caja" aria-labelledby="prog-logros-titulo">
      <div className="prog-cabeza">
        <h2 id="prog-logros-titulo">Tus logros</h2>
        <span className="prog-cuenta">{resumenLogros(logros)}</span>
      </div>
      <ul className="prog-logros">
        {logros.map((logro) => (
          <li key={logro.id} className={logro.logrado ? 'prog-logro prog-logro-hecho' : 'prog-logro'}>
            <span className="prog-logro-icono" aria-hidden="true">
              {logro.icono}
            </span>
            <span>{logro.titulo}</span>
            <span className="visualmente-oculto">{logro.logrado ? ' (logrado)' : ' (pendiente)'}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
