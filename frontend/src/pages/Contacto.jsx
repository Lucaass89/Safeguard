import { Link } from 'react-router'
import Marco from '../components/Marco.jsx'
import { CONTACTO, enlaceCorreo, enlaceWhatsapp, MOTIVOS_CONTACTO } from '../lib/contacto.js'
import './Contacto.css'

const TRAZOS = {
  correo: ['M4 6.5h16v11H4z', 'm4.5 7 7.5 6 7.5-6'],
  whatsapp: [
    'M12 20.5a8.5 8.5 0 1 0-7.4-4.3L3.5 20.5l4.4-1.1a8.5 8.5 0 0 0 4.1 1.1Z',
    'M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 1c-1-.5-2.5-2-3-3l1-1-1-2Z',
  ],
  escudo: ['M12 3.5 5 6v5.5c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6z', 'm9 12 2 2 4-4'],
}

function Icono({ nombre, tam = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={tam} height={tam} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

function Contacto() {
  return (
    <Marco interior>
      <div className="ct">
        <section className="ct-hero" aria-labelledby="ct-titulo">
          <div className="ct-ancho ct-hero-cuerpo">
            <p className="ct-eti">Contacto</p>
            <h1 id="ct-titulo">Hablemos.</h1>
            <p className="ct-sub">
              Escribinos por correo o por WhatsApp, sobre PhishGuard, SafeLink o algo que te llegó. Te respondemos
              nosotros, en español.
            </p>
            <div className="ct-canales">
              <a className="ct-canal ct-canal-correo" href={enlaceCorreo('Consulta desde SafeGuard')}>
                <span className="ct-canal-icono">
                  <Icono nombre="correo" tam={28} />
                </span>
                <span className="ct-canal-texto">
                  <span className="ct-canal-tipo">Correo</span>
                  <strong>{CONTACTO.correo}</strong>
                  <span className="ct-canal-accion">Escribir un correo →</span>
                </span>
              </a>
              <a
                className="ct-canal ct-canal-whatsapp"
                href={enlaceWhatsapp('Hola, les escribo desde la página de SafeGuard.')}
                target="_blank"
                rel="noreferrer"
              >
                <span className="ct-canal-icono">
                  <Icono nombre="whatsapp" tam={28} />
                </span>
                <span className="ct-canal-texto">
                  <span className="ct-canal-tipo">WhatsApp</span>
                  <strong>{CONTACTO.whatsapp}</strong>
                  <span className="ct-canal-accion">Abrir WhatsApp →</span>
                </span>
              </a>
            </div>
          </div>
        </section>

        <div className="ct-ancho ct-cuerpo">
          <section aria-labelledby="ct-motivos">
            <h2 id="ct-motivos">¿Sobre qué nos escribís?</h2>
            <div className="ct-motivos">
              {MOTIVOS_CONTACTO.map((motivo) => (
                <article key={motivo.id} className={`ct-motivo ct-motivo-${motivo.id}`}>
                  <h3>{motivo.titulo}</h3>
                  <p>{motivo.texto}</p>
                  <div className="ct-motivo-acciones">
                    <a href={enlaceWhatsapp(motivo.mensaje)} target="_blank" rel="noreferrer">
                      Escribir por WhatsApp
                    </a>
                    <a href={enlaceCorreo(motivo.titulo)}>Por correo</a>
                    <Link to={motivo.pagina.ruta}>{motivo.pagina.texto}</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="ct-aviso" aria-labelledby="ct-aviso-titulo">
            <span className="ct-aviso-icono">
              <Icono nombre="escudo" tam={30} />
            </span>
            <div>
              <h2 id="ct-aviso-titulo">Nunca te vamos a pedir claves ni códigos</h2>
              <p>
                Ni por correo, ni por WhatsApp, ni por teléfono. Si alguien te los pide en nombre de SafeGuard, es un
                engaño: no respondas y avisanos.
              </p>
            </div>
          </section>
        </div>
      </div>
    </Marco>
  )
}

export default Contacto
