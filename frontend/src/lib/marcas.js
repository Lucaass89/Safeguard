import datosMarcas from '../data/marcas.json' with { type: 'json' }
import datosPlataformas from '../data/plataformas.json' with { type: 'json' }
import { aLatin, decodificarEtiqueta } from './enlace.js'

function sinAcentos(texto) {
  return texto.normalize('NFD').replace(/\p{M}/gu, '')
}

function plano(texto) {
  return aLatin(sinAcentos(texto.toLowerCase()))
}

export const MARCAS = datosMarcas.marcas.map((marca) => ({
  id: marca.id,
  nombre: marca.nombre,
  oficiales: marca.oficiales,
  principal: marca.oficiales[0],
  nombres: (marca.nombres ?? []).map((nombre) => {
    const palabras = plano(nombre).split(/\s+/).filter(Boolean)
    return { palabras, compacto: palabras.join('') }
  }),
  comunes: (marca.comunes ?? []).map(plano),
  excepciones: new Set((marca.excepciones ?? []).map(plano)),
}))

const OFICIALES = new Map(MARCAS.flatMap((marca) => marca.oficiales.map((dominio) => [dominio, marca])))

// Recibe un dominio registrable y solo acepta la coincidencia exacta.
export function marcaOficialDe(dominio) {
  return OFICIALES.get((dominio ?? '').toLowerCase()) ?? null
}

const PLATAFORMAS = [
  ['acortador', datosPlataformas.acortadores],
  ['temporal', datosPlataformas.direccionesTemporales],
  ['contenido', datosPlataformas.contenidoDeTerceros],
]

export function plataformaDe(host) {
  const limpio = (host ?? '').toLowerCase().replace(/\.$/, '')
  for (const [tipo, lista] of PLATAFORMAS) {
    const plataforma = lista.find((nombre) => limpio === nombre || limpio.endsWith(`.${nombre}`))
    if (plataforma) return { tipo, plataforma }
  }
  return null
}

const RELLENO = new Set([
  'login', 'signin', 'signup', 'secure', 'seguro', 'security', 'seguridad', 'support', 'soporte', 'online',
  'cuenta', 'cuentas', 'verificar', 'verificacion', 'verify', 'verification', 'validar', 'validacion',
  'validation', 'app', 'oficial', 'ayuda', 'help', 'update', 'actualizar', 'pay', 'pago', 'pagos', 'info',
  'web', 'mail', 'account', 'auth', 'acceso', 'ingreso', 'ingresar', 'alert', 'alerta', 'alertas', 'service',
  'servicio', 'servicios', 'cliente', 'clientes', 'factura', 'facturas', 'billing', 'wallet', 'billetera',
  'centro', 'center', 'confirm', 'confirma', 'confirmar', 'restore', 'recuperar', 'recuperacion', 'recovery',
  'unlock', 'desbloqueo', 'desbloquear', 'notice', 'aviso', 'banco', 'bank', 'gob', 'gov', 'shop', 'tienda',
  'store', 'suspend', 'suspendida', 'bloqueo', 'bloqueada', 'clave', 'token', 'tramite', 'tramites', 'turno',
  'turnos', 'deuda', 'reintegro', 'beneficio', 'beneficios', 'bono', 'premio', 'premios', 'sorteo', 'promo',
  'promocion', 'envio', 'envios', 'seguimiento', 'portal', 'argentina', 'home', 'inicio',
])

const PAISES = new Set(['ar', 'arg', 'com', 'net', 'latam'])

const SENSIBLES = new Set([
  'login', 'signin', 'ingresar', 'ingreso', 'acceso', 'verificar', 'verificacion', 'verify', 'validar',
  'validacion', 'confirmar', 'confirma', 'actualizar', 'update', 'recuperar', 'recuperacion', 'recovery',
  'restore', 'desbloquear', 'desbloqueo', 'unlock', 'bloqueo', 'bloqueada', 'suspendida', 'suspend', 'clave',
  'password', 'contrasena', 'seguridad', 'security', 'secure', 'cuenta', 'account', 'auth', 'premio', 'sorteo',
  'reintegro', 'reclamo', 'ayuda', 'soporte', 'support', 'help', 'token',
])

