import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { analizar } from '../src/lib/analisis.js'
import { PUNTAJE } from '../src/lib/puntaje.js'
import { veredictoDe } from '../src/lib/veredicto.js'
import { combinarConVirusTotal } from '../src/lib/virustotal.js'

export const FUENTES = ['synthetic', 'real', 'manual']
const ENCABEZADO = ['url', 'label', 'source', 'notes']

function partirLinea(linea) {
  const campos = []
  let actual = ''
  let entreComillas = false
  for (let i = 0; i < linea.length; i += 1) {
    const letra = linea[i]
    if (entreComillas) {
      if (letra === '"' && linea[i + 1] === '"') {
        actual += '"'
        i += 1
      } else if (letra === '"') {
        entreComillas = false
      } else {
        actual += letra
      }
    } else if (letra === '"') {
      entreComillas = true
    } else if (letra === ',') {
      campos.push(actual)
      actual = ''
    } else {
      actual += letra
    }
  }
  campos.push(actual)
  return campos
}

export function leerCsv(texto) {
  const lineas = texto.replace(/^\uFEFF/, '').split(/\r?\n/).filter((linea) => linea.trim())
  const encabezado = partirLinea(lineas[0]).map((campo) => campo.trim())
  if (ENCABEZADO.some((columna, i) => encabezado[i] !== columna)) {
    throw new Error(`El CSV tiene que empezar con: ${ENCABEZADO.join(',')}`)
  }
  return lineas.slice(1).map((linea, i) => {
    const [url = '', label = '', source = '', notes = ''] = partirLinea(linea).map((campo) => campo.trim())
    if (!['phishing', 'legit'].includes(label)) throw new Error(`Fila ${i + 2}: label tiene que ser phishing o legit`)
    if (!FUENTES.includes(source)) throw new Error(`Fila ${i + 2}: source tiene que ser ${FUENTES.join(', ')}`)
    return { url, label, source, notes }
  })
}

function hostDe(url) {
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`).hostname
  } catch {
    return null
  }
}

export function leerVirusTotal(url, carpeta = new URL('./virustotal/', import.meta.url)) {
  const host = hostDe(url)
  if (!host) return null
  const archivo = new URL(`./${host}.json`, carpeta)
  return existsSync(archivo) ? JSON.parse(readFileSync(archivo, 'utf8')) : null
}

const marcado = (nivel) => nivel === 'amarillo' || nivel === 'rojo'

const VEREDICTOS = ['Seguro', 'Sin señales de riesgo', 'Precaución', 'Peligroso', 'No pudimos verificarlo']

export function esperadoDe(notas) {
  const pedido = notas.match(/Esperado:\s*([^.;]+)/i)?.[1]?.trim().toLowerCase()
  return VEREDICTOS.find((veredicto) => veredicto.toLowerCase() === pedido) ?? null
}

export function evaluarFila(fila, { virusTotal = null } = {}) {
  const local = analizar(fila.url)
  const resultado = virusTotal && local ? combinarConVirusTotal(local, virusTotal) : local
  const nivel = resultado?.nivel ?? 'gris'
  const predicho = marcado(nivel) ? 'phishing' : 'legit'
  const veredicto = veredictoDe(resultado).titulo
  const esperado = esperadoDe(fila.notes)
  return {
    ...fila,
    nivel,
    veredicto,
    predicho,
    acierto: predicho === fila.label,
    esperado,
    cumpleEsperado: esperado === null || esperado === veredicto,
    conVirusTotal: Boolean(virusTotal && local),
    motivos: resultado?.motivos ?? ['El detector no pudo leer la dirección.'],
    senales: (resultado?.senales ?? []).map((senal) => senal.id),
  }
}

function metricas(filas) {
  const vp = filas.filter((f) => f.label === 'phishing' && f.predicho === 'phishing').length
  const fn = filas.filter((f) => f.label === 'phishing' && f.predicho === 'legit').length
  const fp = filas.filter((f) => f.label === 'legit' && f.predicho === 'phishing').length
  const vn = filas.filter((f) => f.label === 'legit' && f.predicho === 'legit').length
  const peligroso = filas.filter((f) => f.label === 'phishing' && f.nivel === 'rojo').length
  const tasa = (a, b) => (b === 0 ? null : a / b)
  return {
    casos: filas.length,
    vp,
    fp,
    vn,
    fn,
    deteccion: tasa(vp, vp + fn),
    falsosPositivos: tasa(fp, fp + vn),
    phishingEnPeligroso: tasa(peligroso, vp + fn),
  }
}

export function evaluarUrls(filas, { conVirusTotal = false, leerVt = leerVirusTotal } = {}) {
  const pendientes = filas.filter((fila) => !fila.url).length
  const evaluadas = filas
    .filter((fila) => fila.url)
    .map((fila) => evaluarFila(fila, { virusTotal: conVirusTotal ? leerVt(fila.url) : null }))
  const porFuente = Object.fromEntries(
    FUENTES.map((fuente) => [fuente, metricas(evaluadas.filter((fila) => fila.source === fuente))]),
  )
  return {
    conVirusTotal,
    pendientes,
    total: metricas(evaluadas),
    porFuente,
    errores: evaluadas.filter((fila) => !fila.acierto),
    porDebajo: evaluadas.filter((fila) => fila.acierto && !fila.cumpleEsperado),
    filas: evaluadas,
  }
}

const pct = (valor) => (valor === null ? '—' : `${(valor * 100).toFixed(1)} %`)

function tabla(corrida) {
  const lineas = [
    '| Fuente | Casos | VP | FP | VN | FN | Detección | Falsos positivos | Phishing en Peligroso |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const [nombre, m] of [...Object.entries(corrida.porFuente), ['total', corrida.total]]) {
    lineas.push(
      `| ${nombre} | ${m.casos} | ${m.vp} | ${m.fp} | ${m.vn} | ${m.fn} | ${pct(m.deteccion)} | ${pct(m.falsosPositivos)} | ${pct(m.phishingEnPeligroso)} |`,
    )
  }
  return lineas.join('\n')
}

function itemError(fila, tipo) {
  const motivos = fila.motivos.map((motivo) => `  - ${motivo}`).join('\n')
  const pedido = fila.esperado && !fila.cumpleEsperado ? ` (esperado: ${fila.esperado})` : ''
  return `- **${tipo}** (${fila.source}): \`${fila.url}\` salió **${fila.veredicto}**${pedido}. Señales: ${fila.senales.join(', ') || 'ninguna'}.\n${motivos}`
}

