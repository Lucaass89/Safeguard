export const LIMITE_BYTES = 2 * 1024 * 1024
export const LIMITE_FILAS = 1000

const MENSAJE_CODIFICACION =
  'El archivo parece tener la codificación rota (se ven caracteres como Ã±). Guardalo de nuevo como CSV UTF-8 y volvé a subirlo.'

const CLAVES = {
  nombre: 'nombre',
  name: 'nombre',
  correo: 'correo',
  email: 'correo',
  'e-mail': 'correo',
  mail: 'correo',
  area: 'area',
  departamento: 'area',
  puesto: 'area',
  'area o puesto': 'area',
}

const MENSAJE_SIN_FILAS = 'No encontramos filas con datos. Completá la plantilla y volvé a subirla.'
const MENSAJE_ILEGIBLE = 'No pudimos leer el archivo. Verificá que no tenga contraseña y que no esté dañado.'
const MENSAJE_TOPE = `El archivo tiene más de ${LIMITE_FILAS} filas. El máximo es ${LIMITE_FILAS}.`

function pareceMojibake(texto) {
  return /Ã[\u0080-\u00FF]|Â[\u0080-\u00BF]/.test(texto)
}

export function decodificarCsv(buffer) {
  const bytes = new Uint8Array(buffer)
  if (bytes.length > LIMITE_BYTES) {
    return { error: 'El archivo pesa más de 2 MB. Achicalo o partilo.' }
  }
  if (bytes.length === 0) {
    return { error: 'El archivo está vacío.' }
  }

  let encoding = 'utf-8'
  let inicio = 0
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    inicio = 3
  } else if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    encoding = 'utf-16le'
    inicio = 2
  } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    encoding = 'utf-16be'
    inicio = 2
  }

  const texto = new TextDecoder(encoding).decode(bytes.subarray(inicio))
  if (pareceMojibake(texto)) return { error: MENSAJE_CODIFICACION }
  if (!texto.includes('\uFFFD')) return { texto }

  if (encoding !== 'utf-8') {
    return { error: 'No pudimos leer el archivo. Guardalo como CSV UTF-8 y volvé a subirlo.' }
  }

  const latin = new TextDecoder('windows-1252').decode(bytes)
  if (pareceMojibake(latin) || latin.includes('\uFFFD')) {
    return { error: 'No pudimos leer los acentos. Guardá el archivo como CSV UTF-8 y volvé a subirlo.' }
  }
  return { texto: latin }
}

function filasCrudas(texto) {
  const filas = []
  let actual = ''
  let comillas = false
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i]
    if (c === '"') {
      if (comillas && texto[i + 1] === '"') {
        actual += '""'
        i += 1
        continue
      }
      comillas = !comillas
      actual += c
      continue
    }
    if (!comillas && (c === '\n' || c === '\r')) {
      if (c === '\r' && texto[i + 1] === '\n') i += 1
      filas.push(actual)
      actual = ''
      continue
    }
    actual += c
  }
  if (actual.length > 0) filas.push(actual)
  return filas
}

function contarSeparador(linea, separador) {
  let total = 0
  let comillas = false
  for (let i = 0; i < linea.length; i += 1) {
    const c = linea[i]
    if (c === '"') {
      if (comillas && linea[i + 1] === '"') {
        i += 1
        continue
      }
      comillas = !comillas
      continue
    }
    if (!comillas && c === separador) total += 1
  }
  return total
}

function partirLinea(linea, separador) {
  const campos = []
  let actual = ''
  let comillas = false
  for (let i = 0; i < linea.length; i += 1) {
    const c = linea[i]
    if (comillas) {
      if (c === '"') {
        if (linea[i + 1] === '"') {
          actual += '"'
          i += 1
        } else {
          comillas = false
        }
      } else {
        actual += c
      }
      continue
    }
    if (c === '"') {
      comillas = true
      continue
    }
    if (c === separador) {
      campos.push(actual)
      actual = ''
      continue
    }
    actual += c
  }
  campos.push(actual)
  return campos.map((campo) => campo.trim())
}

