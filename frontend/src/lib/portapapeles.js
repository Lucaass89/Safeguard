import { useSyncExternalStore } from 'react'
import { enlacesEn } from './analisisWhatsapp.js'
import { versionApp } from './esAppNativa.js'

const PREFERENCIA = 'sg-portapapeles'
const PENDIENTE = 'sg-copiado'
const VISTO = 'sg-copiado-visto'
const CAMBIO = 'sg-copiado-cambio'

function leer(almacen, clave) {
  try {
    return almacen.getItem(clave)
  } catch {
    return null
  }
}

function escribir(almacen, clave, valor) {
  try {
    if (valor === null) almacen.removeItem(clave)
    else almacen.setItem(clave, valor)
  } catch {
    /* sin almacenamiento, la tarjeta no aparece */
  }
}

function avisar() {
  window.dispatchEvent(new Event(CAMBIO))
}

export function puedeLeerPortapapeles() {
  return versionApp() >= 2
}

function recibir(evento) {
  if (leer(localStorage, PREFERENCIA) !== 'si') return
  const enlace = enlacesEn(String(evento.detail ?? ''))[0]
  if (!enlace || enlace === leer(localStorage, VISTO)) return
  escribir(sessionStorage, PENDIENTE, enlace)
  avisar()
}

if (typeof window !== 'undefined') {
  window.addEventListener('sg-portapapeles', recibir)
}

export function elegirPortapapeles(activa) {
  escribir(localStorage, PREFERENCIA, activa ? 'si' : 'no')
  if (!activa) escribir(sessionStorage, PENDIENTE, null)
  avisar()
  if (activa && puedeLeerPortapapeles()) window.location.href = 'safeguard://portapapeles'
}

export function olvidarCopiado() {
  const enlace = leer(sessionStorage, PENDIENTE)
  if (enlace) escribir(localStorage, VISTO, enlace)
  escribir(sessionStorage, PENDIENTE, null)
  avisar()
}

function suscribir(aviso) {
  window.addEventListener(CAMBIO, aviso)
  return () => window.removeEventListener(CAMBIO, aviso)
}

function foto() {
  return `${leer(localStorage, PREFERENCIA) ?? ''}|${leer(sessionStorage, PENDIENTE) ?? ''}`
}

export function usePortapapeles() {
  const actual = useSyncExternalStore(suscribir, foto, () => '|')
  const corte = actual.indexOf('|')
  const preferencia = actual.slice(0, corte) || null
  return {
    disponible: puedeLeerPortapapeles(),
    preferencia,
    enlace: preferencia === 'si' ? actual.slice(corte + 1) || null : null,
  }
}
