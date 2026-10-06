import { motivosLimpios, queHacer } from '../lib/analisis.js'
import Faro from './Faro.jsx'

const titulos = {
  verde: '✓ Verde: sin señales fuertes',
  amarillo: '! Amarillo: revisá antes de seguir',
  rojo: '✕ Rojo: no lo abras',
}

function Resultado({ nivel, subtitulo, motivos, casoId, children }) {
  const lista = motivosLimpios(motivos)
  return (
    <article className={`resultado nivel-${nivel}`}>
      <div className="resultado-cabeza">
        <p className="resultado-semaforo">
          <span className="resultado-punto" aria-hidden="true" />
          {titulos[nivel]}
        </p>
        <Faro casoId={casoId ?? `${nivel}:${lista.join('|')}`} nivel={nivel} motivos={lista} />
      </div>
      {subtitulo && <p className="resultado-sub">{subtitulo}</p>}
      <p className="resultado-quehacer">{queHacer(nivel)}</p>
      {lista.length > 0 && (
        <ul className="resultado-motivos">
          {lista.map((motivo) => (
            <li key={motivo}>{motivo}</li>
          ))}
        </ul>
      )}
      {children}
    </article>
  )
}

export default Resultado
