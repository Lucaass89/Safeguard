import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { useSesion } from './useSesion.js'

function leerCache(id) {
  const valor = sessionStorage.getItem(`sg-acceso:${id}`)
  if (valor === '1') return true
  if (valor === '0') return false
  return null
}

function guardarCache(id, pertenece) {
  sessionStorage.setItem(`sg-acceso:${id}`, pertenece ? '1' : '0')
}

function esAdministrador(rol) {
  return typeof rol === 'string' && rol.toLowerCase().startsWith('admin')
}

export function useMembresia() {
  const { sesion, cargando: cargandoSesion } = useSesion()
  const id = sesion?.user?.id ?? null
  const [estado, setEstado] = useState(() => ({
    cargando: Boolean(id),
    pertenece: id ? leerCache(id) : null,
    rol: null,
    organizacionId: null,
    unicoAdmin: null,
  }))

  useEffect(() => {
    if (!id) {
      setEstado({
        cargando: false,
        pertenece: null,
        rol: null,
        organizacionId: null,
        unicoAdmin: null,
      })
      return undefined
    }

    let activo = true

    async function cargar() {
      const { data, error } = await supabase
        .from('usuarios_admin')
        .select('rol, organizacion_id')
        .eq('auth_user_id', id)
        .maybeSingle()

      if (!activo) return
      if (error) {
        setEstado((previo) => ({
          ...previo,
          cargando: false,
          pertenece: previo.pertenece === true ? true : false,
          unicoAdmin: previo.pertenece === true ? previo.unicoAdmin : false,
        }))
        return
      }

      const pertenece = Boolean(data)
      guardarCache(id, pertenece)
      if (!data || !esAdministrador(data.rol)) {
        setEstado({
          cargando: false,
          pertenece,
          rol: data?.rol ?? null,
          organizacionId: data?.organizacion_id ?? null,
          unicoAdmin: false,
        })
        return
      }

      const conteo = await supabase
        .from('usuarios_admin')
        .select('id', { count: 'exact', head: true })
        .eq('organizacion_id', data.organizacion_id)
        .ilike('rol', 'admin%')

      if (!activo) return
      setEstado({
        cargando: false,
        pertenece,
        rol: data.rol,
        organizacionId: data.organizacion_id,
        unicoAdmin: conteo.error ? null : conteo.count === 1,
      })
    }

    cargar()

    return () => {
      activo = false
    }
  }, [id])

  return {
    cargando: cargandoSesion || estado.cargando,
    pertenece: estado.pertenece,
    rol: estado.rol,
    organizacionId: estado.organizacionId,
    unicoAdmin: estado.unicoAdmin,
  }
}
