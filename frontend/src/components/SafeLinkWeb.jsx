import { useRef, useState } from 'react'
import { Link } from 'react-router'
import ChipEstado from './ChipEstado.jsx'
import MisReportes from './MisReportes.jsx'
import { agruparActividad, detalleDe } from '../lib/agruparActividad.js'
import { guardarAnalisis } from '../lib/enriquecer.js'
import { buscarEnRevisados, conteoPorNivel, FILTROS_HISTORIAL, horaDe, motivoCorto, partesDeTotales } from '../lib/revisados.js'
import { CANAL_DE, casoDeRevisado, ENTRADA_DE, resumenDe, revisarTipo } from '../lib/revisarSafeLink.js'
import { agruparPorDia, enlaceTraido, filtrarPorNivel, NOMBRE_TIPO, textoProtegido, tipoDeEntrada } from '../lib/safelinkApp.js'
import { borrarAnalisis, useAnalisisPropios, useTotalesPropios } from '../lib/useAnalisisPropios.js'
import { useSesion } from '../lib/useSesion.js'
import { PantallaResultado, Pasos } from '../pages/SafeLink.jsx'
import './SafeLinkWeb.css'

const TRAZOS = {
  pegar: ['M9 4.5h6a1 1 0 0 1 1 1V7H8V5.5a1 1 0 0 1 1-1Z', 'M8 7H6.5A1.5 1.5 0 0 0 5 8.5v10A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 17.5 7H16'],
  pdf: ['M7 3.5h7l4 4V20.5H7v-17Z', 'M14 3.5V8h4', 'M12 11v6M9.5 14.5 12 17l2.5-2.5'],
  qr: ['M4.5 9V6.5a2 2 0 0 1 2-2H9', 'M15 4.5h2.5a2 2 0 0 1 2 2V9', 'M19.5 15v2.5a2 2 0 0 1-2 2H15', 'M9 19.5H6.5a2 2 0 0 1-2-2V15', 'M8 12h8'],
  buscar: ['M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z', 'm15.5 15.5 4 4'],
  otra: ['M19 12a7 7 0 1 1-2.05-4.95', 'M19 4.5V9h-4.5'],
  borrar: ['M5 7h14', 'M9.5 7V5h5v2', 'M7 7l1 12.5h8L17 7'],
  ir: ['M5 12h14', 'm13 6 6 6-6 6'],
}

