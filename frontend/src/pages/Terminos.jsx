import { Link } from 'react-router'
import { EnCorto, Indice, Marca, Seccion } from '../components/Legal.jsx'
import Marco from '../components/Marco.jsx'
import './Legal.css'

const EN_CORTO = [
  'PhishGuard es un ejercicio de capacitación. No es un ataque real.',
  'Solo se simula con las personas que la organización cargó y autorizó.',
  'La página de simulación no guarda contraseñas ni datos de pago.',
  'Los resultados sirven para enseñar. No se usan para sancionar ni para evaluar el desempeño.',
  'Quien administra puede pausar o cancelar una campaña.',
  'Los datos del equipo quedan en la organización. SafeGuard los usa solo para el ejercicio.',
]

const NO_HACE = [
  'No usa malware, archivos ejecutables ni descargas.',
  'No guarda lo que alguien escribe en una pantalla de clave o de pago.',
  'No entra a correos, cuentas ni sistemas reales de la organización.',
  'No suplanta a una persona real del equipo sin autorización escrita.',
  'No usa como anzuelo despidos, sanciones, plata, salud, fallecimientos ni datos sensibles. Las plantillas del ejercicio usan el nombre de ARCA, Mercado Libre, OCA y Correo Argentino. El mensaje no sale de esas organizaciones.',
]

const INDICE = [
  ['en-corto', 'En corto'],
  ['safelink', 'SafeLink'],
  ['para-que', 'PhishGuard: para qué sirve'],
  ['no-hace', 'Qué no hace una campaña'],
  ['datos', 'Datos'],
  ['resultados', 'Resultados y dignidad'],
  ['pausa', 'Pausa, plazo y responsabilidad'],
  ['propiedad', 'De quién es el producto'],
  ['ley', 'Ley'],
  ['convenio', 'Convenio completo'],
]

