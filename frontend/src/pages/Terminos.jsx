import { Link } from 'react-router'
import Marco from '../components/Marco.jsx'
import './Modulo.css'

function Terminos() {
  return (
    <Marco interior>
      <div className="container nota">
        <p className="nota-aviso">
          Esta página resume el convenio de SafeGuard en palabras de todos los días.
          El texto completo se puede leer y descargar más abajo.
        </p>
        <h1>Términos y condiciones de servicio</h1>
        <p>
          SafeGuard tiene dos partes: SafeLink, para revisar un enlace, un mensaje, un
          PDF o un QR antes de abrirlo; y PhishGuard, para entrenar a un equipo con
          simulaciones de phishing. Al crear una cuenta, al pagar PhishGuard o al
          cargar personas para una campaña, aceptás estas condiciones.
        </p>

        <h2>En corto</h2>
        <ul>
          <li>PhishGuard es un ejercicio de capacitación. No es un ataque real.</li>
          <li>Solo se simula con las personas que la organización cargó y autorizó.</li>
          <li>La página de simulación no guarda contraseñas ni datos de pago.</li>
          <li>Los resultados sirven para enseñar. No se usan para sancionar ni para evaluar el desempeño.</li>
          <li>Quien administra puede borrar una campaña cuando quiera, con sus resultados.</li>
          <li>Los datos del equipo quedan en la organización. SafeGuard los usa solo para el ejercicio.</li>
        </ul>

        <h2>SafeLink</h2>
        <p>
          SafeLink marca un color y un motivo. No reemplaza al antivirus ni al
          firewall. Un verde dice que no hubo señales fuertes en esa revisión; una
          clave, un código o un pago igual no se hacen desde un enlace que llegó en
          un mensaje.
        </p>
        <p>
          La cuenta es opcional: guarda el historial y los reportes. Qué se analiza y
          qué sale del navegador está en <Link to="/privacidad">Privacidad</Link>.
        </p>

        <h2>PhishGuard: para qué sirve</h2>
        <p>
          PhishGuard manda un mensaje de prueba que parece un engaño, para que la
          persona practique antes de un caso real. El objeto es capacitar y medir el
          riesgo. Nadie busca credenciales, datos bancarios ni acceso a los sistemas
          de la organización.
        </p>
        <p>
          Quien administra la organización autoriza el envío al cargar a su equipo y
          al crear la campaña. Esa autorización cubre a esas personas, en ese canal
          y con esa plantilla. Quedan afuera menores de edad, cuentas compartidas y
          quien la organización marque como excluido.
        </p>

        <h2>Qué no hace una campaña</h2>
        <ul>
          <li>No usa malware, archivos ejecutables ni descargas.</li>
          <li>No guarda lo que alguien escribe en una pantalla de clave o de pago.</li>
          <li>No entra a correos, cuentas ni sistemas reales de la organización.</li>
          <li>No suplanta a una persona real del equipo sin autorización escrita.</li>
          <li>
            No usa marcas reales de bancos, organismos públicos ni empresas: las
            plantillas usan marcas ficticias o genéricas.
          </li>
          <li>
            No usa como anzuelo despidos, sanciones, aumentos, premios ni beneficios
            económicos, salud, fallecimientos ni datos sensibles. Algunas plantillas
            hablan de una compra, una cuota o una tasa, como los engaños reales, pero
            nunca cobran ni piden plata de verdad.
          </li>
        </ul>
        <p>
          Si alguien toca el enlace, ve en el momento que era una simulación y cómo
          reconocer las señales. Sin burlas y sin culpa. No tocar el enlace y
          desconfiar del mensaje es la conducta correcta. En WhatsApp y SMS, quien
          administra puede mandarle a esa persona el enlace «Lo hiciste bien», que
          la reconoce y queda registrado.
        </p>
        <p>
          El correo de la campaña sale directo a cada persona. WhatsApp y SMS se
          mandan desde quien administra, con el kit de la campaña.
        </p>

        <h2>Datos</h2>
        <p>
          La organización es responsable de los datos de su personal. SafeGuard los
          trata solo para el ejercicio: nombre, correo, área y lo que pasó en la
          simulación (envío, clic, datos ingresados, capacitación y reconocimiento).
          No se tratan datos sensibles ni contraseñas.
        </p>
        <p>
          La organización informa a su gente, por un medio interno, que hace
          simulaciones educativas. No adelanta el día ni el texto de cada campaña,
          para que el ejercicio sirva.
        </p>
        <p>
          Si una persona pide ver, corregir o borrar sus datos, SafeGuard colabora
          con la organización para responder. El detalle de cada producto está en{' '}
          <Link to="/privacidad">Privacidad</Link>.
        </p>

        <h2>Resultados y dignidad</h2>
        <p>
          El tablero y el informe existen para saber a quién acompañar. Quien
          administra ve los nombres de su equipo. La organización se compromete a no
          usar un resultado individual para sancionar, despedir ni como antecedente
          laboral.
        </p>
        <p>
          Los números agregados por área sirven para ver cómo responde el conjunto.
          Nadie queda señalado en un documento público.
        </p>

        <h2>Baja, plazo y responsabilidad</h2>
        <p>
          Quien administra puede borrar una campaña del listado cuando quiera: se
          borran la campaña y sus resultados, y el informe deja de contarlos. Cualquiera de las partes
          puede terminar el uso con aviso, sin penalidad.
        </p>
        <p>
          PhishGuard y SafeLink se entregan tal como están. No hay una promesa de
          que no vaya a haber un incidente real ni de un porcentaje de clics. Cada
          parte responde por lo que carga y por cumplir estas condiciones.
        </p>

        <h2>De quién es el producto</h2>
        <p>
          SafeGuard, PhishGuard, SafeLink, el código, el diseño y las plantillas
          pertenecen a quienes desarrollan el proyecto. La organización conserva sus
          datos y su marca. El uso de la plataforma no transfiere esa propiedad.
        </p>

        <h2>Ley</h2>
        <p>
          Estas condiciones se rigen por la ley argentina, incluida la Ley 25.326 de
          Protección de los Datos Personales y la Ley 26.388 de delitos informáticos.
          Un conflicto se intenta resolver de buena fe y, si hace falta, en los
          tribunales ordinarios de la Argentina.
        </p>

        <h2>Convenio completo</h2>
        <p>
          El convenio de piloto y autorización de simulación de phishing es el
          acuerdo escrito para una organización que corre un ejercicio con
          PhishGuard. Esta página lo cuenta en corto. El PDF tiene el texto
          completo, con anexos de alcance, plantillas y personas excluidas.
        </p>
        <p>
          <a href="/convenio-piloto-safeguard.pdf" download="convenio-piloto-safeguard.pdf">
            Descargar el convenio completo
          </a>
        </p>
        <p>
          <Link to="/privacidad">Privacidad</Link>
          {' · '}
          <Link to="/contacto">Contacto</Link>
        </p>
      </div>
    </Marco>
  )
}

export default Terminos
