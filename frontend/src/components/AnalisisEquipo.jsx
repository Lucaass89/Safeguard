import { useState } from 'react'
import {
  despuesPersona,
  filtrarPersonas,
  FILTROS_PERSONAS,
  iniciales,
  resultadoPersona,
} from '../lib/analisisEquipo.js'
import { textoDiferencia } from '../lib/resumenPhishguard.js'
import './AnalisisEquipo.css'

const FECHA = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })

export function Cifras({ cifras, ultima }) {
  const cambio = textoDiferencia(ultima?.diferencia)
  return (
    <ul className="ae-cifras">
      <li>
        <strong>{cifras.evaluadas}</strong>
        <span>Personas que recibieron una simulación</span>
        <small>de {cifras.personas} cargadas</small>
      </li>
      <li className="ae-cifra-rojo">
        <strong>{cifras.pctCayeron} %</strong>
        <span>Cayeron</span>
        <small>{cifras.cayeron === 1 ? '1 persona tocó el enlace' : `${cifras.cayeron} personas tocaron el enlace`}</small>
      </li>
      <li className="ae-cifra-verde">
        <strong>{cifras.pctCapacitados} %</strong>
        <span>Terminaron la explicación</span>
        <small>de los que cayeron</small>
      </li>
      <li>
        <strong>{ultima ? `${ultima.porcentaje} %` : '—'}</strong>
        <span>Cayeron en la última campaña</span>
        {cambio ? <small className={`ae-cambio-${cambio.tono}`}>{cambio.texto}</small> : <small>Es la primera campaña</small>}
      </li>
    </ul>
  )
}

export function ComoLeer() {
  return (
    <details className="ae-como">
      <summary>¿Cómo se lee esto?</summary>
      <dl>
        <div>
          <dt>Cayó</dt>
          <dd>Tocó el enlace o cargó datos en un mensaje de prueba. No pasó nada malo: era una simulación.</dd>
        </div>
        <div>
          <dt>Explicación</dt>
          <dd>Lo que la persona ve apenas cae: por qué era un engaño y cómo darse cuenta la próxima vez.</dd>
        </div>
        <div>
          <dt>Refuerzo</dt>
          <dd>Una segunda simulación, un poco más difícil, que reciben a las 3 semanas quienes cayeron.</dd>
        </div>
        <div>
          <dt>Área para reforzar</dt>
          <dd>El sector donde más gente cayó. Ahí conviene la próxima campaña o una charla.</dd>
        </div>
      </dl>
    </details>
  )
}

export function Evolucion({ puntos }) {
  if (puntos.length < 2) {
    return (
      <section className="ae-tarjeta" aria-labelledby="ae-evolucion">
        <h2 id="ae-evolucion">Cómo viene campaña a campaña</h2>
        <p className="ae-nota">Cuando tengas dos campañas o más, acá vas a ver si el equipo cae cada vez menos.</p>
      </section>
    )
  }
  const ancho = 520
  const alto = 170
  const margen = { izq: 44, der: 20, arr: 26, aba: 34 }
  const maximo = Math.max(50, Math.ceil(Math.max(...puntos.map((p) => p.porcentaje)) / 10) * 10)
  const x = (i) => margen.izq + (i * (ancho - margen.izq - margen.der)) / (puntos.length - 1)
  const y = (v) => margen.arr + (1 - v / maximo) * (alto - margen.arr - margen.aba)
  const primera = puntos[0].porcentaje
  const ultima = puntos[puntos.length - 1].porcentaje
  const lectura =
    ultima < primera
      ? 'Cada vez cae menos gente: el equipo está aprendiendo.'
      : ultima > primera
        ? 'Cae más gente que al principio: conviene reforzar.'
        : 'Se mantiene igual que en la primera campaña.'

  return (
    <section className="ae-tarjeta" aria-labelledby="ae-evolucion">
      <h2 id="ae-evolucion">Cómo viene campaña a campaña</h2>
      <svg className="ae-grafico" viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={puntos.map((p) => `${p.nombre}: ${p.porcentaje} %`).join(', ')}>
        {[0, maximo / 2, maximo].map((v) => (
          <g key={v}>
            <line x1={margen.izq} x2={ancho - margen.der} y1={y(v)} y2={y(v)} className="ae-grafico-linea" />
            <text x={4} y={y(v) + 4} className="ae-grafico-eje">
              {v} %
            </text>
          </g>
        ))}
        <polyline className="ae-grafico-trazo" points={puntos.map((p, i) => `${x(i)},${y(p.porcentaje)}`).join(' ')} />
        {puntos.map((p, i) => (
          <g key={p.id}>
            <circle cx={x(i)} cy={y(p.porcentaje)} r="5.5" className="ae-grafico-punto" />
            <text x={x(i)} y={y(p.porcentaje) - 11} textAnchor="middle" className="ae-grafico-valor">
              {p.porcentaje} %
            </text>
            <text x={x(i)} y={alto - 10} textAnchor="middle" className="ae-grafico-eje">
              {FECHA.format(new Date(p.fecha))}
            </text>
          </g>
        ))}
      </svg>
      <p className="ae-nota">% que cayó en cada campaña. {lectura}</p>
    </section>
  )
}

