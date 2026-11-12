import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { analizar, motivosLimpios } from '../lib/analisis.js'

const EJEMPLO = 'https://mercadolibre-pagos-verificar.com/login'

const NIVELES = {
  verde: 'Verde: no aparecen señales de riesgo',
  amarillo: 'Amarillo: hay algo raro',
  rojo: 'Rojo: no lo abras',
  gris: 'Gris: no lo podemos revisar',
}

function ProbadorEnlace() {
  const id = useId()
  const [texto, setTexto] = useState(EJEMPLO)
  const resultado = useMemo(() => {
    const limpio = texto.trim()
    if (!limpio) return null
    try {
      return analizar(limpio)
    } catch {
      return null
    }
  }, [texto])
  const nivel = resultado?.nivel
  const motivos = resultado ? motivosLimpios(resultado.motivos ?? []).slice(0, 2) : []

  return (
    <section className="probador" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`} className="probador-titulo">Probá un enlace</h2>
      <label className="probador-etiqueta" htmlFor={`${id}-url`}>
        Pegá la dirección que te mandaron
      </label>
      <input
        id={`${id}-url`}
        className="probador-campo"
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck="false"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        onFocus={(evento) => {
          if (texto === EJEMPLO) evento.target.select()
        }}
      />
      <div className={`probador-veredicto probador-${nivel ?? 'vacio'}`} aria-live="polite">
        {nivel ? (
          <>
            <p className="probador-nivel">
              <span className="probador-luz" aria-hidden="true" />
              {NIVELES[nivel] ?? nivel}
            </p>
            {motivos.length > 0 && (
              <ul className="probador-motivos">
                {motivos.map((motivo) => (
                  <li key={motivo}>{motivo}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="probador-nivel">
            {texto.trim() ? 'Eso no parece una dirección web.' : 'Pegá un enlace para ver el color.'}
          </p>
        )}
      </div>
      <p className="probador-pie">
        Este chequeo mira solo la dirección y no se guarda.{' '}
        <Link to="/funcion/enlace">Revisarlo completo en SafeLink</Link>
      </p>
    </section>
  )
}

export default ProbadorEnlace
