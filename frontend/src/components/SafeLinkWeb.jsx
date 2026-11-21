import { useRef, useState } from 'react'
import { Link } from 'react-router'
import ChipEstado from './ChipEstado.jsx'
import MisReportes from './MisReportes.jsx'
import { agruparActividad, detalleDe } from '../lib/agruparActividad.js'
import { guardarAnalisis } from '../lib/enriquecer.js'
import { buscarEnRevisados, fechaDeTabla, partesDeTotales } from '../lib/revisados.js'
import { CANAL_DE, casoDeRevisado, ENTRADA_DE, resumenDe, revisarTipo } from '../lib/revisarSafeLink.js'
import { enlaceTraido, FILTROS, filtrarPorNivel, NOMBRE_TIPO, textoProtegido, tipoDeEntrada } from '../lib/safelinkApp.js'
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return { ejecutar, revisando, resultado, setResultado, abrir, aviso, setAviso }
}

function TarjetaRevisar({ revision }) {
  const archivoRef = useRef(null)
  const [entrada, setEntrada] = useState(() => enlaceTraido(window.location.search))
  const [arrastrando, setArrastrando] = useState(false)
  const { ejecutar, revisando, resultado, setResultado, aviso, setAviso } = revision
  const detectado = tipoDeEntrada(entrada)

  function revisarTexto(texto) {
    const tipo = tipoDeEntrada(texto)
    if (!tipo) {
      setAviso('Pegá o escribí algo para revisarlo.')
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

  if (resultado) {
    return (
      <div className="slw-resultado">
        <PantallaResultado
          resultado={resultado}
          onCerrar={() => {
            setResultado(null)
            setEntrada('')
          }}
        />
      </div>
    )
  }

  return (
    <form
      className={arrastrando ? 'slw-revisar slw-revisar-arrastrando' : 'slw-revisar'}
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
      <label className="slw-campo">
        <span className="slw-etiqueta">Revisar algo que te llegó</span>
        <textarea
          value={entrada}
          onChange={(evento) => {
            setEntrada(evento.target.value)
            if (aviso) setAviso('')
          }}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey)) {
              evento.preventDefault()
              revisarTexto(entrada)
            }
          }}
          placeholder="Pegá acá un enlace, un mensaje de WhatsApp o un correo completo"
          rows={5}
          autoComplete="off"
          spellCheck="false"
          disabled={Boolean(revisando)}
        />
      </label>

      {revisando ? <Pasos tipo={revisando} /> : null}

      {aviso ? (
        <p className="slw-aviso" role="status">
          {aviso}
        </p>
      ) : null}

      <div className="slw-barra">
        <div className="slw-herramientas">
          <button type="button" className="slw-herramienta" onClick={pegar} disabled={Boolean(revisando)}>
            <Icono nombre="pegar" />
            Pegar
          </button>
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
          <button type="button" className="slw-herramienta" onClick={() => archivoRef.current?.click()} disabled={Boolean(revisando)}>
            <Icono nombre="pdf" />
            Subir un PDF
          </button>
          <Link className="slw-herramienta" to="/panel/qr">
            <Icono nombre="qr" />
            Foto de un QR
          </Link>
        </div>
      </div>
      <div className="slw-pie">
        <p className="slw-pista">
          {detectado ? (
            <span className="slw-detectado">Parece {NOMBRE_TIPO[detectado]} · </span>
          ) : null}
          <kbd>Ctrl</kbd> + <kbd>Enter</kbd> para revisar · podés soltar un PDF acá
        </p>
        <button type="submit" className="slw-boton" disabled={!detectado || Boolean(revisando)}>
          {revisando ? 'Revisando…' : 'Revisar'}
        </button>
      </div>
    </form>
  )
}

