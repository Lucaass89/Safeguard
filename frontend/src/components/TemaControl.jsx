import { useEffect, useState } from 'react'
import { aplicarTema } from '../lib/tema.js'

function IconoSol() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconoLuna() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M16.5 14.5A6.5 6.5 0 0 1 9.2 6.2 6.5 6.5 0 1 0 16.5 14.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TemaControl({ icono = false }) {
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

  if (icono) {
    const aClaro = tema === 'oscuro'
    return (
      <button
        type="button"
        className="tema-icono"
        aria-label={aClaro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        onClick={() => elegir(aClaro ? 'claro' : 'oscuro')}
      >
        {aClaro ? <IconoSol /> : <IconoLuna />}
      </button>
    )
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
