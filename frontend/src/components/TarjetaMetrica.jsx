import './TarjetaMetrica.css'

function Flecha({ direccion }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direccion === 'sube' ? (
        <path d="M12 19V6M7 10l5-5 5 5" />
      ) : (
        <path d="M12 5v13M7 14l5 5 5-5" />
      )}
    </svg>
  )
}

export function ListaMetricas({ columnas = 2, children }) {
  return (
    <ul className="lista-metricas" style={{ '--metricas-columnas': columnas }}>
      {children}
    </ul>
  )
}

function TarjetaMetrica({ valor, etiqueta, tendencia = null }) {
  return (
    <li className="tarjeta-metrica">
      <strong>{valor}</strong>
      <span className="tarjeta-metrica-etiqueta">{etiqueta}</span>
      {tendencia ? (
        <span className={tendencia.mejora ? 'tarjeta-metrica-tendencia tarjeta-metrica-mejor' : 'tarjeta-metrica-tendencia tarjeta-metrica-peor'}>
          <Flecha direccion={tendencia.direccion} />
          <span>
            {tendencia.delta} · {tendencia.mejora ? 'mejor' : 'peor'}
          </span>
        </span>
      ) : null}
    </li>
  )
}

export default TarjetaMetrica
