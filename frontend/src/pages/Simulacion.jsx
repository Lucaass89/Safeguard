import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { supabase } from '../lib/supabase.js'
import './Simulacion.css'

function cuerpoConLink(texto, token) {
  const link = `${window.location.origin}/simulacion/${token}`
  return (texto ?? '').replaceAll('{link}', link)
}

function MarcoTienda({ children }) {
  return (
    <div className="ml">
      <header className="ml-barra">
        <p className="ml-marca">mercado libre</p>
        <p className="ml-buscar" aria-hidden="true">Buscar productos, marcas y más…</p>
      </header>
      <main className="ml-cuerpo">{children}</main>
    </div>
  )
}

function Tienda({ paso, onCuenta, onMercadoPago }) {
  const [cuenta, setCuenta] = useState({ nombre: '', mail: '', clave: '' })
  const [compra, setCompra] = useState('no')

  if (paso === 'cuenta') {
    return (
      <MarcoTienda>
        <form
          className="ml-caja"
          onSubmit={(evento) => {
            evento.preventDefault()
            setCuenta({ nombre: '', mail: '', clave: '' })
            onCuenta()
          }}
        >
          <h1>Creá tu cuenta</h1>
          <p>Para ver la compra pendiente necesitás una cuenta.</p>
          <label>
            Nombre y apellido
            <input
              required
              autoComplete="off"
              value={cuenta.nombre}
              onChange={(evento) => setCuenta({ ...cuenta, nombre: evento.target.value })}
            />
          </label>
          <label>
            E-mail
            <input
              required
              type="email"
              autoComplete="off"
              value={cuenta.mail}
              onChange={(evento) => setCuenta({ ...cuenta, mail: evento.target.value })}
            />
          </label>
          <label>
            Clave
            <input
              required
              type="password"
              autoComplete="off"
              value={cuenta.clave}
              onChange={(evento) => setCuenta({ ...cuenta, clave: evento.target.value })}
            />
          </label>
          <button type="submit" className="ml-boton">Crear cuenta</button>
        </form>
      </MarcoTienda>
    )
  }

  if (paso === 'producto' && compra === 'no') {
    return (
      <MarcoTienda>
        <article className="ml-producto">
          <div className="ml-foto" aria-hidden="true">
            <span />
            <span />
          </div>
          <div>
            <p className="ml-estado">Nuevo · 3 disponibles</p>
            <h1>Auriculares inalámbricos SoundPro</h1>
            <p className="ml-precio">$ 45.999</p>
            <p className="ml-envio">Llega mañana a tu domicilio</p>
            <button type="button" className="ml-boton" onClick={() => setCompra('medio')}>
              Comprar ahora
            </button>
          </div>
        </article>
      </MarcoTienda>
    )
  }

  if (paso === 'producto' && compra === 'medio') {
    return (
      <div className="mp">
        <header className="mp-barra">
          <p className="mp-marca">Mercado Pago</p>
        </header>
        <main className="mp-cuerpo">
          <section className="mp-caja">
            <h1>Medio de pago</h1>
            <p>Auriculares inalámbricos SoundPro · $ 45.999</p>
            <label className="mp-opcion">
              <input type="radio" name="medio" checked onChange={() => {}} />
              <span>Mercado Pago</span>
            </label>
            <button type="button" className="mp-boton" onClick={onMercadoPago}>
              Continuar
            </button>
          </section>
        </main>
      </div>
    )
  }

  return null
}

