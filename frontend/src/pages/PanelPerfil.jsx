import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase.js'
import { useMembresia } from '../lib/useMembresia.js'
import { useSesion } from '../lib/useSesion.js'
import './Panel.css'

const AVISO_UNICO_ADMIN =
  'Sos el único administrador de tu empresa. Asigná a otra persona como administrador antes de eliminar tu cuenta.'

const ROLES = {
  Admin_Principal: 'Administrador principal',
  Tecnico: 'Técnico',
}

function textoEliminar(pertenece) {
  if (pertenece) return 'Se borra tu cuenta y tu historial. La empresa y sus campañas quedan.'
  if (pertenece === false) return 'Se borra tu cuenta y todo tu historial de SafeLink.'
  return null
}

function iniciales(nombre, correo) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  const base = partes.length >= 2
    ? `${partes[0][0]}${partes[partes.length - 1][0]}`
    : (partes[0] || correo.split('@')[0] || '')
  return base.slice(0, 2).toUpperCase() || '·'
}

function metodosDe(usuario) {
  const identidades = Array.isArray(usuario.identities) ? usuario.identities : null
  const proveedores = identidades
    ? identidades.map((identidad) => identidad.provider)
    : usuario.app_metadata?.providers
  if (!Array.isArray(proveedores)) return null

  const unicos = [...new Set(proveedores.filter((proveedor) => typeof proveedor === 'string'))]
  return {
    clave: unicos.includes('email'),
    google: unicos.includes('google'),
    otros: unicos.filter((proveedor) => proveedor !== 'email' && proveedor !== 'google'),
  }
}

function textoMetodo(metodos) {
  if (!metodos) return null
  const partes = []
  if (metodos.clave) partes.push('correo y contraseña')
  if (metodos.google) partes.push('Google')
  partes.push(...metodos.otros)
  if (partes.length === 0) return null
  if (partes.length === 1) return `Entrás con ${partes[0]}.`
  const ultimo = partes[partes.length - 1]
  return `Entrás con ${partes.slice(0, -1).join(', ')} y con ${ultimo}.`
}

function PerfilActividad({ usuarioId }) {
  const [conteos, setConteos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError(false)

    Promise.all([
      supabase
        .from('safelink_analisis')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId),
      supabase
        .from('safelink_reportes')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId),
    ]).then(([analisis, reportes]) => {
      if (!activo) return
      if (analisis.error || reportes.error) {
        setError(true)
        setConteos(null)
        setCargando(false)
        return
      }
      setConteos({
        analisis: analisis.count ?? 0,
        reportes: reportes.count ?? 0,
      })
      setCargando(false)
    })

    return () => {
      activo = false
    }
  }, [usuarioId, intento])

  const vacio = conteos && conteos.analisis === 0 && conteos.reportes === 0

  return (
    <section className="ajuste perfil-actividad" aria-labelledby="perfil-actividad-titulo" aria-busy={cargando}>
      <div className="ajuste-cabeza">
        <h2 id="perfil-actividad-titulo">Tu actividad</h2>
        <p>Lo que revisaste y reportaste con SafeLink.</p>
      </div>
      <div className="ajuste-cuerpo">
        {cargando && <p className="perfil-estado">Cargando tu actividad…</p>}
        {!cargando && error && (
          <>
            <p className="panel-error">No pudimos leer tu actividad. Probá de nuevo en un momento.</p>
            <button type="button" className="panel-boton-borde" onClick={() => setIntento((valor) => valor + 1)}>
              Reintentar
            </button>
          </>
        )}
        {!cargando && !error && vacio && (
          <p className="perfil-estado">Todavía no hay análisis ni reportes.</p>
        )}
        {!cargando && !error && conteos && !vacio && (
          <ul className="perfil-cifras">
            <li>
              <strong>{conteos.analisis}</strong>
              <span>Análisis</span>
            </li>
            <li>
              <strong>{conteos.reportes}</strong>
              <span>Reportes</span>
            </li>
          </ul>
        )}
        {!cargando && !error && (
          <Link className="perfil-historial" to="/panel/enlaces">Ver historial</Link>
        )}
      </div>
    </section>
  )
}

