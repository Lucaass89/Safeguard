import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { etiquetaRol, fotoDe, metodosDe } from '../lib/cuentaUsuario.js'
import { codigoValido, formatoCodigo, minutosRestantes, normalizarCodigo, textoVinculo } from '../lib/familia.js'
import { nombreEmpresa } from '../lib/formato.js'
import { leerVistas } from '../lib/lecciones.js'
import { estadoLista, leerHechas } from '../lib/listaSeguridad.js'
import { calcularLogros, resumenLogros } from '../lib/logros.js'
import { usePortapapeles } from '../lib/portapapeles.js'
import { nivelProteccion } from '../lib/proteccion.js'
import { leerRacha, textoRacha } from '../lib/racha.js'
import { textoInvitacion } from '../lib/reportesPropios.js'
import { supabase } from '../lib/supabase.js'
import { textoEstado } from '../lib/avisos.js'
import { useTotalesPropios } from '../lib/useAnalisisPropios.js'
import { useActualizacion } from '../lib/useActualizacion.js'
import { appParaAvisos, useAvisos } from '../lib/useAvisos.js'
import { useDosPasos } from '../lib/useDosPasos.js'
import { esAdministrador, useMembresia } from '../lib/useMembresia.js'
import { useSesion } from '../lib/useSesion.js'
import PanelPerfil from './PanelPerfil.jsx'
import MisReportes from '../components/MisReportes.jsx'
import './PerfilApp.css'

const TRAZOS = {
  escudo: ['M12 3.5 19 6.4v5.2c0 4.2-2.7 7.1-7 8.9-4.3-1.8-7-4.7-7-8.9V6.4L12 3.5Z', 'm9.2 12.1 1.9 1.9 3.7-4'],
  campana: ['M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5h-14l1.5-1.5Z', 'M10 20h4'],
  familia: ['M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z', 'M16.5 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z', 'M3.5 19c.6-3 2.3-4.5 4.5-4.5s3.9 1.5 4.5 4.5', 'M13.5 15.2c.8-.5 1.8-.7 3-.7 2 0 3.4 1.4 3.9 4.5'],
  bandera: ['M6 21V4', 'M6 4.5h11l-2 3.5 2 3.5H6'],
  pincel: ['M12 3.5a8.5 8.5 0 1 0 0 17c1 0 1.5-.7 1.5-1.5 0-1.3-1-1.7-1-3 0-1 .8-1.8 1.8-1.8h1.7a4.5 4.5 0 0 0 4.5-4.5C20.5 6.3 16.7 3.5 12 3.5Z', 'M7.5 11h.01M10 7.5h.01M14.5 7.5h.01'],
  datos: ['M5 6.5c0-1.4 3.1-2.5 7-2.5s7 1.1 7 2.5-3.1 2.5-7 2.5-7-1.1-7-2.5Z', 'M5 6.5v11c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-11', 'M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5'],
  ayuda: ['M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z', 'M9.6 9.4a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.9', 'M12 16.5h.01'],
  compartir: ['M8 12.5 16 8M8 11.5l8 4.5', 'M18 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM18 20.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z'],
  celular: ['M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5Z', 'M11 17.5h2'],
  persona: ['M12 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', 'M5 20c1-3.5 3.6-5.2 7-5.2s6 1.7 7 5.2'],
  salir: ['M10 7V5.5A1.5 1.5 0 0 1 11.5 4h6A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 10 18.5V17', 'M13 12H4M6.5 9.5 4 12l2.5 2.5'],
  flecha: ['m9 5 7 7-7 7'],
  atras: ['m15 5-7 7 7 7'],
  empresa: ['M4 20V6.5A1.5 1.5 0 0 1 5.5 5H11v15', 'M11 9.5h7.5A1.5 1.5 0 0 1 20 11V20', 'M4 20h16M7.5 8.5h1.5M7.5 12h1.5M14 13h1.5M14 16.5h1.5'],
}