function Terminos() {
  return (
    <Marco interior>
      <div className="lg">
        <header className="lg-hero">
          <div className="lg-ancho">
            <p className="lg-eti">Legal · SafeLink y PhishGuard</p>
            <h1>Términos y condiciones de servicio</h1>
            <p className="lg-sub">
              Esta página resume el convenio de SafeGuard en palabras de todos los días. El texto completo se puede
              leer y descargar más abajo.
            </p>
            <div className="lg-acciones">
              <a className="lg-boton" href="/convenio-piloto-safeguard.pdf" download="convenio-piloto-safeguard.pdf">
                Descargar el convenio completo
              </a>
              <Link className="lg-boton-sec" to="/privacidad">
                Ver Privacidad
              </Link>
            </div>
          </div>
        </header>

        <div className="lg-ancho lg-grilla">
          <Indice items={INDICE} />

          <div className="lg-texto">
            <p className="lg-intro">
              SafeGuard tiene dos partes: SafeLink, para revisar un enlace, un mensaje, un PDF o un QR antes de abrirlo;
              y PhishGuard, para entrenar a un equipo con simulaciones de phishing. Al crear una cuenta, al pagar
              PhishGuard o al cargar personas para una campaña, aceptás estas condiciones.
            </p>

            <EnCorto items={EN_CORTO} />

            <Seccion id="safelink" numero={1} titulo="SafeLink">
              <p>
                SafeLink marca un color y un motivo. No reemplaza al antivirus ni al firewall. Un verde dice que no hubo
                señales fuertes en esa revisión; una clave, un código o un pago igual no se hacen desde un enlace que
                llegó en un mensaje.
              </p>
              <p>
                La cuenta es opcional: guarda el historial y los reportes. Qué se analiza y qué sale del navegador está
                en <Link to="/privacidad">Privacidad</Link>.
              </p>
            </Seccion>

            <Seccion id="para-que" numero={2} titulo="PhishGuard: para qué sirve">
              <p>
                PhishGuard manda un mensaje de prueba que parece un engaño, para que la persona practique antes de un
                caso real. El objeto es capacitar y medir el riesgo. Nadie busca credenciales, datos bancarios ni acceso
                a los sistemas de la organización.
              </p>
              <p>
                Quien administra la organización autoriza el envío al cargar a su equipo y al crear la campaña. Esa
                autorización cubre a esas personas, en ese canal y con esa plantilla. Quedan afuera menores de edad,
                cuentas compartidas y quien la organización marque como excluido.
              </p>
            </Seccion>

            <Seccion id="no-hace" numero={3} titulo="Qué no hace una campaña">
              <ul className="lg-lista-no">
                {NO_HACE.map((item) => (
                  <li key={item}>
                    <span className="lg-marca lg-marca-no">
                      <Marca tipo="no" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p>
                Si alguien toca el enlace, ve en el momento que era una simulación y cómo reconocer las señales. Sin
                burlas y sin culpa. Reportar el mensaje como sospechoso es una conducta correcta y queda registrada como
                tal.
              </p>
              <p>
                El correo de la campaña sale directo a cada persona. WhatsApp y SMS se mandan desde quien administra,
                con el kit de la campaña.
              </p>
            </Seccion>

            <Seccion id="datos" numero={4} titulo="Datos">
              <p>
                La organización es responsable de los datos de su personal. SafeGuard los trata solo para el ejercicio:
                nombre, correo, área y lo que pasó en la simulación (envío, clic, datos ingresados, capacitación y
                reconocimiento). No se tratan datos sensibles ni contraseñas.
              </p>
              <p>
                La organización informa a su gente, por un medio interno, que hace simulaciones educativas. No adelanta
                el día ni el texto de cada campaña, para que el ejercicio sirva.
              </p>
              <p>
                Si una persona pide ver, corregir o borrar sus datos, SafeGuard colabora con la organización para
                responder. El detalle de cada producto está en <Link to="/privacidad">Privacidad</Link>.
              </p>
            </Seccion>

            <Seccion id="resultados" numero={5} titulo="Resultados y dignidad">
              <p>
                El tablero y el informe existen para saber a quién acompañar. Quien administra ve los nombres de su
                equipo. La organización se compromete a no usar un resultado individual para sancionar, despedir ni como
                antecedente laboral.
              </p>
              <p>
                Los números agregados por área sirven para ver cómo responde el conjunto. Nadie queda señalado en un
                documento público.
              </p>
            </Seccion>

            <Seccion id="pausa" numero={6} titulo="Pausa, plazo y responsabilidad">
              <p>
                Quien administra puede pedir que se detenga una campaña. SafeGuard deja de enviar y se puede borrar la
                campaña del listado. Cualquiera de las partes puede terminar el uso con aviso, sin penalidad.
              </p>
              <p>
                PhishGuard y SafeLink se entregan tal como están. No hay una promesa de que no vaya a haber un incidente
                real ni de un porcentaje de clics. Cada parte responde por lo que carga y por cumplir estas condiciones.
              </p>
            </Seccion>

            <Seccion id="propiedad" numero={7} titulo="De quién es el producto">
              <p>
                SafeGuard, PhishGuard, SafeLink, el código, el diseño y las plantillas pertenecen a quienes desarrollan
                el proyecto. La organización conserva sus datos y su marca. El uso de la plataforma no transfiere esa
                propiedad.
              </p>
            </Seccion>

            <Seccion id="ley" numero={8} titulo="Ley">
              <p>
                Estas condiciones se rigen por la ley argentina, incluida la Ley 25.326 de Protección de los Datos
                Personales y la Ley 26.388 de delitos informáticos. Un conflicto se intenta resolver de buena fe y, si
                hace falta, en los tribunales ordinarios de la Argentina.
              </p>
            </Seccion>

            <Seccion id="convenio" numero={9} titulo="Convenio completo">
              <p>
                El convenio de piloto y autorización de simulación de phishing es el acuerdo escrito para una
                organización que corre un ejercicio con PhishGuard. Esta página lo cuenta en corto. El PDF tiene el
                texto completo, con anexos de alcance, plantillas y personas excluidas.
              </p>
              <a className="lg-descarga" href="/convenio-piloto-safeguard.pdf" download="convenio-piloto-safeguard.pdf">
                <span className="lg-descarga-tipo">PDF</span>
                <span>
                  <strong>Convenio de piloto y autorización</strong>
                  <span>Descargar el convenio completo</span>
                </span>
              </a>
            </Seccion>

            <p className="lg-pie">
              ¿Te quedó una duda? <Link to="/contacto">Escribinos</Link>.
            </p>
          </div>
        </div>
      </div>
    </Marco>
  )
}

export default Terminos
