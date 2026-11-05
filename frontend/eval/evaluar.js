import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { analizar } from '../src/lib/analisis.js'
import { construirCasos, TRANCO } from './casos.js'

const NIVELES = ['verde', 'gris', 'amarillo', 'rojo']
const NOMBRE = { verde: 'Sin señales', gris: 'No pudimos verificarlo', amarillo: 'Precaución', rojo: 'Peligroso' }
const DETECTA = new Set(['amarillo', 'rojo'])
const SIN_VEREDICTO = 'sin_resultado'

const tasa = (parte, total) => (total ? parte / total : 0)
const porciento = (valor) => `${(valor * 100).toFixed(2)} %`

function senalesDe(resultado) {
  return (resultado?.senales ?? []).filter((senal) => senal.puntos > 0).sort((a, b) => b.puntos - a.puntos)
}

export function evaluar(casos = construirCasos()) {
  const filas = casos.map((caso) => {
    const resultado = analizar(caso.url)
    return {
      ...caso,
      nivel: resultado?.nivel ?? SIN_VEREDICTO,
      puntuacion: resultado?.puntuacion ?? null,
      senales: senalesDe(resultado).map((senal) => senal.id),
      anotaciones: (resultado?.senales ?? []).filter((senal) => senal.puntos === 0).map((senal) => senal.id),
      marcaDetectada: resultado?.parecido?.marca ?? null,
    }
  })

  const matriz = {}
  for (const esperado of ['legitimo', 'malicioso']) {
    matriz[esperado] = Object.fromEntries([...NIVELES, SIN_VEREDICTO].map((nivel) => [nivel, 0]))
  }
  for (const fila of filas) matriz[fila.esperado][fila.nivel] += 1

  const legitimos = filas.filter((fila) => fila.esperado === 'legitimo')
  const maliciosos = filas.filter((fila) => fila.esperado === 'malicioso')
  const falsosPositivos = legitimos.filter((fila) => DETECTA.has(fila.nivel))
  const detectados = maliciosos.filter((fila) => DETECTA.has(fila.nivel))

  // Regla dura: ninguna imitación de una marca de la lista sale como "Sin señales".
  const violaciones = maliciosos.filter(
    (fila) => ['typosquat', 'regresion'].includes(fila.categoria) && (fila.nivel === 'verde' || fila.nivel === SIN_VEREDICTO),
  )
  const fueraDeLoEsperado = filas.filter((fila) => fila.niveles && !fila.niveles.includes(fila.nivel))
  const marcaEquivocada = filas.filter((fila) => fila.categoria === 'regresion' && fila.marca !== fila.marcaDetectada)

  return {
    filas,
    matriz,
    totales: { casos: filas.length, legitimos: legitimos.length, maliciosos: maliciosos.length },
    tasas: {
      falsosPositivos: tasa(falsosPositivos.length, legitimos.length),
      deteccion: tasa(detectados.length, maliciosos.length),
      legitimosSinVerificar: tasa(matriz.legitimo.gris, legitimos.length),
      maliciososSinVerificar: tasa(matriz.malicioso.gris, maliciosos.length),
    },
    falsosPositivos,
    noDetectados: maliciosos.filter((fila) => !DETECTA.has(fila.nivel)),
    violaciones,
    fueraDeLoEsperado,
    marcaEquivocada,
  }
}

export function verificarUmbrales(resultado, umbrales) {
  const fallas = []
  const { tasas } = resultado
  if (tasas.falsosPositivos > umbrales.falsosPositivosMax) {
    fallas.push(`Falsos positivos ${porciento(tasas.falsosPositivos)}: el máximo es ${porciento(umbrales.falsosPositivosMax)}.`)
  }
  if (tasas.deteccion < umbrales.deteccionMin) {
    fallas.push(`Detección ${porciento(tasas.deteccion)}: el mínimo es ${porciento(umbrales.deteccionMin)}.`)
  }
  if (tasas.maliciososSinVerificar > umbrales.maliciososSinVerificarMax) {
    fallas.push(
      `Maliciosos sin verificar ${porciento(tasas.maliciososSinVerificar)}: el máximo es ${porciento(umbrales.maliciososSinVerificarMax)}.`,
    )
  }
  for (const fila of resultado.violaciones) {
    fallas.push(`Regla dura: ${fila.url} (${fila.tecnica ?? fila.categoria}, ${fila.marca}) salió ${fila.nivel}.`)
  }
  for (const fila of resultado.fueraDeLoEsperado) {
    fallas.push(`${fila.url} (${fila.categoria}) salió ${fila.nivel}; se esperaba ${fila.niveles.join(' o ')}.`)
  }
  for (const fila of resultado.marcaEquivocada) {
    fallas.push(`${fila.url} debía imitar a ${fila.marca} y el motor marcó ${fila.marcaDetectada ?? 'ninguna marca'}.`)
  }
  return fallas
}

