import { useState } from 'react'
import { Link } from 'react-router'
import Marco from '../components/Marco.jsx'
import { supabase } from '../lib/supabase.js'
import { useSesion } from '../lib/useSesion.js'
import './Modulo.css'

function esCheckoutReal(valor) {
  try {
    const url = new URL(valor)
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'www.mercadopago.com.ar' || url.hostname === 'www.mercadopago.com')
    )
  } catch {
    return false
  }
}

async function mensajeDe(error, data) {
  if (data?.error) return data.error
  if (error?.context && typeof error.context.json === 'function') {
    try {
      const cuerpo = await error.context.json()
      if (cuerpo?.error) return cuerpo.error
    } catch {
      // La función no devolvió un mensaje legible.
    }
  }
  return 'No se pudo abrir Mercado Pago.'
}

function Adquirir() {
  const { sesion, cargando } = useSesion()
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function pagar() {
    setError(null)
    setEnviando(true)
    const { data, error: fallo } = await supabase.functions.invoke('phishguard-mercadopago', {
      body: { accion: 'crear' },
    })
    setEnviando(false)

    if (fallo || !esCheckoutReal(data?.url)) {
      setError(await mensajeDe(fallo, data))
      return
    }

    window.location.assign(data.url)
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
            Precio de prueba. El botón abre el checkout de Mercado Pago. Cuando
            el pago queda aprobado, se desbloquea PhishGuard.
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
              {enviando ? 'Abriendo Mercado Pago…' : 'Pagar con Mercado Pago'}
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
