import { useId } from 'react'
import {
  etiquetaTramo,
  formatoPesos,
  formatoUsd,
  MAX_PERSONAS,
  MIN_PERSONAS,
  precioPhishguard,
} from '../lib/precioPhishguard.js'
import './ElegirPersonas.css'

function ElegirPersonas({ valor, onCambiar, mostrarPesos = true }) {
  const id = useId()
  const precio = precioPhishguard(valor)

  return (
    <div className="elegir-personas">
      <label className="elegir-personas-etiqueta" htmlFor={`${id}-cantidad`}>
        ¿Cuántas personas van a recibir las simulaciones?
      </label>
      <div className="elegir-personas-fila">
        <input
          id={`${id}-cantidad`}
          className="elegir-personas-campo"
          type="number"
          inputMode="numeric"
          min={MIN_PERSONAS}
          max={MAX_PERSONAS}
          step="1"
          value={valor}
          aria-describedby={`${id}-resumen`}
          onChange={(evento) => onCambiar(evento.target.value)}
        />
        <span className="elegir-personas-unidad">personas</span>
      </div>
      <div className="elegir-personas-resumen" id={`${id}-resumen`} aria-live="polite">
        {precio ? (
          <>
            <p className="elegir-personas-total">
              <strong>{formatoUsd(precio.totalUsd)}</strong> por mes
            </p>
            <p>
              {precio.aplicaMinimo
                ? `Con ${precio.personas} ${precio.personas === 1 ? 'persona' : 'personas'} se cobra el mínimo de USD 25 por mes.`
                : `${etiquetaTramo(precio.tramo)}: ${formatoUsd(precio.porPersonaUsd)} por persona.`}
            </p>
            {mostrarPesos && (
              <p>
                En pesos: <strong>{formatoPesos(precio.totalPesos)}</strong>, con USD 1 = $ 1.500.
              </p>
            )}
          </>
        ) : (
          <p className="elegir-personas-error">Escribí un número entero de 1 a 10.000.</p>
        )}
      </div>
    </div>
  )
}

export default ElegirPersonas
