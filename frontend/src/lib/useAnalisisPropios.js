import { useEffect, useState } from 'react'
import { diferenciaDominio, dominioBase } from './analisis.js'
import { leerFragmento } from './fragmentos.js'
import { inicioDeSemana, resumenSemana } from './resumenSemana.js'
import { supabase } from './supabase.js'
import { useSesion } from './useSesion.js'

const COLUMNAS = 'id, url_analizada, dominio, nivel_riesgo, explicacion, puntuacion_riesgo, entrada, fecha_analisis'

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
  gris: 'sin_verificar',
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
    return { titulo: url.hostname, ruta: ruta === '/' ? '' : ruta, host: url.hostname }
  } catch {
    const titulo = fila.dominio || texto
    return { titulo: titulo.length > 72 ? `${titulo.slice(0, 72)}…` : titulo, ruta: '', host: '' }
  }
}

function diferenciaDe(fila, host) {
  if (!fila.explicacion) return null
  const mismoSitio = host && fila.dominio && dominioBase(host) === fila.dominio
  const diferencia = diferenciaDominio(mismoSitio ? host : fila.dominio || host)
  return diferencia && fila.explicacion.includes(diferencia.frase) ? diferencia : null
}

function partesDeMensaje(fila) {
  const fragmento = leerFragmento(fila.id)
  if (fragmento) return { titulo: fragmento, ruta: '', host: '' }
  const enlace = partes(fila)
  return enlace.host ? enlace : { titulo: 'Mensaje de WhatsApp', ruta: '', host: '' }
}

function armarItem(fila) {
  const entrada = ENTRADAS[fila.entrada] ?? ENTRADAS.web
  const { titulo, ruta, host } = fila.entrada === 'whatsapp' ? partesDeMensaje(fila) : partes(fila)
  return {
    id: fila.id,
    entrada: ENTRADAS[fila.entrada] ? fila.entrada : 'web',
    fecha: fila.fecha_analisis,
    titulo,
    ruta,
    diferencia: fila.entrada === 'whatsapp' && !host ? null : diferenciaDe(fila, host),
    texto: `${titulo}${ruta}`,
    tipo: entrada.tipo,
    to: entrada.to,
    nivel: NIVELES[fila.nivel_riesgo] ?? 'sin_verificar',
    nivelRiesgo: NIVELES[fila.nivel_riesgo] ? fila.nivel_riesgo : 'gris',
    url: fila.url_analizada,
    dominio: fila.dominio,
    cuando: haceCuanto(fila.fecha_analisis),
    motivos: fila.explicacion ? [fila.explicacion] : [],
  }
}

export function useAnalisisPropios({ limite = 5 } = {}) {
  const { sesion, cargando: cargandoSesion } = useSesion()
  const usuarioId = sesion?.user?.id ?? null
  const clave = usuarioId ? `${usuarioId}:${limite}` : null
  const [leido, setLeido] = useState({ clave: null, items: [], error: false })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!usuarioId) return undefined
    let activo = true

    supabase
      .from('safelink_analisis')
      .select(COLUMNAS)
      .eq('usuario_id', usuarioId)
      .order('fecha_analisis', { ascending: false })
      .limit(limite)
      .then(({ data, error }) => {
        if (!activo) return
        setLeido({
          clave: `${usuarioId}:${limite}`,
          items: error ? [] : (data ?? []).map(armarItem),
          error: Boolean(error),
        })
      })

    return () => {
      activo = false
    }
  }, [usuarioId, limite, version])

  const recargar = () => setVersion((actual) => actual + 1)

  if (!usuarioId) return { cargando: cargandoSesion, items: [], error: false, recargar }
  if (leido.clave !== clave) return { cargando: true, items: [], error: false, recargar }
  return { cargando: false, items: leido.items, error: leido.error, recargar }
}

export function useResumenSemana() {
  const { sesion } = useSesion()
  const usuarioId = sesion?.user?.id ?? null
  const [leido, setLeido] = useState({ usuarioId: null, texto: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!usuarioId) return undefined
    let activo = true

    supabase
      .from('safelink_analisis')
      .select('entrada, nivel_riesgo')
      .eq('usuario_id', usuarioId)
      .gte('fecha_analisis', inicioDeSemana().toISOString())
      .limit(5000)
      .then(({ data, error }) => {
        if (!activo) return
        setLeido({ usuarioId, texto: error ? null : resumenSemana(data ?? []) })
      })

    return () => {
      activo = false
    }
  }, [usuarioId, version])

  const recargar = () => setVersion((actual) => actual + 1)
  const texto = usuarioId && leido.usuarioId === usuarioId ? leido.texto : null
  return { texto, recargar }
}
