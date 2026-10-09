import { Link } from 'react-router'
import Marco from '../components/Marco.jsx'
import './Modulo.css'

function Adquirir() {
  return (
    <Marco interior>
      <div className="container pg">
        <section className="pg-bloque">
          <p className="adquirir-vuelta">
            <Link to="/empresas">← PhishGuard</Link>
          </p>
          <h1>Medios de pago</h1>
          <p>
            Adquirí PhishGuard. Por ahora el único medio es Mercado Pago.
          </p>
          <a className="medio-pago" href="https://www.mercadopago.com.ar">
            Mercado Pago
          </a>
        </section>
      </div>
    </Marco>
  )
}

export default Adquirir
