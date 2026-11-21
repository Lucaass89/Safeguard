import { useId } from 'react'
import { TIPOS_ORGANIZACION } from '../lib/datosEmpresa.js'
import './FormEmpresa.css'

function Campo({ id, etiqueta, ayuda, error, children }) {
  return (
    <div className={error ? 'form-empresa-campo form-empresa-campo-error' : 'form-empresa-campo'}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {ayuda && !error && <span className="form-empresa-ayuda" id={`${id}-ayuda`}>{ayuda}</span>}
      {error && <span className="form-empresa-mensaje" id={`${id}-error`} role="alert">{error}</span>}
    </div>
  )
}

function FormEmpresa({ valor, onCambiar, errores = {}, titulo = 'Datos de tu empresa' }) {
  const id = useId()

  function cambiar(campo) {
    return (evento) => onCambiar({ ...valor, [campo]: evento.target.value })
  }

  function propiedades(campo, ayuda) {
    const error = errores[campo]
    return {
      id: `${id}-${campo}`,
      value: valor[campo] ?? '',
      onChange: cambiar(campo),
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `${id}-${campo}-error` : ayuda ? `${id}-${campo}-ayuda` : undefined,
    }
  }

  return (
    <fieldset className="form-empresa">
      <legend>{titulo}</legend>

      <div className="form-empresa-grilla">
        <Campo id={`${id}-nombre_empresa`} etiqueta="Nombre de la empresa" error={errores.nombre_empresa}>
          <input {...propiedades('nombre_empresa')} type="text" autoComplete="organization" maxLength={120} required />
        </Campo>

        <Campo id={`${id}-tipo_organizacion`} etiqueta="Tipo de organización" error={errores.tipo_organizacion}>
          <select {...propiedades('tipo_organizacion')} required>
            <option value="">Elegí una opción</option>
            {TIPOS_ORGANIZACION.map(([clave, nombre]) => (
              <option key={clave} value={clave}>{nombre}</option>
            ))}
          </select>
        </Campo>

        <Campo
          id={`${id}-cuit`}
          etiqueta="CUIT (opcional)"
          ayuda="Los 11 números, con o sin guiones."
          error={errores.cuit}
        >
          <input {...propiedades('cuit', true)} type="text" inputMode="numeric" maxLength={13} placeholder="30-12345678-9" />
        </Campo>
      </div>

      <h3 className="form-empresa-subtitulo">Quién representa a la empresa</h3>
      <div className="form-empresa-grilla">
        <Campo id={`${id}-contacto_nombre`} etiqueta="Nombre y apellido" error={errores.contacto_nombre}>
          <input {...propiedades('contacto_nombre')} type="text" autoComplete="name" maxLength={120} required />
        </Campo>

        <Campo id={`${id}-contacto_cargo`} etiqueta="Cargo (opcional)" error={errores.contacto_cargo}>
          <input {...propiedades('contacto_cargo')} type="text" autoComplete="organization-title" maxLength={80} placeholder="Gerente, dueño, director" />
        </Campo>

        <Campo id={`${id}-contacto_email`} etiqueta="Correo" error={errores.contacto_email}>
          <input {...propiedades('contacto_email')} type="email" autoComplete="email" maxLength={320} required />
        </Campo>

        <Campo id={`${id}-contacto_telefono`} etiqueta="Teléfono (opcional)" error={errores.contacto_telefono}>
          <input {...propiedades('contacto_telefono')} type="tel" autoComplete="tel" maxLength={25} placeholder="+54 11 1234-5678" />
        </Campo>
      </div>

      <Campo
        id={`${id}-areas`}
        etiqueta="Áreas (opcional)"
        ayuda="Separalas con comas. Después las elegís al cargar a cada persona."
        error={errores.areas}
      >
        <textarea {...propiedades('areas', true)} rows={2} placeholder="Administración, Ventas, Sistemas" />
      </Campo>
    </fieldset>
  )
}

export default FormEmpresa