function PerfilOrganizacion({ organizacionId, rol }) {
  const [nombre, setNombre] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [intento, setIntento] = useState(0)
  const etiqueta = ROLES[rol] ?? (typeof rol === 'string' && rol.trim() ? rol.trim() : null)

  useEffect(() => {
    if (!organizacionId) return undefined
    let activo = true
    setCargando(true)
    setError(false)

    supabase
      .from('organizaciones')
      .select('nombre_empresa')
      .eq('id', organizacionId)
      .maybeSingle()
      .then(({ data, error: fallo }) => {
        if (!activo) return
        if (fallo) {
          setError(true)
          setNombre(null)
          setCargando(false)
          return
        }
        setNombre((data?.nombre_empresa ?? '').trim())
        setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [organizacionId, intento])

  return (
    <section className="ajuste perfil-org" aria-labelledby="perfil-org-titulo" aria-busy={cargando}>
      <div className="ajuste-cabeza">
        <h2 id="perfil-org-titulo">Organización</h2>
        <p>La empresa de PhishGuard a la que pertenece tu cuenta.</p>
      </div>
      <div className="ajuste-cuerpo">
        {cargando && <p className="perfil-estado">Cargando tu empresa…</p>}
        {!cargando && error && (
          <>
            <p className="panel-error">No pudimos cargar tu empresa. Probá de nuevo en un momento.</p>
            <button type="button" className="panel-boton-borde" onClick={() => setIntento((valor) => valor + 1)}>
              Reintentar
            </button>
          </>
        )}
        {!cargando && !error && (
          <dl className="perfil-ficha">
            <div>
              <dt>Empresa</dt>
              <dd>{nombre || 'Esta empresa no tiene nombre cargado.'}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{etiqueta ? <span className="perfil-rol">{etiqueta}</span> : 'No hay un rol cargado.'}</dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  )
}

function PerfilSeguridad({ usuario }) {
  const navegar = useNavigate()
  const metodos = metodosDe(usuario)
  const texto = textoMetodo(metodos)
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [confirmarCierre, setConfirmarCierre] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [errorCerrar, setErrorCerrar] = useState(null)
  const dialogo = useRef(null)
  const disparador = useRef(null)

  useEffect(() => {
    if (!confirmarCierre) return undefined
    const nodo = dialogo.current
    nodo?.showModal()
    return () => {
      if (nodo?.open) nodo.close()
    }
  }, [confirmarCierre])

  function abrirCierre() {
    disparador.current = document.activeElement
    setErrorCerrar(null)
    setConfirmarCierre(true)
  }

  function cerrarDialogo() {
    if (cerrando) return
    setConfirmarCierre(false)
    disparador.current?.focus?.()
  }

  async function cambiarClave(evento) {
    evento.preventDefault()
    setError(null)
    setAviso(null)

    if (nueva.length < 6) {
      setError('La contraseña tiene que tener al menos 6 caracteres.')
      return
    }
    if (nueva !== confirmar) {
      setError('La confirmación no coincide con la contraseña nueva.')
      return
    }
    if (nueva === actual) {
      setError('La contraseña nueva tiene que ser distinta de la actual.')
      return
    }

    setGuardando(true)
    const { error: falloActual } = await supabase.auth.signInWithPassword({
      email: usuario.email,
      password: actual,
    })
    if (falloActual) {
      setGuardando(false)
      setError('La contraseña actual no coincide.')
      return
    }

    const { error: falloNueva } = await supabase.auth.updateUser({ password: nueva })
    setGuardando(false)
    if (falloNueva) {
      setError('No se pudo cambiar la contraseña. Probá de nuevo en un momento.')
      return
    }

    setActual('')
    setNueva('')
    setConfirmar('')
    setAviso('Listo. La próxima vez entrá con la contraseña nueva.')
  }

  async function cerrarEnTodos() {
    if (cerrando) return
    setErrorCerrar(null)
    setCerrando(true)
    sessionStorage.removeItem('sg-recibido')
    sessionStorage.removeItem(`sg-acceso:${usuario.id}`)
    const { error: fallo } = await supabase.auth.signOut({ scope: 'global' })
    if (fallo) {
      setCerrando(false)
      setErrorCerrar('No se pudo cerrar la sesión. Probá de nuevo en un momento.')
      return
    }
    navegar('/ingresar?aviso=sesion', { replace: true })
  }

  return (
    <section className="ajuste perfil-seguridad" aria-labelledby="perfil-seguridad-titulo">
      <div className="ajuste-cabeza">
        <h2 id="perfil-seguridad-titulo">Seguridad</h2>
        <p>{texto ?? 'No pudimos ver cómo entrás a la cuenta.'}</p>
      </div>
      <div className="ajuste-cuerpo">
        {metodos?.clave && (
          <form className="perfil-clave" onSubmit={cambiarClave}>
            <h3>Cambiar contraseña</h3>
            <label className="panel-campo">
              <span>Contraseña actual</span>
              <input
                type="password"
                value={actual}
                onChange={(evento) => setActual(evento.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <label className="panel-campo">
              <span>Contraseña nueva</span>
              <input
                type="password"
                value={nueva}
                onChange={(evento) => setNueva(evento.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>
            <label className="panel-campo">
              <span>Confirmación</span>
              <input
                type="password"
                value={confirmar}
                onChange={(evento) => setConfirmar(evento.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>
            <div aria-live="polite">
              {error && <p className="panel-error">{error}</p>}
              {aviso && <p className="panel-aviso">{aviso}</p>}
            </div>
            <button type="submit" className="panel-boton" disabled={guardando} aria-busy={guardando}>
              {guardando ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </form>
        )}
        <div className="perfil-fila">
          <div>
            <h3>Cerrar sesión en todos los dispositivos</h3>
            <p>Salís de SafeGuard en este navegador y en los demás.</p>
          </div>
          <button type="button" className="panel-boton-borde" onClick={abrirCierre}>
            Cerrar sesión
          </button>
        </div>
        {confirmarCierre && (
          <dialog
            ref={dialogo}
            className="perfil-dialogo"
            aria-modal="true"
            aria-labelledby="perfil-cierre-titulo"
            aria-describedby="perfil-cierre-texto"
            onCancel={(evento) => {
              evento.preventDefault()
              cerrarDialogo()
            }}
          >
            <h2 id="perfil-cierre-titulo">Cerrar sesión en todos lados</h2>
            <p id="perfil-cierre-texto">
              Vas a salir de SafeGuard en este dispositivo y en los demás. Después tenés que volver a entrar.
            </p>
            <div aria-live="polite">
              {errorCerrar && <p className="panel-error">{errorCerrar}</p>}
            </div>
            <div className="perfil-modal-acciones">
              <button type="button" className="panel-boton-borde" onClick={cerrarDialogo} disabled={cerrando}>
                Cancelar
              </button>
              <button type="button" className="panel-boton" onClick={cerrarEnTodos} disabled={cerrando} aria-busy={cerrando}>
                {cerrando ? 'Cerrando…' : 'Cerrar sesión'}
              </button>
            </div>
          </dialog>
        )}
      </div>
    </section>
  )
}

function nombreInicial(usuario) {
  const meta = usuario.user_metadata ?? {}
  const nombre = (meta.full_name || meta.name || '').trim()
  if (!nombre || nombre === usuario.email) return ''
  return nombre
}

function PanelPerfil() {
  const { sesion } = useSesion()
  const { pertenece, cargando: cargandoMembresia, rol, organizacionId, unicoAdmin } = useMembresia()
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
  const textoBorrar = textoEliminar(pertenece)
  const bloqueado = unicoAdmin === true

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

  async function mensajeBorrado(fallo) {
    const respuesta = fallo?.context
    if (respuesta && typeof respuesta.json === 'function') {
      try {
        const cuerpo = await respuesta.json()
        if (cuerpo?.codigo === 'unico_admin') return AVISO_UNICO_ADMIN
      } catch {
        /* el cuerpo no era json */
      }
    }
    return 'No se pudo eliminar la cuenta. Probá de nuevo en un momento.'
  }

  async function eliminarCuenta(evento) {
    evento.preventDefault()
    if (!puedeBorrar || borrando || bloqueado) return

    setErrorBorrar(null)
    setBorrando(true)
    const { error: fallo } = await supabase.functions.invoke('eliminar-cuenta', { method: 'POST' })
    if (fallo) {
      setBorrando(false)
      setErrorBorrar(await mensajeBorrado(fallo))
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
        <span className="perfil-avatar" aria-hidden="true">{iniciales(nombre, correo)}</span>
        <h1>Tu perfil</h1>
      </header>

      <section className="ajuste perfil-cuenta" aria-labelledby="perfil-cuenta-titulo">
        <div className="ajuste-cabeza">
          <h2 id="perfil-cuenta-titulo">Cuenta</h2>
          <p>El nombre es el que ves al entrar al panel.</p>
        </div>
        <form className="ajuste-cuerpo" onSubmit={guardar}>
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
      </section>

      <PerfilActividad usuarioId={usuario.id} />
      {pertenece && <PerfilOrganizacion organizacionId={organizacionId} rol={rol} />}
      <PerfilSeguridad usuario={usuario} />

      <section className="ajuste perfil-datos" aria-labelledby="perfil-datos-titulo">
        <div className="ajuste-cabeza">
          <h2 id="perfil-datos-titulo">Tus datos</h2>
          <p>Un archivo con tu cuenta, tus análisis y tus reportes.</p>
        </div>
        <div className="ajuste-cuerpo">
          <button type="button" className="panel-boton-borde" onClick={exportar} disabled={exportando}>
            {exportando ? 'Exportando…' : 'Exportar mis datos'}
          </button>
          <div aria-live="polite">
            {errorExportar && <p className="panel-error">{errorExportar}</p>}
          </div>
        </div>
      </section>

      <section className="ajuste perfil-peligro" aria-labelledby="perfil-peligro-titulo">
        <div className="ajuste-cabeza">
          <h2 id="perfil-peligro-titulo">Zona de peligro</h2>
          <p>Estas acciones son definitivas.</p>
        </div>
        <div className="ajuste-cuerpo">
          <div className="perfil-fila">
            <div>
              <h3>Eliminar cuenta</h3>
              {textoBorrar && <p>{textoBorrar}</p>}
            </div>
            <button
              type="button"
              className="perfil-borrar"
              onClick={abrirBorrado}
              disabled={cargandoMembresia || bloqueado}
              aria-describedby={bloqueado ? 'perfil-unico-admin' : undefined}
            >
              Eliminar cuenta
            </button>
          </div>
          {bloqueado && (
            <p id="perfil-unico-admin" className="panel-error perfil-bloqueo">
              {AVISO_UNICO_ADMIN}
            </p>
          )}
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
              {textoBorrar} No se puede deshacer. Escribí tu correo para confirmar.
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
