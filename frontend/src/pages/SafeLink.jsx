import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import FilaActividad, { ListaActividad } from '../components/FilaActividad.jsx'
import Resultado from '../components/Resultado.jsx'
import { agruparActividad } from '../lib/agruparActividad.js'
import { analizarPdf } from '../lib/analisisPdf.js'
import {
  cerrarRevision,
  enlaceParaAbrir,
  guardarAnalisis,
  revisarCorreo,
  revisarEnlace,
  revisarWhatsapp,
} from '../lib/enriquecer.js'
import { usePortapapeles } from '../lib/portapapeles.js'
import {
  agruparPorDia,
  FILTROS,
  filtrarPorNivel,
  fraseDeNivel,
  NOMBRE_TIPO,
  pasoEn,
  pasosRevision,
  textoProtegido,
  tipoDeEntrada,
} from '../lib/safelinkApp.js'
import { borrarAnalisis, useAnalisisPropios, useTotalesPropios } from '../lib/useAnalisisPropios.js'
import { useSesion } from '../lib/useSesion.js'
import { veredictoDe } from '../lib/veredicto.js'
import './SafeLink.css'

const ENTRADA_DE = {
  enlace: 'web',
  mensaje: 'whatsapp',
  correo: 'correo',
  pdf: 'pdf',
}

const CANAL_DE = {
  enlace: 'enlace',
  mensaje: 'whatsapp',
  correo: 'correo',
  pdf: 'pdf',
  qr: 'qr',
}

const ENTRADA_A_TIPO = {
  web: 'enlace',
  whatsapp: 'mensaje',
  correo: 'correo',
  pdf: 'pdf',
  qr: 'qr',
}

