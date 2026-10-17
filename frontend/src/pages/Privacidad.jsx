import { Link } from 'react-router'
import Marco from '../components/Marco.jsx'
import './Modulo.css'

function Privacidad() {
  return (
    <Marco interior>
      <div className="container nota">
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
            La extensión de Chrome, en la carpeta <code>extension</code> y en el
            archivo <code>safelink.zip</code> que se descarga desde SafeLink: lee la
            dirección de la pestaña activa si es http o https. No lee el contenido
            de la página y no bloquea la navegación.
          </li>
          <li>
            Códigos QR, en <code>/panel/qr</code>: la cámara del celular lee el código
            en el aparato con la API nativa del navegador (<code>BarcodeDetector</code>).
            La imagen no se sube; solo la dirección que trae el código se manda a la
            misma función que un enlace pegado a mano.
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
        <p>
          Faro explica el resultado que ya está. La función <code>safelink-faro</code> recibe
          el nivel, los motivos, la pregunta y los últimos turnos del chat. No recibe el
          mensaje original, el enlace ni el archivo. Si el modelo no responde, la respuesta
          se arma en el navegador con ese mismo nivel y esos motivos.
        </p>

        <h2>SafeLink: qué se guarda con cuenta</h2>
        <p>
          Con sesión, <code>guardarAnalisis</code> inserta en{' '}
          <code>safelink_analisis</code> el id del usuario, la URL analizada, el
          dominio, el nivel, la explicación (los motivos unidos), la puntuación
          y el canal (<code>web</code>, <code>whatsapp</code>, <code>pdf</code>,{' '}
          <code>correo</code> o <code>qr</code>).
        </p>
        <p>
          El panel exige iniciar sesión, así que desde la web el chequeo se
          guarda. La extensión no escribe en <code>safelink_analisis</code>. Si{' '}
          <code>extension/config.js</code> tiene la clave publishable, manda la
          dirección a <code>safelink-enriquecer</code> y consulta{' '}
          <code>amenazas</code>, igual que el panel. Sin esa clave, el color sale
          solo de la dirección y no sale nada del navegador.
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
          Abrir el enlace de la simulación deja <code>mail_abierto</code>. El botón
          Entendido deja <code>completo_capacitacion</code>.
        </p>
        <p>
          Si la persona toca el enlace, <code>phishguard-avisar-caida</code> manda un
          aviso corto al correo del administrador y del técnico de esa organización.
          El aviso dice el nombre, el área y cuántos del área tocaron el enlace en esa
          campaña. Se manda una sola vez por persona y campaña. Si el correo no sale,
          la simulación sigue igual.
        </p>
        <p>
          El informe en <code>/panel/informe</code> usa los mismos datos del tablero.
          Quien administra puede guardarlo o imprimirlo desde el navegador. Lista a
          cada persona por nombre, para esa cuenta, y el texto dice que no es una
          sanción.
        </p>

        <p>
          <Link to="/contacto">Contacto</Link>
        </p>
      </div>
    </Marco>
  )
}

export default Privacidad
