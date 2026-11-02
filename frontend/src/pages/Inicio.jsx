import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import DiferenciaDominio, { DominioMarcado } from '../components/DiferenciaDominio.jsx'
import FilaActividad, { ListaActividad } from '../components/FilaActividad.jsx'
import { agruparActividad } from '../lib/agruparActividad.js'
import { analizar, motivosLimpios, queHacer } from '../lib/analisis.js'
import { guardarAnalisis, revisarEnlace, revisarWhatsapp } from '../lib/enriquecer.js'
import { registrarRespuesta } from '../lib/entrenamiento.js'
import { versionApp } from '../lib/esAppNativa.js'
import { CANALES, elegirMensaje, marcarVisto } from '../lib/estafaOReal.js'
import { edicionVigente, fechaLegible } from '../lib/estafasSemana.js'
import { elegirPortapapeles, olvidarCopiado, usePortapapeles } from '../lib/portapapeles.js'
import { useAnalisisPropios, useResumenSemana } from '../lib/useAnalisisPropios.js'
import { useCampanas } from '../lib/useCampanas.js'
import { esAdministrador, useMembresia } from '../lib/useMembresia.js'
import { useSesion } from '../lib/useSesion.js'
import './Inicio.css'

const VEREDICTOS = {
  verde: { titulo: 'Seguro', icono: 'bien' },
  amarillo: { titulo: 'Sospechoso', icono: 'regular' },
  rojo: { titulo: 'Peligroso', icono: 'riesgo' },
  gris: { titulo: 'No pudimos verificarlo', icono: 'duda' },
}

function Icono({ nombre }) {
  const trazo = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (nombre === 'qr') {
    return (
      <svg {...trazo}>
        <path d="M4.5 8.5V6.2A1.7 1.7 0 0 1 6.2 4.5H8.5" />
        <path d="M15.5 4.5h2.3A1.7 1.7 0 0 1 19.5 6.2V8.5" />
        <path d="M19.5 15.5v2.3a1.7 1.7 0 0 1-1.7 1.7H15.5" />
        <path d="M8.5 19.5H6.2a1.7 1.7 0 0 1-1.7-1.7V15.5" />
        <path d="M7.5 12h9" />
      </svg>
    )
  }

  if (nombre === 'flecha') {
    return (
      <svg {...trazo}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    )
  }

  if (nombre === 'bien') {
    return (
      <svg {...trazo}>
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12.2 2.3 2.3 4.7-5" />
      </svg>
    )
  }

  if (nombre === 'regular') {
    return (
      <svg {...trazo}>
        <path d="M12 4.5 20 19H4L12 4.5Z" />
        <path d="M12 10v4.2" />
        <path d="M12 16.8h.01" />
      </svg>
    )
  }

  if (nombre === 'riesgo') {
    return (
      <svg {...trazo}>
        <circle cx="12" cy="12" r="8" />
        <path d="m9 9 6 6M15 9l-6 6" />
      </svg>
    )
  }

  if (nombre === 'duda') {
    return (
      <svg {...trazo}>
        <circle cx="12" cy="12" r="8" />
        <path d="M9.8 9.6a2.3 2.3 0 0 1 4.4.9c0 1.5-2.2 2-2.2 3.3" />
        <path d="M12 16.8h.01" />
      </svg>
    )
  }

  if (nombre === 'equipo') {
    return (
      <svg {...trazo}>
        <circle cx="8" cy="9" r="2.2" />
        <circle cx="16" cy="9" r="2.2" />
        <path d="M4.8 17.2c.7-2 2.2-3 4-3s3.3 1 4 3M12.8 17.2c.5-1.4 1.6-2.3 3.2-2.3 1.8 0 3.3 1 4 3" />
      </svg>
    )
  }

  return (
    <svg {...trazo}>
      <path d="M10 13.5 13.5 10" />
      <path d="M8.2 11.4 6.8 12.8a3.2 3.2 0 0 0 4.5 4.5l1.4-1.4" />
      <path d="M15.8 12.6 17.2 11.2a3.2 3.2 0 0 0-4.5-4.5L11.3 8.1" />
    </svg>
  )
}

function FilaEquipo() {
  const { sesion } = useSesion()
  const membresia = useMembresia()
  const admin = Boolean(sesion) && !membresia.cargando && esAdministrador(membresia.rol)
  const { campanas } = useCampanas(admin ? membresia.organizacionId : null)
  const ultima = campanas[0]

  if (!ultima || ultima.enviados === 0) return null

  return (
    <Link className="inicio-equipo" to="/phishguard">
      <span className="inicio-equipo-icono">
        <Icono nombre="equipo" />
      </span>
      <span className="inicio-equipo-texto">
        Tu equipo: {ultima.completaron} de {ultima.enviados} completaron la simulación
      </span>
      <span className="inicio-ir" aria-hidden="true">
        <Icono nombre="flecha" />
      </span>
    </Link>
  )
}

