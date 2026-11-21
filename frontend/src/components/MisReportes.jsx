import { useEffect, useState } from 'react'
import { estadoReporte } from '../lib/reportesPropios.js'
import { supabase } from '../lib/supabase.js'
import { useSesion } from '../lib/useSesion.js'
import '../pages/PerfilApp.css'

function MisReportes() {
  const { sesion } = useSesion()
  const [filas, setFilas] = useState(null)

  useEffect(() => {
    let activo = true
    supabase
      .from('safelink_reportes')
      .select('id, dominio, motivo, estado, cierre, fecha_reporte')
      .eq('usuario_id', sesion.user.id)
      .order('fecha_reporte', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (activo) setFilas(error ? [] : data ?? [])
      })
    return () => {
      activo = false
    }
  }, [sesion.user.id])

  if (filas === null) return <p className="pa-estado">Buscando tus reportes…</p>
  if (filas.length === 0) {
    return (
      <p className="pa-estado">
        Todavía no reportaste nada. Cuando un resultado te parezca un engaño, tocá Reportar y aparece acá.
      </p>
    )
  }

  return (
    <ul className="pa-reportes">
      {filas.map((fila) => {
        const estado = estadoReporte(fila.estado)
        return (
          <li key={fila.id} className="pa-reporte">
            <div className="pa-reporte-cabeza">
              <strong>{fila.dominio}</strong>
              <span className={`pa-reporte-estado pa-reporte-${estado.nivel}`}>{estado.etiqueta}</span>
            </div>
            <p className="pa-reporte-fecha">
              {new Date(fila.fecha_reporte).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {fila.motivo ? <p>{fila.motivo}</p> : null}
            {fila.cierre ? <p className="pa-reporte-cierre">{fila.cierre}</p> : null}
          </li>
        )
      })}
    </ul>
  )
}

export default MisReportes
