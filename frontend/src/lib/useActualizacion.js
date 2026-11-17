import { useEffect, useState } from 'react'
import { leerUltimaVersion, necesitaActualizar } from './actualizarApp.js'
import { esAppNativa, versionApp } from './esAppNativa.js'

export function useActualizacion() {
  const [ultima, setUltima] = useState(null)
  const enApp = esAppNativa()

  useEffect(() => {
    if (!enApp) return undefined
    let activo = true
    fetch('/app/version.json', { cache: 'no-store' })
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((datos) => {
        if (activo) setUltima(leerUltimaVersion(datos))
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [enApp])

  return { ultima, hayNueva: enApp && necesitaActualizar(versionApp(), ultima) }
}
