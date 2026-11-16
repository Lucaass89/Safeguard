import { useCallback, useEffect, useState } from 'react'
import { estadoDosPasos } from './dosPasos.js'
import { supabase } from './supabase.js'

export function useDosPasos() {
  const [estado, setEstado] = useState('cargando')
  const [factores, setFactores] = useState(null)

  const recargar = useCallback(async () => {
    const [nivel, lista] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ])
    if (nivel.error || lista.error) {
      setEstado('error')
      return
    }
    setFactores(lista.data)
    setEstado(estadoDosPasos({ nivel: nivel.data?.currentLevel, factores: lista.data }))
  }, [])

  useEffect(() => {
    let activo = true
    Promise.all([supabase.auth.mfa.getAuthenticatorAssuranceLevel(), supabase.auth.mfa.listFactors()]).then(
      ([nivel, lista]) => {
        if (!activo) return
        if (nivel.error || lista.error) {
          setEstado('error')
          return
        }
        setFactores(lista.data)
        setEstado(estadoDosPasos({ nivel: nivel.data?.currentLevel, factores: lista.data }))
      },
      () => activo && setEstado('error'),
    )
    return () => {
      activo = false
    }
  }, [])

  return { estado, factores, recargar }
}
