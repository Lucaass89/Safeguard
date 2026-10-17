import { Link } from 'react-router'

const DESTINOS = {
  phishguard: {
    texto: 'Las simulaciones siguen donde estaban.',
    to: '/panel?app=phishguard',
    accion: 'Abrir PhishGuard',
  },
  safelink: {
    texto: 'Las revisiones siguen donde estaban.',
    to: '/panel?app=safelink',
    accion: 'Abrir SafeLink',
  },
  perfil: {
    texto: 'Tu cuenta sigue donde estaba.',
    to: '/panel/perfil',
    accion: 'Abrir perfil',
  },
}

function DestinoApp({ id }) {
  const destino = DESTINOS[id]
  return (
    <p className="app-pendiente">
      {destino.texto} <Link to={destino.to}>{destino.accion}</Link>
    </p>
  )
}

export default DestinoApp