export function Areas({ areas }) {
  const peor = areas.find((area) => area.reforzar)
  return (
    <section className="ae-tarjeta" aria-labelledby="ae-areas">
      <h2 id="ae-areas">Por área</h2>
      {areas.length === 0 ? (
        <p className="ae-nota">Todavía ningún área recibió una simulación.</p>
      ) : (
        <>
          <ul className="ae-areas">
            {areas.map((area) => (
              <li key={area.area}>
                <span className="ae-area-nombre">
                  {area.area}
                  {area.reforzar ? <span className="ae-etiqueta">Reforzar</span> : null}
                </span>
                <span className="ae-barra" aria-hidden="true">
                  <i style={{ width: `${area.porcentaje}%` }} />
                </span>
                <strong>
                  {area.cayo} de {area.evaluadas} · {area.porcentaje} %
                </strong>
              </li>
            ))}
          </ul>
          <p className="ae-nota">
            {peor ? `${peor.area} es el área donde más gente cayó.` : 'Nadie cayó en ningún área. ¡Muy bien!'}
          </p>
        </>
      )}
    </section>
  )
}

export function Recomendaciones({ lista }) {
  if (lista.length === 0) return null
  return (
    <section className="ae-tarjeta ae-recos" aria-labelledby="ae-recos">
      <h2 id="ae-recos">Qué hacer ahora</h2>
      <ul>
        {lista.map((item) => (
          <li key={item.id}>
            <strong>{item.titulo}</strong> {item.texto}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function TablaPersonas({ porPersona, conFiltros = true }) {
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const visibles = conFiltros ? filtrarPersonas(porPersona, filtro, busqueda) : porPersona

  return (
    <section className="ae-tarjeta" aria-labelledby="ae-personas">
      <div className="ae-cabeza">
        <h2 id="ae-personas">Por persona</h2>
        {conFiltros ? (
          <div className="ae-herramientas">
            <div className="ae-filtros" role="group" aria-label="Filtrar por resultado">
              {FILTROS_PERSONAS.map((opcion) => (
                <button
                  key={opcion.id}
                  type="button"
                  className={filtro === opcion.id ? 'ae-filtro ae-filtro-activo' : 'ae-filtro'}
                  aria-pressed={filtro === opcion.id}
                  onClick={() => setFiltro(opcion.id)}
                >
                  {opcion.etiqueta}
                </button>
              ))}
            </div>
            <label className="ae-buscar">
              <span className="visualmente-oculto">Buscar a alguien</span>
              <input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar a alguien" />
            </label>
          </div>
        ) : null}
      </div>
      {visibles.length === 0 ? (
        <p className="ae-nota">No hay personas con ese filtro.</p>
      ) : (
        <div className="ae-tabla-wrap">
          <table className="ae-tabla">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Área</th>
                <th scope="col">Resultado</th>
                <th scope="col">Después</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((persona) => {
                const resultado = resultadoPersona(persona)
                return (
                  <tr key={persona.id}>
                    <td>
                      <span className="ae-persona">
                        <span className="ae-iniciales" aria-hidden="true">
                          {iniciales(persona.nombre)}
                        </span>
                        {persona.nombre}
                      </span>
                    </td>
                    <td>{persona.departamento || 'General'}</td>
                    <td>
                      <span className={`ae-pastilla ae-pastilla-${resultado.tono}`}>{resultado.etiqueta}</span>
                    </td>
                    <td className="ae-despues">{despuesPersona(persona)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
