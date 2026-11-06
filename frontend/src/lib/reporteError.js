import { motivosLimpios } from './analisis.js'
import { sinConsulta } from './enlace.js'

export const ESPERADOS = [
  { id: 'peligroso', etiqueta: 'Es peligroso' },
  { id: 'legitimo', etiqueta: 'Es un sitio legítimo y el resultado se equivocó' },
  { id: 'otro', etiqueta: 'Otra cosa' },
]

const CANALES = new Set(['enlace', 'whatsapp', 'pdf', 'correo', 'qr'])
const NIVELES = new Set(['verde', 'amarillo', 'rojo', 'gris'])
export const TOPE_COMENTARIO = 500

function direccionParaReportar(url) {
  const texto = String(url ?? '').trim()
  if (/^https?:\/\//i.test(texto)) return sinConsulta(texto).slice(0, 2048)
  const esquema = texto.match(/^([a-z][a-z0-9+.-]*):/i)
  return esquema ? `${esquema[1].toLowerCase()}:` : null
}

export function claveReporte(caso) {
  return `${caso.nivel}|${caso.url ?? ''}|${(caso.motivos ?? []).join('|')}`
}

export function armarReporteError(caso, esperado, comentario) {
  if (!caso || !NIVELES.has(caso.nivel) || !ESPERADOS.some((opcion) => opcion.id === esperado)) return null
  const dominio = String(caso.dominio ?? '').trim().toLowerCase()
  return {
    p_url: direccionParaReportar(caso.url),
    p_dominio: /^[\p{L}\p{N}.-]{1,253}$/u.test(dominio) ? dominio : null,
    p_canal: CANALES.has(caso.canal) ? caso.canal : 'enlace',
    p_nivel: caso.nivel,
    p_esperado: esperado,
    p_motivos: motivosLimpios(caso.motivos).slice(0, 20).map((motivo) => motivo.slice(0, 400)),
    p_comentario: String(comentario ?? '').trim().slice(0, TOPE_COMENTARIO) || null,
  }
}
