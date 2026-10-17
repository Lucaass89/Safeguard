import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { esAppNativa } from '../lib/esAppNativa.js'
import { escucharInstalacion, instalarPendiente, pedirInstalacion } from '../lib/instalar.js'
import './InstalarApp.css'

const CLAVE = 'sg-instalacion-pospuesta'

function pospuesta() {
  try {
    return sessionStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

function yaInstalada() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function esSimulacion(pathname) {
  return pathname.startsWith('/simulacion') || pathname.startsWith('/bien')
}

function esSafariIOS() {
  const agente = window.navigator.userAgent
  const ios =
    /iPad|iPhone|iPod/.test(agente) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  const otroNavegador = /CriOS|FxiOS|EdgiOS|OPiOS/.test(agente)
  return ios && /Safari/.test(agente) && !otroNavegador
}

export default function InstalarApp() {
  const { pathname } = useLocation()
  const [evento, setEvento] = useState(null)
  const [oculta, setOculta] = useState(pospuesta)

  useEffect(() => {
    if (yaInstalada()) return undefined
    setEvento(instalarPendiente())
    return escucharInstalacion(setEvento)
  }, [])

  if (oculta || esSimulacion(pathname) || esAppNativa() || yaInstalada()) return null
  if (!evento && !esSafariIOS()) return null

  async function instalar() {
    const resultado = await pedirInstalacion()
    if (resultado !== 'accepted') {
      try {
        sessionStorage.setItem(CLAVE, '1')
      } catch {
        // Si el navegador bloquea el almacenamiento, la barra vuelve en la próxima visita.
      }
      setOculta(true)
    }
  }

  function ahoraNo() {
    try {
      sessionStorage.setItem(CLAVE, '1')
    } catch {
      // Igual se oculta hasta que recarguen.
    }
    setOculta(true)
  }

  return (
    <div className="instalar-app" role="region" aria-label="Instalar SafeGuard">
      <p>
        {evento
          ? 'Instalá SafeGuard en la pantalla de inicio.'
          : 'Tocá Compartir y después Agregar a inicio.'}
      </p>
      <div className="instalar-app-acciones">
        <button className="instalar-app-no" type="button" onClick={ahoraNo}>
          Ahora no
        </button>
        {evento && (
          <button className="instalar-app-si" type="button" onClick={instalar}>
            Instalar
          </button>
        )}
      </div>
    </div>
  )
}
