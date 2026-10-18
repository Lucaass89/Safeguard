import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const CANALES = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'Correo',
}

export function cayo(evento) {
  return Boolean(evento.hizo_clic || evento.ingreso_datos)
}

function termino(evento) {
  return Boolean(evento.completo_capacitacion || (evento.vio_reconocimiento && !cayo(evento)))
}

function resumir(campana) {
  const eventos = Array.isArray(campana.eventos_simulacion) ? campana.eventos_simulacion : []
  return {
    id: campana.id,
    nombre: campana.nombre_campana || 'Campaña sin nombre',
    canal: CANALES[campana.canal] ?? 'Correo',
    eventos,
    enviados: eventos.length,
    clics: eventos.filter(cayo).length,
    datos: eventos.filter((e) => e.ingreso_datos).length,
    reconocieron: eventos.filter((e) => e.vio_reconocimiento && !cayo(e)).length,
    capacitados: eventos.filter((e) => e.completo_capacitacion).length,
    completaron: eventos.filter(termino).length,
  }
}

export function useCampanas(organizacionId) {
  const [leido, setLeido] = useState({ organizacionId: null, campanas: [], error: false })

  useEffect(() => {
    if (!organizacionId) return undefined
    let activo = true

    supabase
      .from('campanas')
      .select(
        'id, nombre_campana, canal, creado_en, eventos_simulacion(hizo_clic, ingreso_datos, completo_capacitacion, vio_reconocimiento, empleados(id, nombre, departamento))',
      )
      .eq('organizacion_id', organizacionId)
      .order('creado_en', { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (!activo) return
        setLeido({
          organizacionId,
          campanas: error ? [] : (data ?? []).map(resumir),
          error: Boolean(error),
        })
      })

    return () => {
      activo = false
    }
  }, [organizacionId])

  if (!organizacionId) return { cargando: false, campanas: [], error: false }
  if (leido.organizacionId !== organizacionId) return { cargando: true, campanas: [], error: false }
  return { cargando: false, campanas: leido.campanas, error: leido.error }
}
