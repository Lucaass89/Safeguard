import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { esAppNativa } from '../lib/esAppNativa.js'
import {
  escucharInstalacion,
  instalacionHecha,
  instalarPendiente,
  pedirInstalacion,
} from '../lib/instalar.js'
import './InstalarApp.css'

function yaInstalada() {
  return (
    instalacionHecha() ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function esCelular() {
  return window.matchMedia('(max-width: 850px)').matches
}

function esSimulacion(pathname) {
  return pathname.startsWith('/simulacion') || pathname.startsWith('/bien')
}

function esIOS() {
  const agente = window.navigator.userAgent
  return (
    /iPad|iPhone|iPod/.test(agente) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  )
}

function esSafariIOS() {
  const agente = window.navigator.userAgent
  return esIOS() && /Safari/.test(agente) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(agente)
}

function pistaManual() {
  if (esIOS()) return 'Abrila en Safari, tocá Compartir y después Agregar a inicio.'
  return 'Abrí el menú del navegador y tocá Instalar app.'
}

export default function InstalarApp() {
  const { pathname } = useLocation()
  const [evento, setEvento] = useState(() => instalarPendiente())
  const [celular, setCelular] = useState(esCelular)
  const [pista, setPista] = useState(false)
  const [lista, setLista] = useState(yaInstalada)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 850px)')
    const alCambiar = () => setCelular(media.matches)
    media.addEventListener('change', alCambiar)
    const dejar = escucharInstalacion((pendiente) => {
      setEvento(pendiente)
      if (instalacionHecha()) setLista(true)
    })
    return () => {
      media.removeEventListener('change', alCambiar)
      dejar()
    }
  }, [])

  if (!celular || lista || esSimulacion(pathname) || esAppNativa() || yaInstalada()) return null

  async function instalar() {
    if (!evento) {
      setPista(true)
      return
    }
    const resultado = await pedirInstalacion()
    if (resultado === 'accepted') setLista(true)
  }

  const texto = esSafariIOS()
    ? 'Tocá Compartir y después Agregar a inicio.'
    : pista && !evento
      ? pistaManual()
      : 'Instalá SafeGuard en la pantalla de inicio.'

  return (
    <div className="instalar-app" role="region" aria-label="Instalar SafeGuard">
      <p>{texto}</p>
      {!esSafariIOS() && (
        <div className="instalar-app-acciones">
          <button className="instalar-app-si" type="button" onClick={instalar}>
            Instalar
          </button>
        </div>
      )}
    </div>
  )
}