function Simulacion() {
  const { token } = useParams()
  const [ficha, setFicha] = useState(null)
  const [paso, setPaso] = useState('cebo')
  const [error, setError] = useState(null)
  const [clave, setClave] = useState('')

  useEffect(() => {
    let activo = true
    supabase.rpc('phishguard_ver_simulacion', { p_token: token }).then(({ data, error: fallo }) => {
      if (!activo) return
      if (fallo || !data) {
        setError('Ese enlace no existe o ya no está activo.')
        return
      }
      setFicha(data)
      if (data.capacitado || (data.categoria === 'MERCADOLIBRE' && data.ingreso_datos)) setPaso('leccion')
      else if (data.categoria === 'MERCADOLIBRE') setPaso(data.hizo_clic ? 'producto' : 'cuenta')
      else if (data.hizo_clic) setPaso('datos')
      supabase.rpc('phishguard_registrar', { p_token: token, p_evento: 'abrio' })
    })
    return () => {
      activo = false
    }
  }, [token])

  async function registrar(evento, siguiente) {
    const { data, error: fallo } = await supabase.rpc('phishguard_registrar', {
      p_token: token,
      p_evento: evento,
    })
    if (fallo) {
      setError(fallo.message)
      return
    }
    if (data) setFicha(data)
    setPaso(siguiente)
  }

  if (error) {
    return (
      <main className="sim-pagina">
        <p className="sim-error">{error}</p>
      </main>
    )
  }

  if (!ficha) {
    return (
      <main className="sim-pagina">
        <p>Cargando…</p>
      </main>
    )
  }

  const leccion = ficha.leccion ?? {}

  if (paso === 'leccion') {
    return (
      <main className="sim-pagina sim-leccion">
        <p className="sim-marca">SafeGuard · PhishGuard</p>
        <h1>Esto era una simulación</h1>
        <p>Era una simulación. El mensaje apuraba y pedía un clic.</p>
        {ficha.categoria === 'MERCADOLIBRE' && (
          <p>
            El botón de Mercado Pago abre el sitio real, mercadopago.com.ar. La barra pasa a decir
            eso recién ahí. Esta página no era Mercado Libre ni Mercado Pago.
          </p>
        )}
        {leccion.cuerpo && !/era una simulaci[oó]n/i.test(leccion.cuerpo) && <p>{leccion.cuerpo}</p>}
        {ficha.refuerzo && (
          <p className="sim-nota">Esta era una segunda ronda, un poco más difícil a propósito.</p>
        )}
        {!ficha.capacitado && (
          <button type="button" className="sim-boton" onClick={() => registrar('capacitacion', 'leccion')}>
            Entendido
          </button>
        )}
      </main>
    )
  }

  if (ficha.categoria === 'MERCADOLIBRE') {
    return (
      <Tienda
        paso={paso}
        onCuenta={() => registrar('clic', 'producto')}
        onMercadoPago={async () => {
          const { error: fallo } = await supabase.rpc('phishguard_registrar', {
            p_token: token,
            p_evento: 'clic',
          })
          if (fallo) {
            setError(fallo.message)
            return
          }
          window.location.assign('https://www.mercadopago.com.ar')
        }}
      />
    )
  }

  if (ficha.canal === 'whatsapp') {
    return (
      <main className="sim-pagina sim-wa">
        <header className="wa-barra">
          <span className="wa-avatar" aria-hidden="true" />
          <div>
            <p className="wa-nombre">{ficha.remitente || 'Director'}</p>
            <p className="wa-estado">en línea</p>
          </div>
        </header>
        <div className="wa-chat">
          <p className="wa-burbuja">
            {(ficha.cuerpo ?? '').replaceAll('{link}', '').trim()}
            {paso === 'cebo' && (
              <button type="button" className="wa-link" onClick={() => registrar('clic', 'datos')}>
                Abrir enlace
              </button>
            )}
          </p>
        </div>
        {paso === 'datos' && (
          <form
            className="wa-form"
            onSubmit={(e) => {
              e.preventDefault()
              registrar('datos', 'leccion')
            }}
          >
            <p>Para confirmar, escribí tu clave de acceso. No se guarda ni se envía.</p>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" className="sim-boton">
              Confirmar
            </button>
          </form>
        )}
      </main>
    )
  }

  if (ficha.canal === 'sms') {
    return (
      <main className="sim-pagina sim-sms">
        <header className="sms-barra">{ficha.remitente || 'Mensaje'}</header>
        <p className="sms-burbuja">
          {cuerpoConLink(ficha.cuerpo, token)}
        </p>
        {paso === 'cebo' && (
          <button type="button" className="sms-link" onClick={() => registrar('clic', 'datos')}>
            Abrir aviso
          </button>
        )}
        {paso === 'datos' && (
          <form
            className="sms-form"
            onSubmit={(e) => {
              e.preventDefault()
              registrar('datos', 'leccion')
            }}
          >
            <p>Ingresá el código de seguimiento. No se guarda.</p>
            <input
              type="text"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" className="sim-boton">
              Enviar
            </button>
          </form>
        )}
      </main>
    )
  }

  return (
    <main className="sim-pagina sim-mail">
      <p className="mail-de">De: {ficha.remitente}</p>
      <h1>{ficha.asunto}</h1>
      <p>{cuerpoConLink(ficha.cuerpo, token)}</p>
      {paso === 'cebo' && (
        <button type="button" className="sim-boton" onClick={() => registrar('clic', 'datos')}>
          Acceder
        </button>
      )}
      {paso === 'datos' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            registrar('datos', 'leccion')
          }}
        >
          <p>Acceso corporativo. Lo que escribas no se guarda.</p>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="Contraseña"
            autoComplete="off"
          />
          <button type="submit" className="sim-boton">
            Ingresar
          </button>
        </form>
      )}
    </main>
  )
}

export default Simulacion