function listaErrores(corrida) {
  const lineas = [
    ...corrida.errores.map((fila) => itemError(fila, fila.label === 'legit' ? 'Falso positivo' : 'Falso negativo')),
    ...corrida.porDebajo.map((fila) => itemError(fila, 'Detectada, pero no con el veredicto esperado')),
  ]
  return lineas.length === 0 ? 'Sin errores.' : lineas.join('\n')
}

export function armarReporte(sinVt, conVt) {
  return `# Línea base de urls_eval.csv

Las URLs \`synthetic\` las armamos nosotros a partir de las mismas reglas que tiene el detector: es una prueba circular y
no mide la detección real. La que vale es \`real\`. Las \`manual\` son legítimas elegidas a mano por difíciles.

"Detectada" quiere decir Precaución o Peligroso. "No pudimos verificarlo" cuenta como no detectada.
Filas de \`real\` sin URL (para completar): ${sinVt.pendientes}.

## Solo la dirección (VirusTotal apagado)

${tabla(sinVt)}

### Errores

${listaErrores(sinVt)}

## Con las respuestas guardadas de VirusTotal

Regla: VirusTotal es una señal más. De ${PUNTAJE.virustotal.motoresMedia} a ${PUNTAJE.virustotal.motoresFuerte - 1} motores "malicious" es una señal media (${PUNTAJE.virustotal.pesoMedia} puntos); ${PUNTAJE.virustotal.motoresFuerte} o más es fuerte (${PUNTAJE.virustotal.pesoFuerte} puntos) y sola alcanza para Peligroso.
Casos con respuesta guardada: ${conVt.filas.filter((fila) => fila.conVirusTotal).length}.

${tabla(conVt)}

### Errores

${listaErrores(conVt)}
`
}

function resumen(corrida) {
  return {
    total: corrida.total,
    porFuente: corrida.porFuente,
    errores: [...corrida.errores, ...corrida.porDebajo].map((fila) => ({
      url: fila.url,
      label: fila.label,
      source: fila.source,
      veredicto: fila.veredicto,
      esperado: fila.esperado,
    })),
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const filas = leerCsv(readFileSync(new URL('./urls_eval.csv', import.meta.url), 'utf8'))
  const sinVt = evaluarUrls(filas)
  const conVt = evaluarUrls(filas, { conVirusTotal: true })
  const reporte = armarReporte(sinVt, conVt)
  console.log(reporte)
  if (process.argv.includes('--guardar')) {
    writeFileSync(new URL('./linea_base_urls.md', import.meta.url), reporte)
    writeFileSync(
      new URL('./linea_base_urls.json', import.meta.url),
      `${JSON.stringify({ sinVirusTotal: resumen(sinVt), conVirusTotal: resumen(conVt) }, null, 2)}\n`,
    )
  }
}
