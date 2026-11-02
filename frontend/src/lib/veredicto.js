import { analizar, esDominioOficial, FALLO_AL_SEGUIR, motivosLimpios, SIN_FORMATO } from './analisis.js'

export const SIN_ABRIR = 'No pudimos abrir el sitio para confirmarlo: puede que no exista o que no haya respondido.'
export const SIN_BASE = 'No pudimos consultar la base de amenazas.'

export const MOTIVOS_VISIBLES = 3

// "Seguro" solo con evidencia positiva: el dominio final es el oficial de una marca de la lista,
// sin plataforma de terceros y sin nada que haya quedado sin verificar.
export function veredictoDe(resultado) {
  const nivel = resultado?.nivel
  if (nivel === 'rojo') return { clave: 'peligroso', titulo: 'Peligroso' }
  if (nivel === 'amarillo') return { clave: 'sospechoso', titulo: 'Sospechoso' }
  if (nivel !== 'verde') return { clave: 'sin_verificar', titulo: 'No pudimos verificarlo' }
  const dominio = resultado.dominioDestino ?? resultado.dominio
  const oficial = !resultado.sinVerificar && !resultado.plataforma && esDominioOficial(dominio)
  return oficial ? { clave: 'seguro', titulo: 'Seguro' } : { clave: 'sin_senales', titulo: 'Sin señales de riesgo' }
}

const POR_FALLO = {
  no_resuelve: 'El sitio no existe o no apunta a ningún servidor.',
  dns: 'No pudimos averiguar a qué servidor apunta el sitio.',
  bloqueado: 'Apunta a una red interna, así que no lo abrimos.',
  protocolo: 'Redirige a algo que no es una página web.',
  tls: 'La conexión segura con el sitio falló.',
  tiempo: 'El sitio tardó demasiado en responder.',
  conexion: 'No pudimos conectarnos con el sitio.',
  saltos: 'Redirige demasiadas veces seguidas.',
}

function tieneSenal(resultado, id) {
  return (resultado?.senales ?? []).some((senal) => senal.id === id)
}

// Una línea con la causa, solo si algo quedó sin verificar.
export function porQueSinVerificar(resultado) {
  if (!resultado || (!resultado.sinVerificar && resultado.nivel !== 'gris')) return null
  const motivos = motivosLimpios(resultado.motivos)
  if (tieneSenal(resultado, 'otra_app')) return 'No es una dirección web: abre otra aplicación.'
  if (resultado.sinFormato || tieneSenal(resultado, 'sin_formato')) return 'El enlace no es válido.'
  if (resultado.falloAlSeguir) return POR_FALLO[resultado.falloAlSeguir] ?? POR_FALLO.conexion
  if (resultado.demasiadoLarga) return 'La dirección es demasiado larga para revisarla.'
  if (motivos.includes(SIN_ABRIR)) return 'No pudimos conectarnos con el sitio.'
  if (resultado.plataforma?.tipo === 'acortador') return 'Es un acortador y no pudimos ver a dónde lleva.'
  if (resultado.plataforma?.tipo === 'temporal') return 'Es una dirección temporal: no se sabe quién la armó.'
  if (resultado.plataforma?.tipo === 'contenido') return 'El sitio es conocido, pero lo que se abre lo subió otra persona.'
  if (motivos.includes(SIN_BASE)) return 'No pudimos consultar la base de amenazas.'
  return null
}

// Si la línea de arriba ya dice por qué no se verificó, el motivo largo que dice lo mismo sobra.
const REPITEN_LA_CAUSA = new Set([SIN_ABRIR, SIN_FORMATO, ...Object.values(FALLO_AL_SEGUIR)])

export function motivosCortos(motivos, { abierto = false, conCausa = false } = {}) {
  const lista = motivosLimpios(motivos).filter((motivo) => !conCausa || !REPITEN_LA_CAUSA.has(motivo))
  return { visibles: abierto ? lista : lista.slice(0, MOTIVOS_VISIBLES), ocultos: Math.max(0, lista.length - MOTIVOS_VISIBLES), lista }
}

// Un caso del historial guarda nivel, dominio y motivos. La comparación de letras se rearma con el motor,
// y Resultado solo la muestra si su frase está entre los motivos que se guardaron.
export function casoGuardado(fila) {
  const motivos = motivosLimpios(fila.explicacion ? [fila.explicacion] : [])
  let diferencia
  try {
    diferencia = fila.url_analizada ? (analizar(fila.url_analizada)?.diferencia ?? null) : null
  } catch {
    diferencia = null
  }
  return {
    nivel: fila.nivel_riesgo,
    url: fila.url_analizada,
    dominio: fila.dominio,
    motivos,
    diferencia,
    sinVerificar: fila.nivel_riesgo === 'gris',
  }
}

// El dominio va desarmado ("g0ogle[.]com") para que la alerta no se convierta en un enlace que se toca.
export function desarmar(dominio) {
  return String(dominio ?? '').replace(/\./g, '[.]')
}

export function textoAlerta(resultado, titulo) {
  const dominio = resultado.dominioDestino ?? resultado.dominio
  const sitio = dominio && dominio.includes('.') ? ` Sitio: ${desarmar(dominio)}.` : ''
  const motivos = motivosLimpios(resultado.motivos).slice(0, MOTIVOS_VISIBLES).join(' ')
  return `SafeLink: ${titulo}.${sitio}${motivos ? ` ${motivos}` : ''}`
}
