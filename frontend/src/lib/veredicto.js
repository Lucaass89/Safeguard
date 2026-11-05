import { analizar, esDominioOficial, FALLO_AL_SEGUIR, motivosLimpios, SIN_FORMATO } from './analisis.js'

export const SIN_ABRIR = 'No pudimos abrir el sitio para confirmarlo: puede que no exista o que no haya respondido.'
export const SIN_BASE = 'No pudimos consultar la base de amenazas.'

export const MOTIVOS_VISIBLES = 3

// "Seguro" solo con evidencia positiva: el dominio final es el oficial de una marca de la lista,
// sin plataforma de terceros y sin nada que haya quedado sin verificar.
export function veredictoDe(resultado) {
  const nivel = resultado?.nivel
  if (nivel === 'rojo') return { clave: 'peligroso', titulo: 'Peligroso' }
  if (nivel === 'amarillo') return { clave: 'sospechoso', titulo: 'Precaución' }
  if (nivel !== 'verde') return { clave: 'sin_verificar', titulo: 'No pudimos verificarlo' }
  const dominio = resultado.dominioDestino ?? resultado.dominio
  const oficial = !resultado.sinVerificar && !resultado.plataforma && esDominioOficial(dominio)
  return oficial ? { clave: 'seguro', titulo: 'Seguro' } : { clave: 'sin_senales', titulo: 'Sin señales de riesgo' }
}

export const SIN_CONTENIDO =
  'No pudimos revisar el contenido de la página. Esta evaluación se basa solo en la dirección del enlace.'

function tieneSenal(resultado, id) {
  return (resultado?.senales ?? []).some((senal) => senal.id === id)
}

// Que el sitio no responda no es un error de SafeLink ni lo vuelve inocente: va como nota informativa, no arriba.
export function notaSinContenido(resultado) {
  if (!resultado) return null
  return resultado.falloAlSeguir || motivosLimpios(resultado.motivos).includes(SIN_ABRIR) ? SIN_CONTENIDO : null
}

// Una línea con la causa, solo si algo quedó sin verificar. Que el sitio no responda va en notaSinContenido.
export function porQueSinVerificar(resultado) {
  if (!resultado || (!resultado.sinVerificar && resultado.nivel !== 'gris')) return null
  const motivos = motivosLimpios(resultado.motivos)
  if (tieneSenal(resultado, 'otra_app')) return 'No es una dirección web: abre otra aplicación.'
  if (resultado.sinFormato || tieneSenal(resultado, 'sin_formato')) return 'El enlace no es válido.'
  if (resultado.demasiadoLarga) return 'La dirección es demasiado larga para revisarla.'
  if (resultado.plataforma?.tipo === 'acortador') return 'Es un acortador y no pudimos ver a dónde lleva.'
  if (resultado.plataforma?.tipo === 'temporal') return 'Es una dirección temporal: no se sabe quién la armó.'
  if (resultado.plataforma?.tipo === 'contenido') return 'El sitio es conocido, pero lo que se abre lo subió otra persona.'
  if (motivos.includes(SIN_BASE)) return 'No pudimos consultar la base de amenazas.'
  return null
}

// Si la línea de arriba ya dice por qué no se verificó, el motivo largo que dice lo mismo sobra.
const REPITEN_LA_CAUSA = new Set([SIN_FORMATO])
// Cuando está la nota de que no se pudo revisar el contenido, estos motivos dicen lo mismo con otras palabras.
const REPITEN_LA_NOTA = new Set([
  SIN_ABRIR,
  FALLO_AL_SEGUIR.tiempo,
  FALLO_AL_SEGUIR.conexion,
  FALLO_AL_SEGUIR.tls,
  FALLO_AL_SEGUIR.dns,
])
const ORDEN_FUERZA = { fuerte: 0, media: 1, debil: 2 }

// Une las frases de una misma señal en un solo motivo y ordena: primero las fuertes, después por peso.
// Lo que no viene de una señal (avisos, el camino de una redirección) va al final, en su orden.
export function motivosOrdenados(motivos, senales = []) {
  const deFrase = new Map()
  ;(senales ?? []).forEach((senal, indice) => {
    if (!senal?.texto) return
    const rango = { clave: `${senal.id}-${indice}`, fuerza: ORDEN_FUERZA[senal.fuerza] ?? 3, peso: senal.peso ?? 0 }
    for (const frase of motivosLimpios([senal.texto])) {
      const previo = deFrase.get(frase)
      if (!previo || rango.fuerza < previo.fuerza || (rango.fuerza === previo.fuerza && rango.peso > previo.peso)) {
        deFrase.set(frase, rango)
      }
    }
  })

  const grupos = []
  for (const frase of motivosLimpios(motivos)) {
    const rango = deFrase.get(frase) ?? { clave: null, fuerza: 4, peso: 0 }
    const ultimo = grupos.at(-1)
    if (rango.clave && ultimo?.clave === rango.clave) ultimo.texto = `${ultimo.texto} ${frase}`
    else grupos.push({ ...rango, texto: frase })
  }
  return grupos
    .map((grupo, indice) => ({ ...grupo, indice }))
    .sort((a, b) => a.fuerza - b.fuerza || b.peso - a.peso || a.indice - b.indice)
    .map((grupo) => grupo.texto)
}

export function motivosCortos(motivos, { abierto = false, conCausa = false, senales = [], sinContenido = false } = {}) {
  const lista = motivosOrdenados(motivos, senales).filter(
    (motivo) => !(conCausa && REPITEN_LA_CAUSA.has(motivo)) && !(sinContenido && REPITEN_LA_NOTA.has(motivo)),
  )
  return { visibles: abierto ? lista : lista.slice(0, MOTIVOS_VISIBLES), ocultos: Math.max(0, lista.length - MOTIVOS_VISIBLES), lista }
}

// Un caso del historial guarda nivel, dominio y motivos. La comparación de letras se rearma con el motor,
// y Resultado solo la muestra si su frase está entre los motivos que se guardaron.
export function casoGuardado(fila) {
  const motivos = motivosLimpios(fila.explicacion ? [fila.explicacion] : [])
  let base = null
  try {
    base = fila.url_analizada ? analizar(fila.url_analizada) : null
  } catch {
    base = null
  }
  const guardada = Number(fila.puntuacion_riesgo)
  return {
    nivel: fila.nivel_riesgo,
    url: fila.url_analizada,
    dominio: fila.dominio,
    motivos,
    diferencia: base?.diferencia ?? null,
    sinVerificar: fila.nivel_riesgo === 'gris',
    puntuacion: Number.isFinite(guardada) ? guardada : (base?.puntuacion ?? null),
    senales: base?.senales ?? [],
  }
}

// El dominio va desarmado ("g0ogle[.]com") para que la alerta no se convierta en un enlace que se toca.
export function desarmar(dominio) {
  return String(dominio ?? '').replace(/\./g, '[.]')
}

export function textoAlerta(resultado, titulo) {
  const dominio = resultado.dominioDestino ?? resultado.dominio
  const sitio = dominio && dominio.includes('.') ? ` Sitio: ${desarmar(dominio)}.` : ''
  const motivos = motivosOrdenados(resultado.motivos, resultado.senales).slice(0, MOTIVOS_VISIBLES).join(' ')
  return `SafeLink: ${titulo}.${sitio}${motivos ? ` ${motivos}` : ''}`
}
