import { useEffect, useState } from 'react'
import { aplicarTema } from '../lib/tema.js'

function TemaControl() {
  const [tema, setTema] = useState(() =>
    document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro',
  )

  useEffect(() => {
    function alCambiar(evento) {
      if (evento.type === 'sg-tema') {
        setTema(evento.detail === 'oscuro' ? 'oscuro' : 'claro')
        return
      }
      if (evento.key !== 'sg-tema') return
      setTema(aplicarTema(evento.newValue))
    }

    window.addEventListener('sg-tema', alCambiar)
    window.addEventListener('storage', alCambiar)
    return () => {
      window.removeEventListener('sg-tema', alCambiar)
      window.removeEventListener('storage', alCambiar)
    }
  }, [])

  function elegir(siguiente) {
    setTema(aplicarTema(siguiente))
  }

  return (
    <div className="tema-control" role="group" aria-label="Apariencia">
      <button type="button" aria-pressed={tema === 'claro'} onClick={() => elegir('claro')}>
        Claro
      </button>
      <button type="button" aria-pressed={tema === 'oscuro'} onClick={() => elegir('oscuro')}>
        Oscuro
      </button>
    </div>
  )
}

export default TemaControl
