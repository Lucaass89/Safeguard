import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
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

export default function InstalarApp() {
  const { pathname } = useLocation()
  const [evento, setEvento] = useState(null)
  const [oculta, setOculta] = useState(pospuesta)

  useEffect(() => {
    if (yaInstalada()) return undefined
    setEvento(instalarPendiente())
    return escucharInstalacion(setEvento)
  }, [])

  if (!evento || oculta || esSimulacion(pathname) || yaInstalada()) return null

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
      <p>Instalá SafeGuard en la pantalla de inicio.</p>
      <div className="instalar-app-acciones">
        <button className="instalar-app-no" type="button" onClick={ahoraNo}>
          Ahora no
        </button>
        <button className="instalar-app-si" type="button" onClick={instalar}>
          Instalar
        </button>
      </div>
    </div>
  )
}
