import { useRef, useState } from 'react'
import { useAnalisisPropios } from '../lib/useAnalisisPropios.js'
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

// TODO: reemplazar por el análisis real de cada tipo.
const RESULTADOS = {
  enlace: {
    nivel: 'peligroso',
    motivos: [
      'El dominio se registró hace 4 días.',
      'El camino imita el ingreso de un banco.',
      'La página pide una clave.',
    ],
  },
  mensaje: {
    nivel: 'sospechoso',
    motivos: [
      'Te apura para pagar antes de hoy.',
      'El enlace del mensaje no coincide con la marca que nombra.',
    ],
  },
  pdf: {
    nivel: 'sospechoso',
    motivos: [
      'El archivo esconde un enlace a otro sitio.',
      'Pide abrir un programa al descargarlo.',
    ],
  },
  correo: {
    nivel: 'seguro',
    motivos: [
      'El remitente coincide con el dominio de la empresa.',
      'No hay enlaces acortados ni pedido de clave.',
    ],
  },
  qr: {
    nivel: 'peligroso',
    motivos: [
      'El código lleva a un sitio distinto del que muestra.',
      'Ese sitio pide datos de la tarjeta.',
    ],
  },
}

const VEREDICTO = {
  seguro: 'Seguro',
  sospechoso: 'Sospechoso',
  peligroso: 'Peligroso',
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

  if (nombre === 'seguro') {
    return (
      <svg {...trazo}>
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12.2 2.3 2.3 4.7-5" />
      </svg>
    )
  }

  if (nombre === 'sospechoso') {
    return (
      <svg {...trazo}>
        <path d="M12 4.5 20 19H4L12 4.5Z" />
        <path d="M12 10v4.2" />
        <path d="M12 16.8h.01" />
      </svg>
    )
  }

  if (nombre === 'peligroso') {
    return (
      <svg {...trazo}>
        <circle cx="12" cy="12" r="8" />
        <path d="m9 9 6 6M15 9l-6 6" />
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

function Resultado({ resultado, reportado, aviso, onCerrar, onReportar, onCompartir }) {
  return (
    <section className={`sl-resultado sl-resultado-${resultado.nivel}`} aria-labelledby="sl-veredicto">
      <div className="sl-veredicto">
        <Icono nombre={resultado.nivel} />
      </div>
      <h2 id="sl-veredicto">{VEREDICTO[resultado.nivel]}</h2>
      <p className="sl-resultado-que">{resultado.resumen}</p>
      <ul className="sl-motivos">
        {resultado.motivos.map((motivo) => (
          <li key={motivo}>{motivo}</li>
        ))}
      </ul>
      <div className="sl-acciones">
        <button type="button" className="sl-revisar" onClick={onCerrar}>
          No abrir
        </button>
        <button type="button" className="sl-secundario" onClick={onReportar} disabled={reportado}>
          {reportado ? 'Reportado' : 'Reportar'}
        </button>
        <button type="button" className="sl-secundario" onClick={onCompartir}>
          Compartir alerta
        </button>
      </div>
      {aviso ? <p className="sl-aviso">{aviso}</p> : null}
    </section>
  )
}

function SafeLink() {
  const archivoRef = useRef(null)
  const [tipo, setTipo] = useState('enlace')
  const [entrada, setEntrada] = useState('')
  const [archivo, setArchivo] = useState('')
  const [camaraLista, setCamaraLista] = useState(false)
  const [aviso, setAviso] = useState('')
  const [resultado, setResultado] = useState(null)
  const [reportado, setReportado] = useState(false)
  const revisados = useAnalisisPropios({ limite: 10, soloHoy: true })
  const campo = CAMPOS[tipo]

  function elegirTipo(siguiente) {
    setTipo(siguiente)
    setAviso('')
    if (siguiente !== 'pdf') setArchivo('')
    if (siguiente !== 'qr') setCamaraLista(false)
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

  function revisar(evento) {
    evento.preventDefault()
    if (tipo === 'pdf' && !archivo) {
      setAviso('Elegí un PDF para revisarlo.')
      return
    }
    if (tipo === 'qr' && !camaraLista) {
      setAviso('Abrí la cámara para leer el código.')
      return
    }
    if (campo && !entrada.trim()) {
      setAviso('Pegá algo para revisarlo.')
      return
    }
    const base = RESULTADOS[tipo]
    setReportado(false)
    setAviso('')
    setResultado({
      nivel: base.nivel,
      motivos: base.motivos,
      resumen: resumenDe(tipo, entrada, archivo),
    })
  }

  function abrirRevisado(item) {
    setReportado(false)
    setAviso('')
    setResultado({
      nivel: item.nivel,
      motivos: item.motivos,
      resumen: item.texto,
    })
  }

  function reportar() {
    // TODO: enviar el reporte al servidor.
    setReportado(true)
    setAviso('Quedó el reporte. No lo abras.')
  }

  async function compartir() {
    const texto = `SafeLink: ${VEREDICTO[resultado.nivel]}. ${resultado.motivos.join(' ')}`
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

  if (resultado) {
    return (
      <div className="sl">
        <Resultado
          resultado={resultado}
          reportado={reportado}
          aviso={aviso}
          onCerrar={() => {
            setResultado(null)
            setAviso('')
          }}
          onReportar={reportar}
          onCompartir={compartir}
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
          <button
            type="button"
            className="sl-grande"
            aria-pressed={camaraLista}
            onClick={() => {
              setCamaraLista(true)
              setAviso('')
            }}
          >
            <Icono nombre="qr" />
            <span>{camaraLista ? 'Cámara lista' : 'Abrir la cámara'}</span>
            <span className="sl-grande-nota">
              {camaraLista ? 'Tocá Revisar para ver el código' : 'Leé el QR antes de abrirlo'}
            </span>
          </button>
        </div>
      )}

      {aviso ? <p className="sl-aviso">{aviso}</p> : null}

      <button type="submit" className="sl-revisar">
        Revisar
      </button>

      <section className="sl-bloque" aria-labelledby="sl-hoy">
        <h2 id="sl-hoy">Revisados hoy</h2>
        {revisados.cargando ? (
          <p className="sl-vacio">Buscando tus revisiones…</p>
        ) : revisados.error ? (
          <p className="sl-vacio">No se pudieron leer tus revisiones. Probá de nuevo en un rato.</p>
        ) : revisados.items.length === 0 ? (
          <p className="sl-vacio">Hoy todavía no revisaste nada.</p>
        ) : (
          <ul className="sl-lista">
            {revisados.items.map((item) => (
              <li key={item.id}>
                <button type="button" className="sl-item" onClick={() => abrirRevisado(item)}>
                  <span className="sl-item-texto">
                    <strong>{item.texto}</strong>
                    <span>
                      {item.tipo} · {item.cuando}
                    </span>
                  </span>
                  <span className={`sl-chip sl-chip-${item.nivel}`}>
                    <Icono nombre={item.nivel} />
                    {VEREDICTO[item.nivel]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </form>
  )
}

export default SafeLink
