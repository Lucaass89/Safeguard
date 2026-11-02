import { Fragment } from 'react'
import './DiferenciaDominio.css'

function texto(tramos) {
  return tramos.map((tramo) => tramo.texto).join('')
}

export function DominioMarcado({ tramos, clase = 'dif-trucho' }) {
  return (
    <span className="dif-dominio">
      {tramos.map((tramo, indice) =>
        tramo.trucho ? (
          <mark key={indice} className={clase}>
            {tramo.texto}
          </mark>
        ) : (
          <Fragment key={indice}>{tramo.texto}</Fragment>
        ),
      )}
    </span>
  )
}

export function LecturaReal({ diferencia }) {
  return (
    <span className="dif-lectura">
      {diferencia.rotulo} <DominioMarcado tramos={diferencia.real} clase="dif-bien" />
    </span>
  )
}

function DiferenciaDominio({ diferencia }) {
  return (
    <dl
      className="dif"
      aria-label={`${texto(diferencia.visto)}. ${diferencia.rotulo} ${texto(diferencia.real)}.`}
    >
      <div className="dif-fila">
        <dt>Este enlace</dt>
        <dd>
          <DominioMarcado tramos={diferencia.visto} />
        </dd>
      </div>
      <div className="dif-fila">
        <dt>{diferencia.rotulo}</dt>
        <dd>
          <DominioMarcado tramos={diferencia.real} clase="dif-bien" />
        </dd>
      </div>
    </dl>
  )
}

export default DiferenciaDominio
