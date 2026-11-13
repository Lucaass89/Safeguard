import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import ElegirPersonas from '../components/ElegirPersonas.jsx'
import FormEmpresa from '../components/FormEmpresa.jsx'
import Marco from '../components/Marco.jsx'
import { EMPRESA_VACIA, empresaDesdeOrganizacion, guardarBorrador, leerBorrador, validarEmpresa } from '../lib/datosEmpresa.js'
import { cargarEmpresaGuardada } from '../lib/empresaGuardada.js'
import { recordarPersonas } from '../lib/planRecordado.js'
import { formatoPesos, leerPersonas, PERSONAS_POR_DEFECTO, precioPhishguard } from '../lib/precioPhishguard.js'
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
      void 0
    }
  }
  return 'No se pudo abrir Mercado Pago.'
}

function Adquirir() {
  const { sesion, cargando } = useSesion()
  const [params] = useSearchParams()
  const [personas, setPersonas] = useState(
    () => String(leerPersonas(params.get('personas')) ?? PERSONAS_POR_DEFECTO),
  )
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [acepta, setAcepta] = useState(false)
  const [empresa, setEmpresa] = useState(() => leerBorrador() ?? EMPRESA_VACIA)
  const [erroresEmpresa, setErroresEmpresa] = useState({})
  const formulario = useRef(null)
  const usuarioId = sesion?.user?.id ?? null
  const correo = sesion?.user?.email ?? ''

  useEffect(() => {
    guardarBorrador(empresa)
  }, [empresa])

  useEffect(() => {
    if (!usuarioId) return undefined
    let activo = true
    cargarEmpresaGuardada().then(({ organizacion, areas }) => {
      if (!activo) return
      setEmpresa((actual) => {
        const guardada = empresaDesdeOrganizacion(organizacion, areas, correo)
        const completa = Object.fromEntries(
          Object.keys(EMPRESA_VACIA).map((clave) => [clave, actual[clave] || guardada[clave] || '']),
        )
        return completa
      })
    })
    return () => {
      activo = false
    }
  }, [usuarioId, correo])
  const precio = precioPhishguard(personas)
  const volver = `/adquirir?personas=${precio ? precio.personas : PERSONAS_POR_DEFECTO}`

  async function pagar() {
    setError(null)
    if (!precio) {
      setError('Elegí cuántas personas va a cubrir el plan, de 1 a 10.000.')
      return
    }
    const revision = validarEmpresa(empresa)
    setErroresEmpresa(revision.errores)
    if (!revision.valido) {
      setError('Revisá los datos de la empresa marcados en rojo.')
      formulario.current?.querySelector('[aria-invalid="true"]')?.focus()
      return
    }
    if (!acepta) {
      setError('Para pagar tenés que aceptar los términos y condiciones de servicio.')
      return
    }
    setEnviando(true)
    recordarPersonas(sesion.user.id, precio.personas)
    const { data, error: fallo } = await supabase.functions.invoke('phishguard-mercadopago', {
      body: { accion: 'crear', personas: precio.personas, empresa: revision.datos },
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
          <h1>Elegí tu plan</h1>
          <ElegirPersonas valor={personas} onCambiar={setPersonas} mostrarPesos={false} />
          <div ref={formulario}>
            <FormEmpresa valor={empresa} onCambiar={setEmpresa} errores={erroresEmpresa} />
          </div>
          <p className="adquirir-monto">{precio ? formatoPesos(precio.totalPesos) : '—'}</p>
          <p>
            Es un pago único en pesos por el primer mes del plan que elegiste,
            y desbloquea PhishGuard en esta cuenta. No hay suscripción
            automática.
          </p>
          <p>
            El botón abre el checkout de Mercado Pago. Cerrá antes la sesión de
            la cuenta que cobra y pagá como invitado con una tarjeta. Cuando el
            pago queda aprobado, se desbloquea PhishGuard.
          </p>
          <label className="adquirir-acepto">
            <input
              type="checkbox"
              checked={acepta}
              onChange={(evento) => setAcepta(evento.target.checked)}
            />
            <span>
              Acepto los{' '}
              <Link to="/terminos">términos y condiciones de servicio</Link>
              . PhishGuard es un ejercicio de capacitación: los resultados no se
              usan para sancionar.
            </span>
          </label>
          {cargando ? (
            <p>Verificando tu sesión…</p>
          ) : sesion ? (
            <button
              type="button"
              className="medio-pago"
              onClick={pagar}
              disabled={enviando || !acepta || !precio}
            >
              {enviando ? 'Abriendo Mercado Pago…' : 'Pagar con Mercado Pago'}
            </button>
          ) : (
            <Link className="medio-pago" to={`/ingresar?volver=${encodeURIComponent(volver)}`}>
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
