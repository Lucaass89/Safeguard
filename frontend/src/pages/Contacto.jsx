import { Link } from 'react-router'
import Marco from '../components/Marco.jsx'
import './Modulo.css'

function Contacto() {
  return (
    <Marco interior>
      <div className="container nota">
        <div className="eyebrow">Contacto</div>
        <h1>Hablar con nosotros</h1>
        <p>
          PhishGuard no tiene una demo ni un alta propia. Crear una cuenta en
          Ingresar abre SafeLink y el panel; no reemplaza esta conversación.
        </p>
        <h2>Mail</h2>
        <p>[COMPLETAR: dirección de correo]</p>
        <h2>WhatsApp</h2>
        <p>[COMPLETAR: número de WhatsApp]</p>
        <p>
          <Link to="/privacidad">Privacidad</Link>
        </p>
      </div>
    </Marco>
  )
}

export default Contacto
