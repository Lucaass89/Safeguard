import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { esAdministrador, useMembresia } from '../lib/useMembresia.js'
import { supabase } from '../lib/supabase.js'
import { useSesion } from '../lib/useSesion.js'
import '../pages/PhishGuard.css'

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
      void 0
    }
  }
  return 'No se pudo abrir Mercado Pago.'
}

export function PhishGuardPago() {
  const { sesion } = useSesion()
  const { pathname, search, hash } = useLocation()
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [verificando, setVerificando] = useState(false)
  const volver = `/ingresar?volver=${encodeURIComponent(`${pathname}${search}${hash}`)}`
  const usuarioId = sesion?.user?.id ?? null

  useEffect(() => {
    if (!usuarioId) return undefined

    let activo = true
    let enCurso = false

    async function verificar() {
      if (enCurso || document.visibilityState === 'hidden') return
      enCurso = true
      setVerificando(true)
      const { data } = await supabase.functions.invoke('phishguard-mercadopago', {
        body: { accion: 'verificar' },
      })
      enCurso = false
      if (!activo) return
      setVerificando(false)
      const recargado = `sg-pago-recargado:${usuarioId}`
      if (data?.estado === 'aprobado' && sessionStorage.getItem(recargado) !== '1') {
        sessionStorage.setItem(recargado, '1')
        sessionStorage.removeItem(`sg-acceso:${usuarioId}`)
        window.location.reload()
      }
    }

    verificar()
    document.addEventListener('visibilitychange', verificar)
    return () => {
      activo = false
      document.removeEventListener('visibilitychange', verificar)
    }
  }, [usuarioId])

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
    <section className="phish-pago" aria-labelledby="phish-pago-titulo">
      <h2 id="phish-pago-titulo">PhishGuard se paga por persona</h2>
      <p>
        Si no tenés cuenta, o la tenés y no administrás la empresa, esta parte se paga.
        SafeLink sigue disponible.
      </p>
      <p className="phish-pago-monto">$ 37.500</p>
      <p>
        Es un pago único en pesos, equivalente al mínimo de USD 25 por mes. El
        plan publicado se cobra por persona y por mes, desde USD 1, con un
        mínimo de USD 25 por mes.
      </p>
      {sesion ? (
        <button
          type="button"
          className="phish-armar"
          onClick={pagar}
          disabled={enviando || verificando}
        >
          {verificando
            ? 'Revisando si ya pagaste…'
            : enviando
              ? 'Abriendo Mercado Pago…'
              : 'Pagar con Mercado Pago'}
        </button>
      ) : (
        <Link className="phish-armar" to={volver}>
          Entrá para pagar
        </Link>
      )}
      {error ? (
        <p className="phish-pago-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}

function PhishGuardAcceso() {
  const { sesion, cargando } = useSesion()
  const membresia = useMembresia()

  if (cargando || membresia.cargando) {
    return <p className="phish-estado">Revisando tu plan…</p>
  }

  if (sesion && esAdministrador(membresia.rol)) return <Outlet />

  return (
    <div className="phish">
      <PhishGuardPago />
    </div>
  )
}

export default PhishGuardAcceso
