import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase.js'
import { useSesion } from '../lib/useSesion.js'
import './Panel.css'

function nombreInicial(usuario) {
  const meta = usuario.user_metadata ?? {}
  const nombre = (meta.full_name || meta.name || '').trim()
  if (!nombre || nombre === usuario.email) return ''
  return nombre
}

function PanelPerfil() {
  const { sesion } = useSesion()
  const usuario = sesion.user
  const navegar = useNavigate()
  const [nombre, setNombre] = useState(() => nombreInicial(usuario))
  const [guardado, setGuardado] = useState(() => nombreInicial(usuario))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [confirmacion, setConfirmacion] = useState('')
  const [borrando, setBorrando] = useState(false)
  const [errorBorrar, setErrorBorrar] = useState(null)
  const [exportando, setExportando] = useState(false)
  const [errorExportar, setErrorExportar] = useState(null)
  const dialogo = useRef(null)
  const campoConfirmar = useRef(null)
  const disparador = useRef(null)
  const cambio = nombre.trim() !== guardado
  const correo = usuario.email ?? ''
  const puedeBorrar = confirmacion.trim().toLowerCase() === correo.trim().toLowerCase() && correo !== ''

  useEffect(() => {
    if (!modalAbierto) return undefined
    const nodo = dialogo.current
    nodo?.showModal()
    campoConfirmar.current?.focus()
    return () => {
      if (nodo?.open) nodo.close()
    }
  }, [modalAbierto])

  function alEscribir(evento) {
    setNombre(evento.target.value)
    setError(null)
    setAviso(null)
  }

  function abrirBorrado() {
    disparador.current = document.activeElement
    setConfirmacion('')
    setErrorBorrar(null)
    setModalAbierto(true)
  }

  function cerrarBorrado() {
    if (borrando) return
    setModalAbierto(false)
    disparador.current?.focus?.()
  }

  async function guardar(evento) {
    evento.preventDefault()
    setError(null)
    setAviso(null)

    const limpio = nombre.trim()
    if (!limpio) {
      setError('Escribí el nombre con el que querés que te salude el panel.')
      return
    }

    setGuardando(true)
    const { error: fallo } = await supabase.auth.updateUser({
      data: { full_name: limpio, name: limpio },
    })
    setGuardando(false)

    if (fallo) {
      setError('No se pudo guardar el nombre. Probá de nuevo en un momento.')
      return
    }

    setNombre(limpio)
    setGuardado(limpio)
    setAviso('Listo. Así te vamos a saludar cuando entres.')
  }

  async function exportar() {
    setErrorExportar(null)
    setExportando(true)

    const [analisis, reportes] = await Promise.all([
      supabase
        .from('safelink_analisis')
        .select('url_analizada, dominio, nivel_riesgo, explicacion, puntuacion_riesgo, entrada, fecha_analisis')
        .order('fecha_analisis', { ascending: false }),
      supabase
        .from('safelink_reportes')
        .select('dominio, motivo, estado, cierre, origin_type, fecha_reporte')
        .order('fecha_reporte', { ascending: false }),
    ])

    setExportando(false)

    if (analisis.error || reportes.error) {
      setErrorExportar('No se pudieron exportar tus datos. Probá de nuevo en un momento.')
      return
    }

    const datos = {
      cuenta: {
        id: usuario.id,
        correo,
        nombre: nombreInicial(usuario) || null,
        creado_en: usuario.created_at,
      },
      analisis: analisis.data ?? [],
      reportes: reportes.data ?? [],
    }
    const archivo = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(archivo)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = 'safeguard-mis-datos.json'
    enlace.click()
    URL.revokeObjectURL(url)
  }

  async function eliminarCuenta(evento) {
    evento.preventDefault()
    if (!puedeBorrar || borrando) return

    setErrorBorrar(null)
    setBorrando(true)
    const { error: fallo } = await supabase.functions.invoke('eliminar-cuenta', { method: 'POST' })
    if (fallo) {
      setBorrando(false)
      setErrorBorrar('No se pudo eliminar la cuenta. Probá de nuevo en un momento.')
      return
    }

    sessionStorage.removeItem('sg-recibido')
    sessionStorage.removeItem(`sg-acceso:${usuario.id}`)
    await supabase.auth.signOut({ scope: 'local' })
    navegar('/')
  }

  return (
    <div className="panel panel-personas perfil">
      <header className="panel-header">
        <span className="panel-tag">Cuenta</span>
        <h1>Tu perfil</h1>
        <p className="panel-lead">El nombre es el que ves al entrar al panel.</p>
      </header>

      <form className="panel-form panel-pieza" onSubmit={guardar}>
        <label className="panel-campo">
          <span>Nombre</span>
          <input
            type="text"
            value={nombre}
            onChange={alEscribir}
            autoComplete="name"
            required
          />
        </label>
        <label className="panel-campo">
          <span>Correo</span>
          <span className="perfil-correo">
            <input
              type="email"
              value={usuario.email ?? ''}
              readOnly
              aria-readonly="true"
              aria-describedby="perfil-correo-ayuda"
            />
            <svg className="perfil-candado" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
        </label>
        <p id="perfil-correo-ayuda" className="perfil-nota">
          El correo es el de la cuenta con la que entraste.
        </p>
        <div aria-live="polite">
          {error && <p className="panel-error">{error}</p>}
          {aviso && <p className="panel-aviso">{aviso}</p>}
        </div>
        <button type="submit" className="panel-boton" disabled={!cambio || guardando} aria-busy={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </form>

      <section className="panel-seccion perfil-peligro" aria-labelledby="perfil-peligro-titulo">
        <h2 id="perfil-peligro-titulo">Zona de peligro</h2>
        <p>Estas acciones son definitivas.</p>
        <div className="perfil-peligro-fila">
          <div>
            <h3>Exportar mis datos</h3>
            <p>Un archivo con tu cuenta, tus análisis y tus reportes.</p>
          </div>
          <button type="button" className="panel-boton-borde" onClick={exportar} disabled={exportando}>
            {exportando ? 'Exportando…' : 'Exportar'}
          </button>
        </div>
        <div className="perfil-peligro-fila">
          <div>
            <h3>Eliminar cuenta</h3>
            <p>
              Se borra tu cuenta y el historial de SafeLink. La empresa y sus campañas quedan.
            </p>
          </div>
          <button type="button" className="perfil-borrar" onClick={abrirBorrado}>
            Eliminar cuenta
          </button>
        </div>
        <div aria-live="polite">
          {errorExportar && <p className="panel-error">{errorExportar}</p>}
        </div>
      </section>

      {modalAbierto && (
        <dialog
          ref={dialogo}
          className="perfil-modal"
          aria-modal="true"
          aria-labelledby="perfil-borrar-titulo"
          aria-describedby="perfil-borrar-texto"
          onCancel={(evento) => {
            evento.preventDefault()
            cerrarBorrado()
          }}
        >
          <form onSubmit={eliminarCuenta}>
            <h2 id="perfil-borrar-titulo">Eliminar cuenta</h2>
            <p id="perfil-borrar-texto">
              Se borra tu historial de SafeLink y no se puede deshacer. La empresa, si tenés una, no se toca.
              Escribí tu correo para confirmar.
            </p>
            <label className="panel-campo">
              <span>Correo</span>
              <input
                ref={campoConfirmar}
                type="email"
                value={confirmacion}
                onChange={(evento) => setConfirmacion(evento.target.value)}
                autoComplete="off"
                aria-describedby="perfil-borrar-texto"
              />
            </label>
            <div aria-live="polite">
              {errorBorrar && <p className="panel-error">{errorBorrar}</p>}
            </div>
            <div className="perfil-modal-acciones">
              <button type="button" className="panel-boton-borde" onClick={cerrarBorrado} disabled={borrando}>
                Cancelar
              </button>
              <button type="submit" className="perfil-borrar" disabled={!puedeBorrar || borrando} aria-busy={borrando}>
                {borrando ? 'Eliminando…' : 'Eliminar mi cuenta'}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </div>
  )
}

export default PanelPerfil
