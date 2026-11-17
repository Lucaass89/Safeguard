import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { veredictoDe } from '../lib/veredicto.js'
import { analizar, motivosLimpios } from '../lib/analisis.js'
import { consejoDelDia } from '../lib/consejoDelDia.js'
import { registrarRespuesta } from '../lib/entrenamiento.js'
import { versionApp } from '../lib/esAppNativa.js'
import { CANALES, elegirMensaje, marcarVisto } from '../lib/estafaOReal.js'
import { edicionVigente, fechaLegible } from '../lib/estafasSemana.js'
import { alternarEnLista } from '../lib/guardadoLocal.js'
import { leerVistas, marcarVista, ordenarLecciones } from '../lib/lecciones.js'
import { estadoLista, guardarHechas, leerHechas } from '../lib/listaSeguridad.js'
import { calcularLogros, resumenLogros } from '../lib/logros.js'
import { SITUACIONES } from '../lib/mePaso.js'
import { cerrarNovedad, leerCerradas, NOVEDADES, novedadesPendientes } from '../lib/novedades.js'
import { elegirPortapapeles, olvidarCopiado, usePortapapeles } from '../lib/portapapeles.js'
import { guardarRacha, leerRacha, siguienteRacha, textoRacha } from '../lib/racha.js'
import { saludoPara } from '../lib/saludo.js'
import { useResumenSemana, useTotalesPropios } from '../lib/useAnalisisPropios.js'
import { activarAvisos, apagarAvisos, appParaAvisos, useAvisos } from '../lib/useAvisos.js'
import { useActualizacion } from '../lib/useActualizacion.js'
import { guardarJson, leerJson } from '../lib/guardadoLocal.js'
import { BotonActualizar } from '../components/ActualizarApp.jsx'
import { useCampanas } from '../lib/useCampanas.js'
import { esAdministrador, useMembresia } from '../lib/useMembresia.js'
import { useSesion } from '../lib/useSesion.js'
import './Inicio.css'

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

  if (nombre === 'flecha') {
    return (
      <svg {...trazo}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    )
  }

  if (nombre === 'cerrar') {
    return (
      <svg {...trazo}>
        <path d="m6 6 12 12M18 6 6 18" />
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

  if (nombre === 'ayuda') {
    return (
      <svg {...trazo}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="m6 6 3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5" />
      </svg>
    )
  }

  if (nombre === 'tilde') {
    return (
      <svg {...trazo}>
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
    )
  }

  if (nombre === 'libro') {
    return (
      <svg {...trazo}>
        <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H18v14H6.5A1.5 1.5 0 0 0 5 19.5v-14Z" />
        <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H18v-3" />
      </svg>
    )
  }

  return (
    <svg {...trazo}>
      <path d="M12 4v10M12 18h.01" />
    </svg>
  )
}

function Dialogo({ abierto, titulo, onCerrar, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal?.()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog ref={ref} className="inicio-dialogo" aria-label={titulo} onClose={onCerrar}>
      <div className="inicio-dialogo-cabeza">
        <h2>{titulo}</h2>
        <button type="button" className="inicio-dialogo-cerrar" aria-label="Cerrar" onClick={onCerrar}>
          <Icono nombre="cerrar" />
        </button>
      </div>
      {abierto ? children : null}
    </dialog>
  )
}

function OjoHoy({ edicion }) {
  const estafa = edicion?.estafas[0] ?? consejoDelDia()
  const otras = edicion ? edicion.estafas.length - 1 : 0

  return (
    <section className="inicio-ojo" aria-labelledby="inicio-ojo-titulo">
      <p className="inicio-ojo-ceja">
        <Icono nombre="alerta" />
        Ojo hoy
      </p>
      <h2 id="inicio-ojo-titulo">{estafa.titulo}</h2>
      <p className="inicio-ojo-quien">
        {estafa.quien} · {estafa.canal}
      </p>
      <blockquote className="inicio-ojo-ejemplo">{estafa.ejemplo}</blockquote>
      <ul className="inicio-ojo-mirar">
        {estafa.mirar.slice(0, 2).map((punto) => (
          <li key={punto}>{punto}</li>
        ))}
      </ul>
      {otras > 0 ? (
        <a className="inicio-ojo-mas" href="#inicio-estafas">
          Ver las otras {otras} de la semana
        </a>
      ) : null}
    </section>
  )
}

function MePaso() {
  const [abierto, setAbierto] = useState(false)
  const [elegida, setElegida] = useState(null)

  function cerrar() {
    setAbierto(false)
    setElegida(null)
  }

  return (
    <>
      <button type="button" className="inicio-mepaso" onClick={() => setAbierto(true)}>
        <span className="inicio-mepaso-icono">
          <Icono nombre="ayuda" />
        </span>
        <span className="inicio-mepaso-texto">
          <strong>¿Te pasó algo?</strong>
          <span>Si ya tocaste un enlace o pasaste datos, te decimos qué hacer ahora.</span>
        </span>
        <Icono nombre="flecha" />
      </button>
      <Dialogo abierto={abierto} titulo={elegida ? elegida.titulo : '¿Qué pasó?'} onCerrar={cerrar}>
        {elegida ? (
          <div className="inicio-mepaso-pasos">
            <ol>
              {elegida.pasos.map((paso) => (
                <li key={paso}>{paso}</li>
              ))}
            </ol>
            <p className="inicio-mepaso-calma">Le pasa a mucha gente. Lo importante es moverse rápido.</p>
            <button type="button" className="inicio-dialogo-secundario" onClick={() => setElegida(null)}>
              Me pasó otra cosa
            </button>
          </div>
        ) : (
          <ul className="inicio-mepaso-opciones">
            {SITUACIONES.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => setElegida(item)}>
                  {item.titulo}
                  <Icono nombre="flecha" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dialogo>
    </>
  )
}

function ListaSeguridad({ estado, onAlternar }) {
  const avance = Math.round((estado.listas / estado.total) * 100)

  return (
    <section className="inicio-lista" aria-labelledby="inicio-lista-titulo">
      <div className="inicio-lista-cabeza">
        <h2 id="inicio-lista-titulo">Tu cuenta, más segura</h2>
        <span className="inicio-lista-cuenta">
          {estado.listas} de {estado.total}
        </span>
      </div>
      <div
        className="inicio-lista-barra"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={estado.total}
        aria-valuenow={estado.listas}
        aria-label="Avance de la lista"
      >
        <span style={{ width: `${avance}%` }} />
      </div>
      <ul className="inicio-lista-tareas">
        {estado.tareas.map((tarea) => (
          <li key={tarea.id} className={tarea.hecha ? 'inicio-tarea inicio-tarea-hecha' : 'inicio-tarea'}>
            <details>
              <summary>
                <span className="inicio-tarea-marca" aria-hidden="true">
                  {tarea.hecha ? <Icono nombre="tilde" /> : null}
                </span>
                <span>{tarea.titulo}</span>
              </summary>
              <p>{tarea.como}</p>
              {tarea.automatica ? (
                tarea.hecha ? null : (
                  <button type="button" className="inicio-tarea-boton" onClick={() => elegirPortapapeles(true)}>
                    Activarlo
                  </button>
                )
              ) : tarea.id === 'safeguard' ? (
                <div className="inicio-tarea-acciones">
                  <Link className="inicio-tarea-boton" to="/perfil">
                    Ir a Perfil
                  </Link>
                  <button type="button" className="inicio-tarea-boton inicio-tarea-boton-borde" onClick={() => onAlternar(tarea.id)}>
                    {tarea.hecha ? 'Desmarcar' : 'Ya lo hice'}
                  </button>
                </div>
              ) : (
                <button type="button" className="inicio-tarea-boton" onClick={() => onAlternar(tarea.id)}>
                  {tarea.hecha ? 'Desmarcar' : 'Ya lo hice'}
                </button>
              )}
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Lecciones({ vistas, onVista }) {
  const [abierta, setAbierta] = useState(null)
  const [parte, setParte] = useState(0)

  function abrir(leccion) {
    setAbierta(leccion)
    setParte(0)
  }

  function cerrar() {
    setAbierta(null)
  }

  const ultima = abierta && parte === abierta.partes.length - 1

  return (
    <section className="inicio-lecciones" aria-labelledby="inicio-lecciones-titulo">
      <div className="inicio-lista-cabeza">
        <h2 id="inicio-lecciones-titulo">Aprendé en 1 minuto</h2>
        <span className="inicio-lista-cuenta">
          {vistas.length} de {ordenarLecciones(vistas).length}
        </span>
      </div>
      <ul className="inicio-lecciones-lista">
        {ordenarLecciones(vistas).map((leccion) => (
          <li key={leccion.id}>
            <button
              type="button"
              className={vistas.includes(leccion.id) ? 'inicio-leccion inicio-leccion-vista' : 'inicio-leccion'}
              onClick={() => abrir(leccion)}
            >
              <span className="inicio-leccion-icono">
                <Icono nombre={vistas.includes(leccion.id) ? 'tilde' : 'libro'} />
              </span>
              <strong>{leccion.titulo}</strong>
              <span>{vistas.includes(leccion.id) ? 'Vista' : '1 minuto'}</span>
            </button>
          </li>
        ))}
      </ul>
      <Dialogo abierto={Boolean(abierta)} titulo={abierta?.titulo ?? ''} onCerrar={cerrar}>
        {abierta ? (
          <div className="inicio-leccion-cuerpo">
            <p className="inicio-leccion-parte" aria-live="polite">
              {abierta.partes[parte]}
            </p>
            <div className="inicio-leccion-puntos" aria-hidden="true">
              {abierta.partes.map((texto, indice) => (
                <i key={texto} className={indice === parte ? 'inicio-punto-activo' : undefined} />
              ))}
            </div>
            <div className="inicio-leccion-acciones">
              {parte > 0 ? (
                <button type="button" className="inicio-dialogo-secundario" onClick={() => setParte(parte - 1)}>
                  Atrás
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                className="inicio-dialogo-principal"
                onClick={() => {
                  if (!ultima) {
                    setParte(parte + 1)
                    return
                  }
                  onVista(abierta.id)
                  cerrar()
                }}
              >
                {ultima ? 'Listo' : 'Siguiente'}
              </button>
            </div>
          </div>
        ) : null}
      </Dialogo>
    </section>
  )
}

const LUCES = [
  ['verde', 'Seguros'],
  ['amarillo', 'Precaución'],
  ['rojo', 'Peligrosos'],
]

function SemaforoSemana({ conteo, texto }) {
  if (!conteo || conteo.total === 0) return null
  return (
    <div className="inicio-semaforo">
      <h3>Tu semana</h3>
      <ul className="inicio-semaforo-luces">
        {LUCES.map(([nivel, nombre]) => (
          <li key={nivel} className={`inicio-luz inicio-luz-${nivel}`}>
            <strong>{conteo[nivel]}</strong>
            <span>{nombre}</span>
          </li>
        ))}
      </ul>
      {texto ? <p className="inicio-semaforo-texto">{texto}</p> : null}
    </div>
  )
}

function TarjetaEstafas({ edicion }) {
  return (
    <section className="inicio-estafas" id="inicio-estafas" aria-labelledby="inicio-estafas-titulo">
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

function EstafaOReal({ racha, onRacha }) {
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
    const nueva = siguienteRacha(racha, bien)
    onRacha(nueva)
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
        {textoRacha(racha) ? (
          <p className={racha.racha > 0 ? 'inicio-juego-racha inicio-juego-racha-viva' : 'inicio-juego-racha'}>
            {textoRacha(racha)}
          </p>
        ) : null}
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
        <div
          className={`inicio-juego-explicacion inicio-juego-${mensaje.estafa ? 'estafa' : 'real'} ${acerto ? 'inicio-juego-acerto' : 'inicio-juego-erro'}`}
        >
          <h3 ref={explicacion} tabIndex={-1}>
            {resultado}
          </h3>
          <p className="inicio-juego-leccion">{mensaje.leccion.titulo}</p>
          <p>{mensaje.leccion.cuerpo}</p>
          {safelink ? (
            <p className="inicio-juego-safelink">
              SafeLink marca <span className="inicio-juego-enlace">{mensaje.enlace}</span> como{' '}
              <strong>{veredictoDe(safelink).titulo}</strong>. {motivosLimpios(safelink.motivos)[0]}
            </p>
          ) : null}
          <button type="button" className="inicio-juego-otro" onClick={otro}>
            Otro mensaje
          </button>
        </div>
      ) : (
        <div className="inicio-juego-botones">
          <button
            ref={primerBoton}
            type="button"
            className="inicio-juego-boton inicio-juego-boton-estafa"
            onClick={() => responder(true)}
          >
            Estafa
          </button>
          <button type="button" className="inicio-juego-boton inicio-juego-boton-real" onClick={() => responder(false)}>
            Real
          </button>
        </div>
      )}
    </section>
  )
}

function TuProgreso({ resumen, logros }) {
  return (
    <section className="inicio-progreso" aria-labelledby="inicio-progreso-titulo">
      <div className="inicio-lista-cabeza">
        <h2 id="inicio-progreso-titulo">Tu progreso</h2>
        <span className="inicio-lista-cuenta">{resumenLogros(logros)}</span>
      </div>
      <SemaforoSemana conteo={resumen.conteo} texto={resumen.texto} />
      <ul className="inicio-logros">
        {logros.map((logro) => (
          <li key={logro.id} className={logro.logrado ? 'inicio-logro inicio-logro-hecho' : 'inicio-logro'}>
            <span className="inicio-logro-icono" aria-hidden="true">
              {logro.icono}
            </span>
            <span>{logro.titulo}</span>
            <span className="visualmente-oculto">{logro.logrado ? ' (logrado)' : ' (pendiente)'}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function TarjetaEquipo() {
  const { sesion } = useSesion()
  const membresia = useMembresia()
  const admin = Boolean(sesion) && !membresia.cargando && esAdministrador(membresia.rol)
  const { campanas } = useCampanas(admin ? membresia.organizacionId : null)
  const ultima = campanas[0]
  const anterior = campanas[1]

  if (!ultima || ultima.enviados === 0) return null

  const porcentaje = Math.round((ultima.clics / ultima.enviados) * 100)
  const antes = anterior?.enviados ? Math.round((anterior.clics / anterior.enviados) * 100) : null
  const tendencia =
    antes === null ? null : porcentaje < antes ? `Mejoró: antes cayó el ${antes} %` : porcentaje > antes ? `Antes cayó el ${antes} %` : 'Igual que la anterior'

  return (
    <Link className="inicio-equipo-tarjeta" to="/phishguard">
      <span className="inicio-equipo-cabeza">
        <span className="inicio-equipo-icono">
          <Icono nombre="equipo" />
        </span>
        <span>
          <strong>Tu equipo</strong>
          <span>{ultima.nombre}</span>
        </span>
        <Icono nombre="flecha" />
      </span>
      <span className="inicio-equipo-numeros">
        <span>
          <strong>{porcentaje} %</strong>
          <span>cayó</span>
        </span>
        <span>
          <strong>
            {ultima.completaron}/{ultima.enviados}
          </strong>
          <span>completaron</span>
        </span>
      </span>
      {tendencia ? <span className="inicio-equipo-tendencia">{tendencia}</span> : null}
    </Link>
  )
}

function Novedades() {
  const [cerradas, setCerradas] = useState(() => leerCerradas())
  const pendientes = novedadesPendientes(NOVEDADES, cerradas)
  if (pendientes.length === 0) return null

  return (
    <section className="inicio-novedades" aria-labelledby="inicio-novedades-titulo">
      <h2 id="inicio-novedades-titulo">Novedades de SafeGuard</h2>
      <ul>
        {pendientes.map((item) => (
          <li key={item.id} className="inicio-novedad">
            <div>
              <strong>{item.titulo}</strong>
              <p>{item.texto}</p>
            </div>
            <button
              type="button"
              className="inicio-oferta-no"
              aria-label={`Cerrar la novedad: ${item.titulo}`}
              onClick={() => setCerradas(cerrarNovedad(cerradas, item.id))}
            >
              <Icono nombre="cerrar" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function OfertaActualizar() {
  const { ultima, hayNueva } = useActualizacion()
  const [cerrada, setCerrada] = useState(() => leerJson('sg-actualizacion-cerrada', null))
  if (!hayNueva || cerrada === ultima.nombre) return null

  return (
    <section className="inicio-oferta inicio-actualizar" aria-labelledby="inicio-actualizar-titulo">
      <div className="inicio-oferta-texto">
        <h2 id="inicio-actualizar-titulo">Hay una versión nueva de la app ({ultima.nombre})</h2>
        <p>{ultima.novedades || 'Trae mejoras y arreglos.'}</p>
        <BotonActualizar ultima={ultima} className="inicio-actualizar-boton" />
      </div>
      <span />
      <button
        type="button"
        className="inicio-oferta-no"
        aria-label="Ahora no"
        onClick={() => {
          guardarJson('sg-actualizacion-cerrada', ultima.nombre)
          setCerrada(ultima.nombre)
        }}
      >
        <Icono nombre="cerrar" />
      </button>
    </section>
  )
}

function OfertaAvisos() {
  const avisos = useAvisos()
  const app = appParaAvisos()
  if (app === 'web' || avisos.decidido) return null

  if (app === 'vieja') return null

  return (
    <section className="inicio-oferta" aria-labelledby="inicio-avisos-titulo">
      <div className="inicio-oferta-texto">
        <h2 id="inicio-avisos-titulo">¿Te avisamos al celular?</h2>
        <p>Mantenimientos, estafas de la semana y avisos de tu equipo. Lo cambiás en Perfil.</p>
      </div>
      <button type="button" className="inicio-oferta-si" onClick={() => activarAvisos({})}>
        Activar
      </button>
      <button type="button" className="inicio-oferta-no" aria-label="Ahora no" onClick={apagarAvisos}>
        <Icono nombre="cerrar" />
      </button>
    </section>
  )
}

function Inicio() {
  const { sesion } = useSesion()
  const [parametros] = useSearchParams()
  const compartido = parametros.get('compartido')
  const portapapeles = usePortapapeles()
  const resumen = useResumenSemana()
  const totales = useTotalesPropios()
  const [estafas] = useState(() => edicionVigente())
  const [racha, setRacha] = useState(() => leerRacha())
  const [hechas, setHechas] = useState(() => leerHechas())
  const [vistas, setVistas] = useState(() => leerVistas())
  const lista = estadoLista(hechas, { portapapeles: portapapeles.preferencia === 'si' })
  const logros = calcularLogros({
    peligrosos: totales.peligrosos,
    total: totales.total,
    mejorRacha: racha.mejor,
    listaCompleta: lista.completa,
    lecciones: vistas.length,
  })

  if (compartido?.trim()) {
    return <Navigate to={`/safelink?compartido=${encodeURIComponent(compartido)}`} replace />
  }

  function cambiarRacha(nueva) {
    setRacha(nueva)
    guardarRacha(nueva)
  }

  function alternarTarea(id) {
    const nuevas = alternarEnLista(hechas, id)
    setHechas(nuevas)
    guardarHechas(nuevas)
  }

  return (
    <div className="inicio">
      <header className="inicio-saludo-caja">
        <p className="inicio-saludo">{saludoPara(sesion?.user)}</p>
        <h1 className="inicio-saludo-titulo">Esto conviene mirar hoy</h1>
      </header>

      {portapapeles.enlace ? (
        <section className="inicio-oferta" aria-labelledby="inicio-copiado-titulo">
          <div className="inicio-oferta-texto">
            <h2 id="inicio-copiado-titulo">Copiaste un enlace</h2>
            <p className="inicio-copiado-enlace">{portapapeles.enlace}</p>
          </div>
          <Link
            className="inicio-oferta-si"
            to={`/safelink?compartido=${encodeURIComponent(portapapeles.enlace)}`}
            onClick={olvidarCopiado}
          >
            Revisar
          </Link>
          <button type="button" className="inicio-oferta-no" aria-label="No, gracias" onClick={olvidarCopiado}>
            <Icono nombre="cerrar" />
          </button>
        </section>
      ) : null}

      <OfertaActualizar />
      <OfertaAvisos />
      <OjoHoy edicion={estafas} />
      <MePaso />
      <ListaSeguridad estado={lista} onAlternar={alternarTarea} />
      <EstafaOReal racha={racha} onRacha={cambiarRacha} />
      <Lecciones vistas={vistas} onVista={(id) => setVistas(marcarVista(vistas, id))} />
      <TuProgreso resumen={resumen} logros={logros} />
      <TarjetaEquipo />
      {estafas && estafas.estafas.length > 1 ? <TarjetaEstafas edicion={estafas} /> : null}
      <Novedades />
    </div>
  )
}

export default Inicio
