import { motivosLimpios, queHacer } from '../lib/analisis.js'

const titulos = {
  verde: '✓ Verde: sin señales fuertes',
  amarillo: '! Amarillo: revisá antes de seguir',
  rojo: '✕ Rojo: no lo abras',
}

function Resultado({ nivel, subtitulo, motivos, children }) {
  const lista = motivosLimpios(motivos)
  return (
    <article className={`resultado nivel-${nivel}`}>
      <p className="resultado-semaforo">
        <span className="resultado-punto" aria-hidden="true" />
        {titulos[nivel]}
      </p>
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
