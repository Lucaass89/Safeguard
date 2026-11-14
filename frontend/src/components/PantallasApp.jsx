import { Link } from 'react-router'
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
    alt: 'Pantalla de inicio de la app: un campo para pegar un enlace y el juego "¿Estafa o real?" con un mensaje para adivinar si es estafa.',
  },
]

function PantallasApp() {
  return (
    <section className="pantallas" aria-labelledby="pantallas-titulo">
      <div className="pantallas-cabeza">
        <h2 id="pantallas-titulo">Así se ve en tu celular</h2>
        <p>
          Capturas reales de la app de SafeGuard para Android. Es la misma revisión que hacés en
          la web, con la cámara para leer códigos QR.
        </p>
      </div>
      <ul className="pantallas-lista">
        {PANTALLAS.map((pantalla) => (
          <li key={pantalla.id} className="pantallas-item">
            <div className="pantallas-telefono">
              <span className="pantallas-camara" aria-hidden="true" />
              <img
                className="pantallas-captura pantallas-captura-claro"
                src={`/capturas/app-${pantalla.id}-claro.webp`}
                alt={pantalla.alt}
                width="540"
                height="1099"
                loading="lazy"
                decoding="async"
              />
              <img
                className="pantallas-captura pantallas-captura-oscuro"
                src={`/capturas/app-${pantalla.id}-oscuro.webp`}
                alt={pantalla.alt}
                width="540"
                height="1099"
                loading="lazy"
                decoding="async"
              />
            </div>
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
