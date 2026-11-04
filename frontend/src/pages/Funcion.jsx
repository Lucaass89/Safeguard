import { Link, Navigate, useParams } from 'react-router'
import Marco from '../components/Marco.jsx'
import { useSesion } from '../lib/useSesion.js'
import './Modulo.css'

const funciones = {
  simulacion: {
    parte: 'PhishGuard',
    titulo: 'Simulación',
    resumen:
      'Una simulación es un mensaje de prueba que se parece a un engaño real. Se lo mandás a tu equipo para que practique a reconocerlo sin correr ningún riesgo.',
    pasos: [
      'Elegís una plantilla en español: banco, ARCA, envío, colegio, Mercado Libre y más.',
      'Elegís el canal: correo, WhatsApp o SMS.',
      'Elegís a quién le llega entre las personas que cargaste, o dejás que el sistema elija al azar.',
      'Si alguien toca el enlace, queda registrado y ve una explicación en el momento.',
    ],
    nota: 'Solo se simula con personas que la organización cargó y autorizó. La página de prueba no guarda contraseñas ni datos de pago.',
    accion: { texto: 'Conocer PhishGuard', ruta: '/empresas' },
  },
  explicacion: {
    parte: 'PhishGuard',
    titulo: 'Explicación',
    resumen:
      'Cuando alguien cae en la simulación no recibe un reto. Ve, en ese mismo momento, una pantalla que le muestra qué señales tenía que mirar.',
    pasos: [
      'Aparece apenas la persona toca el enlace o intenta cargar datos.',
      'Señala las pistas del mensaje: el remitente, la urgencia, el enlace que no coincide.',
      'Da un consejo corto para la próxima vez.',
      'Quien administra ve el resultado en el tablero y en el historial de la campaña.',
    ],
    nota: 'Los resultados sirven para enseñar. No se usan para sancionar ni para evaluar el desempeño.',
    accion: { texto: 'Conocer PhishGuard', ruta: '/empresas' },
  },
  semaforo: {
    parte: 'SafeLink',
    titulo: 'Semáforo',
    resumen:
      'SafeLink revisa un enlace, un WhatsApp, un PDF o un correo y te contesta con un color y un motivo, no con un informe técnico.',
    pasos: [
      'Verde: no aparecieron señales de riesgo. Podés continuar.',
      'Amarillo: hay algo raro. Revisá antes de seguir.',
      'Rojo: fuentes de reputación lo marcaron como peligroso. No lo abras.',
      'Junto al color te explicamos en una frase por qué.',
    ],
    nota: 'Un verde dice que no hubo señales fuertes en esa revisión. Una clave, un código o un pago igual no se hacen desde un enlace que llegó en un mensaje.',
    accion: { texto: 'Conocer SafeLink', ruta: '/personas' },
  },
  nube: {
    parte: 'SafeGuard',
    titulo: 'En la nube',
    resumen:
      'Todo SafeGuard funciona desde el navegador. No hay que instalar un programa en cada computadora ni pedirle permiso a sistemas para cada equipo.',
    pasos: [
      'PhishGuard se arma y se sigue desde el panel web.',
      'SafeLink se usa desde la web o desde el celular.',
      'SafeLink avisa con un color: no bloquea la navegación ni frena el trabajo.',
      'Tus revisiones y campañas quedan guardadas en tu cuenta.',
    ],
    nota: 'Qué se analiza y qué sale de tu navegador está explicado en Privacidad.',
    accion: { texto: 'Ver privacidad', ruta: '/privacidad' },
  },
  enlace: {
    parte: 'SafeLink',
    titulo: 'Revisar un enlace',
    resumen:
      'Pegás la dirección antes de abrirla y SafeLink te dice si es segura. Si es un link acortado, como bit.ly, abrimos el destino por vos y te mostramos a dónde lleva.',
    pasos: [
      'Copiá el link del mensaje, sin abrirlo.',
      'Pegalo en Revisar un enlace.',
      'Miramos el dominio, si imita a una marca conocida y qué dicen las fuentes de reputación.',
      'Te respondemos con el semáforo y el motivo.',
    ],
    nota: 'Con tu cuenta, cada enlace queda guardado en tu historial.',
    accion: { texto: 'Revisar un enlace', ruta: '/panel/enlaces', cuenta: true },
  },
  whatsapp: {
    parte: 'SafeLink',
    titulo: 'Pegar un WhatsApp',
    resumen:
      'Copiás el mensaje entero que te llegó por WhatsApp y SafeLink lo revisa. No hace falta que encuentres el enlace: lo sacamos nosotros.',
    pasos: [
      'Mantené apretado el mensaje y copialo completo.',
      'Pegalo en Pegar un WhatsApp.',
      'Separamos el texto, el número y los links, y revisamos cada uno.',
      'Te avisamos si usa trucos comunes: urgencia, premios, cuentas bloqueadas.',
    ],
    nota: 'Sirve para mensajes de números desconocidos y también para cadenas que reenvía un conocido.',
    accion: { texto: 'Pegar un WhatsApp', ruta: '/panel/whatsapp', cuenta: true },
  },
  pdf: {
    parte: 'SafeLink',
    titulo: 'Revisar un PDF',
    resumen:
      'Subís un PDF que te mandaron y SafeLink mira si esconde algo antes de que lo abras: enlaces raros, código o formularios que piden datos.',
    pasos: [
      'Elegí el archivo desde tu computadora o tu celular.',
      'Lo leemos en tu navegador.',
      'Buscamos enlaces, acciones automáticas y partes ocultas.',
      'Te respondemos con el semáforo y lo que encontramos.',
    ],
    nota: 'El archivo se lee en tu navegador. No se sube a ningún servidor.',
    accion: { texto: 'Revisar un PDF', ruta: '/panel/pdf', cuenta: true },
  },
  correo: {
    parte: 'SafeLink',
    titulo: 'Revisar un correo',
    resumen:
      'Un correo puede mostrar el nombre de tu banco y venir de cualquier lado. SafeLink lee los datos ocultos del mensaje y te dice si el remitente es quien dice ser.',
    pasos: [
      'En Gmail, abrí el correo, tocá los tres puntitos y elegí Mostrar original.',
      'Copiá todo, incluidos los encabezados.',
      'Pegalo en Revisar un correo.',
      'Comprobamos si el dominio que lo mandó es real y si los enlaces coinciden con lo que dice.',
    ],
    nota: 'Si el correo te pide una clave o un pago, entrá a la página oficial escribiendo la dirección vos mismo.',
    accion: { texto: 'Revisar un correo', ruta: '/panel/correo', cuenta: true },
  },
}

function Funcion() {
  const { id } = useParams()
  const { sesion } = useSesion()
  const funcion = funciones[id]

  if (!funcion) return <Navigate to="/" replace />

  const { parte, titulo, resumen, pasos, nota, accion } = funcion
  const destino = accion.cuenta && !sesion ? '/ingresar' : accion.ruta

  return (
    <Marco interior>
      <div className="container nota">
        <p className="nota-aviso">{parte}</p>
        <h1>{titulo}</h1>
        <p>{resumen}</p>

        <h2>Cómo funciona</h2>
        <ol>
          {pasos.map((paso) => (
            <li key={paso}>{paso}</li>
          ))}
        </ol>

        <h2>Para tener en cuenta</h2>
        <p>{nota}</p>

        <p className="funcion-acciones">
          <Link className="funcion-cta" to={destino}>
            {accion.cuenta && !sesion ? 'Ingresar para usarlo' : accion.texto}
          </Link>
          <Link to="/">Volver al inicio</Link>
        </p>
      </div>
    </Marco>
  )
}

export default Funcion
