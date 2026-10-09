import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Marco from '../components/Marco.jsx'
import { supabase } from '../lib/supabase.js'
import { useSesion } from '../lib/useSesion.js'
import './Modulo.css'

function Adquirir() {
  const { sesion, cargando } = useSesion()
  const navegar = useNavigate()
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function pagar() {
    setError(null)
    setEnviando(true)
    const { error: fallo } = await supabase.rpc('phishguard_pagar_prueba')
    setEnviando(false)

    if (fallo) {
      setError(fallo.message)
      return
    }

    if (sesion?.user?.id) {
      sessionStorage.removeItem(`sg-acceso:${sesion.user.id}`)
    }

    navegar('/panel?app=phishguard')
  }

  return (
    <Marco interior>
      <div className="container pg">
        <section className="pg-bloque">
          <p className="adquirir-vuelta">
            <Link to="/empresas">← PhishGuard</Link>
          </p>
          <h1>Medios de pago</h1>
          <p className="adquirir-monto">$ 500</p>
          <p>
            Precio de prueba. El único medio es Mercado Pago. Al pagar se
            desbloquea PhishGuard. En esta prueba no se cobra una tarjeta.
          </p>
          {cargando ? (
            <p>Verificando tu sesión…</p>
          ) : sesion ? (
            <button
              type="button"
              className="medio-pago"
              onClick={pagar}
              disabled={enviando}
            >
              {enviando ? 'Pagando…' : 'Pagar 500 pesos'}
            </button>
          ) : (
            <Link className="medio-pago" to="/ingresar?volver=/adquirir">
              Entrá para pagar
            </Link>
          )}
          {error ? <p className="adquirir-error">{error}</p> : null}
        </section>
      </div>
    </Marco>
  )
}

export default Adquirir
