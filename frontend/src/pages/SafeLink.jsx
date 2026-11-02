import { useRef, useState } from 'react'
import { Link } from 'react-router'
import FilaActividad, { ListaActividad } from '../components/FilaActividad.jsx'
import Resultado from '../components/Resultado.jsx'
import { agruparActividad } from '../lib/agruparActividad.js'
import { analizar } from '../lib/analisis.js'
import { analizarPdf } from '../lib/analisisPdf.js'
import {
  cerrarRevision,
  enlaceParaAbrir,
  guardarAnalisis,
  revisarCorreo,
  revisarEnlace,
  revisarWhatsapp,
} from '../lib/enriquecer.js'
import { useAnalisisPropios } from '../lib/useAnalisisPropios.js'
import { useSesion } from '../lib/useSesion.js'
import './SafeLink.css'

const TIPOS = [
  { id: 'enlace', etiqueta: 'Enlace' },
  { id: 'mensaje', etiqueta: 'Mensaje' },
  { id: 'pdf', etiqueta: 'PDF' },
  { id: 'correo', etiqueta: 'Correo' },
  { id: 'qr', etiqueta: 'QR' },
]

const CAMPOS = {
  enlace: { etiqueta: 'Enlace para revisar', placeholder: 'Pegá el enlace acá' },
  mensaje: { etiqueta: 'Mensaje para revisar', placeholder: 'Pegá el mensaje acá' },
  correo: { etiqueta: 'Correo para revisar', placeholder: 'Pegá el correo acá' },
}

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
        <path d="M9 5.5h6" />
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
      </svg>
    )
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

  return (
    <svg {...trazo}>
      <path d="M8 7h8M8 12h8M8 17h5" />
    </svg>
  )
}

function resumenDe(tipo, entrada, archivo) {
  if (tipo === 'pdf') return archivo || 'PDF'
  if (tipo === 'qr') return 'Código QR'
  const linea = entrada.trim().split('\n')[0]
  return linea.length > 72 ? `${linea.slice(0, 72)}…` : linea
}

