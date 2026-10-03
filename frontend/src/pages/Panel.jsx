import { Link } from 'react-router'
import { useSesion } from '../lib/useSesion.js'
import './Panel.css'

const grupos = [
  {
    nombre: 'SafeLink',
    clase: 'panel-personas',
    items: [
      { to: '/panel/enlaces', titulo: 'Revisar un enlace', nota: 'Abrís el destino' },
      { to: '/panel/whatsapp', titulo: 'Pegar un WhatsApp', nota: 'Texto y número' },
      { to: '/panel/pdf', titulo: 'Revisar un PDF', nota: 'Formularios y scripts' },
      { to: '/panel/correo', titulo: 'Revisar un correo', nota: 'SPF, DKIM, remitente' },
    ],
  },
  {
    nombre: 'PhishGuard',
    clase: 'panel-empresas',
    items: [
      { to: '/panel/empresa', titulo: 'Tu empresa', nota: 'Alta y personas' },
      { to: '/panel/campanas', titulo: 'Campañas', nota: 'WhatsApp, SMS o mail' },
      { to: '/panel/tablero', titulo: 'Tablero del equipo', nota: 'Por persona y por área' },
    ],
  },
]

function Panel() {
  const { sesion } = useSesion()
  const nombre =
    sesion.user.user_metadata?.full_name ??
    sesion.user.user_metadata?.name ??
    sesion.user.email

  return (
    <div className="panel mesa">
      <div className="mesa-barra">
        <p>
          <span>{nombre}</span>
          <span>{sesion.user.email}</span>
        </p>
        <p>7 herramientas</p>
      </div>

      <div className="mesa-hoja">
        {grupos.map((grupo) => (
          <section className={grupo.clase} key={grupo.nombre}>
            <h2>{grupo.nombre}</h2>
            <ol>
              {grupo.items.map((item, indice) => (
                <li key={item.to}>
                  <Link to={item.to}>
                    <span>{String(indice + 1).padStart(2, '0')}</span>
                    <strong>{item.titulo}</strong>
                    <span>{item.nota}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}

export default Panel