function TarjetaEstafas({ edicion }) {
  return (
    <section className="inicio-estafas" aria-labelledby="inicio-estafas-titulo">
      <div className="inicio-estafas-cabeza">
        <h2 id="inicio-estafas-titulo">Estafas de la semana</h2>
        <p>
          En Argentina · Actualizado el <time dateTime={edicion.fecha}>{fechaLegible(edicion.fecha)}</time>
        </p>
      </div>
      <ul className="inicio-estafas-lista">
        {edicion.estafas.map((estafa) => (
          <li key={estafa.id} className="inicio-estafa">
            <details>
              <summary>
                <span className="inicio-estafa-quien">
                  {estafa.quien} · {estafa.canal}
                </span>
                <strong>{estafa.titulo}</strong>
              </summary>
              <div className="inicio-estafa-cuerpo">
                <p className="inicio-estafa-etiqueta">Mensaje de ejemplo</p>
                <blockquote className="inicio-estafa-ejemplo">{estafa.ejemplo}</blockquote>
                <p className="inicio-estafa-etiqueta">Qué mirar</p>
                <ul className="inicio-estafa-mirar">
                  {estafa.mirar.map((punto) => (
                    <li key={punto}>{punto}</li>
                  ))}
                </ul>
              </div>
            </details>
            <p className="inicio-estafa-fuente">
              Fuente:{' '}
              <a href={estafa.fuente.url} target="_blank" rel="noopener noreferrer">
                {estafa.fuente.nombre}
              </a>
              , <time dateTime={estafa.fuente.fecha}>{fechaLegible(estafa.fuente.fecha)}</time>
            </p>
          </li>
        ))}
      </ul>
      {versionApp() >= 2 ? (
        <p className="inicio-estafas-nota">
          ¿Te llegó uno parecido? En WhatsApp, mantené apretado el mensaje y tocá ⋮ → Compartir → SafeGuard.
        </p>
      ) : null}
    </section>
  )
}

function EstafaOReal() {
  const [mensaje, setMensaje] = useState(() => elegirMensaje())
  const [acerto, setAcerto] = useState(null)
  const [foco, setFoco] = useState(null)
  const explicacion = useRef(null)
  const primerBoton = useRef(null)
  const respondio = acerto !== null
  const safelink = respondio && mensaje.enlace ? analizar(mensaje.enlace) : null

  useEffect(() => {
    if (foco === 'explicacion') {
      explicacion.current?.focus({ preventScroll: true })
      explicacion.current?.parentElement.scrollIntoView({ block: 'nearest' })
    }
    if (foco === 'pregunta') {
      primerBoton.current?.focus({ preventScroll: true })
      primerBoton.current?.closest('.inicio-juego').scrollIntoView({ block: 'start' })
    }
  }, [foco, mensaje.id])

  function responder(dijoEstafa) {
    if (respondio) return
    const bien = dijoEstafa === mensaje.estafa
    setAcerto(bien)
    setFoco('explicacion')
    marcarVisto(mensaje.id)
    registrarRespuesta(mensaje.id, bien)
  }

  function otro() {
    setMensaje(elegirMensaje(undefined, mensaje.id))
    setAcerto(null)
    setFoco('pregunta')
  }

  const resultado = mensaje.estafa
    ? acerto
      ? 'Bien visto: era una estafa.'
      : 'Era una estafa.'
    : acerto
      ? 'Bien visto: era real.'
      : 'Era real.'

  return (
    <section className="inicio-juego" aria-labelledby="inicio-juego-titulo">
      <div className="inicio-juego-cabeza">
        <h2 id="inicio-juego-titulo">¿Estafa o real?</h2>
        <p>Mirá el mensaje y elegí. La explicación aparece al toque.</p>
      </div>
      <figure className="inicio-juego-mensaje">
        <figcaption>
          <span className="inicio-juego-canal">{CANALES[mensaje.canal]}</span>
          <strong>{mensaje.remitente}</strong>
          {mensaje.asunto ? <span className="inicio-juego-asunto">{mensaje.asunto}</span> : null}
        </figcaption>
        <p>{mensaje.texto}</p>
      </figure>
      {respondio ? (
        <div className={`inicio-juego-explicacion inicio-juego-${mensaje.estafa ? 'estafa' : 'real'}`}>
          <h3 ref={explicacion} tabIndex={-1}>
            {resultado}
          </h3>
          <p className="inicio-juego-leccion">{mensaje.leccion.titulo}</p>
          <p>{mensaje.leccion.cuerpo}</p>
          {safelink ? (
            <p className="inicio-juego-safelink">
              SafeLink marca <span className="inicio-juego-enlace">{mensaje.enlace}</span> como{' '}
              <strong>{VEREDICTOS[safelink.nivel]?.titulo}</strong>. {motivosLimpios(safelink.motivos)[0]}
            </p>
          ) : null}
          <button type="button" className="inicio-juego-otro" onClick={otro}>
            Otro mensaje
          </button>
        </div>
      ) : (
        <div className="inicio-juego-botones">
          <button ref={primerBoton} type="button" className="inicio-juego-boton" onClick={() => responder(true)}>
            Estafa
          </button>
          <button type="button" className="inicio-juego-boton" onClick={() => responder(false)}>
            Real
          </button>
        </div>
      )}
    </section>
  )
}

