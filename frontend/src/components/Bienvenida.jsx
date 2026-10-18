import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Logo from './Logo.jsx'
import { useSesion } from '../lib/useSesion.js'
import './Bienvenida.css'

function primerNombre(usuario) {
  const meta = usuario.user_metadata ?? {}
  const completo = (meta.full_name || meta.name || '').trim()
  if (!completo || completo === usuario.email) return ''
  return completo.split(/\s+/)[0]
}

function Bienvenida() {
  const { sesion, cargando } = useSesion()
  const capa = useRef(null)
  const [sale, setSale] = useState(false)
  const [cerrada, setCerrada] = useState(false)
  const usuario = sesion?.user
  const id = usuario?.id
  const yaVista = Boolean(id) && sessionStorage.getItem('sg-recibido') === id

  useEffect(() => {
    if (cargando || !id || cerrada || yaVista) return undefined
    const raiz = document.getElementById('root')
    raiz?.setAttribute('inert', '')
    return () => raiz?.removeAttribute('inert')
  }, [cargando, id, cerrada, yaVista])

  if (cargando || !id || cerrada || yaVista) return null

  const nombre = primerNombre(usuario)

  function guardar() {
    sessionStorage.setItem('sg-recibido', id)
    window.dispatchEvent(new Event('sg-recibido'))
    setCerrada(true)
  }

  function continuar() {
    if (sale) return
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (quieto) {
      guardar()
      return
    }
    setSale(true)
  }

  function alAnimar(evento) {
    if (evento.target !== capa.current || evento.animationName !== 'bienvenida-sale') return
    guardar()
  }

  return createPortal(
    <div
      ref={capa}
      className={sale ? 'bienvenida bienvenida-sale' : 'bienvenida'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bienvenida-titulo"
      onAnimationEnd={alAnimar}
    >
      <div className="bienvenida-caja">
        <div className="bienvenida-marca">
          <Logo className="bienvenida-logo" />
        </div>
        <p className="bienvenida-hola">{nombre ? `Hola, ${nombre}` : 'Hola'}</p>
        <h1 id="bienvenida-titulo">Bienvenidos a SafeGuard</h1>
        <button type="button" className="bienvenida-seguir" onClick={continuar} autoFocus>
          Continuar
        </button>
      </div>
    </div>,
    document.body,
  )
}

export default Bienvenida
