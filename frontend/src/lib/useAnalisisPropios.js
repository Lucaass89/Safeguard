import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { useSesion } from './useSesion.js'

const COLUMNAS = 'id, url_analizada, dominio, nivel_riesgo, explicacion, entrada, fecha_analisis'

const ENTRADAS = {
  web: { tipo: 'Enlace', to: '/safelink/enlaces' },
  qr: { tipo: 'QR', to: '/safelink/qr' },
  whatsapp: { tipo: 'Mensaje', to: '/safelink/whatsapp' },
  pdf: { tipo: 'PDF', to: '/safelink/pdf' },
  correo: { tipo: 'Correo', to: '/safelink/correo' },
}

const NIVELES = {
  verde: 'seguro',
  amarillo: 'sospechoso',
  rojo: 'peligroso',
}

export function haceCuanto(fecha) {
  const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000)
  if (minutos < 1) return 'Recién'
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `Hace ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'Ayer'
  if (dias < 7) return `Hace ${dias} días`
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function partes(fila) {
  const texto = (fila.url_analizada ?? '').trim()
  try {
    const url = new URL(texto)
    const ruta = `${url.pathname}${url.search}`
    return { titulo: url.hostname, ruta: ruta === '/' ? '' : ruta }
  } catch {
    const titulo = fila.dominio || texto
    return { titulo: titulo.length > 72 ? `${titulo.slice(0, 72)}…` : titulo, ruta: '' }
  }
}

function armarItem(fila) {
  const entrada = ENTRADAS[fila.entrada] ?? ENTRADAS.web
  const { titulo, ruta } = partes(fila)
  return {
    id: fila.id,
    titulo,
    ruta,
    texto: `${titulo}${ruta}`,
    tipo: entrada.tipo,
    to: entrada.to,
    nivel: NIVELES[fila.nivel_riesgo] ?? 'sospechoso',
    cuando: haceCuanto(fila.fecha_analisis),
    motivos: fila.explicacion ? [fila.explicacion] : [],
  }
}

export function useAnalisisPropios({ limite = 5, soloHoy = false } = {}) {
  const { sesion, cargando: cargandoSesion } = useSesion()
  const usuarioId = sesion?.user?.id ?? null
  const clave = usuarioId ? `${usuarioId}:${limite}:${soloHoy}` : null
  const [leido, setLeido] = useState({ clave: null, items: [], error: false })

  useEffect(() => {
    if (!usuarioId) return undefined
    let activo = true

    let consulta = supabase
      .from('safelink_analisis')
      .select(COLUMNAS)
      .eq('usuario_id', usuarioId)
      .order('fecha_analisis', { ascending: false })
      .limit(limite)

    if (soloHoy) {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      consulta = consulta.gte('fecha_analisis', hoy.toISOString())
    }

    consulta.then(({ data, error }) => {
      if (!activo) return
      setLeido({
        clave: `${usuarioId}:${limite}:${soloHoy}`,
        items: error ? [] : (data ?? []).map(armarItem),
        error: Boolean(error),
      })
    })

    return () => {
      activo = false
    }
  }, [usuarioId, limite, soloHoy])

  if (!usuarioId) return { cargando: cargandoSesion, items: [], error: false }
  if (leido.clave !== clave) return { cargando: true, items: [], error: false }
  return { cargando: false, items: leido.items, error: leido.error }
}
