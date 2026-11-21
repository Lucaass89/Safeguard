import { Link } from 'react-router'
import { esAppNativa, rutaEnApp } from '../lib/esAppNativa.js'
import './CabeceraPhishGuard.css'

function CabeceraPhishGuard({ titulo, texto, organizacion = '', seccion = '', children = null }) {
  if (esAppNativa()) {
    return (
      <header className="panel-header">
        <Link className="panel-volver" to={rutaEnApp('/panel?app=phishguard')}>
          ← Volver a las opciones
        </Link>
        <h1>{titulo}</h1>
        {texto ? <p className="panel-lead">{texto}</p> : null}
        {children}
      </header>
    )
  }

  const etiqueta = ['PhishGuard', seccion, organizacion].filter(Boolean).join(' · ')

  return (
    <header className="pgc-hero">
      <div className="pgc-adentro">
        <Link className="pgc-volver" to="/panel?app=phishguard">
          ← Volver a PhishGuard
        </Link>
        <p className="pgc-eti">{etiqueta}</p>
        <h1>{titulo}</h1>
        {texto ? <p className="pgc-lead">{texto}</p> : null}
        {children ? <div className="pgc-extra">{children}</div> : null}
      </div>
    </header>
  )
}

export default CabeceraPhishGuard