function Veredicto({ resultado, guardado, onOtro }) {
  const titulo = useRef(null)
  const veredicto = VEREDICTOS[resultado.nivel] ?? VEREDICTOS.gris
  const motivos = motivosLimpios(resultado.motivos)
  const diferencia =
    resultado.diferencia && motivos.includes(resultado.diferencia.frase) ? resultado.diferencia : null

  useEffect(() => {
    titulo.current?.focus()
  }, [resultado.id])

  return (
    <section
      className={`inicio-veredicto inicio-veredicto-${resultado.nivel}`}
      aria-labelledby="inicio-veredicto-titulo"
    >
      <div className="inicio-veredicto-cabeza">
        <span className="inicio-veredicto-icono">
          <Icono nombre={veredicto.icono} />
        </span>
        <div className="inicio-veredicto-nombre">
          <h2 id="inicio-veredicto-titulo" ref={titulo} tabIndex={-1}>
            {veredicto.titulo}
          </h2>
          <p className="inicio-veredicto-dominio">
            {diferencia ? (
              <DominioMarcado tramos={diferencia.visto} />
            ) : resultado.dominio === 'whatsapp' ? (
              'Mensaje sin enlaces'
            ) : (
              (resultado.dominioDestino ?? resultado.dominio)
            )}
          </p>
        </div>
      </div>
      {diferencia ? <DiferenciaDominio diferencia={diferencia} /> : null}
      <p className="inicio-veredicto-consejo">{queHacer(resultado.nivel)}</p>
      {motivos.length > 0 ? (
        <ul className="inicio-veredicto-motivos">
          {motivos.map((motivo) => (
            <li key={motivo}>{motivo}</li>
          ))}
        </ul>
      ) : null}
      {guardado === false ? (
        <p className="inicio-veredicto-nota">No se pudo guardar en tu historial.</p>
      ) : null}
      <button type="button" className="inicio-veredicto-otro" onClick={onOtro}>
        Revisar otro
      </button>
    </section>
  )
}

