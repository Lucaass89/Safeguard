import { useState } from 'react'
import { Link } from 'react-router'
import { useSesion } from '../lib/useSesion.js'
import { combinarConAmenaza, combinarConEnriquecimiento } from '../lib/analisis.js'
import { analizarCorreo } from '../lib/analisisCorreo.js'
import { consultarPeorAmenaza, enriquecer, guardarAnalisis } from '../lib/enriquecer.js'
import Resultado from '../components/Resultado.jsx'
import './Panel.css'

function PanelCorreo() {
  const { sesion } = useSesion()
  const [crudo, setCrudo] = useState('')
  const [resultado, setResultado] = useState(null)
  const [analizando, setAnalizando] = useState(false)
  const [error, setError] = useState(null)

  async function manejarEnvio(evento) {
    evento.preventDefault()
    const analisis = analizarCorreo(crudo)
    if (!analisis) {
      setError('Pegá el contenido del correo para poder revisarlo.')
      return
    }
    setError(null)
    setAnalizando(true)
    const peor = analisis.enlaces[0]
    const extra = peor ? await enriquecer(peor.url) : null
    const { amenaza } = await consultarPeorAmenaza([
      analisis.dominio,
      peor?.dominio,
      extra?.dominio,
    ])
    const final = combinarConEnriquecimiento(combinarConAmenaza(analisis, amenaza), extra)
    setResultado({ ...final, casoId: crypto.randomUUID() })
    const { error: fallo } = await guardarAnalisis(sesion, final, 'correo')
    setAnalizando(false)
    if (fallo) setError(`El análisis se hizo, pero no se pudo guardar: ${fallo.message}`)
  }

  return (
    <div className="panel panel-personas">
      <header className="panel-header">
        <Link className="panel-volver" to="/panel?app=safelink">
          ← Volver a las opciones
        </Link>
        <h1>Revisar un correo</h1>
        <p className="panel-lead">
          En Gmail: tres puntitos → Mostrar original. Pegá todo, incluyendo los encabezados.
        </p>
      </header>

      <form className="panel-form panel-pieza" onSubmit={manejarEnvio}>
        <label className="panel-campo">
          <span>Correo original</span>
          <textarea
            value={crudo}
            onChange={(e) => setCrudo(e.target.value)}
            placeholder="From: ...&#10;Authentication-Results: ..."
          />
        </label>
        <button type="submit" className="panel-boton" disabled={analizando}>
          {analizando ? 'Analizando…' : 'Analizar correo'}
        </button>
      </form>

      {error && <p className="panel-error">{error}</p>}

      {resultado && (
        <Resultado
          casoId={resultado.casoId}
          nivel={resultado.nivel}
          subtitulo={resultado.asunto || resultado.dominio}
          motivos={resultado.motivos}
        />
      )}
    </div>
  )
}

export default PanelCorreo