function claveColumna(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function textoCelda(valor) {
  if (valor == null) return ''
  if (typeof valor === 'number') return String(valor).trim()
  if (typeof valor === 'boolean') return valor ? 'true' : 'false'
  if (valor instanceof Date) return ''
  return String(valor).replaceAll('\u00a0', ' ').trim()
}

function normalizarCorreo(valor) {
  let correo = textoCelda(valor).replace(/\s+/g, '').toLowerCase()
  while (correo.startsWith('mailto:')) correo = correo.slice(7)
  return correo
}

function riesgoFormula(valor) {
  return /^[=+\-@]/.test(valor)
}

function errorColumnas(nombres) {
  const encontradas = nombres.map((nombre) => String(nombre).trim()).filter(Boolean)
  const lista = encontradas.length > 0 ? encontradas.join(', ') : 'ninguna'
  return { error: `Falta la columna nombre o correo. Encontré: ${lista}.` }
}

function correoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) && correo.length <= 320
}

function areaCanonica(area, existentes) {
  const limpia = area.trim()
  if (!limpia) return 'General'
  const hallada = existentes.find((item) => item.toLowerCase() === limpia.toLowerCase())
  return hallada ?? limpia
}

function mapearTabla(encabezados, datos) {
  const columnas = encabezados.map((nombre) => claveColumna(textoCelda(nombre)))
  const mapa = {}
  columnas.forEach((columna, indice) => {
    const destino = CLAVES[columna]
    if (destino && mapa[destino] === undefined) mapa[destino] = indice
  })
  if (mapa.nombre === undefined || mapa.correo === undefined) return errorColumnas(encabezados)

  const filas = []
  datos.forEach((dato) => {
    const celdas = dato.celdas ?? []
    const nombre = textoCelda(celdas[mapa.nombre])
    const correo = normalizarCorreo(celdas[mapa.correo])
    const area = mapa.area === undefined ? '' : textoCelda(celdas[mapa.area])
    if (!nombre && !correo && !area) return
    filas.push({ fila: dato.numero, nombre, correo, area })
  })
  if (filas.length === 0) return { error: MENSAJE_SIN_FILAS }
  if (filas.length > LIMITE_FILAS) return { error: MENSAJE_TOPE }
  return { filas }
}

export function analizarFilas(filas, { correos = [], areas = [], dominios = [], hoja = '', masHojas = false } = {}) {
  const yaCargados = new Set(correos.map((correo) => correo.trim().toLowerCase()))
  const vistos = new Map()
  const dominiosConocidos = new Set(dominios.map((dominio) => dominio.trim().toLowerCase()).filter(Boolean))
  const areasNuevas = []
  const areasVistas = new Set(areas.map((area) => area.trim().toLowerCase()).filter(Boolean))
  areasVistas.add('general')

  const revisadas = filas.map((fila) => {
    const area = areaCanonica(fila.area, areas)
    const base = { fila: fila.fila, nombre: fila.nombre, correo: fila.correo, area, aviso: '' }

    if (riesgoFormula(fila.nombre) || riesgoFormula(fila.area)) {
      return {
        ...base,
        area: fila.area,
        resultado: 'invalida',
        motivo: 'El nombre o el área empieza con un símbolo que Excel puede tomar como fórmula.',
      }
    }
    if (!fila.nombre || fila.nombre.length > 200) {
      return { ...base, resultado: 'invalida', motivo: fila.nombre ? 'El nombre es demasiado largo.' : 'Falta el nombre.' }
    }
    if (!correoValido(fila.correo)) {
      return { ...base, resultado: 'invalida', motivo: 'El correo no es válido.' }
    }
    if (area.length > 120) {
      return { ...base, resultado: 'invalida', motivo: 'El área es demasiado larga.' }
    }

    const dominio = fila.correo.slice(fila.correo.indexOf('@') + 1)
    const aviso = dominiosConocidos.size > 0 && !dominiosConocidos.has(dominio)
      ? `El dominio ${dominio} no es el de la empresa. Se puede cargar igual.`
      : ''

    if (yaCargados.has(fila.correo)) {
      return { ...base, aviso, resultado: 'duplicada', motivo: 'Ese correo ya está cargado en tu empresa.' }
    }
    if (vistos.has(fila.correo)) {
      return {
        ...base,
        aviso,
        resultado: 'duplicada',
        motivo: `Ese correo ya está en el archivo, en la fila ${vistos.get(fila.correo)}.`,
      }
    }
    vistos.set(fila.correo, fila.fila)

    if (!areasVistas.has(area.toLowerCase())) {
      areasVistas.add(area.toLowerCase())
      areasNuevas.push(area)
    }

    return { ...base, aviso, resultado: 'valida', motivo: '' }
  })

  return {
    filas: revisadas,
    validas: revisadas.filter((fila) => fila.resultado === 'valida'),
    duplicadas: revisadas.filter((fila) => fila.resultado === 'duplicada').length,
    invalidas: revisadas.filter((fila) => fila.resultado === 'invalida'),
    areasNuevas,
    hoja,
    masHojas,
  }
}

