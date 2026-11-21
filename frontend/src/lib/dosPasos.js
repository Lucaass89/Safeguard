export const NOMBRE_FACTOR = 'SafeGuard'

export function factoresVerificados(factores) {
  const lista = Array.isArray(factores?.totp) ? factores.totp : Array.isArray(factores?.all) ? factores.all : []
  return lista.filter((factor) => factor?.factor_type === 'totp' && factor?.status === 'verified')
}

export function factoresSinTerminar(factores) {
  const lista = Array.isArray(factores?.all) ? factores.all : []
  return lista.filter((factor) => factor?.factor_type === 'totp' && factor?.status !== 'verified')
}

export function estadoDosPasos({ nivel, factores }) {
  if (factoresVerificados(factores).length === 0) return 'activar'
  return nivel === 'aal2' ? 'listo' : 'codigo'
}

export function limpiarCodigo(texto) {
  return String(texto ?? '').replace(/\D/g, '').slice(0, 6)
}

export function codigoValido(texto) {
  return /^\d{6}$/.test(String(texto ?? '').replace(/\s/g, ''))
}

export function secretoLegible(secreto) {
  return String(secreto ?? '')
    .replace(/\s/g, '')
    .match(/.{1,4}/g)
    ?.join(' ') ?? ''
}

export function mensajeError(error) {
  const texto = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase()
  if (/invalid|expired|mfa_verification_failed|code/.test(texto)) {
    return 'El código no es correcto o ya cambió. Escribí el que aparece ahora en la app.'
  }
  if (/rate|too many|429/.test(texto)) {
    return 'Probaste muchas veces seguidas. Esperá un minuto y volvé a intentar.'
  }
  if (/disabled|not enabled|mfa_totp/.test(texto)) {
    return 'La verificación en dos pasos no está habilitada en el servidor. Avisale al equipo de SafeGuard.'
  }
  return 'No se pudo completar la verificación. Probá de nuevo en un momento.'
}