function TarjetaActividad({ totales }) {
  const partes = partesDeTotales(totales)
  const frase = textoProtegido(totales)
  return (
    <section className="slw-tarjeta slw-actividad" aria-labelledby="slw-actividad-titulo">
      <div className="slw-tarjeta-cabeza">
        <h2 id="slw-actividad-titulo">Tu actividad</h2>
        <Link to="/panel/historial">Historial</Link>
      </div>
      {totales.cargando ? (
        <p className="slw-nota">Contando tus revisiones…</p>
      ) : partes.length === 0 ? (
        <p className="slw-nota">Todavía no revisaste nada. Lo que revises queda acá, en la web y en la app.</p>
      ) : (
        <>
          <p className="slw-total">
            <strong>{totales.total}</strong> revisiones
          </p>
          <div className="slw-barra-niveles" role="img" aria-label={partes.map((parte) => `${parte.cantidad} ${parte.etiqueta}`).join(', ')}>
            {partes.map((parte) =>
              parte.cantidad > 0 ? <span key={parte.id} className={`slw-nivel-${parte.id}`} style={{ width: `${parte.porcentaje}%` }} /> : null,
            )}
          </div>
          <ul className="slw-leyenda">
            {partes.map((parte) => (
              <li key={parte.id} className={`slw-nivel-${parte.id}`}>
                <span aria-hidden="true" />
                {parte.etiqueta}
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

function TablaRevisados({ items, completo, onAbrir, onBorrar, onRevisar }) {
  return (
    <table className="slw-tabla">
      <thead>
        <tr>
          <th scope="col">Resultado</th>
          <th scope="col">Qué revisaste</th>
          <th scope="col">Tipo</th>
          <th scope="col">Cuándo</th>
          <th scope="col">
            <span className="visualmente-oculto">Acciones</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} onClick={() => onAbrir(item)}>
            <td data-titulo="Resultado">
              <ChipEstado nivel={item.nivel} />
            </td>
            <td data-titulo="Qué revisaste" className="slw-que">
              <button type="button" className="slw-abrir" onClick={(evento) => { evento.stopPropagation(); onAbrir(item) }}>
                <strong>{item.titulo}</strong>
                {item.ruta ? <span>{item.ruta}</span> : null}
              </button>
            </td>
            <td data-titulo="Tipo">{detalleDe(item)}</td>
            <td data-titulo="Cuándo" className="slw-cuando">
              {fechaDeTabla(item.fecha)}
            </td>
            <td className="slw-acciones">
              {completo && (item.entrada === 'web' || item.entrada === 'qr') && item.url ? (
                <button type="button" title="Revisar de nuevo" aria-label={`Revisar de nuevo ${item.titulo}`} onClick={(evento) => { evento.stopPropagation(); onRevisar(item) }}>
                  <Icono nombre="otra" />
                </button>
              ) : null}
              {completo ? (
                <button type="button" title="Borrar" aria-label={`Borrar ${item.titulo}`} className="slw-accion-borrar" onClick={(evento) => { evento.stopPropagation(); onBorrar(item) }}>
                  <Icono nombre="borrar" />
                </button>
              ) : (
                <span className="slw-ir" aria-hidden="true">
                  <Icono nombre="ir" />
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function InicioSafeLinkWeb({ lateral = null }) {
  const revisados = useAnalisisPropios({ limite: 20 })
  const totales = useTotalesPropios()
  const revision = useRevisionWeb(() => {
    revisados.recargar()
    totales.recargar()
  })
  const ultimos = agruparActividad(revisados.items, 6)

  return (
    <div className="slw-inicio">
      <div className="slw-principal">
        <TarjetaRevisar revision={revision} />
      </div>
      <aside className="slw-lateral">
        <TarjetaActividad totales={totales} />
        {lateral}
      </aside>
      {!revision.resultado ? (
        <section className="slw-tarjeta slw-ultimos" aria-labelledby="slw-ultimos-titulo">
          <div className="slw-tarjeta-cabeza">
            <h2 id="slw-ultimos-titulo">Lo último que revisaste</h2>
            {ultimos.length > 0 ? <Link to="/panel/historial">Ver todo el historial</Link> : null}
          </div>
          {revisados.cargando ? (
            <p className="slw-nota">Buscando tus revisiones…</p>
          ) : ultimos.length === 0 ? (
            <p className="slw-nota">Cuando revises algo, aparece acá.</p>
          ) : (
            <TablaRevisados items={ultimos} onAbrir={(item) => revision.abrir(casoDeRevisado(item))} />
          )}
        </section>
      ) : null}
    </div>
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
  const visibles = buscarEnRevisados(filtrarPorNivel(agrupados, filtro), busqueda)

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

  if (revision.resultado || revision.revisando) {
    return (
      <div className="slw-resultado">
        {revision.revisando ? (
          <Pasos tipo={revision.revisando} />
        ) : (
          <PantallaResultado resultado={revision.resultado} onCerrar={() => revision.setResultado(null)} />
        )}
      </div>
    )
  }

  return (
    <div className="slw-historial">
      <div className="slw-herramientas-tabla">
        <div className="slw-filtros" role="group" aria-label="Filtrar por color">
          {FILTROS.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              className={filtro === opcion.id ? 'slw-filtro slw-filtro-activo' : 'slw-filtro'}
              aria-pressed={filtro === opcion.id}
              onClick={() => setFiltro(opcion.id)}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
        <label className="slw-buscar">
          <Icono nombre="buscar" />
          <span className="visualmente-oculto">Buscar en el historial</span>
          <input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar un sitio o un mensaje" />
        </label>
      </div>

      {aviso || revision.aviso ? (
        <p className="slw-aviso" role="status">
          {aviso || revision.aviso}
        </p>
      ) : null}

      <section className="slw-tarjeta" aria-label="Lo que revisaste">
        {revisados.cargando ? (
          <p className="slw-nota">Buscando tus revisiones…</p>
        ) : revisados.error ? (
          <p className="slw-nota">No se pudieron leer tus revisiones. Probá de nuevo en un rato.</p>
        ) : visibles.length === 0 ? (
          <p className="slw-nota">{agrupados.length === 0 ? 'Todavía no revisaste nada.' : 'No hay revisiones que coincidan.'}</p>
        ) : (
          <>
            <p className="slw-cantidad">
              {visibles.length === 1 ? '1 revisión' : `${visibles.length} revisiones`}
            </p>
            <TablaRevisados
              items={visibles}
              completo
              onAbrir={(item) => revision.abrir(casoDeRevisado(item))}
              onBorrar={borrar}
              onRevisar={(item) => revision.ejecutar('enlace', item.url)}
            />
          </>
        )}
      </section>

      <section className="slw-tarjeta slw-reportes" aria-labelledby="slw-reportes-titulo">
        <div className="slw-tarjeta-cabeza">
          <h2 id="slw-reportes-titulo">Tus reportes</h2>
        </div>
        <MisReportes />
      </section>
    </div>
  )
}