async function revisarTipo(tipo, entrada, archivo) {
  if (tipo === 'enlace') return revisarEnlace(entrada)
  if (tipo === 'mensaje') return revisarWhatsapp(entrada)
  if (tipo === 'correo') return revisarCorreo(entrada)
  const analisis = await analizarPdf(archivo)
  const peor = enlaceParaAbrir(analisis.enlaces)
  return cerrarRevision(analisis, peor?.url, [peor?.dominio])
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

  if (nombre === 'pegar') {
    return (
      <svg {...trazo}>
        <path d="M9 4.5h6a1 1 0 0 1 1 1V7H8V5.5a1 1 0 0 1 1-1Z" />
        <path d="M8 7H6.5A1.5 1.5 0 0 0 5 8.5v10A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 17.5 7H16" />
      </svg>
    )
  }

  if (nombre === 'pdf') {
    return (
      <svg {...trazo}>
        <path d="M7 3.5h7l4 4V20.5H7v-17Z" />
        <path d="M14 3.5V8h4" />
        <path d="M12 11v6M9.5 14.5 12 17l2.5-2.5" />
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

  if (nombre === 'faro') {
    return (
      <svg {...trazo}>
        <path d="M6 5.5h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 3v-3a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
        <path d="M9 11h.01M12 11h.01M15 11h.01" />
      </svg>
    )
  }

  return null
}

function SimboloNivel({ clave }) {
  const trazo = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2.6',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  if (clave === 'peligroso') {
    return (
      <svg {...trazo}>
        <path d="m7 7 10 10M17 7 7 17" />
      </svg>
    )
  }
  if (clave === 'sospechoso') {
    return (
      <svg {...trazo}>
        <path d="M12 6v8M12 18h.01" />
      </svg>
    )
  }
  if (clave === 'sin_verificar') {
    return (
      <svg {...trazo}>
        <path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01" />
      </svg>
    )
  }
  return (
    <svg {...trazo}>
      <path d="m6 12.5 4 4L18 8" />
    </svg>
  )
}

function resumenDe(tipo, entrada, archivo) {
  if (tipo === 'pdf') return archivo || 'PDF'
  const linea = entrada.trim().split('\n')[0]
  return linea.length > 72 ? `${linea.slice(0, 72)}…` : linea
}

function Pasos({ tipo }) {
  const [pasado, setPasado] = useState(0)

  useEffect(() => {
    const inicio = Date.now()
    const reloj = window.setInterval(() => setPasado(Date.now() - inicio), 200)
    return () => window.clearInterval(reloj)
  }, [])

  const actual = pasoEn(tipo, pasado)
  return (
    <div className="slapp-pasos" role="status" aria-live="polite">
      <p className="slapp-pasos-titulo">Revisando {NOMBRE_TIPO[tipo] ?? 'lo que pegaste'}…</p>
      <ol>
        {pasosRevision(tipo).map((paso, indice) => (
          <li
            key={paso}
            className={
              indice < actual.indice ? 'slapp-paso-hecho' : indice === actual.indice ? 'slapp-paso-actual' : undefined
            }
          >
            <span className="slapp-paso-marca" aria-hidden="true">
              {indice < actual.indice ? <Icono nombre="tilde" /> : null}
            </span>
            {paso}
          </li>
        ))}
      </ol>
    </div>
  )
}

function PantallaResultado({ resultado, onCerrar }) {
  const contenedor = useRef(null)
  const { clave, titulo } = veredictoDe(resultado.caso)

  function abrirFaro() {
    const raiz = contenedor.current
    raiz?.querySelector('.faro-abrir')?.click()
    window.requestAnimationFrame(() => raiz?.querySelector('.faro')?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
  }

  return (
    <div ref={contenedor} className={`slapp slapp-resultado slapp-resultado-${clave}`}>
      <div className="slapp-resultado-hero" aria-hidden="true">
        <span className="slapp-resultado-simbolo">
          <SimboloNivel clave={clave} />
        </span>
        <p className="slapp-resultado-nivel">{titulo}</p>
        <p className="slapp-resultado-frase">{fraseDeNivel(clave)}</p>
      </div>
      <Resultado
        casoId={resultado.id}
        resultado={resultado.caso}
        canal={resultado.canal}
        subtitulo={resultado.subtitulo}
        onNoAbrir={onCerrar}
      />
      <div className="slapp-resultado-barra">
        <button type="button" className="slapp-resultado-faro" onClick={abrirFaro}>
          <Icono nombre="faro" />
          Preguntale a Faro
        </button>
        <button type="button" className="slapp-resultado-otro" onClick={onCerrar}>
          Revisar otra cosa
        </button>
      </div>
    </div>
  )
}

function SafeLink() {
  const archivoRef = useRef(null)
  const [entrada, setEntrada] = useState('')
  const [aviso, setAviso] = useState('')
  const [resultado, setResultado] = useState(null)
  const [revisando, setRevisando] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const { sesion, cargando: cargandoSesion } = useSesion()
  const [parametros, setParametros] = useSearchParams()
  const compartido = parametros.get('compartido')
  const revisados = useAnalisisPropios({ limite: 60 })
  const totales = useTotalesPropios()
  const portapapeles = usePortapapeles()
  const detectado = tipoDeEntrada(entrada)
  const agrupados = agruparActividad(revisados.items, 40)
  const filtrados = filtrarPorNivel(agrupados, filtro)
  const dias = agruparPorDia(filtrados)
  const protegido = sesion ? textoProtegido(totales) : ''

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
      const guardar = ENTRADA_DE[tipo] === 'whatsapp' ? texto : null
      const { error } = await guardarAnalisis(sesion, final, ENTRADA_DE[tipo], guardar)
      if (!error) {
        revisados.recargar()
        totales.recargar()
      }
    }
  }

  function revisarTexto(texto) {
    const tipo = tipoDeEntrada(texto)
    if (!tipo) {
      setAviso('Pegá algo para revisarlo.')
      return
    }
    ejecutar(tipo, texto.trim())
  }

  const alCompartir = useEffectEvent((texto) => {
    setParametros({}, { replace: true })
    setEntrada(texto.trim())
    revisarTexto(texto)
  })

  useEffect(() => {
    if (cargandoSesion || !compartido?.trim()) return undefined
    const espera = window.setTimeout(() => alCompartir(compartido), 0)
    return () => window.clearTimeout(espera)
  }, [compartido, cargandoSesion])

  async function pegarYRevisar() {
    const texto = await navigator.clipboard.readText().catch(() => portapapeles.enlace ?? '')
    if (!texto.trim()) {
      setAviso('No encontramos nada copiado. Copiá el enlace o el mensaje y volvé a tocar.')
      return
    }
    setEntrada(texto.trim())
    revisarTexto(texto)
  }

  function revisar(evento) {
    evento.preventDefault()
    revisarTexto(entrada)
  }

  function abrirRevisado(item) {
    setAviso('')
    const mensaje = item.entrada === 'whatsapp'
    setResultado({
      id: item.id,
      caso: {
        nivel: item.nivelRiesgo,
        url: item.url,
        dominio: item.dominio,
        motivos: item.motivos,
        diferencia: item.diferencia,
        sinVerificar: item.nivelRiesgo === 'gris',
      },
      canal: CANAL_DE[ENTRADA_A_TIPO[item.entrada]] ?? 'enlace',
      subtitulo: mensaje || item.entrada === 'pdf' || item.entrada === 'correo' ? item.texto : undefined,
    })
  }

  async function borrar(item) {
    const listo = await borrarAnalisis(item.ids ?? [item.id])
    if (!listo) {
      setAviso('No se pudo borrar. Probá de nuevo en un rato.')
      return
    }
    revisados.recargar()
    totales.recargar()
  }

  function accionesDe(item) {
    if (!sesion) return null
    const acciones = []
    if ((item.entrada === 'web' || item.entrada === 'qr') && item.url) {
      acciones.push({ etiqueta: 'Revisar de nuevo', tono: 'otra', onClick: () => ejecutar('enlace', item.url) })
    }
    acciones.push({ etiqueta: 'Borrar', tono: 'borrar', onClick: () => borrar(item) })
    return acciones
  }

  if (resultado) {
    return (
      <PantallaResultado
        resultado={resultado}
        onCerrar={() => {
          setResultado(null)
          setAviso('')
          setEntrada('')
        }}
      />
    )
  }

  return (
    <form className="slapp" onSubmit={revisar}>
      {protegido ? <p className="slapp-protegido">{protegido}</p> : null}

      <button type="button" className="slapp-pegar-grande" onClick={pegarYRevisar} disabled={Boolean(revisando)}>
        <span className="slapp-pegar-icono">
          <Icono nombre="pegar" />
        </span>
        <span className="slapp-pegar-texto">
          <strong>Pegar lo que copiaste</strong>
          <span>{portapapeles.enlace || 'Un enlace, un mensaje o un correo. Lo revisamos al toque.'}</span>
        </span>
      </button>

      <div className="slapp-entrada">
        <label>
          <span className="slapp-etiqueta">O escribilo acá</span>
          <textarea
            value={entrada}
            onChange={(evento) => {
              setEntrada(evento.target.value)
              if (aviso) setAviso('')
            }}
            placeholder="Un enlace, un mensaje de WhatsApp o un correo"
            rows={3}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </label>
        {detectado ? <p className="slapp-detectado">Parece {NOMBRE_TIPO[detectado]}</p> : null}
      </div>

      {aviso ? (
        <p className="slapp-aviso" role="status">
          {aviso}
        </p>
      ) : null}

      {revisando ? (
        <Pasos tipo={revisando} />
      ) : (
        <div className="slapp-botones">
          <button type="submit" className="slapp-revisar" disabled={!detectado}>
            Revisar
          </button>
          <input
            ref={archivoRef}
            className="slapp-archivo-input"
            type="file"
            accept="application/pdf,.pdf"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(evento) => {
              const elegido = evento.target.files?.[0]
              evento.target.value = ''
              if (elegido) ejecutar('pdf', '', elegido)
            }}
          />
          <button type="button" className="slapp-subir" onClick={() => archivoRef.current?.click()}>
            <Icono nombre="pdf" />
            Subir un PDF
          </button>
        </div>
      )}

      <section className="slapp-bloque" aria-labelledby="slapp-ultimos">
        <h2 id="slapp-ultimos">Lo que revisaste</h2>
        {agrupados.length > 0 ? (
          <div className="slapp-filtros" role="group" aria-label="Filtrar por color">
            {FILTROS.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                className={`slapp-filtro slapp-filtro-${opcion.id}${filtro === opcion.id ? ' slapp-filtro-activo' : ''}`}
                aria-pressed={filtro === opcion.id}
                onClick={() => setFiltro(opcion.id)}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
        ) : null}
        {revisados.cargando ? (
          <p className="slapp-vacio">Buscando tus revisiones…</p>
        ) : revisados.error ? (
          <p className="slapp-vacio">No se pudieron leer tus revisiones. Probá de nuevo en un rato.</p>
        ) : agrupados.length === 0 ? (
          <div className="slapp-vacio">
            <p className="slapp-vacio-titulo">
              {sesion ? 'Todavía no revisaste nada.' : 'Sin cuenta, lo que revisás no se guarda.'}
            </p>
            <p>Probá con algo que te llegó: el enlace de un SMS, un WhatsApp que te pide datos o un PDF adjunto.</p>
          </div>
        ) : filtrados.length === 0 ? (
          <p className="slapp-vacio">No hay revisiones con ese color.</p>
        ) : (
          <>
            {dias.map((dia) => (
              <div key={dia.titulo} className="slapp-dia">
                <h3>{dia.titulo}</h3>
                <ListaActividad>
                  {dia.items.map((item) => (
                    <FilaActividad
                      key={item.id}
                      item={item}
                      onClick={() => abrirRevisado(item)}
                      acciones={accionesDe(item)}
                    />
                  ))}
                </ListaActividad>
              </div>
            ))}
            {sesion ? <p className="slapp-ayuda">Deslizá una fila hacia la izquierda para borrarla o revisarla de nuevo.</p> : null}
          </>
        )}
      </section>
    </form>
  )
}

export default SafeLink
