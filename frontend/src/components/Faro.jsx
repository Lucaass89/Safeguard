import { useEffect, useId, useRef, useState } from 'react'
import { consultarFaro } from '../lib/consultarFaro.js'
import { PREGUNTAS_LISTAS, SALUDO, plano, recortarTexto } from '../lib/faro.js'
import './Faro.css'

function Robot({ pensando, grande }) {
  return (
    <svg
      className={pensando ? 'faro-robot faro-pensando' : 'faro-robot'}
      data-grande={grande ? 'si' : 'no'}
      viewBox="0 0 72 90"
      aria-hidden="true"
    >
      <line x1="36" y1="16" x2="36" y2="8" stroke="#2a9a96" strokeWidth="2" />
      <circle cx="36" cy="6" r="3" fill="#2a9a96" />
      <circle cx="36" cy="34" r="20" fill="#e7eef4" stroke="#b7c9d4" strokeWidth="1.5" />
      <g className="faro-visor">
        <rect x="20" y="30" width="32" height="12" rx="6" fill="#2f9e6b" />
        <rect x="24" y="33" width="10" height="3" rx="1.5" fill="#fff" opacity="0.45" />
      </g>
      <rect x="22" y="50" width="28" height="32" rx="12" fill="#1a3044" />
      <path d="M36 58 L45 61.5 V70 C45 75 36 79 36 79 C36 79 27 75 27 70 V61.5 Z" fill="#2a9a96" />
      <path
        d="M32.2 68.8 L35 71.6 L40.8 65.2"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Faro({ casoId, nivel, motivos }) {
  const campoId = useId()
  const entrada = useRef(null)
  const casoActual = useRef(casoId)
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState([])
  const [borrador, setBorrador] = useState('')
  const [pensando, setPensando] = useState(false)

  useEffect(() => {
    casoActual.current = casoId
    setAbierto(false)
    setMensajes([])
    setBorrador('')
    setPensando(false)
  }, [casoId])

  useEffect(() => {
    if (abierto) entrada.current?.focus()
  }, [abierto])

  function abrir() {
    setAbierto(true)
    setMensajes([{ rol: 'faro', texto: SALUDO }])
  }

  async function preguntar(texto) {
    const visible = recortarTexto(texto)
    const caso = casoId
    if (!visible || !/[a-z0-9]/i.test(plano(visible))) {
      setMensajes((prev) => [
        ...prev,
        {
          rol: 'faro',
          texto: 'Escribí la duda en una frase. No hace falta pegar el mensaje ni el enlace.',
        },
      ])
      setBorrador('')
      return
    }

    const previos = mensajes.slice(-6)
    setMensajes((prev) => [...prev, { rol: 'vos', texto: visible }])
    setBorrador('')
    setPensando(true)
    const respuesta = await consultarFaro(nivel, motivos, visible, previos)
    if (casoActual.current !== caso) return
    setMensajes((prev) => [...prev, { rol: 'faro', texto: respuesta }])
    setPensando(false)
  }

  if (!abierto) {
    return (
      <button type="button" className="faro-abrir" onClick={abrir}>
        <Robot />
        <span>¿Preguntale a Faro?</span>
      </button>
    )
  }

  return (
    <section className="faro" aria-label="Faro">
      <div className="faro-panel">
        <p className="faro-nota">Faro no vuelve a leer el mensaje y no cambia el semáforo.</p>
        <div className="faro-cuerpo">
          <Robot pensando={pensando} grande />
          <div className="faro-dialogo" aria-busy={pensando}>
          <ol className="faro-mensajes">
            {mensajes.map((mensaje, indice) => (
              <li key={`${mensaje.rol}-${indice}`} className={mensaje.rol === 'faro' ? 'faro-msg-faro' : 'faro-msg-vos'}>
                <span className="faro-quien">{mensaje.rol === 'faro' ? 'Faro' : 'Vos'}</span>
                <p>{mensaje.texto}</p>
              </li>
            ))}
          </ol>
          {pensando && (
            <p className="faro-pensando-texto" role="status" aria-live="polite">
              Faro está pensando…
            </p>
          )}
          <ul className="faro-listas">
            {PREGUNTAS_LISTAS.map((pregunta) => (
              <li key={pregunta}>
                <button type="button" disabled={pensando} onClick={() => preguntar(pregunta)}>
                  {pregunta}
                </button>
              </li>
            ))}
          </ul>
          <form
            className="faro-form"
            onSubmit={(evento) => {
              evento.preventDefault()
              preguntar(borrador)
            }}
          >
            <label className="faro-campo" htmlFor={campoId}>
              Otra pregunta
            </label>
            <input
              id={campoId}
              ref={entrada}
              value={borrador}
              maxLength={280}
              disabled={pensando}
              autoComplete="off"
              onChange={(evento) => setBorrador(evento.target.value)}
            />
            <button type="submit" className="faro-enviar" disabled={pensando || !borrador.trim()}>
              Preguntar
            </button>
          </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Faro
