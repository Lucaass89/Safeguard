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
          {ultima.desinstalar
            ? 'Cuando termine: primero desinstalá SafeGuard (mantené apretado el ícono › Desinstalar) y después tocá la notificación de Android y elegí Instalar.'
            : 'Cuando termine, tocá la notificación de Android y elegí Instalar.'}
        </span>
      ) : ultima.desinstalar ? (
        <span className="actualizar-nota">
          Esta vez cambia la firma de la app: hay que desinstalar la versión que tenés antes de instalar la nueva, y
          después volver a ingresar.
        </span>
      ) : null}
    </span>
  )
}
