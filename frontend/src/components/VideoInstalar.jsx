import { useRef, useState } from 'react'
import { DURACION, PASOS_INSTALAR } from '../lib/instalarExtension.js'
import { capituloEn } from '../lib/recorridoApp.js'
import { elementoVisible } from '../lib/reproduccion.js'
import './VideoInstalar.css'

const TEMAS = ['claro', 'oscuro']
const DESCRIPCION =
  'Animación de cómo instalar SafeLink en Chrome: descargar el archivo, descomprimirlo, abrir chrome://extensions, activar el modo de desarrollador, cargar la carpeta y fijar la extensión.'

function VideoInstalar() {
  const videos = useRef({})
  const [tiempo, setTiempo] = useState(0)
  const actual = capituloEn(tiempo, PASOS_INSTALAR)

  function irA(indice) {
    const video = elementoVisible(TEMAS.map((tema) => videos.current[tema]))
    const inicio = PASOS_INSTALAR[indice].inicio
    setTiempo(inicio)
    if (!video) return
    video.currentTime = inicio
    video.play().catch(() => {})
  }

  return (
    <div className="video-instalar">
      <div className="video-instalar-marco">
        {TEMAS.map((tema) => (
          <video
            key={tema}
            ref={(el) => {
              videos.current[tema] = el
            }}
            className={`video-instalar-video video-instalar-${tema}`}
            src={`/capturas/instalar-extension-${tema}.mp4`}
            poster={`/capturas/instalar-extension-${tema}.webp`}
            width="1280"
            height="720"
            controls
            muted
            playsInline
            preload="none"
            aria-label={DESCRIPCION}
            onTimeUpdate={(evento) => setTiempo(evento.currentTarget.currentTime)}
          />
        ))}
      </div>
      <ol className="video-instalar-pasos" aria-label={`Pasos para instalar, ${Math.round(DURACION)} segundos de video`}>
        {PASOS_INSTALAR.map((paso, indice) => (
          <li key={paso.id}>
            <button
              type="button"
              className={indice === actual ? 'video-instalar-paso video-instalar-actual' : 'video-instalar-paso'}
              aria-current={indice === actual ? 'step' : undefined}
              onClick={() => irA(indice)}
            >
              <span className="video-instalar-numero">{indice + 1}</span>
              <span>
                <strong>{paso.titulo}</strong>
                <span>{paso.texto}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default VideoInstalar