function Icono({ nombre }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {(TRAZOS[nombre] ?? []).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

function iniciales(nombre, correo) {
  const partes = (nombre || '').trim().split(/\s+/).filter(Boolean)
  const base = partes.length >= 2 ? `${partes[0][0]}${partes.at(-1)[0]}` : partes[0] || correo.split('@')[0] || '·'
  return base.slice(0, 2).toUpperCase()
}

function useEmpresa(organizacionId) {
  const [nombre, setNombre] = useState(undefined)
  useEffect(() => {
    if (!organizacionId) return undefined
    let activo = true
    supabase
      .from('organizaciones')
      .select('nombre_empresa')
      .eq('id', organizacionId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (activo) setNombre(error ? undefined : nombreEmpresa(data?.nombre_empresa) || null)
      })
    return () => {
      activo = false
    }
  }, [organizacionId])
  return organizacionId ? nombre : undefined
}

function useResumenCuenta(usuarioId) {
  const [resumen, setResumen] = useState({ reportes: null, familia: null })
  useEffect(() => {
    let activo = true
    Promise.all([
      supabase
        .from('safelink_reportes')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId)
        .then(({ count, error }) => (error ? null : count ?? 0)),
      supabase.rpc('familia_mis_vinculos').then(({ data, error }) => (error ? null : data ?? [])),
    ]).then(([reportes, familia]) => {
      if (activo) setResumen({ reportes, familia })
    })
    return () => {
      activo = false
    }
  }, [usuarioId])
  return resumen
}