function tabla(encabezados, filas) {
  const linea = (celdas) => `| ${celdas.join(' | ')} |`
  return [linea(encabezados), linea(encabezados.map(() => '---')), ...filas.map(linea)].join('\n')
}

function agrupar(filas, clave) {
  const grupos = new Map()
  for (const fila of filas) {
    const nombre = typeof clave === 'function' ? clave(fila) : fila[clave]
    if (!grupos.has(nombre)) grupos.set(nombre, [])
    grupos.get(nombre).push(fila)
  }
  return [...grupos.entries()]
}

function porNivel(filas) {
  return NIVELES.map((nivel) => String(filas.filter((fila) => fila.nivel === nivel).length))
}

const celda = (texto) => String(texto).replace(/\|/g, '\\|')
const listaSenales = (fila) => (fila.senales.length ? fila.senales.join(', ') : `sin puntos (${fila.anotaciones.join(', ') || 'nada'})`)

export function armarReporte(resultado, umbrales, fallas) {
  const { matriz, tasas, totales } = resultado
  const columnas = NIVELES.map((nivel) => `${nivel} (${NOMBRE[nivel]})`)

  const conteoSenales = new Map()
  for (const fila of resultado.filas) {
    for (const id of fila.senales) {
      const actual = conteoSenales.get(id) ?? { legitimo: 0, malicioso: 0, decisiva: 0 }
      actual[fila.esperado] += 1
      conteoSenales.set(id, actual)
    }
    if (fila.senales[0]) {
      const actual = conteoSenales.get(fila.senales[0])
      actual.decisiva += 1
    }
  }

  const partes = [
    '# Evaluación del motor de SafeLink',
    '',
    'Generado por `npm run eval` (frontend/eval/evaluar.js). Evalúa el análisis local de la dirección (`analizar`),',
    'el mismo que corre en el teléfono y en la web antes de consultar al servidor. No incluye el seguimiento de',
    'redirecciones, la edad del dominio ni las bases de amenazas, porque dependen de la red.',
    '',
    `Legítimos de Tranco: top ${TRANCO.cantidad} de la lista ${TRANCO.id} (${TRANCO.fecha}), ${TRANCO.url}.`,
    '',
    '## Resumen',
    '',
    tabla(
      ['Medida', 'Valor', 'Umbral'],
      [
        ['Casos', totales.casos, ''],
        ['Legítimos', totales.legitimos, ''],
        ['Maliciosos', totales.maliciosos, ''],
        ['Falsos positivos (legítimo en Precaución o Peligroso)', porciento(tasas.falsosPositivos), `≤ ${porciento(umbrales.falsosPositivosMax)}`],
        ['Detección (malicioso en Precaución o Peligroso)', porciento(tasas.deteccion), `≥ ${porciento(umbrales.deteccionMin)}`],
        ['Maliciosos en No pudimos verificarlo', porciento(tasas.maliciososSinVerificar), `≤ ${porciento(umbrales.maliciososSinVerificarMax)}`],
        ['Legítimos en No pudimos verificarlo', porciento(tasas.legitimosSinVerificar), ''],
        ['Imitaciones de marca en Sin señales (regla dura)', resultado.violaciones.length, '= 0'],
      ],
    ),
    '',
    fallas.length ? `**Falla: ${fallas.length} problema(s).**\n\n${fallas.map((falla) => `- ${falla}`).join('\n')}` : '**Pasa todos los umbrales.**',
    '',
    '## Matriz de confusión',
    '',
    tabla(['Esperado', ...columnas], ['legitimo', 'malicioso'].map((esperado) => [esperado, ...NIVELES.map((nivel) => matriz[esperado][nivel])])),
    '',
    '## Por categoría',
    '',
    tabla(
      ['Esperado', 'Categoría', 'Casos', ...NIVELES],
      agrupar(resultado.filas, (fila) => `${fila.esperado}|${fila.categoria}`).map(([, filas]) => [
        filas[0].esperado,
        filas[0].categoria,
        filas.length,
        ...porNivel(filas),
      ]),
    ),
    '',
    '## Maliciosos por técnica',
    '',
    tabla(
      ['Técnica', 'Casos', ...NIVELES, 'Detección'],
      agrupar(
        resultado.filas.filter((fila) => fila.esperado === 'malicioso'),
        'tecnica',
      ).map(([tecnica, filas]) => [
        tecnica,
        filas.length,
        ...porNivel(filas),
        porciento(tasa(filas.filter((fila) => DETECTA.has(fila.nivel)).length, filas.length)),
      ]),
    ),
    '',
    '## Qué señal produjo cada veredicto',
    '',
    'Cuántos veredictos sumaron puntos con cada señal. "Decisiva" es la que más puntos aportó en ese caso.',
    'El detalle de cada caso está en `eval/resultados.csv`.',
    '',
    tabla(
      ['Señal', 'En legítimos', 'En maliciosos', 'Decisiva'],
      [...conteoSenales.entries()]
        .sort((a, b) => b[1].decisiva - a[1].decisiva || a[0].localeCompare(b[0]))
        .map(([id, conteo]) => [`\`${id}\``, conteo.legitimo, conteo.malicioso, conteo.decisiva]),
    ),
    '',
    `## Falsos positivos (${resultado.falsosPositivos.length})`,
    '',
    tabla(
      ['Dirección', 'Categoría', 'Nivel', 'Señales'],
      resultado.falsosPositivos.map((fila) => [celda(fila.url), fila.categoria, fila.nivel, listaSenales(fila)]),
    ),
    '',
    `## Maliciosos no detectados (${resultado.noDetectados.length})`,
    '',
    tabla(
      ['Dirección', 'Técnica', 'Marca', 'Nivel', 'Señales'],
      resultado.noDetectados.map((fila) => [celda(fila.url), fila.tecnica ?? fila.categoria, fila.marca ?? '-', fila.nivel, listaSenales(fila)]),
    ),
    '',
  ]
  return partes.join('\n')
}

