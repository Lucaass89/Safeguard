import { construirCasos } from './casos.js'
import { analizar, queHacer, FALLO_AL_SEGUIR } from '../src/lib/analisis.js'
import { MENSAJES } from '../src/lib/estafaOReal.js'
const casos = construirCasos()
const frases = new Set()
for (const c of casos) {
  const r = analizar(c.url)
  if (r) r.motivos.forEach((m) => frases.add(m))
}
const motivos = [...frases]
const otros = [...['rojo','amarillo','gris','verde'].map(queHacer), ...Object.values(FALLO_AL_SEGUIR)]
const lecciones = MENSAJES.map((m) => `${m.leccion.titulo}. ${m.leccion.cuerpo}`)
function silabas(p) {
  const w = p.toLowerCase().normalize('NFD').replace(/[́]/g, '´').normalize('NFC').replace(/[^a-záéíóúüñ´]/g, '')
  if (!w) return 0
  const g = w.replace(/´/g,'').match(/[aeiouáéíóúü]+/g) ?? []
  let n = 0
  for (const v of g) {
    let k = 1
    for (let i = 1; i < v.length; i++) { const a = v[i-1], b = v[i]; const fuerte = (x) => 'aeoáéó'.includes(x) || 'íú'.includes(x); if (fuerte(a) && fuerte(b)) k++ }
    n += k
  }
  return Math.max(1, n)
}
function inflesz(textos) {
  let s = 0, p = 0, f = 0
  for (let t of textos) {
    t = t.replace(/\S*[a-z0-9]\.[a-z0-9]\S*/gi, "sitio").replace(/\(([^)]*)\)/g, " $1 ")
    const ora = t.split(/[.!?]+/).filter((x) => x.trim()); f += ora.length
    for (const pal of t.split(/\s+/).filter((x) => /[a-záéíóúñ]/i.test(x))) { p++; s += silabas(pal) }
  }
  return { indice: +(206.835 - 62.3 * (s / p) - p / f).toFixed(1), palabras: p, frases: f, palabrasPorFrase: +(p / f).toFixed(1) }
}
console.log('casos', casos.length, 'frases distintas', motivos.length)
console.log('motivos', JSON.stringify(inflesz(motivos)))
console.log('que hacer y fallos', JSON.stringify(inflesz(otros)))
console.log('lecciones', JSON.stringify(inflesz(lecciones)))
console.log('todo', JSON.stringify(inflesz([...motivos, ...otros, ...lecciones])))
