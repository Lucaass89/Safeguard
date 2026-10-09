import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import Marco from '../components/Marco.jsx'
import { supabase } from '../lib/supabase.js'
import { useSesion } from '../lib/useSesion.js'
import './Modulo.css'

function AdquirirVuelta() {
  const { sesion, cargando } = useSesion()
  const [params] = useSearchParams()
  const [estado, setEstado] = useState('esperando')
  const [error, setError] = useState(null)
  const pagoId = params.get('payment_id') || params.get('collection_id') || ''
  const volver = `/adquirir/vuelta${pagoId ? `?payment_id=${encodeURIComponent(pagoId)}` : ''}`

  useEffect(() => {
    if (cargando || !sesion || !/^\d{1,20}$/.test(pagoId)) return

    let activo = true
    supabase.functions
      .invoke('phishguard-mercadopago', {
        body: { accion: 'confirmar', pago_id: pagoId },
      })
      .then(({ data, error: fallo }) => {
        if (!activo) return
        if (fallo || data?.error) {
          setError(data?.error || 'No pude confirmar el pago en Mercado Pago.')
          setEstado('error')
          return
        }
        if (data?.estado === 'aprobado') {
          sessionStorage.removeItem(`sg-acceso:${sesion.user.id}`)
        }
        setEstado(data?.estado || 'error')
      })

    return () => {
      activo = false
    }
  }, [cargando, sesion, pagoId])

  let texto = 'Confirmando el pago con Mercado Pago…'
  if (!cargando && !sesion) {
    texto = 'Entrá con la misma cuenta para terminar de abrir PhishGuard.'
  } else if (!pagoId) {
    texto = 'Mercado Pago no informó un pago.'
  } else if (estado === 'aprobado') {
    texto = 'El pago quedó aprobado. PhishGuard está desbloqueado.'
  } else if (estado === 'pendiente') {
    texto = 'Mercado Pago todavía está procesando el pago.'
  } else if (estado === 'rechazado') {
    texto = 'Mercado Pago no aprobó el pago. PhishGuard sigue cerrado.'
  } else if (estado === 'error') {
    texto = error || 'No pude confirmar el pago.'
  }

  return (
    <Marco interior>
      <div className="container pg">
        <section className="pg-bloque">
          <p className="adquirir-vuelta">
            <Link to="/adquirir">← Medios de pago</Link>
          </p>
          <h1>Mercado Pago</h1>
          <p>{texto}</p>
          {!cargando && !sesion ? (
            <Link className="medio-pago" to={`/ingresar?volver=${encodeURIComponent(volver)}`}>
              Entrá para terminar
            </Link>
          ) : null}
          {estado === 'aprobado' ? (
            <Link className="medio-pago" to="/panel?app=phishguard">
              Ir a PhishGuard
            </Link>
          ) : null}
        </section>
      </div>
    </Marco>
  )
}

export default AdquirirVuelta