function Icono({ nombre }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

function useRevisionWeb(alGuardar) {
  const { sesion } = useSesion()
  const [revisando, setRevisando] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [aviso, setAviso] = useState('')

  async function ejecutar(tipo, texto, archivo = null) {
    if (revisando) return
    setAviso('')
    setRevisando(tipo)
    let final
    try {
      final = await revisarTipo(tipo, texto, archivo)
    } catch {
      final = null
    }
    setRevisando(null)
    if (!final) {
      setAviso(tipo === 'pdf' ? 'No se pudo leer el PDF.' : 'No se pudo revisar. Probá de nuevo en un momento.')
      return
    }
    setResultado({
      id: crypto.randomUUID(),
      caso: final,
      canal: CANAL_DE[tipo],
      subtitulo: tipo === 'enlace' ? undefined : resumenDe(tipo, texto, archivo?.name ?? ''),
    })
    if (sesion) {
      const { error } = await guardarAnalisis(sesion, final, ENTRADA_DE[tipo], ENTRADA_DE[tipo] === 'whatsapp' ? texto : null)
      if (!error) alGuardar?.()
    }
  }

  function abrir(caso) {
    setResultado(caso)
    window.requestAnimationFrame(() => document.querySelector('.slw-resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return { ejecutar, revisando, resultado, setResultado, abrir, aviso, setAviso }
}

function crecer(campo) {
  if (!campo) return
  campo.style.height = 'auto'
  campo.style.height = `${Math.min(campo.scrollHeight, 220)}px`
}

function Buscador({ revision }) {
  const archivoRef = useRef(null)
  const campoRef = useRef(null)
  const [entrada, setEntrada] = useState(() => enlaceTraido(window.location.search))
  const [arrastrando, setArrastrando] = useState(false)
  const { ejecutar, revisando, aviso, setAviso } = revision
  const detectado = tipoDeEntrada(entrada)

  function revisarTexto(texto) {
    const tipo = tipoDeEntrada(texto)
    if (!tipo) {
      setAviso('Pegá o escribí algo para revisarlo.')
      campoRef.current?.focus()
      return
    }
    ejecutar(tipo, texto.trim())
  }

  async function pegar() {
    const texto = await navigator.clipboard.readText().catch(() => '')
    if (!texto.trim()) {
      setAviso('No encontramos nada copiado. Copiá el enlace o el mensaje y volvé a probar.')
      return
    }
    setEntrada(texto.trim())
    window.requestAnimationFrame(() => crecer(campoRef.current))
    revisarTexto(texto)
  }

  function soltar(evento) {
    evento.preventDefault()
    setArrastrando(false)
    const archivo = [...(evento.dataTransfer?.files ?? [])].find((uno) => /\.pdf$/i.test(uno.name) || uno.type === 'application/pdf')
    if (archivo) {
      ejecutar('pdf', '', archivo)
      return
    }
    const texto = evento.dataTransfer?.getData('text')
    if (texto?.trim()) setEntrada(texto.trim())
  }

  return (
    <form
      className={arrastrando ? 'slw-buscador slw-buscador-arrastrando' : 'slw-buscador'}
      onSubmit={(evento) => {
        evento.preventDefault()
        revisarTexto(entrada)
      }}
      onDragOver={(evento) => {
        evento.preventDefault()
        setArrastrando(true)
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={soltar}
    >
      <div className="slw-barra-busqueda">
        <label className="visualmente-oculto" htmlFor="slw-entrada">
          Lo que te llegó
        </label>
        <textarea
          id="slw-entrada"
          ref={campoRef}
          value={entrada}
          rows={1}
          onChange={(evento) => {
            setEntrada(evento.target.value)
            crecer(evento.target)
            if (aviso) setAviso('')
          }}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter' && !evento.shiftKey) {
              evento.preventDefault()
              revisarTexto(entrada)
            }
          }}
          placeholder="Pegá lo que te mandaron…"
          autoComplete="off"
          spellCheck="false"
          disabled={Boolean(revisando)}
        />
        <button type="submit" className="slw-boton" disabled={Boolean(revisando)}>
          {revisando ? 'Revisando…' : 'Revisar'}
        </button>
      </div>
      <p className="slw-detectado" aria-live="polite">
        {detectado ? `Parece ${NOMBRE_TIPO[detectado]} · Enter para revisar, Shift + Enter para otra línea` : 'Enter para revisar · también podés soltar un PDF acá'}
      </p>
      <input
        ref={archivoRef}
        className="slw-archivo"
        type="file"
        accept="application/pdf,.pdf"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(evento) => {
          const elegido = evento.target.files?.[0]
          evento.target.value = ''
          if (elegido) ejecutar('pdf', '', elegido)
        }}
      />
      <div className="slw-opciones">
        <button type="button" onClick={pegar} disabled={Boolean(revisando)}>
          <Icono nombre="pegar" />
          Pegar lo copiado
        </button>
        <button type="button" onClick={() => archivoRef.current?.click()} disabled={Boolean(revisando)}>
          <Icono nombre="pdf" />
          Subir un PDF
        </button>
        <Link to="/panel/qr">
          <Icono nombre="qr" />
          Foto de un QR
        </Link>
      </div>
      {revisando ? <Pasos tipo={revisando} /> : null}
      {aviso ? (
        <p className="slw-aviso" role="status">
          {aviso}
        </p>
      ) : null}
    </form>
  )
}

function Actividad({ totales }) {
  const partes = partesDeTotales(totales)
  const frase = textoProtegido(totales)
  return (
    <section className="slw-actividad" aria-labelledby="slw-actividad-titulo">
      <h2 id="slw-actividad-titulo">Tu actividad</h2>
      {totales.cargando ? (
        <p className="slw-nota">Contando tus revisiones…</p>
      ) : partes.length === 0 ? (
        <p className="slw-nota">Todavía no revisaste nada.</p>
      ) : (
        <>
          <ul className="slw-contadores">
            {partes.map((parte) => (
              <li key={parte.id} className={`slw-contador slw-nivel-${parte.id}`}>
                <span>{parte.etiqueta}</span>
                <strong>{parte.cantidad}</strong>
              </li>
            ))}
          </ul>
          {frase ? <p className="slw-frase">{frase}</p> : null}
        </>
      )}
    </section>
  )
}

const FECHA_CORTA = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })

