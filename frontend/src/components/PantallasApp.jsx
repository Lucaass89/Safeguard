import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { debeReproducirse, elementoVisible, leerModo, UMBRAL_VISIBLE } from '../lib/reproduccion.js'
import './PantallasApp.css'

const PANTALLAS = [
  {
    id: 'enlace',
    titulo: 'Pegás un enlace',
    texto: 'Te dice el color, el motivo y qué hacer. Acá, una página que imita al Banco Nación.',
    alt: 'Pantalla de SafeLink en la app: el enlace bna-acceso.com sale como Peligroso porque usa el nombre de Banco Nación sin ser su dominio oficial.',
  },
  {
    id: 'mensaje',
    titulo: 'Pegás un mensaje',
    texto: 'Lee el texto de un WhatsApp o un SMS y marca el engaño, como el clásico "cambié de número".',
    alt: 'Pantalla de SafeLink en la app: un WhatsApp que dice "Hola ma, cambié de número" y pide una transferencia sale como Peligroso.',
  },
  {
    id: 'inicio',
    titulo: 'Practicás en el inicio',
    texto: 'Un juego corto de "¿Estafa o real?" para entrenar el ojo con mensajes de bancos, envíos y trámites.',
    alt: 'Pantalla de inicio de la app: el juego "¿Estafa o real?" con un mensaje y la explicación de por qué era real o una estafa.',
  },
]

const TEMAS = ['claro', 'oscuro']

function Telefono({ pantalla, modo }) {
  const caja = useRef(null)
  const videos = useRef({})
  const [apuntado, setApuntado] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pedido, setPedido] = useState(false)
  const [enMovimiento, setEnMovimiento] = useState(false)
  const reproducir = debeReproducirse({ modo, apuntado, visible, pedido })

  useEffect(() => {
    if (modo !== 'pantalla' || !caja.current || typeof IntersectionObserver !== 'function') return undefined
    const observador = new IntersectionObserver(
      ([entrada]) => setVisible(entrada.isIntersecting && entrada.intersectionRatio >= UMBRAL_VISIBLE),
      { threshold: [0, UMBRAL_VISIBLE, 1] },
    )
    observador.observe(caja.current)
    return () => observador.disconnect()
  }, [modo])

  useEffect(() => {
    const lista = TEMAS.map((tema) => videos.current[tema])
    const activo = elementoVisible(lista)
    for (const video of lista) {
      if (video && video !== activo) video.pause()
    }
    if (!activo) return
    if (reproducir) {
      activo.currentTime = 0
      activo.play().catch(() => {})
    } else {
      activo.pause()
    }
  }, [reproducir])

  const eventosApuntar =
    modo === 'apuntar'
      ? {
          onMouseEnter: () => setApuntado(true),
          onMouseLeave: () => setApuntado(false),
          onFocus: () => setApuntado(true),
          onBlur: () => setApuntado(false),
          tabIndex: 0,
          'aria-label': `${pantalla.titulo}: pasá el mouse o enfocá para ver cómo funciona`,
        }
      : {}

  return (
    <div
      ref={caja}
      className={`pantallas-telefono${enMovimiento ? ' pantallas-en-movimiento' : ''}`}
      {...eventosApuntar}
    >
      <span className="pantallas-camara" aria-hidden="true" />
      <div className="pantallas-pantalla">
        {TEMAS.map((tema) => (
          <video
            key={`video-${tema}`}
            ref={(el) => {
              videos.current[tema] = el
            }}
            className={`pantallas-video pantallas-captura-${tema}`}
            src={`/capturas/app-${pantalla.id}-${tema}.mp4`}
            width="540"
            height="1100"
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => setEnMovimiento(true)}
            onPause={() => setEnMovimiento(false)}
          />
        ))}
        {TEMAS.map((tema) => (
          <img
            key={`foto-${tema}`}
            className={`pantallas-captura pantallas-captura-${tema}`}
            src={`/capturas/app-${pantalla.id}-${tema}.webp`}
            alt={pantalla.alt}
            width="540"
            height="1100"
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>
      {modo === 'apuntar' && (
        <span className="pantallas-pista" aria-hidden="true">
          <span className="pantallas-pista-icono" />
          Pasá el mouse
        </span>
      )}
      {modo === 'boton' && (
        <button
          type="button"
          className="pantallas-pista pantallas-pista-boton"
          aria-pressed={pedido}
          onClick={() => setPedido((antes) => !antes)}
        >
          <span className={pedido ? 'pantallas-pista-pausa' : 'pantallas-pista-icono'} aria-hidden="true" />
          {pedido ? 'Pausar' : 'Ver cómo funciona'}
        </button>
      )}
    </div>
  )
}

function PantallasApp() {
  const [modo] = useState(() => leerModo())

  return (
    <section className="pantallas" aria-labelledby="pantallas-titulo">
      <div className="pantallas-cabeza">
        <h2 id="pantallas-titulo">Así se ve en tu celular</h2>
        <p>
          Grabaciones reales de la app de SafeGuard para Android. Es la misma revisión que hacés en
          la web, con la cámara para leer códigos QR.
        </p>
      </div>
      <ul className="pantallas-lista">
        {PANTALLAS.map((pantalla) => (
          <li key={pantalla.id} className="pantallas-item">
            <Telefono pantalla={pantalla} modo={modo} />
            <h3>{pantalla.titulo}</h3>
            <p>{pantalla.texto}</p>
          </li>
        ))}
      </ul>
      <p className="pantallas-pie">
        <Link className="portada-boton" to="/personas">Probar SafeLink gratis</Link>
      </p>
    </section>
  )
}

export default PantallasApp