function TarjetaCuenta({ usuario, membresia, empresa, dosPasos }) {
  const meta = usuario.user_metadata ?? {}
  const nombre = (meta.full_name || meta.name || '').trim()
  const foto = fotoDe(usuario)
  const [fotoRota, setFotoRota] = useState(false)
  const metodos = metodosDe(usuario)
  const rol = membresia.pertenece ? etiquetaRol(membresia.rol) : null

  return (
    <section className="pa-cuenta" aria-labelledby="pa-nombre">
      {foto && !fotoRota ? (
        <img className="pa-foto" src={foto} alt="" referrerPolicy="no-referrer" onError={() => setFotoRota(true)} />
      ) : (
        <span className="pa-foto pa-iniciales" aria-hidden="true">
          {iniciales(nombre, usuario.email ?? '')}
        </span>
      )}
      <div className="pa-cuenta-texto">
        <h1 id="pa-nombre">{nombre || 'Tu perfil'}</h1>
        <p>{usuario.email}</p>
        <ul className="pa-chips">
          {rol ? <li>{empresa ? `${rol} · ${empresa}` : rol}</li> : null}
          {metodos?.google ? <li>Entrás con Google</li> : metodos?.clave ? <li>Entrás con contraseña</li> : null}
          {dosPasos === 'activar' || dosPasos === 'listo' || dosPasos === 'codigo' ? (
            <li className={dosPasos === 'activar' ? 'pa-chip-falta' : 'pa-chip-bien'}>
              {dosPasos === 'activar' ? 'Dos pasos: falta' : 'Dos pasos: activa'}
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  )
}

function Anillo({ porcentaje }) {
  const radio = 34
  const largo = 2 * Math.PI * radio
  return (
    <svg className="pa-anillo" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r={radio} className="pa-anillo-fondo" />
      <circle
        cx="40"
        cy="40"
        r={radio}
        className="pa-anillo-avance"
        strokeDasharray={largo}
        strokeDashoffset={largo * (1 - porcentaje / 100)}
      />
      <text x="40" y="46" textAnchor="middle" className="pa-anillo-texto">
        {porcentaje}%
      </text>
    </svg>
  )
}

function Proteccion({ nivel }) {
  return (
    <section className="pa-proteccion" aria-labelledby="pa-proteccion-titulo">
      <Anillo porcentaje={nivel.porcentaje} />
      <div>
        <h2 id="pa-proteccion-titulo">{nivel.frase}</h2>
        <p className="visualmente-oculto">Nivel de protección: {nivel.porcentaje} por ciento.</p>
        {nivel.proximo ? (
          <>
            <p>Lo que más suma ahora: {nivel.proximo.consejo}</p>
            <Link className="pa-boton" to={nivel.proximo.to}>
              {nivel.proximo.accion}
            </Link>
          </>
        ) : (
          <p>Tenés todo lo importante activado.</p>
        )}
      </div>
    </section>
  )
}

function Actividad({ totales, racha, logros }) {
  return (
    <section className="pa-actividad" aria-labelledby="pa-actividad-titulo">
      <div className="pa-fila-titulo">
        <h2 id="pa-actividad-titulo">Lo que revisaste</h2>
        <Link to="/safelink">Ver historial</Link>
      </div>
      <ul className="pa-luces">
        <li className="pa-luz pa-luz-verde">
          <strong>{totales.seguros}</strong>
          <span>Seguros</span>
        </li>
        <li className="pa-luz pa-luz-amarillo">
          <strong>{totales.dudosos}</strong>
          <span>Precaución</span>
        </li>
        <li className="pa-luz pa-luz-rojo">
          <strong>{totales.peligrosos}</strong>
          <span>Peligrosos</span>
        </li>
      </ul>
      <p className="pa-actividad-pie">
        {[textoRacha(racha), resumenLogros(logros)].filter(Boolean).join(' · ')}
      </p>
    </section>
  )
}

function FilaMenu({ to, icono, titulo, nota, alerta = false, onClick }) {
  const contenido = (
    <>
      <span className={alerta ? 'pa-menu-icono pa-menu-icono-alerta' : 'pa-menu-icono'}>
        <Icono nombre={icono} />
      </span>
      <span className="pa-menu-texto">
        <strong>{titulo}</strong>
        {nota ? <span>{nota}</span> : null}
      </span>
      <span className="pa-menu-ir">
        <Icono nombre="flecha" />
      </span>
    </>
  )
  return (
    <li>
      {to ? (
        <Link className="pa-menu-fila" to={to}>
          {contenido}
        </Link>
      ) : (
        <button type="button" className="pa-menu-fila" onClick={onClick}>
          {contenido}
        </button>
      )}
    </li>
  )
}

function PerfilApp() {
  const { sesion } = useSesion()
  const usuario = sesion.user
  const navegar = useNavigate()
  const membresia = useMembresia()
  const empresa = useEmpresa(membresia.pertenece ? membresia.organizacionId : null)
  const admin = membresia.pertenece && esAdministrador(membresia.rol)
  const { estado: dosPasos } = useDosPasos()
  const avisos = useAvisos()
  const app = appParaAvisos()
  const portapapeles = usePortapapeles()
  const actualizacion = useActualizacion()
  const totales = useTotalesPropios()
  const [racha] = useState(() => leerRacha())
  const [hechas] = useState(() => leerHechas())
  const [vistas] = useState(() => leerVistas())
  const [invitado, setInvitado] = useState('')
  const [saliendo, setSaliendo] = useState(false)
  const { reportes, familia } = useResumenCuenta(usuario.id)
  const dosPasosListo = dosPasos === 'activar' || dosPasos === 'listo' || dosPasos === 'codigo'

  const lista = estadoLista(hechas, { portapapeles: portapapeles.preferencia === 'si' })
  const nivel = nivelProteccion({
    dosPasos: dosPasosListo ? dosPasos !== 'activar' : null,
    avisos: app === 'lista' ? avisos.activos && avisos.permiso === 'si' : app === 'vieja' ? false : null,
    portapapeles: portapapeles.disponible ? portapapeles.preferencia === 'si' : null,
    app: actualizacion.enApp && actualizacion.instalada > 0 && actualizacion.ultima ? !actualizacion.hayNueva : null,
    listaListas: lista.listas,
    listaTotal: lista.total,
  })
  const logros = calcularLogros({
    peligrosos: totales.peligrosos,
    total: totales.total,
    mejorRacha: racha.mejor,
    listaCompleta: lista.completa,
    lecciones: vistas.length,
  })

  async function invitar() {
    const texto = textoInvitacion(usuario.user_metadata?.full_name)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SafeGuard', text: texto })
        return
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(texto)
      setInvitado('Copiamos el mensaje: pegalo en WhatsApp.')
    } catch {
      setInvitado('No se pudo compartir desde acá.')
    }
  }

  async function salir() {
    setSaliendo(true)
    await supabase.auth.signOut()
    navegar('/', { replace: true })
  }

  const vinculos = Array.isArray(familia) ? familia.length : 0

  return (
    <div className="pa">
      <TarjetaCuenta usuario={usuario} membresia={membresia} empresa={empresa} dosPasos={dosPasos} />

      {admin && empresa === null ? (
        <Link className="pa-alerta" to="/phishguard/empresa">
          <Icono nombre="empresa" />
          <span>
            <strong>Completá los datos de tu empresa</strong>
            <span>Tu empresa todavía no tiene nombre cargado.</span>
          </span>
        </Link>
      ) : null}

      <Proteccion nivel={nivel} />
      <Actividad totales={totales} racha={racha} logros={logros} />

      <nav aria-label="Ajustes">
        <ul className="pa-menu">
          <FilaMenu
            to="/perfil/seguridad"
            icono="escudo"
            titulo="Seguridad"
            nota={dosPasos === 'activar' ? 'Falta la verificación en dos pasos' : dosPasosListo ? 'Dos pasos activa · Sesiones abiertas' : 'Dos pasos y sesiones abiertas'}
            alerta={dosPasos === 'activar'}
          />
          <FilaMenu
            to="/perfil/avisos"
            icono="campana"
            titulo="Avisos al celular"
            nota={app === 'lista' ? textoEstado(avisos) : app === 'pwa' ? 'Necesitan la app de Android' : 'Actualizá la app para recibirlos'}
          />
          <FilaMenu
            to="/perfil/familia"
            icono="familia"
            titulo="Cuidar a un familiar"
            nota={vinculos > 0 ? `${vinculos} ${vinculos === 1 ? 'persona vinculada' : 'personas vinculadas'}` : 'Avisale a alguien si revisás algo peligroso'}
          />
          <FilaMenu
            to="/perfil/reportes"
            icono="bandera"
            titulo="Mis reportes"
            nota={reportes === null ? 'Lo que nos avisaste' : `${reportes} ${reportes === 1 ? 'reporte' : 'reportes'}`}
          />
          <FilaMenu to="/perfil/apariencia" icono="pincel" titulo="Apariencia" nota="Tema y enlaces copiados" />
          <FilaMenu to="/perfil/datos" icono="datos" titulo="Tus datos y privacidad" nota="Exportar, política y términos" />
          {actualizacion.enApp ? (
            <FilaMenu
              to="/perfil/version"
              icono="celular"
              titulo="Versión de la app"
              nota={actualizacion.hayNueva ? `Hay una nueva: ${actualizacion.ultima.nombre}` : actualizacion.esWeb ? 'App web · Bajá la de Android' : 'Estás al día'}
              alerta={actualizacion.hayNueva}
            />
          ) : null}
          <FilaMenu to="/perfil/ayuda" icono="ayuda" titulo="Ayuda" nota="¿Te pasó algo? Contacto" />
          <FilaMenu icono="compartir" titulo="Invitar a alguien" nota={invitado || 'Mandale SafeGuard por WhatsApp'} onClick={invitar} />
          <FilaMenu to="/perfil/cuenta" icono="persona" titulo="Cuenta" nota="Nombre y eliminar la cuenta" />
        </ul>
      </nav>

      <button type="button" className="pa-salir" onClick={salir} disabled={saliendo} aria-busy={saliendo}>
        <Icono nombre="salir" />
        {saliendo ? 'Cerrando…' : 'Cerrar sesión'}
      </button>
    </div>
  )
}

function Familia() {
  const [vinculos, setVinculos] = useState(null)
  const [codigo, setCodigo] = useState(null)
  const [escrito, setEscrito] = useState('')
  const [aviso, setAviso] = useState('')
  const [version, setVersion] = useState(0)
  const [ahora, setAhora] = useState(() => Date.now())
  const reloj = useRef(null)

  useEffect(() => {
    let activo = true
    supabase.rpc('familia_mis_vinculos').then(({ data, error }) => {
      if (activo) setVinculos(error ? [] : data ?? [])
    })
    return () => {
      activo = false
    }
  }, [version])

  useEffect(() => {
    if (!codigo) return undefined
    reloj.current = window.setInterval(() => setAhora(Date.now()), 30000)
    return () => window.clearInterval(reloj.current)
  }, [codigo])

  async function crearCodigo() {
    setAviso('')
    const { data, error } = await supabase.rpc('familia_crear_codigo')
    if (error) {
      setAviso(error.message || 'No se pudo crear el código.')
      return
    }
    const fila = Array.isArray(data) ? data[0] : data
    setAhora(Date.now())
    setCodigo(fila)
  }

  async function aceptar(evento) {
    evento.preventDefault()
    if (!codigoValido(escrito)) {
      setAviso('El código tiene 6 letras y números, por ejemplo ABC-234.')
      return
    }
    const { data, error } = await supabase.rpc('familia_aceptar', { p_codigo: normalizarCodigo(escrito) })
    if (error) {
      setAviso(error.message || 'No se pudo usar el código.')
      return
    }
    setEscrito('')
    setAviso(`Listo: ahora cuidás a ${data}. Si revisa algo peligroso, te avisamos al celular.`)
    setVersion((valor) => valor + 1)
  }

  async function quitar(vinculo) {
    const { error } = await supabase.rpc('familia_quitar', { p_otro: vinculo.otro_id })
    setAviso(error ? 'No se pudo quitar. Probá de nuevo.' : `Quitaste a ${vinculo.nombre}.`)
    setVersion((valor) => valor + 1)
  }

  const restante = codigo ? minutosRestantes(codigo.vence, new Date(ahora)) : 0

  return (
    <div className="pa-familia">
      <p className="pa-intro">
        Si alguien de tu familia revisa algo que da <strong>rojo</strong>, quien lo cuida recibe un aviso al celular con
        el sitio, para llamarlo a tiempo. No se comparte nada más: ni el historial ni los mensajes.
      </p>

      <section className="pa-caja" aria-labelledby="pa-familia-cuidar">
        <h2 id="pa-familia-cuidar">Quiero que me cuiden</h2>
        <p>Creá un código y pasáselo a la persona de confianza. Vence a los 30 minutos.</p>
        {codigo && restante > 0 ? (
          <p className="pa-codigo">
            <strong>{formatoCodigo(codigo.codigo)}</strong>
            <span>Vence en {restante} {restante === 1 ? 'minuto' : 'minutos'}</span>
          </p>
        ) : (
          <button type="button" className="pa-boton" onClick={crearCodigo}>
            Crear un código
          </button>
        )}
      </section>

      <section className="pa-caja" aria-labelledby="pa-familia-cuido">
        <h2 id="pa-familia-cuido">Quiero cuidar a alguien</h2>
        <form className="pa-codigo-form" onSubmit={aceptar}>
          <label htmlFor="pa-codigo-campo">Escribí el código que te pasó</label>
          <div>
            <input
              id="pa-codigo-campo"
              value={formatoCodigo(escrito)}
              onChange={(evento) => setEscrito(normalizarCodigo(evento.target.value))}
              placeholder="ABC-234"
              autoComplete="off"
              autoCapitalize="characters"
              inputMode="text"
              maxLength={7}
            />
            <button type="submit" className="pa-boton" disabled={!codigoValido(escrito)}>
              Usar
            </button>
          </div>
        </form>
        <p className="pa-nota">Para recibir los avisos, activá Avisos al celular en la app de Android.</p>
      </section>

      {aviso ? (
        <p className="pa-aviso" role="status">
          {aviso}
        </p>
      ) : null}

      {vinculos && vinculos.length > 0 ? (
        <section className="pa-caja" aria-labelledby="pa-familia-lista">
          <h2 id="pa-familia-lista">Tus vínculos</h2>
          <ul className="pa-vinculos">
            {vinculos.map((vinculo) => (
              <li key={`${vinculo.rol}-${vinculo.otro_id}`}>
                <span>
                  <strong>{vinculo.nombre}</strong>
                  <span>{textoVinculo(vinculo)}</span>
                </span>
                <button type="button" className="pa-quitar" onClick={() => quitar(vinculo)}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function Ayuda() {
  return (
    <ul className="pa-menu">
      <FilaMenu to="/" icono="ayuda" titulo="¿Te pasó algo?" nota="En Inicio, qué hacer si tocaste un enlace o pasaste datos" />
      <FilaMenu to="/personas" icono="escudo" titulo="Cómo funciona SafeLink" nota="Los colores y qué revisa" />
      <FilaMenu to="/contacto" icono="bandera" titulo="Contanos un problema" nota="Si algo de la app no anda" />
      <FilaMenu to="/privacidad" icono="datos" titulo="Privacidad" nota="Qué guardamos y para qué" />
    </ul>
  )
}

const SECCIONES = {
  seguridad: 'Seguridad',
  avisos: 'Avisos al celular',
  familia: 'Cuidar a un familiar',
  reportes: 'Mis reportes',
  apariencia: 'Apariencia',
  datos: 'Tus datos y privacidad',
  version: 'Versión de la app',
  ayuda: 'Ayuda',
  cuenta: 'Cuenta',
}

export function PerfilSeccionApp() {
  const { seccion } = useParams()
  if (!SECCIONES[seccion]) return <Navigate to="/perfil" replace />

  const propia = { reportes: <MisReportes />, familia: <Familia />, ayuda: <Ayuda /> }[seccion]

  return (
    <div className="pa pa-sub">
      <Link className="pa-volver" to="/perfil">
        <Icono nombre="atras" />
        Perfil
      </Link>
      {propia ? <h1 className="pa-sub-titulo">{SECCIONES[seccion]}</h1> : null}
      {propia ?? <PanelPerfil variante="app" seccion={seccion} />}
    </div>
  )
}

export default PerfilApp