export function analizarCsv(texto, opciones = {}) {
  const numeradas = filasCrudas(texto).map((linea, indice) => ({ linea, numero: indice + 1 }))
  const utiles = numeradas.filter((fila) => fila.linea.trim() !== '')
  if (utiles.length === 0) return { error: 'El archivo está vacío.' }

  const encabezado = utiles[0].linea
  const comas = contarSeparador(encabezado, ',')
  const puntos = contarSeparador(encabezado, ';')
  if (comas === 0 && puntos === 0) {
    return { error: 'No encontré columnas. Separalas con coma o punto y coma.' }
  }
  const separador = puntos > comas ? ';' : ','
  const datos = []
  utiles.slice(1).forEach((fila) => {
    datos.push({ numero: fila.numero, celdas: partirLinea(fila.linea, separador) })
  })
  if (datos.length > LIMITE_FILAS) return { error: MENSAJE_TOPE }

  const tabla = mapearTabla(partirLinea(encabezado, separador), datos)
  if (tabla.error) return tabla
  return analizarFilas(tabla.filas, opciones)
}

export function interpretarLibro(hojas, opciones = {}) {
  if (!Array.isArray(hojas) || hojas.length === 0) return { error: MENSAJE_ILEGIBLE }
  const primera = hojas[0]
  const celdas = primera?.data
  if (!Array.isArray(celdas) || celdas.length === 0) return { error: MENSAJE_SIN_FILAS }

  const indiceEncabezado = celdas.findIndex((fila) => Array.isArray(fila) && fila.some((celda) => textoCelda(celda) !== ''))
  if (indiceEncabezado === -1) return { error: MENSAJE_SIN_FILAS }

  const datos = []
  for (let i = indiceEncabezado + 1; i < celdas.length; i += 1) {
    const fila = Array.isArray(celdas[i]) ? celdas[i] : []
    if (!fila.some((celda) => textoCelda(celda) !== '')) continue
    datos.push({ numero: i + 1, celdas: fila })
    if (datos.length > LIMITE_FILAS) return { error: MENSAJE_TOPE }
  }

  const tabla = mapearTabla(celdas[indiceEncabezado], datos)
  if (tabla.error) return tabla
  return analizarFilas(tabla.filas, {
    ...opciones,
    hoja: primera.sheet ?? '',
    masHojas: hojas.length > 1,
  })
}

export async function leerXlsx(archivo, opciones = {}) {
  // fflate, que es quien descomprime el .xlsx, no pone tope al tamaño
  // descomprimido: usa el tamaño que declara el zip. El tope de 2 MB es
  // del archivo subido, no de lo que el zip dice que pesa adentro.
  // readSheet lee una sola hoja pero no devuelve su nombre ni si hay más.
  // La exportación por defecto de la 9.3.10 sí. Nos quedamos con la primera.
  try {
    const { default: leerLibro } = await import('read-excel-file/browser')
    return interpretarLibro(await leerLibro(archivo), opciones)
  } catch {
    return { error: MENSAJE_ILEGIBLE }
  }
}

export function plantillaCsv() {
  return '\uFEFFnombre;correo;area\r\nAna Pérez;ana.perez@empresa.com;Ventas\r\n'
}

export function reporteErrores(filas) {
  const lineas = ['fila;motivo']
  filas
    .filter((fila) => fila.resultado !== 'valida')
    .forEach((fila) => {
      const motivo = fila.motivo.replaceAll('"', '""')
      lineas.push(`${fila.fila};"${motivo}"`)
    })
  return `\uFEFF${lineas.join('\r\n')}\r\n`
}