const DIGITOS = { 0: 'o', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b' }

// Formas de leer un texto deshaciendo los trucos visuales. El 1 puede pasar por l o por i,
// y una I mayúscula se ve igual que una l, por eso salen varias lecturas.
export function variantes(texto) {
  const leido = plano(texto)
    .replace(/[034578]/g, (cifra) => DIGITOS[cifra])
    .replace(/rn/g, 'm')
    .replace(/vv/g, 'w')
  const conL = leido.replace(/1/g, 'l')
  return [...new Set([conL, leido.replace(/1/g, 'i'), conL.replace(/i/g, 'l')])]
}

// Damerau-Levenshtein en su forma de alineación óptima: cuenta como un solo error
// cambiar, agregar, sacar o invertir dos letras vecinas.
export function distanciaDL(a, b) {
  const x = [...a]
  const y = [...b]
  const d = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)])
  for (let j = 1; j <= y.length; j++) d[0][j] = j
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      const costo = x[i - 1] === y[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costo)
      if (i > 1 && j > 1 && x[i - 1] === y[j - 2] && x[i - 2] === y[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[x.length][y.length]
}

// Con cuatro letras o menos, un error de distancia ya es otra palabra (arca, area); ahí solo vale
// la coincidencia exacta después de deshacer los trucos.
export function umbral(largo) {
  if (largo <= 4) return 0
  if (largo <= 8) return 1
  return 2
}

function restoSospechoso(resto, nombre) {
  if (!resto) return false
  if (/^\d+$/.test(resto)) return true
  if (PAISES.has(resto)) return nombre.length >= 6
  return RELLENO.has(resto)
}

function conRelleno(texto, nombre) {
  if (texto === nombre || !texto.includes(nombre)) return false
  if (nombre.length >= 10) return true
  if (texto.startsWith(nombre) && restoSospechoso(texto.slice(nombre.length), nombre)) return true
  return texto.endsWith(nombre) && restoSospechoso(texto.slice(0, -nombre.length), nombre)
}

function comoSeEscribio(candidato, variante) {
  const latino = aLatin(sinAcentos(candidato))
  if (latino !== sinAcentos(candidato).toLowerCase()) return 'alfabeto'
  return variante !== latino || sinAcentos(candidato) !== candidato ? 'letras' : 'nombre'
}

function partesDe(etiqueta) {
  const partes = etiqueta.split('-').filter(Boolean)
  const compacto = partes.join('')
  return { compacto, candidatos: [...new Set([compacto, ...partes])], partes }
}

function comunConRelleno(marca, partes) {
  if (partes.length < 2) return null
  for (const parte of partes) {
    const lecturas = variantes(parte)
    const comun = marca.comunes.find((palabra) => lecturas.includes(palabra))
    if (!comun) continue
    const otras = partes.filter((otra) => otra !== parte)
    if (otras.some((otra) => RELLENO.has(plano(otra)))) return { candidato: parte, variante: comun, termino: comun }
  }
  return null
}

function buscarEnEtiqueta(etiqueta, { exacto }) {
  const { compacto, candidatos, partes } = partesDe(etiqueta)
  let mejor = null
  const anotar = (marca, candidato, variante, termino, distancia) => {
    if (mejor && mejor.distancia <= distancia) return
    mejor = { marca, candidato, variante, termino, distancia, completo: candidato === compacto && partes.length === 1 }
  }

  for (const marca of MARCAS) {
    for (const candidato of candidatos) {
      for (const variante of variantes(candidato)) {
        if (marca.excepciones.has(variante)) continue
        for (const { compacto: termino } of marca.nombres) {
          if (exacto && termino.length < 3) continue
          const distancia = distanciaDL(variante, termino)
          if (distancia <= (exacto ? 0 : umbral(termino.length))) anotar(marca, candidato, variante, termino, distancia)
          else if (conRelleno(variante, termino)) anotar(marca, candidato, variante, termino, 0)
        }
      }
    }
    const comun = comunConRelleno(marca, partes)
    if (comun) anotar(marca, comun.candidato, comun.variante, comun.termino, 0)
  }
  return mejor
}

function hallazgo(encontrado, como, extra = {}) {
  const { marca, candidato, termino, distancia, completo } = encontrado
  return {
    marca: marca.id,
    nombre: marca.nombre,
    oficial: marca.principal,
    como,
    visto: candidato,
    termino,
    distancia,
    completo,
    ...extra,
  }
}

// Busca una imitación de marca en un dominio que no es el oficial. Primero en el nombre del
// dominio registrable (con errores de tipeo y letras cambiadas) y después en los subdominios,
// donde solo vale el nombre exacto de la marca. Un enlace inválido nunca es el sitio oficial,
// aunque al compararlo quede igual.
export function parecidoAMarca({ dominio, etiqueta, subdominio }, { invalido = false } = {}) {
  if (!etiqueta || (!invalido && marcaOficialDe(dominio))) return null

  const nombre = decodificarEtiqueta(etiqueta)
  const enNombre = buscarEnEtiqueta(nombre, { exacto: false })
  if (enNombre) {
    const como = comoSeEscribio(enNombre.candidato, enNombre.variante)
    return hallazgo(enNombre, enNombre.distancia > 0 && como !== 'alfabeto' ? 'parecido' : como)
  }

  for (const parte of (subdominio ?? '').split('.')) {
    if (!parte || parte === 'www') continue
    const enSubdominio = buscarEnEtiqueta(decodificarEtiqueta(parte), { exacto: true })
    if (enSubdominio) return hallazgo(enSubdominio, 'subdominio', { visto: decodificarEtiqueta(parte), dominio })
  }
  return null
}

function palabrasDe(texto) {
  return plano(texto ?? '').split(/[^a-z0-9]+/).filter(Boolean)
}

export function marcaEnTexto(texto) {
  const palabras = palabrasDe(texto)
  if (palabras.length === 0) return null
  const unidas = ` ${palabras.join(' ')} `
  for (const marca of MARCAS) {
    for (const { palabras: partes, compacto } of marca.nombres) {
      if (
        unidas.includes(` ${partes.join(' ')} `) ||
        (partes.length > 1 && palabras.includes(compacto)) ||
        (compacto.length >= 10 && palabras.some((palabra) => palabra.includes(compacto)))
      ) {
        return { marca: marca.id, nombre: marca.nombre, oficial: marca.principal }
      }
    }
  }
  return null
}

const RASTREO = /^(utm_\w+|fbclid|gclid|igshid|si|ref|ref_src|source|via|campaign)$/i

function decodificar(texto) {
  try {
    return decodeURIComponent(texto)
  } catch {
    return texto
  }
}

// Marca nombrada en el camino o en los parámetros. Los de seguimiento (utm_source=facebook)
// no cuentan: los agrega cualquier sitio que comparte en redes.
export function marcaEnCamino(url) {
  const camino = decodificar(`${url.pathname} ${url.hash}`)
  const parametros = [...url.searchParams]
    .filter(([clave]) => !RASTREO.test(clave))
    .map(([clave, valor]) => `${clave} ${valor}`)
    .join(' ')

  for (const [donde, texto] of [
    ['camino', camino],
    ['parametro', parametros],
  ]) {
    const encontrada = marcaEnTexto(texto)
    if (!encontrada) continue
    const todo = `${camino} ${parametros}`.toLowerCase()
    const marca = MARCAS.find((candidata) => candidata.id === encontrada.marca)
    return {
      ...encontrada,
      donde,
      nombraOficial: marca.oficiales.some((oficial) => todo.includes(oficial)),
      sensible: palabrasDe(todo).some((palabra) => SENSIBLES.has(palabra)),
    }
  }
  return null
}

// Para un host que no se puede abrir: saca lo que no puede ir en un dominio solo para comparar
// contra las marcas. El enlace no se arregla ni se abre.
export function hostParaComparar(escrito) {
  const etiquetas = (escrito ?? '')
    .toLowerCase()
    .split('.')
    .map((etiqueta) => etiqueta.replace(/[^\p{L}\p{N}-]/gu, '').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
  return etiquetas.length >= 2 ? etiquetas.join('.') : null
}
