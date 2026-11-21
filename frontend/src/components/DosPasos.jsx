import { useId, useState } from 'react'
import {
  codigoValido,
  factoresSinTerminar,
  factoresVerificados,
  limpiarCodigo,
  mensajeError,
  NOMBRE_FACTOR,
  secretoLegible,
} from '../lib/dosPasos.js'
import { supabase } from '../lib/supabase.js'
import { useDosPasos } from '../lib/useDosPasos.js'
import './DosPasos.css'

function imagenQr(qr) {
  if (!qr) return ''
  if (qr.startsWith('data:')) return qr
  return `data:image/svg+xml;utf-8,${encodeURIComponent(qr)}`
}

function CampoCodigo({ id, valor, onCambiar, autoFocus = false }) {
  return (
    <input
      id={id}
      className="dos-pasos-codigo"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={7}
      placeholder="000000"
      value={valor}
      autoFocus={autoFocus}
      onChange={(evento) => onCambiar(limpiarCodigo(evento.target.value))}
    />
  )
}

export function ActivarDosPasos({ onListo, factores }) {
  const id = useId()
  const [alta, setAlta] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function empezar() {
    setError('')
    setOcupado(true)
    for (const viejo of factoresSinTerminar(factores)) {
      await supabase.auth.mfa.unenroll({ factorId: viejo.id })
    }
    const { data, error: fallo } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `${NOMBRE_FACTOR} ${new Date().toISOString().slice(0, 10)}`,
    })
    setOcupado(false)
    if (fallo) {
      setError(mensajeError(fallo))
      return
    }
    setAlta(data)
  }

  async function confirmar(evento) {
    evento.preventDefault()
    if (!codigoValido(codigo) || !alta) {
      setError('Escribí los 6 números que muestra la app.')
      return
    }
    setError('')
    setOcupado(true)
    const { error: fallo } = await supabase.auth.mfa.challengeAndVerify({ factorId: alta.id, code: codigo })
    setOcupado(false)
    if (fallo) {
      setError(mensajeError(fallo))
      setCodigo('')
      return
    }
    onListo?.()
  }

  if (!alta) {
    return (
      <div className="dos-pasos-paso">
        <ol className="dos-pasos-lista">
          <li>Instalá en tu celular una app de códigos: Google Authenticator, Microsoft Authenticator o similar.</li>
          <li>Tocá "Empezar" y escaneá el código QR con esa app.</li>
          <li>Escribí acá los 6 números que te muestra.</li>
        </ol>
        {error && (
          <p className="dos-pasos-error" role="alert">
            {error}
          </p>
        )}
        <button type="button" className="dos-pasos-boton" onClick={empezar} disabled={ocupado}>
          {ocupado ? 'Preparando…' : 'Empezar'}
        </button>
      </div>
    )
  }

  return (
    <form className="dos-pasos-paso" onSubmit={confirmar}>
      <div className="dos-pasos-qr-fila">
        <img className="dos-pasos-qr" src={imagenQr(alta.totp?.qr_code)} alt="Código QR para la app de códigos" width="180" height="180" />
        <div className="dos-pasos-secreto">
          <p>¿No podés escanear? Cargá esta clave a mano en la app:</p>
          <code>{secretoLegible(alta.totp?.secret)}</code>
        </div>
      </div>
      <label className="dos-pasos-etiqueta" htmlFor={`${id}-codigo`}>
        Código de 6 números
      </label>
      <CampoCodigo id={`${id}-codigo`} valor={codigo} onCambiar={setCodigo} autoFocus />
      {error && (
        <p className="dos-pasos-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="dos-pasos-boton" disabled={ocupado}>
        {ocupado ? 'Revisando…' : 'Activar'}
      </button>
    </form>
  )
}

export function PedirCodigo({ factores, onListo }) {
  const id = useId()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const factor = factoresVerificados(factores)[0]

  async function confirmar(evento) {
    evento.preventDefault()
    if (!codigoValido(codigo) || !factor) {
      setError('Escribí los 6 números que muestra la app.')
      return
    }
    setError('')
    setOcupado(true)
    const { error: fallo } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: codigo })
    setOcupado(false)
    if (fallo) {
      setError(mensajeError(fallo))
      setCodigo('')
      return
    }
    onListo?.()
  }

  return (
    <form className="dos-pasos-paso" onSubmit={confirmar}>
      <label className="dos-pasos-etiqueta" htmlFor={`${id}-codigo`}>
        Código de 6 números de tu app
      </label>
      <CampoCodigo id={`${id}-codigo`} valor={codigo} onCambiar={setCodigo} autoFocus />
      {error && (
        <p className="dos-pasos-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="dos-pasos-boton" disabled={ocupado}>
        {ocupado ? 'Revisando…' : 'Confirmar'}
      </button>
      <p className="dos-pasos-ayuda">
        Si perdiste el celular, escribinos desde Contacto con el correo de la cuenta y la desactivamos después de
        confirmar que sos vos.
      </p>
    </form>
  )
}

function DosPasos({ children }) {
  const { estado, factores, recargar } = useDosPasos()

  if (estado === 'listo') return children
  if (estado === 'cargando') return <p className="phish-estado">Revisando la verificación en dos pasos…</p>

  return (
    <section className="dos-pasos" aria-labelledby="dos-pasos-titulo">
      <span className="dos-pasos-escudo" aria-hidden="true" />
      <h1 id="dos-pasos-titulo">
        {estado === 'codigo' ? 'Confirmá que sos vos' : 'Activá la verificación en dos pasos'}
      </h1>
      <p className="dos-pasos-lead">
        {estado === 'codigo'
          ? 'Para entrar a PhishGuard escribí el código que muestra tu app de códigos. Cambia cada 30 segundos.'
          : 'PhishGuard maneja datos de tu equipo, así que pedimos un segundo paso además de la contraseña. Aunque alguien la sepa, no entra sin tu celular. Se configura una sola vez.'}
      </p>
      {estado === 'error' && (
        <p className="dos-pasos-error" role="alert">
          No pudimos revisar la verificación. Recargá la página.
        </p>
      )}
      {estado === 'codigo' && <PedirCodigo factores={factores} onListo={recargar} />}
      {estado === 'activar' && <ActivarDosPasos factores={factores} onListo={recargar} />}
    </section>
  )
}

export function PerfilDosPasos() {
  const { estado, factores, recargar } = useDosPasos()
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function desactivar() {
    const confirma = window.confirm(
      'Si la desactivás, vas a tener que volver a activarla para entrar a PhishGuard. ¿Seguís?',
    )
    if (!confirma) return
    setError('')
    setOcupado(true)
    for (const factor of factoresVerificados(factores)) {
      const { error: fallo } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
      if (fallo) {
        setError(mensajeError(fallo))
        setOcupado(false)
        return
      }
    }
    await supabase.auth.refreshSession()
    setOcupado(false)
    setAbierto(false)
    recargar()
  }

  const nota =
    estado === 'listo' || estado === 'codigo'
      ? 'Está activa: además de la contraseña te pedimos un código de tu app. Es obligatoria para usar PhishGuard.'
      : 'Además de la contraseña, te pedimos un código de una app del celular. Es obligatoria para usar PhishGuard.'

  return (
    <div className="perfil-dos-pasos">
      <div className="fila-ajuste">
        <span className="fila-ajuste-texto">
          <strong className="fila-ajuste-titulo">Verificación en dos pasos</strong>
          <span className="fila-ajuste-nota">{nota}</span>
        </span>
        {estado === 'activar' && !abierto && (
          <button type="button" className="panel-boton" onClick={() => setAbierto(true)}>
            Activar
          </button>
        )}
        {estado === 'listo' && (
          <button type="button" className="panel-boton-borde" onClick={desactivar} disabled={ocupado}>
            {ocupado ? 'Desactivando…' : 'Desactivar'}
          </button>
        )}
        {estado === 'codigo' && !abierto && (
          <button type="button" className="panel-boton-borde" onClick={() => setAbierto(true)}>
            Desactivar
          </button>
        )}
      </div>
      {error && <p className="panel-error">{error}</p>}
      {abierto && estado === 'activar' && (
        <div className="dos-pasos">
          <ActivarDosPasos factores={factores} onListo={() => {
            setAbierto(false)
            recargar()
          }} />
        </div>
      )}
      {abierto && estado === 'codigo' && (
        <div className="dos-pasos">
          <p className="dos-pasos-lead">Para desactivarla, primero confirmá con un código de tu app.</p>
          <PedirCodigo factores={factores} onListo={recargar} />
        </div>
      )}
    </div>
  )
}

export default DosPasos
