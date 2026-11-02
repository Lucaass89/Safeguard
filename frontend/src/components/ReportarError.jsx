import { useEffect, useId, useRef, useState } from 'react'
import { dispositivo } from '../lib/dispositivo.js'
import { armarReporteError, ESPERADOS, TOPE_COMENTARIO } from '../lib/reporteError.js'
import { supabase } from '../lib/supabase.js'
import './ReportarError.css'

function ReportarError({ caso, onCancelar, onEnviado }) {
  const id = useId()
  const leyenda = useRef(null)
  const [esperado, setEsperado] = useState('')
  const [comentario, setComentario] = useState('')
  const [estado, setEstado] = useState('')

  useEffect(() => {
    leyenda.current?.focus()
  }, [])

  async function enviar(evento) {
    evento.preventDefault()
    const datos = armarReporteError(caso, esperado, comentario)
    if (!datos || estado === 'enviando') return
    setEstado('enviando')
    const { data, error } = await supabase.rpc('safelink_reportar_error', { p_dispositivo: dispositivo(), ...datos })
    if (!error && data === true) onEnviado()
    else setEstado('fallo')
  }

  return (
    <form className="reportar-error" onSubmit={enviar}>
      <fieldset>
        <legend ref={leyenda} tabIndex={-1}>
          ¿Qué querés reportar?
        </legend>
        {ESPERADOS.map((opcion) => (
          <label key={opcion.id} className="reportar-error-opcion">
            <input
              type="radio"
              name={`${id}-esperado`}
              value={opcion.id}
              checked={esperado === opcion.id}
              onChange={() => setEsperado(opcion.id)}
            />
            {opcion.etiqueta}
          </label>
        ))}
      </fieldset>
      <label className="reportar-error-campo" htmlFor={`${id}-comentario`}>
        Contanos qué pasó (opcional)
      </label>
      <textarea
        id={`${id}-comentario`}
        rows={3}
        maxLength={TOPE_COMENTARIO}
        value={comentario}
        onChange={(evento) => setComentario(evento.target.value)}
        placeholder="No pongas claves ni datos personales."
      />
      <p className="reportar-error-nota">
        Guardamos la dirección sin lo que va después del signo ?, el resultado y los motivos. Una persona lo revisa a
        mano: el reporte no cambia el veredicto ni agrega el sitio a ninguna lista.
      </p>
      {estado === 'fallo' && (
        <p className="reportar-error-fallo" role="alert">
          No se pudo enviar. Probá de nuevo en un rato.
        </p>
      )}
      <div className="reportar-error-acciones">
        <button type="submit" className="reportar-error-enviar" disabled={!esperado || estado === 'enviando'}>
          {estado === 'enviando' ? 'Enviando…' : 'Enviar reporte'}
        </button>
        <button type="button" className="reportar-error-cancelar" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default ReportarError
