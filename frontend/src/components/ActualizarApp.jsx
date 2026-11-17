import { useState } from 'react'
import { nombreDescarga } from '../lib/actualizarApp.js'
import './ActualizarApp.css'

export function BotonActualizar({ ultima, className = '' }) {
  const [bajando, setBajando] = useState(false)

  return (
    <span className={`actualizar ${className}`.trim()}>
      <a
        className="actualizar-boton"
        href={ultima.archivo}
        download={nombreDescarga(ultima)}
        onClick={() => setBajando(true)}
      >
        {bajando ? 'Bajando…' : 'Actualizar'}
      </a>
      {bajando ? (
        <span className="actualizar-nota" role="status">
          Cuando termine, tocá la notificación de Android y elegí Instalar.
        </span>
      ) : null}
    </span>
  )
}
