import { useState } from 'react'

function Captura({ src, alt, className = '', children = null }) {
  const [estado, setEstado] = useState('cargando')
  const clases = ['captura', className].filter(Boolean).join(' ')
  const pendiente =
    import.meta.env.DEV && estado === 'falta' ? (
      <div className={`${clases} captura-pendiente`}>Captura pendiente: public{src}</div>
    ) : null

  return (
    <>
      {estado !== 'lista' && (children ?? pendiente)}
      <figure className={clases} hidden={estado !== 'lista'}>
        <img
          src={src}
          alt={alt}
          onLoad={() => setEstado('lista')}
          onError={() => setEstado('falta')}
        />
      </figure>
    </>
  )
}

export default Captura
