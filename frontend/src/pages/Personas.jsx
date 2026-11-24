import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import BuscadorPortada from '../components/BuscadorPortada.jsx'
import Marco from '../components/Marco.jsx'
import VideoInstalar from '../components/VideoInstalar.jsx'
import { useSesion } from '../lib/useSesion.js'
import './Personas.css'

const QUE_REVISA = ['Enlaces', 'Códigos QR', 'Mensajes de WhatsApp o SMS', 'Correos', 'PDF']

const semaforo = [
  {
    nivel: 'verde',
    titulo: 'Seguro',
    simbolo: '✓',
    texto: 'No aparecieron señales de riesgo. Igual, mirá que la dirección sea la del sitio oficial.',
  },
  {
    nivel: 'amarillo',
    titulo: 'Precaución',
    simbolo: '!',
    texto: 'Hay algo raro, por ejemplo un sitio creado hace pocos días. Revisá bien antes de seguir.',
  },
  {
    nivel: 'rojo',
    titulo: 'Peligroso',
    simbolo: '✕',
    texto: 'Hay señales fuertes de engaño o el sitio ya fue denunciado. No lo abras ni pongas datos.',
  },
]

const TRAZOS = {
  web: ['M4 5.5h16v11H4z', 'M9 20h6', 'M12 16.5V20'],
  chrome: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', 'M12 8.5h8.2', 'M9 13.8 4.9 6.8', 'M15 13.8l-4 7.1'],
  celular: ['M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5Z', 'M11 17.5h2'],
  faro: ['M6 5.5h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 3v-3a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z', 'M9 11h.01M12 11h.01M15 11h.01'],
}

const donde = [
  {
    icono: 'web',
    titulo: 'En la web',
    texto: 'Pegás lo que te llegó y te decimos el color al instante. Sin instalar nada.',
  },
  {
    icono: 'celular',
    titulo: 'En el celular',
    texto: 'La app para Android lee códigos QR con la cámara, revisa lo que te comparten por WhatsApp y te avisa si copiás un enlace peligroso.',
  },
  {
    icono: 'chrome',
    titulo: 'En Chrome',
    texto: 'La extensión revisa la página que estás viendo y pone un color en el ícono. Avisa, no bloquea.',
  },
  {
    icono: 'faro',
    titulo: 'Con Faro',
    texto: 'Un chat que te explica cada resultado con palabras simples: por qué dio ese color y qué hacer.',
  },
]

function Icono({ nombre }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

function useApk() {
  const [apk, setApk] = useState('/app/safeguard-1.4.apk')
  useEffect(() => {
    let activo = true
    fetch('/app/version.json', { cache: 'no-store' })
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((datos) => {
        if (activo && typeof datos?.archivo === 'string' && datos.archivo.startsWith('/app/')) setApk(datos.archivo)
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])
  return apk
}

function Personas() {
  const { sesion } = useSesion()
  const apk = useApk()

  return (
    <Marco interior>
      <div className="pe">
        <section className="pe-hero" aria-labelledby="pe-titulo">
          <div className="pe-ancho pe-hero-centro">
            <p className="pe-eti">SafeLink · Para vos · Gratis</p>
            <h1 id="pe-titulo">Antes del clic, un color y el motivo.</h1>
            <p className="pe-sub">
              SafeLink revisa lo que te llegó y te dice si conviene abrirlo. Es gratis y no necesitás cuenta.
            </p>
            <BuscadorPortada />
            <ul className="pe-revisa" aria-label="Qué podés revisar">
              {QUE_REVISA.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <div className="pe-ancho pe-cuerpo">
          <section aria-labelledby="pe-colores">
            <h2 id="pe-colores">Qué significa cada color</h2>
            <div className="pe-colores">
              {semaforo.map((item) => (
                <article key={item.nivel} className={`pe-color pe-color-${item.nivel}`}>
                  <span className="pe-color-simbolo" aria-hidden="true">
                    {item.simbolo}
                  </span>
                  <h3>{item.titulo}</h3>
                  <p>{item.texto}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="pe-donde">
            <h2 id="pe-donde">Usalo donde te quede cómodo</h2>
            <div className="pe-donde">
              {donde.map((item) => (
                <article key={item.titulo} className="pe-lugar">
                  <span className="pe-lugar-icono">
                    <Icono nombre={item.icono} />
                  </span>
                  <h3>{item.titulo}</h3>
                  <p>{item.texto}</p>
                </article>
              ))}
            </div>
            <div className="pe-acciones">
              <a className="pe-boton" href={apk} download>
                Bajar la app para Android
              </a>
              <a className="pe-boton-sec" href="#instalar">
                Instalar la extensión de Chrome
              </a>
              {sesion ? (
                <Link className="pe-boton-sec" to="/panel/historial">
                  Ver lo que revisé
                </Link>
              ) : null}
            </div>
          </section>

          <section id="instalar" className="pe-extension" aria-labelledby="pe-extension-titulo">
            <div className="pe-extension-texto">
              <p className="pe-eti">Extensión de Chrome</p>
              <h2 id="pe-extension-titulo">Que SafeLink te avise solo</h2>
              <p>
                Revisa la página que estás viendo y pone un color en el ícono de la barra. No bloquea nada y no guarda
                tu historial.
              </p>
              <p>
                Todavía no está en la tienda de Chrome, así que se instala a mano en el modo de desarrollador. Mirá el
                video: son seis pasos.
              </p>
              <a className="pe-boton" href="/safelink.zip" download="safelink.zip">
                Descargar la extensión
              </a>
            </div>
            <div className="pe-extension-video">
              <VideoInstalar />
            </div>
          </section>

          <section className="pe-cierre" aria-labelledby="pe-cierre-titulo">
            <h2 id="pe-cierre-titulo">¿Querés guardar lo que revisás?</h2>
            <p>
              La cuenta es opcional. Solo guarda tu historial y tus reportes, para que los veas en la web y en la app.{' '}
              <Link to="/privacidad">Qué se guarda</Link>.
            </p>
            <Link className="pe-boton" to={sesion ? '/panel?app=safelink' : '/ingresar'}>
              {sesion ? 'Ir a SafeLink' : 'Crear mi cuenta gratis'}
            </Link>
          </section>
        </div>
      </div>
    </Marco>
  )
}

export default Personas