function Inicio() {
  const { sesion, cargando: cargandoSesion } = useSesion()
  const campoEnlace = useRef(null)
  const [enlace, setEnlace] = useState('')
  const [aviso, setAviso] = useState('')
  const [analizando, setAnalizando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [guardado, setGuardado] = useState(null)
  const actividad = useAnalisisPropios({ limite: 20 })
  const resumen = useResumenSemana()
  const portapapeles = usePortapapeles()
  const [parametros, setParametros] = useSearchParams()
  const compartido = parametros.get('compartido')
  const [estafas] = useState(() => edicionVigente())

  async function ejecutar(que, trabajo, entrada, texto = null) {
    setAviso('')
    setResultado(null)
    setGuardado(null)
    setAnalizando(que)

    let final
    try {
      final = await trabajo()
    } catch {
      final = null
    }
    setAnalizando(false)
    if (!final) {
      setAviso(`No se pudo revisar el ${que}. Probá de nuevo en un rato.`)
      return
    }
    setResultado({ ...final, id: crypto.randomUUID() })

    if (!sesion) return
    const { error } = await guardarAnalisis(sesion, final, entrada, texto)
    setGuardado(!error)
    if (error) return
    actividad.recargar()
    resumen.recargar()
  }

  function revisarDireccion(valor) {
    setEnlace(valor)
    return ejecutar('enlace', () => revisarEnlace(valor), 'web')
  }

  function revisar(evento) {
    evento.preventDefault()
    if (analizando) return
    const valor = enlace.trim()
    if (!valor) {
      setAviso('Pegá una dirección para revisarla.')
      return
    }
    if (!analizar(valor)) {
      setAviso('Eso no parece un enlace. Probá con algo como ejemplo.com/promo')
      return
    }
    revisarDireccion(valor)
  }

  function revisarCopiado() {
    const valor = portapapeles.enlace
    olvidarCopiado()
    if (valor) revisarDireccion(valor)
  }

  const alCompartir = useEffectEvent((texto) => {
    setParametros({}, { replace: true })
    const limpio = texto.trim()
    if (!/\s/.test(limpio) && analizar(limpio)) {
      revisarDireccion(limpio)
      return
    }
    setEnlace('')
    ejecutar('mensaje', () => revisarWhatsapp(limpio), 'whatsapp', limpio)
  })

  useEffect(() => {
    if (cargandoSesion || !compartido?.trim()) return undefined
    const espera = window.setTimeout(() => alCompartir(compartido), 0)
    return () => window.clearTimeout(espera)
  }, [compartido, cargandoSesion])

  function revisarOtro() {
    setResultado(null)
    setGuardado(null)
    setEnlace('')
    campoEnlace.current?.focus()
  }

  return (
    <div className="inicio">
      {resumen.texto && actividad.items.length > 0 ? <p className="inicio-resumen">{resumen.texto}</p> : null}
      <FilaEquipo />

      <form className="inicio-revisar" onSubmit={revisar}>
        <div className="inicio-campo">
          <label className="inicio-etiqueta" htmlFor="inicio-enlace">
            Pegá un enlace para revisarlo
          </label>
          <input
            ref={campoEnlace}
            id="inicio-enlace"
            type="text"
            name="enlace"
            value={enlace}
            onChange={(evento) => {
              setEnlace(evento.target.value)
              if (aviso) setAviso('')
              if (resultado) setResultado(null)
            }}
            placeholder="ejemplo.com/promo"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            inputMode="url"
            enterKeyHint="go"
          />
          <Link className="inicio-qr" to="/safelink/qr" aria-label="Escanear un QR">
            <Icono nombre="qr" />
          </Link>
          <button
            type="submit"
            className="inicio-enviar"
            aria-label={analizando ? 'Revisando el enlace' : 'Revisar el enlace'}
            aria-busy={analizando}
            disabled={analizando}
          >
            {analizando ? <span className="inicio-girando" aria-hidden="true" /> : <Icono nombre="flecha" />}
          </button>
        </div>
      </form>
      {aviso ? <p className="inicio-aviso">{aviso}</p> : null}
      {analizando ? (
        <p className="inicio-revisando" role="status">
          Revisando el {analizando}…
        </p>
      ) : null}
      {portapapeles.enlace && !analizando && !resultado ? (
        <section className="inicio-copiado" aria-labelledby="inicio-copiado-titulo">
          <h2 id="inicio-copiado-titulo">Copiaste un enlace, ¿lo revisamos?</h2>
          <p className="inicio-copiado-enlace">{portapapeles.enlace}</p>
          <div className="inicio-copiado-acciones">
            <button type="button" className="inicio-copiado-si" onClick={revisarCopiado}>
              Revisar
            </button>
            <button type="button" className="inicio-copiado-no" onClick={olvidarCopiado}>
              No, gracias
            </button>
          </div>
        </section>
      ) : null}
      {portapapeles.disponible && !portapapeles.preferencia && !analizando && !resultado ? (
        <section className="inicio-copiado" aria-labelledby="inicio-ofrecer-titulo">
          <h2 id="inicio-ofrecer-titulo">¿Te avisamos cuando copies un enlace?</h2>
          <p>
            Al abrir SafeGuard, miramos si copiaste un enlace y te ofrecemos revisarlo. Android te avisa cada vez
            que se lee lo copiado. Lo podés cambiar en Perfil.
          </p>
          <div className="inicio-copiado-acciones">
            <button type="button" className="inicio-copiado-si" onClick={() => elegirPortapapeles(true)}>
              Activar
            </button>
            <button type="button" className="inicio-copiado-no" onClick={() => elegirPortapapeles(false)}>
              Ahora no
            </button>
          </div>
        </section>
      ) : null}
      {resultado ? <Veredicto resultado={resultado} guardado={guardado} onOtro={revisarOtro} /> : null}

      <section className="inicio-bloque" aria-labelledby="inicio-actividad">
        <h2 id="inicio-actividad">Actividad reciente</h2>
        {actividad.cargando ? (
          <p className="inicio-vacio">Buscando tus revisiones…</p>
        ) : actividad.error ? (
          <p className="inicio-vacio">No se pudo leer tu actividad. Probá de nuevo en un rato.</p>
        ) : actividad.items.length === 0 ? (
          <p className="inicio-vacio">
            Todavía no revisaste nada. Pegá un enlace arriba y el resultado aparece acá.
          </p>
        ) : (
          <ListaActividad>
            {agruparActividad(actividad.items).map((item) => (
              <FilaActividad key={item.id} item={item} to={item.to} />
            ))}
          </ListaActividad>
        )}
      </section>

      {estafas ? <TarjetaEstafas edicion={estafas} /> : null}
      <EstafaOReal />
    </div>
  )
}

export default Inicio
