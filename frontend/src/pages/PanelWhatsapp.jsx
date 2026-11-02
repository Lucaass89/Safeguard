import { useState } from 'react'
import { Link } from 'react-router'
import { rutaEnApp } from '../lib/esAppNativa.js'
import { useSesion } from '../lib/useSesion.js'
import { analizarWhatsapp } from '../lib/analisisWhatsapp.js'
import { guardarAnalisis, revisarWhatsapp } from '../lib/enriquecer.js'
import Resultado from '../components/Resultado.jsx'
import './Panel.css'

function PanelWhatsapp() {
  const { sesion } = useSesion()
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState(null)
  const [analizando, setAnalizando] = useState(false)
  const [error, setError] = useState(null)

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setError(null)

    const local = analizarWhatsapp(texto)
    if (!local) {
      setError('Pegá el mensaje completo, como te llegó.')
      return
    }

    setAnalizando(true)

    const final = await revisarWhatsapp(texto)
    setResultado({ ...final, casoId: crypto.randomUUID() })

    const { error: fallo } = await guardarAnalisis(sesion, final, 'whatsapp', texto)
    setAnalizando(false)
    if (fallo) {
      setError(`El análisis se hizo, pero no se pudo guardar: ${fallo.message}`)
    }
  }

  return (
    <div className="panel panel-personas">
      <header className="panel-header">
        <Link className="panel-volver" to={rutaEnApp('/panel?app=safelink')}>
          ← Volver a las opciones
        </Link>
        <h1>Pegar un WhatsApp</h1>
        <p className="panel-lead">
          Copiá el mensaje entero. Mucha gente no distingue el enlace: nosotros
          sacamos el texto, el número y los links juntos.
        </p>
      </header>

      <form className="panel-form panel-pieza" onSubmit={manejarEnvio}>
        <label className="panel-campo">
          <span>Mensaje</span>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={'Hola, soy del banco. Tu cuenta se bloquea hoy. Entrá acá: bit.ly/xxxx'}
          />
        </label>
        <button type="submit" className="panel-boton" disabled={analizando}>
          {analizando ? 'Analizando…' : 'Analizar mensaje'}
        </button>
      </form>

      {error && <p className="panel-error">{error}</p>}

      {resultado && (
        <Resultado
          casoId={resultado.casoId}
          resultado={resultado}
          canal="whatsapp"
          subtitulo={resultado.dominio === 'whatsapp' ? 'Mensaje sin enlace claro' : undefined}
          onNoAbrir={() => {
            setResultado(null)
            setTexto('')
          }}
        />
      )}
    </div>
  )
}

export default PanelWhatsapp
