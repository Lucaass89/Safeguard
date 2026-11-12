import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { armarRegistro } from '../lib/registroSimulacion.js'
import { supabase } from '../lib/supabase.js'
import './Simulacion.css'

const TIENDAS = new Set(['TIENDA', 'MERCADOLIBRE'])

function esTienda(categoria) {
  return TIENDAS.has(categoria)
}

function cuerpoConLink(texto, token) {
  const link = `${window.location.origin}/simulacion/${token}`
  return (texto ?? '').replaceAll('{link}', link)
}

function MarcoTienda({ children }) {
  return (
    <div className="tienda">
      <header className="tienda-barra">
        <p className="tienda-marca">vitrina</p>
        <p className="tienda-buscar" aria-hidden="true">Buscar productos, marcas y más…</p>
      </header>
      <main className="tienda-cuerpo">{children}</main>
    </div>
  )
}

function Tienda({ paso, onCuenta, onPagar }) {
  const [cuenta, setCuenta] = useState({ nombre: '', mail: '', clave: '' })
  const [compra, setCompra] = useState('no')

  if (paso === 'cuenta') {
    return (
      <MarcoTienda>
        <form
          className="tienda-caja"
          onSubmit={(evento) => {
            evento.preventDefault()
            const escrito = `${cuenta.nombre}\n${cuenta.mail}\n${cuenta.clave}`
            setCuenta({ nombre: '', mail: '', clave: '' })
            onCuenta(escrito)
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
          <button type="submit" className="tienda-boton">Crear cuenta</button>
          <button type="button" className="pago-boton tienda-pagar" onClick={onPagar}>
            Pagar con Billetera Vitrina
          </button>
        </form>
      </MarcoTienda>
    )
  }

  if (paso === 'producto' && compra === 'no') {
    return (
      <MarcoTienda>
        <article className="tienda-producto">
          <div className="tienda-foto" aria-hidden="true">
            <span />
            <span />
          </div>
          <div>
            <p className="tienda-estado">Nuevo · 3 disponibles</p>
            <h1>Auriculares inalámbricos SoundPro</h1>
            <p className="tienda-precio">$ 45.999</p>
            <p className="tienda-envio">Llega mañana a tu domicilio</p>
            <button type="button" className="tienda-boton" onClick={() => setCompra('medio')}>
              Comprar ahora
            </button>
            <button type="button" className="pago-boton tienda-pagar" onClick={onPagar}>
              Pagar con Billetera Vitrina
            </button>
          </div>
        </article>
      </MarcoTienda>
    )
  }

  if (paso === 'producto' && compra === 'medio') {
    return (
      <div className="pago">
        <header className="pago-barra">
          <p className="pago-marca">Billetera Vitrina</p>
        </header>
        <main className="pago-cuerpo">
          <section className="pago-caja">
            <h1>Medio de pago</h1>
            <p>Auriculares inalámbricos SoundPro · $ 45.999</p>
            <label className="pago-opcion">
              <input type="radio" name="medio" checked onChange={() => {}} />
              <span>Billetera Vitrina</span>
            </label>
            <button type="button" className="pago-boton" onClick={onPagar}>
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
      if (data.capacitado || (esTienda(data.categoria) && data.ingreso_datos)) setPaso('leccion')
      else if (esTienda(data.categoria)) setPaso('producto')
      else if (data.hizo_clic) setPaso('datos')
      supabase.rpc('phishguard_registrar', armarRegistro(token, 'abrio'))
    })
    return () => {
      activo = false
    }
  }, [token])

  function avisarCaida() {
    return supabase.functions.invoke('phishguard-avisar-caida', { body: { token } }).then(
      () => {},
      () => {},
    )
  }

  async function registrar(evento, siguiente, escrito = '') {
    const { data, error: fallo } = await supabase.rpc(
      'phishguard_registrar',
      armarRegistro(token, evento, escrito),
    )
    if (fallo) {
      setError(fallo.message)
      return
    }
    if (data) setFicha(data)
    setPaso(siguiente)
    if (evento === 'clic' || evento === 'datos') avisarCaida()
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
        {esTienda(ficha.categoria) && (
          <p>
            La tienda y la billetera de esta página eran inventadas. Una tienda real no te pide crear una
            cuenta ni pagar desde un aviso que llegó por mail.
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

  if (esTienda(ficha.categoria)) {
    return (
      <Tienda
        paso={paso}
        onCuenta={(escrito) => registrar('clic', 'producto', escrito)}
        onPagar={async () => {
          const { error: fallo } = await supabase.rpc(
            'phishguard_registrar',
            armarRegistro(token, 'clic'),
          )
          if (fallo) {
            setError(fallo.message)
            return
          }
          avisarCaida()
          setPaso('leccion')
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
              registrar('datos', 'leccion', clave)
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
              registrar('datos', 'leccion', clave)
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
            registrar('datos', 'leccion', clave)
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
