import { useEffect, useState } from 'react'
import { aplicarTema } from '../lib/tema.js'

function TemaControl() {
  const [tema, setTema] = useState(() =>
    document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro',
  )

  useEffect(() => {
    function alCambiar(evento) {
      if (evento.key !== 'sg-tema') return
      const siguiente = aplicarTema(evento.newValue)
      setTema(siguiente)
    }

    window.addEventListener('storage', alCambiar)
    return () => window.removeEventListener('storage', alCambiar)
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
