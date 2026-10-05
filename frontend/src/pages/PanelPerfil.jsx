import { useState } from 'react'
import TemaControl from '../components/TemaControl.jsx'
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
  const [nombre, setNombre] = useState(() => nombreInicial(usuario))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

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
    setAviso('Listo. Así te vamos a saludar cuando entres.')
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
            onChange={(evento) => setNombre(evento.target.value)}
            autoComplete="name"
            required
          />
        </label>
        <label className="panel-campo">
          <span>Correo</span>
          <input type="email" value={usuario.email ?? ''} readOnly />
        </label>
        <p className="perfil-nota">El correo es el de la cuenta con la que entraste.</p>
        {error && <p className="panel-error">{error}</p>}
        {aviso && <p className="panel-aviso">{aviso}</p>}
        <button type="submit" className="panel-boton" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </form>

      <section className="panel-seccion perfil-apariencia">
        <h2>Apariencia</h2>
        <p>Elegí si SafeGuard se ve claro u oscuro en este navegador.</p>
        <TemaControl />
      </section>
    </div>
  )
}

export default PanelPerfil
