import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { rutaEnApp } from '../lib/esAppNativa.js'
import { supabase } from '../lib/supabase.js'
import { useSesion } from '../lib/useSesion.js'
import { analizar } from '../lib/analisis.js'
import { guardarAnalisis, revisarEnlace } from '../lib/enriquecer.js'
import { casoGuardado } from '../lib/veredicto.js'
import Resultado from '../components/Resultado.jsx'
import './Panel.css'

const COLUMNAS = 'id, url_analizada, dominio, nivel_riesgo, explicacion, puntuacion_riesgo, fecha_analisis'

function fecha(valor) {
  return new Date(valor).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function PanelEnlaces() {
  const { sesion } = useSesion()
  const { state } = useLocation()
  const entradaInicial = typeof state?.entrada === 'string' ? state.entrada : ''
  const [entrada, setEntrada] = useState(entradaInicial)
  const [resultado, setResultado] = useState(null)
  const [historial, setHistorial] = useState([])
  const [reportes, setReportes] = useState([])
  const [analizando, setAnalizando] = useState(false)
  const [caso, setCaso] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let activo = true

    Promise.all([
      supabase
        .from('safelink_analisis')
        .select(COLUMNAS)
        .order('fecha_analisis', { ascending: false })
        .limit(20),
      supabase
        .from('safelink_reportes')
        .select('id, dominio, cierre, estado, fecha_reporte')
        .order('fecha_reporte', { ascending: false })
        .limit(10),
    ]).then(([hist, reps]) => {
      if (!activo) return
      if (hist.error) setError(`No se pudo leer el historial: ${hist.error.message}`)
      else setHistorial(hist.data ?? [])
      if (!reps.error) setReportes(reps.data ?? [])
    })

    return () => {
      activo = false
    }
  }, [])

  async function manejarAnalisis(evento) {
    evento.preventDefault()
    setError(null)

    if (!analizar(entrada)) {
      setError('Eso no parece un enlace. Probá con algo como ejemplo.com/promo')
      return
    }

    setAnalizando(true)

    const final = await revisarEnlace(entrada)

    setResultado({ ...final, casoId: crypto.randomUUID() })

    const { error: falloGuardado } = await guardarAnalisis(sesion, final, 'web')
    setAnalizando(false)

    if (falloGuardado) {
      setError(`El análisis se hizo, pero no se pudo guardar: ${falloGuardado.message}`)
      return
    }

    setHistorial((previo) =>
      [
        {
          id: crypto.randomUUID(),
          url_analizada: final.url,
          dominio: final.dominioDestino ?? final.dominio,
          nivel_riesgo: final.nivel,
          explicacion: final.motivos.join(' '),
          fecha_analisis: new Date().toISOString(),
        },
        ...previo,
      ].slice(0, 20),
    )
  }

  function noAbrir() {
    setResultado(null)
    setEntrada('')
  }

  return (
    <div className="panel panel-personas">
      <header className="panel-header">
        <Link className="panel-volver" to={rutaEnApp('/panel?app=safelink')}>
          ← Volver a las opciones
        </Link>
        <h1>Revisar un enlace</h1>
        <p className="panel-lead">
          Pegá la dirección antes de abrirla. Si es un bit.ly o un cutt.ly,
          abrimos el destino por vos y te decimos a dónde lleva.
        </p>
      </header>

      <form className="panel-form panel-form-fila panel-pieza" onSubmit={manejarAnalisis}>
        <label className="panel-campo">
          <span>Dirección</span>
          <input
            type="text"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder="bit.ly/algo o ejemplo.com/promo"
            autoComplete="off"
            spellCheck="false"
          />
        </label>
        <button type="submit" className="panel-boton" disabled={analizando}>
          {analizando ? 'Analizando…' : 'Analizar'}
        </button>
      </form>

      {error && <p className="panel-error">{error}</p>}

      {resultado && (
        <Resultado casoId={resultado.casoId} resultado={resultado} canal="enlace" onNoAbrir={noAbrir} />
      )}

      <section className="panel-seccion">
        <h2>Mis enlaces</h2>
        {caso && (
          <Resultado
            casoId={caso.id}
            resultado={casoGuardado(caso)}
            canal="enlace"
            onNoAbrir={() => setCaso(null)}
          />
        )}
        {historial.length === 0 ? (
          <p className="panel-vacio">Todavía no analizaste ninguno.</p>
        ) : (
          <ul className="historial">
            {historial.map((item) => (
              <li className={`historial-item nivel-${item.nivel_riesgo}`} key={item.id}>
                <button
                  type="button"
                  className="historial-abrir"
                  aria-expanded={caso?.id === item.id}
                  onClick={() => setCaso(item)}
                >
                  <span className="historial-punto" aria-hidden="true" />
                  <span>
                    <p className="historial-url">{item.url_analizada}</p>
                    <p className="historial-meta">
                      {item.nivel_riesgo === 'verde'
                        ? '✓ Verde'
                        : item.nivel_riesgo === 'amarillo'
                          ? '! Amarillo'
                          : item.nivel_riesgo === 'gris'
                            ? '? No verificado'
                            : '✕ Rojo'}
                      {' · '}
                      {item.dominio} · {fecha(item.fecha_analisis)}
                      <span className="historial-ver">{caso?.id === item.id ? 'Caso abierto' : 'Ver caso'}</span>
                    </p>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {reportes.length > 0 && (
        <section className="panel-seccion">
          <h2>Tus reportes</h2>
          <ul className="reportes">
            {reportes.map((item) => (
              <li className="reporte-item" key={item.id}>
                <div>
                  <p className="reporte-dominio">{item.dominio}</p>
                  <p className="reporte-meta">
                    {item.cierre} · {fecha(item.fecha_reporte)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default PanelEnlaces
