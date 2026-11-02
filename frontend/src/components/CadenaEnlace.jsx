import './CadenaEnlace.css'

function partir(direccion) {
  try {
    const url = new URL(direccion)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return { sitio: direccion, resto: '' }
    const resto = `${url.pathname === '/' ? '' : url.pathname}${url.search}`
    return { sitio: url.host, resto, inseguro: url.protocol === 'http:' }
  } catch {
    return { sitio: direccion, resto: '' }
  }
}

function CadenaEnlace({ cadena, cortada }) {
  if (!Array.isArray(cadena) || cadena.length < 2) return null
  const ultimo = cadena.length - 1

  return (
    <section className="cadena" aria-label="Recorrido del enlace">
      <h3 className="cadena-titulo">Recorrido del enlace</h3>
      <ol className="cadena-lista">
        {cadena.map((paso, indice) => {
          const { sitio, resto, inseguro } = partir(paso)
          const etiqueta =
            indice === 0 ? 'Dirección original' : indice === ultimo ? (cortada ? 'Acá se cortó' : 'Destino final') : `Salto ${indice}`
          return (
            <li key={`${indice}-${paso}`} className="cadena-paso">
              <span className="cadena-etiqueta">{etiqueta}</span>
              <span className="cadena-url">
                <strong>{sitio}</strong>
                {resto ? <span className="cadena-resto">{resto}</span> : null}
              </span>
              {inseguro ? <span className="cadena-nota">Sin conexión segura (http)</span> : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default CadenaEnlace