function Ultimos({ items, cargando, onAbrir }) {
  return (
    <section className="slw-ultimos" aria-labelledby="slw-ultimos-titulo">
      <div className="slw-cabeza">
        <h2 id="slw-ultimos-titulo">Lo último que revisaste</h2>
        {items.length > 0 ? <Link to="/panel/historial">Ver todo el historial</Link> : null}
      </div>
      {cargando ? (
        <p className="slw-nota">Buscando tus revisiones…</p>
      ) : items.length === 0 ? (
        <p className="slw-nota">Cuando revises algo, aparece acá.</p>
      ) : (
        <ul className="slw-lista">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => onAbrir(item)}>
                <ChipEstado nivel={item.nivel} />
                <span className="slw-lista-que">
                  <strong>{item.titulo}</strong>
                  {item.ruta ? <span>{item.ruta}</span> : null}
                </span>
                <span className="slw-lista-cuando">{FECHA_CORTA.format(new Date(item.fecha))}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function InicioSafeLinkWeb({ onVolver }) {
  const revisados = useAnalisisPropios({ limite: 20 })
  const totales = useTotalesPropios()
  const revision = useRevisionWeb(() => {
    revisados.recargar()
    totales.recargar()
  })
  const ultimos = agruparActividad(revisados.items, 6)

  return (
    <div className="slw-inicio">
      <section className="slw-hero" aria-labelledby="slw-titulo">
        <div className="slw-hero-adentro">
          {onVolver ? (
            <button type="button" className="slw-volver" onClick={onVolver}>
              ← Elegir otra aplicación
            </button>
          ) : null}
          <p className="slw-eti">SafeLink</p>
          <h1 id="slw-titulo">¿Qué te llegó?</h1>
          <p className="slw-sub">Pegá un enlace, un WhatsApp o un correo. Te decimos si es seguro antes de que lo abras.</p>
          <Buscador revision={revision} />
        </div>
      </section>
      {revision.resultado ? (
        <div className="slw-resultado">
          <PantallaResultado resultado={revision.resultado} onCerrar={() => revision.setResultado(null)} />
        </div>
      ) : (
        <div className="slw-cuerpo">
          <Ultimos items={ultimos} cargando={revisados.cargando} onAbrir={(item) => revision.abrir(casoDeRevisado(item))} />
          <Actividad totales={totales} />
        </div>
      )}
    </div>
  )
}

const ICONO_ENTRADA = {
  web: ['M10 13.5 13.5 10', 'M8.4 11.6 7 13a3.4 3.4 0 0 0 4.8 4.8l1.4-1.4', 'M15.6 12.4 17 11a3.4 3.4 0 0 0-4.8-4.8L10.8 7.6'],
  qr: ['M4.5 9V6.5a2 2 0 0 1 2-2H9', 'M15 4.5h2.5a2 2 0 0 1 2 2V9', 'M19.5 15v2.5a2 2 0 0 1-2 2H15', 'M9 19.5H6.5a2 2 0 0 1-2-2V15', 'M8 12h8'],
  whatsapp: ['M5 18.5 6.2 15A7 7 0 1 1 9 17.8L5 18.5Z'],
  pdf: ['M7 3.5h7l4 4V20.5H7v-17Z', 'M14 3.5V8h4', 'M9.5 13h5M9.5 16h5'],
  correo: ['M4 6.5h16v11H4z', 'm4.5 7 7.5 6 7.5-6'],
}

function IconoEntrada({ entrada }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {(ICONO_ENTRADA[entrada] ?? ICONO_ENTRADA.web).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

export function HistorialWeb() {
  const revisados = useAnalisisPropios({ limite: 200 })
  const totales = useTotalesPropios()
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [aviso, setAviso] = useState('')
  const revision = useRevisionWeb(() => {
    revisados.recargar()
    totales.recargar()
  })
  const agrupados = agruparActividad(revisados.items, 200)
  const conteo = conteoPorNivel(agrupados)
  const visibles = buscarEnRevisados(filtrarPorNivel(agrupados, filtro), busqueda)
  const dias = agruparPorDia(visibles)
  const filtros = FILTROS_HISTORIAL.filter((opcion) => opcion.id !== 'gris' || conteo.gris > 0)

  async function borrar(item) {
    const listo = await borrarAnalisis(item.ids ?? [item.id])
    if (!listo) {
      setAviso('No se pudo borrar. Probá de nuevo en un rato.')
      return
    }
    setAviso('')
    revisados.recargar()
    totales.recargar()
  }

  return (
    <div className="slw-inicio slh">
      <section className="slw-hero" aria-labelledby="slh-titulo">
        <div className="slw-hero-adentro slh-hero">
          <Link className="slw-volver" to="/panel?app=safelink">
            ← Volver a SafeLink
          </Link>
          <p className="slw-eti">SafeLink · Historial</p>
          <h1 id="slh-titulo">Lo que revisaste</h1>
          <p className="slw-sub">
            Todo lo que revisaste en la web y en la app. Tocá una fila para ver por qué dio ese color y preguntarle a Faro.
          </p>
          <div className="slh-contadores" role="group" aria-label="Filtrar por color">
            {filtros.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                className={`slh-contador slh-contador-${opcion.id}${filtro === opcion.id ? ' slh-contador-activo' : ''}`}
                aria-pressed={filtro === opcion.id}
                onClick={() => setFiltro(opcion.id)}
              >
                <strong>{conteo[opcion.id]}</strong>
                <span>{opcion.etiqueta}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {revision.resultado || revision.revisando ? (
        <div className="slw-resultado">
          {revision.revisando ? (
            <Pasos tipo={revision.revisando} />
          ) : (
            <PantallaResultado resultado={revision.resultado} onCerrar={() => revision.setResultado(null)} />
          )}
        </div>
      ) : (
        <div className="slh-cuerpo">
          <div className="slh-barra">
            <label className="slh-buscar">
              <Icono nombre="buscar" />
              <span className="visualmente-oculto">Buscar en el historial</span>
              <input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar un sitio, un mensaje o un correo" />
            </label>
            <span className="slh-cantidad">
              {visibles.length === 1 ? '1 resultado' : `${visibles.length} resultados`}
            </span>
          </div>

          {aviso || revision.aviso ? (
            <p className="slw-aviso" role="status">
              {aviso || revision.aviso}
            </p>
          ) : null}

          {revisados.cargando ? (
            <p className="slw-nota">Buscando tus revisiones…</p>
          ) : revisados.error ? (
            <p className="slw-nota">No se pudieron leer tus revisiones. Probá de nuevo en un rato.</p>
          ) : agrupados.length === 0 ? (
            <section className="slh-vacio">
              <h2>Todavía no revisaste nada</h2>
              <p>Cuando revises un enlace, un mensaje, un correo o un PDF, va a aparecer acá.</p>
              <Link className="slh-boton" to="/panel?app=safelink">
                Revisar algo
              </Link>
            </section>
          ) : visibles.length === 0 ? (
            <section className="slh-vacio">
              <h2>No hay nada con ese filtro</h2>
              <p>Probá con otro color o con otra palabra.</p>
            </section>
          ) : (
            dias.map((dia) => (
              <section key={dia.titulo} className="slh-dia" aria-label={dia.titulo}>
                <h2>{dia.titulo}</h2>
                <ul>
                  {dia.items.map((item) => {
                    const motivo = motivoCorto(item)
                    return (
                      <li key={item.id} className={`slh-fila slh-fila-${item.nivelRiesgo ?? 'gris'}`}>
                        <button type="button" className="slh-abrir" onClick={() => revision.abrir(casoDeRevisado(item))}>
                          <span className="slh-icono">
                            <IconoEntrada entrada={item.entrada} />
                          </span>
                          <span className="slh-texto">
                            <span className="slh-que">
                              <strong>{item.titulo}</strong>
                              {item.ruta ? <span>{item.ruta}</span> : null}
                            </span>
                            {motivo ? <span className="slh-motivo">{motivo}</span> : null}
                          </span>
                          <span className="slh-meta">
                            <ChipEstado nivel={item.nivel} />
                            <span>
                              {detalleDe(item)} · {horaDe(item.fecha)}
                            </span>
                          </span>
                        </button>
                        <span className="slh-acciones">
                          {(item.entrada === 'web' || item.entrada === 'qr') && item.url ? (
                            <button type="button" title="Revisar de nuevo" aria-label={`Revisar de nuevo ${item.titulo}`} onClick={() => revision.ejecutar('enlace', item.url)}>
                              <Icono nombre="otra" />
                            </button>
                          ) : null}
                          <button type="button" title="Borrar" aria-label={`Borrar ${item.titulo}`} className="slw-accion-borrar" onClick={() => borrar(item)}>
                            <Icono nombre="borrar" />
                          </button>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))
          )}

          <section className="slh-reportes" aria-labelledby="slw-reportes-titulo">
            <h2 id="slw-reportes-titulo">Tus reportes</h2>
            <p className="slw-nota">Lo que nos avisaste que era un engaño y en qué quedó.</p>
            <MisReportes />
          </section>
        </div>
      )}
    </div>
  )
}
