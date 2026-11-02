import './FilaAjuste.css'

function FilaAjuste({ titulo, tituloId, nota = null, tocable = false, apilado = false, children }) {
  const Contenedor = tocable ? 'label' : 'div'
  const clases = ['fila-ajuste', tocable && 'fila-ajuste-tocable', apilado && 'fila-ajuste-apilada']
    .filter(Boolean)
    .join(' ')

  return (
    <Contenedor className={clases}>
      <span className="fila-ajuste-texto">
        <strong id={tituloId} className="fila-ajuste-titulo">
          {titulo}
        </strong>
        {nota ? <span className="fila-ajuste-nota">{nota}</span> : null}
      </span>
      {children}
    </Contenedor>
  )
}

export default FilaAjuste
