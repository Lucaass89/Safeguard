import { useState } from 'react'
import { Link } from 'react-router'
import { useSesion } from '../lib/useSesion.js'
import { combinarConAmenaza, combinarConEnriquecimiento } from '../lib/analisis.js'
import { analizarPdf } from '../lib/analisisPdf.js'
import { consultarPeorAmenaza, enriquecer, guardarAnalisis } from '../lib/enriquecer.js'
import Resultado from '../components/Resultado.jsx'
import './Panel.css'

function PanelPdf() {
  const { sesion } = useSesion()
  const [resultado, setResultado] = useState(null)
  const [analizando, setAnalizando] = useState(false)
  const [error, setError] = useState(null)
  const [nombreArchivo, setNombreArchivo] = useState('')

  async function manejarArchivo(evento) {
    const archivo = evento.target.files?.[0]
    if (!archivo) return
    setNombreArchivo(archivo.name)
    setError(null)
    setResultado(null)
    setAnalizando(true)

    try {
      const analisis = await analizarPdf(archivo)
      const peor = analisis.enlaces[0]
      const extra = peor ? await enriquecer(peor.url) : null
      const { amenaza } = await consultarPeorAmenaza([peor?.dominio, extra?.dominio])
      const final = combinarConEnriquecimiento(combinarConAmenaza(analisis, amenaza), extra)
      setResultado({ ...final, casoId: crypto.randomUUID() })
      const { error: fallo } = await guardarAnalisis(sesion, final, 'pdf')
      if (fallo) setError(`El análisis se hizo, pero no se pudo guardar: ${fallo.message}`)
    } catch (fallo) {
      setError(`No se pudo leer el PDF: ${fallo.message}`)
    } finally {
      setAnalizando(false)
    }
  }

  return (
    <div className="panel panel-personas">
      <header className="panel-header">
        <Link className="panel-volver" to="/panel?app=safelink">
          ← Volver a las opciones
        </Link>
        <h1>Revisar un PDF</h1>
        <p className="panel-lead">El archivo se lee en tu navegador. No se sube a ningún servidor.</p>
      </header>

      <label className="panel-campo panel-pieza">
        <span>Archivo</span>
        <span className="panel-archivo-zona">
          {nombreArchivo ? (
            <span className="panel-archivo-nombre">{nombreArchivo}</span>
          ) : (
            'Elegí un PDF'
          )}
          <input
            className="panel-archivo-input"
            type="file"
            accept="application/pdf"
            onChange={manejarArchivo}
            disabled={analizando}
          />
        </span>
      </label>

      {analizando && <p className="panel-estado">Leyendo el PDF…</p>}
      {error && <p className="panel-error">{error}</p>}

      {resultado && (
        <Resultado
          casoId={resultado.casoId}
          nivel={resultado.nivel}
          subtitulo={resultado.nombre}
          motivos={resultado.motivos}
        />
      )}
    </div>
  )
}

export default PanelPdf