function csv(filas) {
  const escapar = (valor) => {
    const texto = String(valor ?? '')
    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }
  const columnas = ['url', 'esperado', 'categoria', 'tecnica', 'marca', 'nivel', 'puntuacion', 'senales', 'anotaciones']
  return [
    columnas.join(','),
    ...filas.map((fila) =>
      [fila.url, fila.esperado, fila.categoria, fila.tecnica, fila.marca, fila.nivel, fila.puntuacion, fila.senales.join(' '), fila.anotaciones.join(' ')]
        .map(escapar)
        .join(','),
    ),
  ].join('\n')
}

export function leerUmbrales() {
  return JSON.parse(readFileSync(new URL('./umbrales.json', import.meta.url), 'utf8'))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const umbrales = leerUmbrales()
  const resultado = evaluar()
  const fallas = verificarUmbrales(resultado, umbrales)
  writeFileSync(new URL('./reporte.md', import.meta.url), armarReporte(resultado, umbrales, fallas))
  writeFileSync(new URL('./resultados.csv', import.meta.url), `${csv(resultado.filas)}\n`)

  const { tasas } = resultado
  console.log(`Casos: ${resultado.totales.casos} (${resultado.totales.legitimos} legítimos, ${resultado.totales.maliciosos} maliciosos)`)
  console.log(`Falsos positivos: ${porciento(tasas.falsosPositivos)} (máximo ${porciento(umbrales.falsosPositivosMax)})`)
  console.log(`Detección: ${porciento(tasas.deteccion)} (mínimo ${porciento(umbrales.deteccionMin)})`)
  console.log(`Maliciosos sin verificar: ${porciento(tasas.maliciososSinVerificar)} (máximo ${porciento(umbrales.maliciososSinVerificarMax)})`)
  console.log('Reporte: eval/reporte.md')
  if (fallas.length) {
    console.error(`\nLa evaluación falló:\n${fallas.map((falla) => `- ${falla}`).join('\n')}`)
    process.exit(1)
  }
}
