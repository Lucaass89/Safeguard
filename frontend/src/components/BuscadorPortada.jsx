import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { analizar, motivosLimpios, SIN_FORMATO } from '../lib/analisis.js'
import './BuscadorPortada.css'

const EJEMPLO = 'https://mercadolibre-pagos-verificar.com/login'

const NIVELES = {
  verde: { etiqueta: 'Seguro', frase: 'No vimos nada raro en la dirección.' },
  amarillo: { etiqueta: 'Precaución', frase: 'Hay algo dudoso. Mirá bien antes de seguir.' },
  rojo: { etiqueta: 'Peligroso', frase: 'No lo abras.' },
  gris: { etiqueta: 'Sin verificar', frase: 'No lo podemos revisar solo con la dirección.' },
}

function BuscadorPortada() {
  const id = useId()
  const [texto, setTexto] = useState(EJEMPLO)
  const resultado = useMemo(() => {
    const limpio = texto.trim()
    if (!limpio) return null
    try {
      const analisis = analizar(limpio)
      return analisis?.motivos?.includes(SIN_FORMATO) ? null : analisis
    } catch {
      return null
    }
  }, [texto])
  const nivel = resultado?.nivel
  const datos = NIVELES[nivel]
  const motivo = resultado ? motivosLimpios(resultado.motivos ?? [])[0] : null
  const completo = `/panel/enlaces?url=${encodeURIComponent(texto.trim())}`

  return (
    <div className="bp">
      <form
        className="bp-barra"
        onSubmit={(evento) => {
          evento.preventDefault()
        }}
      >
        <label className="visualmente-oculto" htmlFor={`${id}-url`}>
          Pegá el enlace que te mandaron
        </label>
        <input
          id={`${id}-url`}
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck="false"
          value={texto}
          placeholder="Pegá acá el enlace que te mandaron"
          onChange={(evento) => setTexto(evento.target.value)}
          onFocus={(evento) => {
            if (texto === EJEMPLO) evento.target.select()
          }}
        />
        <Link className="bp-boton" to={resultado ? completo : '/personas'}>
          Revisar
        </Link>
      </form>

      <div className={`bp-resultado bp-${nivel ?? 'vacio'}`} aria-live="polite">
        {datos ? (
          <>
            <span className="bp-chip">{datos.etiqueta}</span>
            <p>
              <strong>{datos.frase}</strong> {motivo && !/^no aparecen/i.test(motivo) ? motivo : ''}
            </p>
          </>
        ) : (
          <p>{texto.trim() ? 'Eso no parece una dirección web. Probá con algo como ejemplo.com/promo' : 'Pegá un enlace y te mostramos el color al instante.'}</p>
        )}
      </div>
      <p className="bp-pie">
        Este primer chequeo mira solo la dirección y no se guarda. Con <b>Revisar</b> vas al análisis completo, que también
        mira a dónde lleva el enlace.
      </p>
    </div>
  )
}

export default BuscadorPortada