function SafeLink() {
  const archivoRef = useRef(null)
  const [tipo, setTipo] = useState('enlace')
  const [entrada, setEntrada] = useState('')
  const [archivo, setArchivo] = useState('')
  const [pdf, setPdf] = useState(null)
  const [aviso, setAviso] = useState('')
  const [resultado, setResultado] = useState(null)
  const [revisando, setRevisando] = useState(false)
  const { sesion } = useSesion()
  const revisados = useAnalisisPropios({ limite: 20 })
  const ultimos = agruparActividad(revisados.items, 10)
  const campo = CAMPOS[tipo]
  const vacio = campo ? !entrada.trim() : tipo === 'pdf' && !pdf

  function elegirTipo(siguiente) {
    setTipo(siguiente)
    setAviso('')
    if (siguiente !== 'pdf') {
      setArchivo('')
      setPdf(null)
    }
  }

  async function pegar() {
    try {
      const texto = await navigator.clipboard.readText()
      if (!texto.trim()) {
        setAviso('El portapapeles está vacío.')
        return
      }
      setEntrada(texto.trim())
      setAviso('')
    } catch {
      setAviso('No se pudo leer el portapapeles. Pegalo con el dedo en el campo.')
    }
  }

  async function revisar(evento) {
    evento.preventDefault()
    if (revisando || tipo === 'qr') return
    if (tipo === 'pdf' && !pdf) {
      setAviso('Elegí un PDF para revisarlo.')
      return
    }
    if (campo && !entrada.trim()) {
      setAviso('Pegá algo para revisarlo.')
      return
    }
    if (tipo === 'enlace' && !analizar(entrada)) {
      setAviso('Eso no parece un enlace. Pegá la dirección completa, por ejemplo https://sitio.com.ar.')
      return
    }

    setAviso('')
    setRevisando(true)
    let final
    try {
      final = await revisarTipo(tipo, entrada.trim(), pdf)
    } catch {
      final = null
    }
    setRevisando(false)

    if (!final) {
      setAviso(tipo === 'pdf' ? 'No se pudo leer el PDF.' : 'No se pudo revisar. Probá de nuevo en un momento.')
      return
    }

    setResultado({
      id: crypto.randomUUID(),
      caso: final,
      canal: CANAL_DE[tipo],
      subtitulo: tipo === 'enlace' ? undefined : resumenDe(tipo, entrada, archivo),
    })

    if (sesion) {
      const texto = ENTRADA_DE[tipo] === 'whatsapp' ? entrada : null
      const { error } = await guardarAnalisis(sesion, final, ENTRADA_DE[tipo], texto)
      if (!error) revisados.recargar()
    }
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

  if (resultado) {
    return (
      <div className="sl">
        <Resultado
          casoId={resultado.id}
          resultado={resultado.caso}
          canal={resultado.canal}
          subtitulo={resultado.subtitulo}
          conFaro={false}
          onNoAbrir={() => {
            setResultado(null)
            setAviso('')
          }}
        />
      </div>
    )
  }

  return (
    <form className="sl" onSubmit={revisar}>
      <div className="sl-tipos" role="group" aria-label="Qué querés revisar">
        {TIPOS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tipo === item.id ? 'sl-tipo sl-tipo-activo' : 'sl-tipo'}
            aria-pressed={tipo === item.id}
            onClick={() => elegirTipo(item.id)}
          >
            {item.etiqueta}
          </button>
        ))}
      </div>

      {campo ? (
        <div className="sl-entrada">
          <label>
            <span className="sl-etiqueta">{campo.etiqueta}</span>
            <textarea
              value={entrada}
              onChange={(evento) => {
                setEntrada(evento.target.value)
                if (aviso) setAviso('')
              }}
              placeholder={campo.placeholder}
              rows={5}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </label>
          <button type="button" className="sl-pegar" onClick={pegar}>
            <Icono nombre="pegar" />
            Pegar
          </button>
        </div>
      ) : tipo === 'pdf' ? (
        <div className="sl-entrada">
          <input
            ref={archivoRef}
            className="sl-archivo-input"
            type="file"
            accept="application/pdf,.pdf"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(evento) => {
              const elegido = evento.target.files?.[0]
              setArchivo(elegido ? elegido.name : '')
              setPdf(elegido ?? null)
              setAviso('')
            }}
          />
          <button type="button" className="sl-grande" onClick={() => archivoRef.current?.click()}>
            <Icono nombre="pdf" />
            <span>Elegir archivo</span>
            <span className="sl-grande-nota">{archivo || 'Un PDF, antes de abrirlo'}</span>
          </button>
        </div>
      ) : (
        <div className="sl-entrada">
          <Link className="sl-grande" to="/safelink/qr">
            <Icono nombre="qr" />
            <span>Abrir la cámara</span>
            <span className="sl-grande-nota">Leé el QR antes de abrirlo</span>
          </Link>
        </div>
      )}

      {aviso ? (
        <p className="sl-aviso" role="status">
          {aviso}
        </p>
      ) : null}

      {tipo === 'qr' ? null : (
        <button type="submit" className="sl-revisar" disabled={revisando || vacio} aria-busy={revisando}>
          {revisando ? 'Revisando…' : 'Revisar'}
        </button>
      )}

      <section className="sl-bloque" aria-labelledby="sl-ultimos">
        <h2 id="sl-ultimos">Últimos revisados</h2>
        {revisados.cargando ? (
          <p className="sl-vacio">Buscando tus revisiones…</p>
        ) : revisados.error ? (
          <p className="sl-vacio">No se pudieron leer tus revisiones. Probá de nuevo en un rato.</p>
        ) : ultimos.length === 0 ? (
          <div className="sl-vacio">
            <p className="sl-vacio-titulo">
              {sesion ? 'Todavía no revisaste nada.' : 'Sin cuenta, lo que revisás no se guarda.'}
            </p>
            <p>
              Probá con algo que te llegó: el enlace de un SMS, un WhatsApp que te pide datos, un PDF adjunto o
              el QR de un cartel.
            </p>
          </div>
        ) : (
          <ListaActividad>
            {ultimos.map((item) => (
              <FilaActividad key={item.id} item={item} onClick={() => abrirRevisado(item)} />
            ))}
          </ListaActividad>
        )}
      </section>
    </form>
  )
}

export default SafeLink
