import { useEffect, useId, useRef, useState } from 'react'
import { motivosLimpios, queHacer } from '../lib/analisis.js'
import { claveReporte } from '../lib/reporteError.js'
import { motivosCortos, notaSinContenido, porQueSinVerificar, textoAlerta, veredictoDe } from '../lib/veredicto.js'
import CadenaEnlace from './CadenaEnlace.jsx'
import DiferenciaDominio, { DominioMarcado } from './DiferenciaDominio.jsx'
import Faro from './Faro.jsx'
import ReportarError from './ReportarError.jsx'
import './Resultado.css'

const TRAZO = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.8',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function IconoVeredicto({ clave }) {
  if (clave === 'seguro') {
    return (
      <svg {...TRAZO}>
        <path d="M12 3.5 19 6v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6l7-2.5Z" />
        <path d="m8.8 12.2 2.2 2.2 4.4-4.6" />
      </svg>
    )
  }
  if (clave === 'sin_senales') {
    return (
      <svg {...TRAZO}>
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12.2 2.3 2.3 4.7-5" />
      </svg>
    )
  }
  if (clave === 'sospechoso') {
    return (
      <svg {...TRAZO}>
        <path d="M12 4.5 20 19H4L12 4.5Z" />
        <path d="M12 10v4.2" />
        <path d="M12 16.8h.01" />
      </svg>
    )
  }
  if (clave === 'peligroso') {
    return (
      <svg {...TRAZO}>
        <path d="M8.7 3.5h6.6l5.2 5.2v6.6l-5.2 5.2H8.7l-5.2-5.2V8.7l5.2-5.2Z" />
        <path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" />
      </svg>
    )
  }
  return (
    <svg {...TRAZO}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.8 9.6a2.3 2.3 0 0 1 4.4.9c0 1.5-2.2 2-2.2 3.3" />
      <path d="M12 16.8h.01" />
    </svg>
  )
}

function Tarjeta({ resultado, canal, subtitulo, casoId, porQue, conFaro, onNoAbrir, children }) {
  const tituloId = useId()
  const titulo = useRef(null)
  const [verTodos, setVerTodos] = useState(false)
  const [reportando, setReportando] = useState(false)
  const [reportado, setReportado] = useState(false)
  const [aviso, setAviso] = useState('')

  const { nivel } = resultado
  const veredicto = veredictoDe(resultado)
  const causa = porQue ?? porQueSinVerificar(resultado)
  const nota = porQue ? null : notaSinContenido(resultado)
  const todos = motivosLimpios(resultado.motivos)
  const { visibles, ocultos } = motivosCortos(todos, {
    abierto: verTodos,
    conCausa: Boolean(causa),
    senales: resultado.senales,
    sinContenido: Boolean(nota),
  })
  const diferencia = resultado.diferencia && todos.includes(resultado.diferencia.frase) ? resultado.diferencia : null
  const dominio = resultado.dominioDestino ?? resultado.dominio
  const linea = subtitulo ?? dominio
  const caso = { nivel, url: resultado.url, dominio: dominio === 'whatsapp' ? null : dominio, canal, motivos: todos }

  useEffect(() => {
    titulo.current?.focus()
  }, [])

  async function compartir() {
    const texto = textoAlerta(resultado, veredicto.titulo)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Alerta de SafeLink', text: texto })
        return
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(texto)
      setAviso('Copiamos la alerta para que la compartas.')
    } catch {
      setAviso('No se pudo compartir desde este navegador.')
    }
  }

  return (
    <article className={`veredicto veredicto-${veredicto.clave}`} aria-labelledby={tituloId}>
      <div className="veredicto-cabeza">
        <span className="veredicto-icono">
          <IconoVeredicto clave={veredicto.clave} />
        </span>
        <div className="veredicto-nombre">
          <h2 id={tituloId} ref={titulo} tabIndex={-1}>
            {veredicto.titulo}
          </h2>
          {(diferencia || linea) && (
            <p className="veredicto-dominio">{diferencia ? <DominioMarcado tramos={diferencia.visto} /> : linea}</p>
          )}
        </div>
        {conFaro && (
          <Faro
            casoId={casoId ?? claveReporte(caso)}
            nivel={nivel}
            motivos={todos}
            caso={{
              url: resultado.url || '',
              dominio: caso.dominio || '',
              puntuacion: typeof resultado.puntuacion === 'number' ? resultado.puntuacion : null,
              canal: canal || '',
              titulo: veredicto.titulo,
              senales: resultado.senales ?? [],
              virusTotal: resultado.virusTotal ?? null,
              sinContenido: Boolean(nota),
              registradoEn: resultado.registradoEn ?? null,
              edadDias: Number.isFinite(resultado.edadDias) ? resultado.edadDias : null,
              destino: resultado.destino ?? null,
              falloAlSeguir: resultado.falloAlSeguir ?? null,
              contenidoRevisado: resultado.contenidoRevisado === true,
            }}
          />
        )}
      </div>

      {causa && veredicto.clave === 'sin_verificar' && <p className="veredicto-causa">{causa}</p>}
      <p className="veredicto-consejo">{queHacer(nivel)}</p>
      {diferencia && <DiferenciaDominio diferencia={diferencia} />}

      {visibles.length > 0 && (
        <ul className="veredicto-motivos">
          {visibles.map((motivo) => (
            <li key={motivo}>{motivo}</li>
          ))}
        </ul>
      )}
      {ocultos > 0 && (
        <button type="button" className="veredicto-ver" aria-expanded={verTodos} onClick={() => setVerTodos(!verTodos)}>
          {verTodos ? 'Ver menos motivos' : `Ver ${ocultos === 1 ? 'otro motivo' : `${ocultos} motivos más`}`}
        </button>
      )}

      {causa && veredicto.clave !== 'sin_verificar' && <p className="veredicto-nota">{causa}</p>}
      {nota && <p className="veredicto-nota">{nota}</p>}

      <CadenaEnlace cadena={resultado.cadena} cortada={Boolean(resultado.falloAlSeguir)} />
      {children}

      <div className="veredicto-acciones">
        <button type="button" className="veredicto-boton veredicto-boton-principal" onClick={onNoAbrir}>
          No abrir
        </button>
        <button
          type="button"
          className="veredicto-boton veredicto-boton-tonal"
          aria-expanded={reportando}
          disabled={reportado}
          onClick={() => setReportando(!reportando)}
        >
          {reportado ? 'Reportado' : 'Reportar'}
        </button>
        <button type="button" className="veredicto-boton veredicto-boton-borde" onClick={compartir}>
          Compartir alerta
        </button>
      </div>

      {reportando && (
        <ReportarError
          caso={caso}
          onCancelar={() => setReportando(false)}
          onEnviado={() => {
            setReportando(false)
            setReportado(true)
            setAviso('Gracias. Una persona lo va a revisar; el resultado no cambia solo.')
          }}
        />
      )}
      {aviso && (
        <p className="veredicto-aviso" role="status">
          {aviso}
        </p>
      )}
    </article>
  )
}

// Cada resultado nuevo arranca de cero: motivos plegados, sin reporte abierto y con el foco en el título.
function Resultado({ resultado, conFaro = true, ...resto }) {
  const clave = resto.casoId ?? claveReporte(resultado)
  return <Tarjeta key={clave} resultado={resultado} conFaro={conFaro} {...resto} />
}

export default Resultado
