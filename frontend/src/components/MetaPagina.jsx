import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { metaDe } from '../lib/metaPaginas.js'

function fijar(selector, crear, atributo, valor) {
  let nodo = document.head.querySelector(selector)
  if (!nodo) {
    nodo = crear()
    document.head.appendChild(nodo)
  }
  nodo.setAttribute(atributo, valor)
}

function meta(clave, nombre, valor) {
  fijar(
    `meta[${clave}="${nombre}"]`,
    () => {
      const nodo = document.createElement('meta')
      nodo.setAttribute(clave, nombre)
      return nodo
    },
    'content',
    valor,
  )
}

function MetaPagina() {
  const { pathname } = useLocation()

  useEffect(() => {
    const datos = metaDe(pathname)
    document.title = datos.titulo
    meta('name', 'description', datos.descripcion)
    meta('name', 'robots', datos.indexar ? 'index, follow' : 'noindex, nofollow')
    meta('property', 'og:title', datos.titulo)
    meta('property', 'og:description', datos.descripcion)
    meta('property', 'og:url', datos.canonica)
    meta('name', 'twitter:title', datos.titulo)
    meta('name', 'twitter:description', datos.descripcion)
    fijar(
      'link[rel="canonical"]',
      () => {
        const nodo = document.createElement('link')
        nodo.setAttribute('rel', 'canonical')
        return nodo
      },
      'href',
      datos.canonica,
    )
  }, [pathname])

  return null
}

export default MetaPagina
