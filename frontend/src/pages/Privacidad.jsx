import { Link } from 'react-router'
import Marco from '../components/Marco.jsx'
import './Modulo.css'

function Privacidad() {
  return (
    <Marco interior>
      <div className="container nota">
        <div className="eyebrow">Privacidad</div>
        <p className="nota-aviso">Este documento está en elaboración y puede cambiar.</p>
        <h1>Qué hace SafeGuard con los datos</h1>
        <p>
          Esta página describe solo lo que se puede leer en el código de esta
          versión.
        </p>

        <h2>SafeLink: qué se analiza</h2>
        <ul>
          <li>Enlaces, desde el panel de enlaces.</li>
          <li>Textos de WhatsApp, desde el panel de WhatsApp.</li>
          <li>PDFs, leídos en el navegador con pdf.js. El archivo no se manda a la función de enriquecimiento.</li>
          <li>Correos, desde el panel de correo (encabezados que pegás ahí).</li>
          <li>
            Códigos QR y la extensión de Chrome: Pendiente de definir. Ese
            código no está en este repositorio.
          </li>
        </ul>

        <h2>SafeLink: qué sale del navegador</h2>
        <p>
          Al revisar un enlace, la función <code>safelink-enriquecer</code> pide
          esa URL (sigue hasta cinco redirecciones y no consulta direcciones
          privadas), lee solo el comienzo de la página (el título, si pide una
          clave y si el destino es una descarga) y consulta el dominio en
          rdap.org y en crt.sh. No guarda el contenido de la página. También se
          busca el dominio en la tabla propia <code>amenazas</code>.
        </p>
        <p>
          Pendiente de definir. El texto del WhatsApp, el correo y el PDF se leen
          en el navegador. Si ahí aparece un enlace, esa dirección se manda a la
          misma función. El archivo y el mensaje completo no se suben; lo que se
          guarda después es el resultado.
        </p>

        <h2>SafeLink: qué se guarda con cuenta</h2>
        <p>
          Con sesión, <code>guardarAnalisis</code> inserta en{' '}
          <code>safelink_analisis</code> el id del usuario, la URL analizada, el
          dominio, el nivel, la explicación (los motivos unidos), la puntuación
          y el canal (<code>web</code>, <code>whatsapp</code>, <code>pdf</code> o{' '}
          <code>correo</code>).
        </p>
        <p>
          El panel exige iniciar sesión, así que desde la web el chequeo se
          guarda. Pendiente de definir. El sitio lo dice en SafeLink, pero el
          código de la extensión no está en este repositorio y no hay un
          análisis público sin sesión.
        </p>
        <p>Pendiente de definir.</p>

        <h2>PhishGuard: qué se registra</h2>
        <p>
          Por cada persona de la simulación el código guarda si hizo clic, si
          ingresó datos, si completó la capacitación y si vio el reconocimiento.
          La persona tiene nombre, correo y departamento, y el tablero los
          muestra uno por uno.
        </p>
        <p>
          Pendiente de definir. En <code>eventos_simulacion</code> no hay una
          columna de apertura.
        </p>
        <p>
          Pendiente de definir. El tablero de la app lista a cada persona por
          nombre. No hay en este código un PDF mensual generado.
        </p>

        <p>
          <Link to="/contacto">Contacto</Link>
        </p>
      </div>
    </Marco>
  )
}

export default Privacidad
