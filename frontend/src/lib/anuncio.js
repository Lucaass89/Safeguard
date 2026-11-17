export const TEMAS_ANUNCIO = ['anuncios', 'estafas']

export function armarAnuncio({ titulo, texto, tema, ruta }) {
  const limpioTitulo = (titulo ?? '').trim()
  const limpioTexto = (texto ?? '').trim()
  const elegido = (tema ?? 'anuncios').trim()
  if (!limpioTitulo || limpioTitulo.length > 65) return { error: 'El título tiene que tener entre 1 y 65 letras.' }
  if (!limpioTexto || limpioTexto.length > 240) return { error: 'El texto tiene que tener entre 1 y 240 letras.' }
  if (!TEMAS_ANUNCIO.includes(elegido)) return { error: `El tema tiene que ser ${TEMAS_ANUNCIO.join(' o ')}.` }
  const destino = (ruta ?? '').trim() || '/'
  if (!destino.startsWith('/') || destino.startsWith('//')) return { error: 'La ruta tiene que empezar con /.' }
  return { tema: elegido, aviso: { titulo: limpioTitulo, texto: limpioTexto, ruta: destino } }
}
