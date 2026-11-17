import { useEffect, useState } from 'react'
import { leerUltimaVersion, necesitaActualizar } from './actualizarApp.js'
import { esAppNativa, versionApp } from './esAppNativa.js'

export function useActualizacion() {
  const [ultima, setUltima] = useState(null)
  const [estado, setEstado] = useState('consultando')
  const enApp = esAppNativa()

  useEffect(() => {
    if (!enApp) return undefined
    let activo = true
    fetch('/app/version.json', { cache: 'no-store' })
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((datos) => {
        if (!activo) return
        const leida = leerUltimaVersion(datos)
        setUltima(leida)
        setEstado(leida ? 'lista' : 'error')
      })
      .catch(() => {
        if (activo) setEstado('error')
      })
    return () => {
      activo = false
    }
  }, [enApp])

  const instalada = versionApp()
  const esWeb = enApp && instalada < 1
  return { ultima, estado, instalada, enApp, esWeb, hayNueva: enApp && necesitaActualizar(instalada, ultima) }
}
