import { useEffect, useState } from 'react'
import { esAppNativa } from '../lib/esAppNativa.js'
import { supabase } from '../lib/supabase.js'
import { ContextoSesion } from '../lib/useSesion.js'
import { diasPermitidos, leerActividad, marcarActividad, olvidarActividad, sesionVencida } from '../lib/vencimientoSesion.js'

function SesionProvider({ children }) {
  const [estado, setEstado] = useState({ sesion: null, cargando: true })

  useEffect(() => {
    let activo = true
    const ultimaAlAbrir = leerActividad()

    supabase.auth.getSession().then(async ({ data }) => {
      let sesion = data.session
      if (sesion && sesionVencida(ultimaAlAbrir, Date.now(), diasPermitidos(esAppNativa()))) {
        await supabase.auth.signOut({ scope: 'local' })
        olvidarActividad()
        sesion = null
      }
      if (sesion) marcarActividad(Date.now())
      if (activo) setEstado({ sesion, cargando: false })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (evento === 'SIGNED_OUT') olvidarActividad()
      else if (sesion && evento === 'SIGNED_IN') marcarActividad(Date.now())
      setEstado({ sesion, cargando: false })
    })

    function alUsar() {
      marcarActividad(Date.now())
    }
    window.addEventListener('pointerdown', alUsar, { passive: true })
    window.addEventListener('keydown', alUsar)

    return () => {
      activo = false
      subscription.unsubscribe()
      window.removeEventListener('pointerdown', alUsar)
      window.removeEventListener('keydown', alUsar)
    }
  }, [])

  return <ContextoSesion.Provider value={estado}>{children}</ContextoSesion.Provider>
}

export default SesionProvider
