import { Link } from 'react-router'
import Marco from '../components/Marco.jsx'
import ProbadorEnlace from '../components/ProbadorEnlace.jsx'
import { useSesion } from '../lib/useSesion.js'
import './Modulo.css'

const semaforo = [
  {
    nivel: 'verde',
    titulo: '✓ Verde',
    texto: 'No aparecieron señales de riesgo. Podés continuar.',
  },
  {
    nivel: 'amarillo',
    titulo: '! Amarillo',
    texto:
      'Hay algo raro: por ejemplo, el dominio se creó hace pocos días. Revisá antes de seguir.',
  },
  {
    nivel: 'rojo',
    titulo: '✕ Rojo',
    texto:
      'Hay señales fuertes de engaño o el sitio ya fue denunciado en SafeLink. No la abras.',
  },
]

const donde = [
  {
    titulo: 'En la computadora',
    texto:
      'La extensión de Chrome revisa la pestaña activa y muestra un ícono de color en la barra. Avisa, no bloquea la navegación.',
  },
  {
    titulo: 'En el celular',
    texto:
      'La app usa la cámara para leer el código QR y analiza el enlace antes de abrirlo, así no se escanea a ciegas.',
  },
  {
    titulo: 'En el portapapeles',
    texto:
      'Si copiás un enlace peligroso en el celular, SafeLink te avisa antes de que lo abras.',
  },
  {
    titulo: 'Con cuenta, tu historial',
    texto:
      'Cada análisis queda guardado en Mis enlaces para consultarlo o reportarlo. Sin cuenta, el chequeo no se guarda.',
  },
]

function Personas() {
  const { sesion } = useSesion()

  return (
    <Marco interior>
      <div className="container sl">
        <section className="sl-hero">
          <div className="sl-hero-texto">
            <h1>Antes del clic, un color y el motivo.</h1>
            <p>
              SafeLink revisa el enlace, el QR, el PDF o el mensaje que te
              llegó y te dice si conviene abrirlo. Es gratis y no necesitás
              cuenta.
            </p>
            <div className="sl-acciones">
              <a className="sl-boton" href="/safelink.zip" download="safelink.zip">
                Descargar la extensión
              </a>
              {sesion && (
                <Link className="sl-boton sl-boton-secundario" to="/panel/enlaces">
                  Mis enlaces
                </Link>
              )}
            </div>
          </div>
          <ProbadorEnlace />
        </section>

        <div className="sl-grilla">
          <div className="sl-cuerpo">
            <section>
              <h2>Un color, un motivo</h2>
              <div className="sl-bandas">
                {semaforo.map((item) => (
                  <article className={`sl-banda sl-${item.nivel}`} key={item.nivel}>
                    <h3>{item.titulo}</h3>
                    <p>{item.texto}</p>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <h2>Dónde aparece</h2>
              <dl className="sl-lugares">
                {donde.map((item) => (
                  <div key={item.titulo}>
                    <dt>{item.titulo}</dt>
                    <dd>
                      {item.texto}
                      {item.titulo === 'Con cuenta, tu historial' && (
                        <>
                          {' '}
                          <Link to="/privacidad">Qué se guarda está en Privacidad.</Link>
                        </>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section id="instalar">
              <h2>Extensión de Chrome</h2>
              <p>
                Revisa la pestaña que estás viendo y pone un color en el ícono de la barra.
                Avisa. No bloquea la página y no guarda el historial.{' '}
                <a href="/safelink.zip" download="safelink.zip">
                  Descargá la extensión
                </a>
                .
              </p>
              <ol className="sl-pasos">
                <li>Descargá el archivo y descomprimilo.</li>
                <li>Abrí la página de extensiones de Chrome y activá el modo de desarrollador.</li>
                <li>Elegí Cargar descomprimida y seleccioná la carpeta que se descomprimió.</li>
              </ol>
            </section>

            <p className="sl-gratis">
              La cuenta es opcional y solo guarda el historial y los reportes.
            </p>
          </div>
        </div>
      </div>
    </Marco>
  )
}

export default Personas
