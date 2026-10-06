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
}

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
  return valor
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
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

export function analizarCsv(texto, { correos = [], areas = [], dominios = [] } = {}) {
  const crudas = filasCrudas(texto).filter((linea, indice) => indice === 0 || linea.trim() !== '')
  if (crudas.length === 0) return { error: 'El archivo está vacío.' }

  const encabezado = crudas[0]
  const comas = contarSeparador(encabezado, ',')
  const puntos = contarSeparador(encabezado, ';')
  if (comas === 0 && puntos === 0) {
    return { error: 'No encontré columnas. Separalas con coma o punto y coma.' }
  }
  const separador = puntos > comas ? ';' : ','
  const columnas = partirLinea(encabezado, separador).map(claveColumna)
  const mapa = {}
  columnas.forEach((columna, indice) => {
    const destino = CLAVES[columna]
    if (destino && mapa[destino] === undefined) mapa[destino] = indice
  })
  if (mapa.nombre === undefined || mapa.correo === undefined) {
    return { error: 'El archivo tiene que tener las columnas nombre y correo. Área es opcional.' }
  }

  const datos = crudas.slice(1).filter((linea) => linea.trim() !== '')
  if (datos.length === 0) return { error: 'El archivo no tiene personas.' }
  if (datos.length > LIMITE_FILAS) {
    return { error: `El archivo tiene más de ${LIMITE_FILAS} filas. El máximo es ${LIMITE_FILAS}.` }
  }

  const yaCargados = new Set(correos.map((correo) => correo.trim().toLowerCase()))
  const vistos = new Map()
  const dominiosConocidos = new Set(dominios.map((dominio) => dominio.trim().toLowerCase()).filter(Boolean))
  const areasNuevas = []
  const areasVistas = new Set(areas.map((area) => area.trim().toLowerCase()).filter(Boolean))
  areasVistas.add('general')

  const filas = datos.map((linea, indice) => {
    const numero = indice + 2
    const campos = partirLinea(linea, separador)
    const nombre = (campos[mapa.nombre] ?? '').trim()
    const correo = (campos[mapa.correo] ?? '').trim().toLowerCase()
    const area = areaCanonica(mapa.area === undefined ? '' : (campos[mapa.area] ?? ''), areas)
    const base = { fila: numero, nombre, correo, area, aviso: '' }

    if (!nombre || nombre.length > 200) {
      return { ...base, resultado: 'invalida', motivo: nombre ? 'El nombre es demasiado largo.' : 'Falta el nombre.' }
    }
    if (!correoValido(correo)) {
      return { ...base, resultado: 'invalida', motivo: 'El correo no es válido.' }
    }
    if (area.length > 120) {
      return { ...base, resultado: 'invalida', motivo: 'El área es demasiado larga.' }
    }

    const dominio = correo.slice(correo.indexOf('@') + 1)
    const aviso = dominiosConocidos.size > 0 && !dominiosConocidos.has(dominio)
      ? `El dominio ${dominio} no es el de la empresa. Se puede cargar igual.`
      : ''

    if (yaCargados.has(correo)) {
      return { ...base, aviso, resultado: 'duplicada', motivo: 'Ese correo ya está cargado en tu empresa.' }
    }
    if (vistos.has(correo)) {
      return {
        ...base,
        aviso,
        resultado: 'duplicada',
        motivo: `Ese correo ya está en el archivo, en la fila ${vistos.get(correo)}.`,
      }
    }
    vistos.set(correo, numero)

    if (!areasVistas.has(area.toLowerCase())) {
      areasVistas.add(area.toLowerCase())
      areasNuevas.push(area)
    }

    return { ...base, aviso, resultado: 'valida', motivo: '' }
  })

  return {
    filas,
    validas: filas.filter((fila) => fila.resultado === 'valida'),
    duplicadas: filas.filter((fila) => fila.resultado === 'duplicada').length,
    invalidas: filas.filter((fila) => fila.resultado === 'invalida'),
    areasNuevas,
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
