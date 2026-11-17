import { useEffect, useSyncExternalStore } from 'react'
import { estadoApp, normalizarAvisos, recibirRespuesta, urlAvisos, VERSION_CON_AVISOS } from './avisos.js'
import { esAppNativa, versionApp } from './esAppNativa.js'
import { guardarJson, leerJson } from './guardadoLocal.js'
import { supabase } from './supabase.js'

const CLAVE = 'sg-avisos'
const CAMBIO = 'sg-avisos-cambio'

export function appParaAvisos() {
  return estadoApp(esAppNativa(), versionApp())
}

export function puedeAvisar() {
  return esAppNativa() && versionApp() >= VERSION_CON_AVISOS
}

let foto = null

function leer() {
  if (foto === null) foto = JSON.stringify(normalizarAvisos(leerJson(CLAVE, null)))
  return foto
}

function escribir(estado) {
  const normal = normalizarAvisos(estado)
  guardarJson(CLAVE, normal)
  foto = JSON.stringify(normal)
  window.dispatchEvent(new Event(CAMBIO))
  return normal
}

function suscribir(avisar) {
  function respuesta(evento) {
    escribir(recibirRespuesta(JSON.parse(leer()), evento.detail))
  }
  window.addEventListener('sg-push', respuesta)
  window.addEventListener(CAMBIO, avisar)
  return () => {
    window.removeEventListener('sg-push', respuesta)
    window.removeEventListener(CAMBIO, avisar)
  }
}

function pedirAlCelular(estado) {
  if (puedeAvisar()) window.location.href = urlAvisos(estado)
}

export function activarAvisos(temas) {
  const actual = JSON.parse(leer())
  const nuevo = escribir({ ...actual, decidido: true, activos: true, temas: { ...actual.temas, ...temas } })
  pedirAlCelular(nuevo)
}

export function apagarAvisos() {
  const nuevo = escribir({ ...JSON.parse(leer()), decidido: true, activos: false })
  pedirAlCelular(nuevo)
}

export function cambiarTema(id, prendido) {
  const actual = JSON.parse(leer())
  const temas = { ...actual.temas, [id]: prendido }
  const activos = Object.values(temas).some(Boolean)
  const nuevo = escribir({ ...actual, decidido: true, activos, temas })
  pedirAlCelular(nuevo)
}

export function useAvisos() {
  const texto = useSyncExternalStore(suscribir, leer, () => JSON.stringify(normalizarAvisos(null)))
  return JSON.parse(texto)
}

export function useRegistrarAvisos(sesion) {
  const estado = useAvisos()
  const usuario = sesion?.user?.id ?? null
  const phishguard = estado.activos && estado.temas.phishguard

  useEffect(() => {
    if (!usuario || !estado.token || estado.permiso !== 'si') return
    const pedido = phishguard
      ? supabase.rpc('push_registrar', { p_token: estado.token, p_phishguard: true })
      : supabase.rpc('push_borrar', { p_token: estado.token })
    pedido.then(
        () => {},
        () => {},
      )
  }, [usuario, estado.token, estado.permiso, phishguard])
}
