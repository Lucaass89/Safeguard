import { parse as partirDominio } from 'tldts'

export const LARGO_MAXIMO = 2048

const ESQUEMAS_PELIGROSOS = new Set(['javascript', 'vbscript', 'data', 'file', 'blob', 'filesystem'])

const INVISIBLES = /[\u00ad\u180e\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/
// eslint-disable-next-line no-control-regex
const ESPACIOS = /[\s\u0000-\u001f\u007f]/
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/
const PSL = { allowPrivateDomains: true }

const MAL_ARMADO = 'El nombre del sitio está mal armado, con guiones o puntos de más.'

export const HOMO = {
  а: 'a',
  е: 'e',
  о: 'o',
  р: 'p',
  с: 'c',
  у: 'y',
  х: 'x',
  і: 'i',
  ӏ: 'l',
  ѕ: 's',
  һ: 'h',
  к: 'k',
  м: 'm',
  т: 't',
  ο: 'o',
  α: 'a',
  ε: 'e',
  ν: 'v',
  ј: 'j',
  ԁ: 'd',
  ԛ: 'q',
  ԝ: 'w',
  ѵ: 'v',
  ɡ: 'g',
  ı: 'i',
  ι: 'i',
  κ: 'k',
  ρ: 'p',
  τ: 't',
  υ: 'u',
  χ: 'x',
}

export function aLatin(texto) {
  return [...texto.toLowerCase()].map((letra) => HOMO[letra] ?? letra).join('')
}

function adapt(delta, numPoints, first) {
  let d = first ? Math.floor(delta / 700) : delta >> 1
  d += Math.floor(d / numPoints)
  let k = 0
  while (d > 455) {
    d = Math.floor(d / 35)
    k += 36
  }
  return k + Math.floor((36 * d) / (d + 38))
}

export function decodificarEtiqueta(etiqueta) {
  if (!etiqueta.startsWith('xn--')) return etiqueta
  const input = etiqueta.slice(4)
  const output = []
  let n = 128
  let i = 0
  let bias = 72
  const basic = input.lastIndexOf('-')
  if (basic > 0) {
    for (let j = 0; j < basic; j++) output.push(input.charCodeAt(j))
  }
  let index = basic > 0 ? basic + 1 : 0
  while (index < input.length) {
    const oldi = i
    let w = 1
    for (let k = 36; ; k += 36) {
      if (index >= input.length) return etiqueta
      const code = input.charCodeAt(index++)
      const dig = code >= 48 && code <= 57 ? code - 22 : code >= 97 && code <= 122 ? code - 97 : 36
      if (dig >= 36) return etiqueta
      i += dig * w
      const t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias
      if (dig < t) break
      w *= 36 - t
    }
    const out = output.length + 1
    bias = adapt(i - oldi, out, oldi === 0)
    n += Math.floor(i / out)
    i %= out
    output.splice(i, 0, n)
    i += 1
  }
  try {
    return String.fromCodePoint(...output)
  } catch {
    return etiqueta
  }
}

export function dominioRegistrable(host) {
  return partesDominio(host).dominio
}

// etiqueta es el nombre del dominio registrable sin la extensión: "tiktok" en vm.tiktok.com.ar.
export function partesDominio(host) {
  const limpio = (host ?? '').toLowerCase().replace(/\.$/, '')
  if (IPV4.test(limpio) || limpio.startsWith('[')) return { dominio: limpio, etiqueta: '', subdominio: '' }
  const partes = partirDominio(limpio, PSL)
  return {
    dominio: partes.domain ?? limpio,
    etiqueta: partes.domainWithoutSuffix ?? '',
    subdominio: partes.subdomain ?? '',
  }
}

const ESQUEMA = /^([a-z][a-z0-9+.-]*):(.*)$/is

// Un texto sin esquema (ejemplo.com/promo) se lee como https://. Lo que tiene forma de esquema
// pero lleva un punto o sigue con un número (ejemplo.com:8080, localhost:3000) es un host con
// puerto. Si ya trae esquema, se deja tal cual aunque después no se pueda leer.
function completarEsquema(texto) {
  const partes = texto.match(ESQUEMA)
  if (partes && !partes[1].includes('.') && !/^\d+(?:[/?#]|$)/.test(partes[2])) return texto
  return `https://${texto}`
}

// Solo sirve para comparar cómo se escribió el host con cómo lo lee el navegador;
// el host que se juzga siempre es el del parser.
function hostEscrito(completo) {
  let resto = completo.slice(completo.indexOf(':') + 1)
  let inicio = 0
  while (resto[inicio] === '/' || resto[inicio] === '\\') inicio += 1
  resto = resto.slice(inicio)
  const fin = resto.search(/[/?#\\]/)
  const autoridad = fin === -1 ? resto : resto.slice(0, fin)
  const host = autoridad.slice(autoridad.lastIndexOf('@') + 1)
  if (host.startsWith('[')) return host.slice(0, host.indexOf(']') + 1) || host
  const puerto = host.lastIndexOf(':')
  return puerto === -1 ? host : host.slice(0, puerto)
}

function formaIp(escrito) {
  const partes = escrito.replace(/\.$/, '').split('.')
  if (partes.some((parte) => /^0x/i.test(parte))) return 'hexadecimal'
  if (partes.some((parte) => parte.length > 1 && parte.startsWith('0'))) return 'octal'
  if (partes.length < 4) return 'numero'
  return null
}

function problemaDeHost(host) {
  if (host.length > 253) return 'El nombre del sitio es más largo de lo que permite una dirección real.'
  const partes = host.split('.')
  if (partes.length < 2) return 'La dirección no tiene la forma de un sitio, como nombre.com.'
  for (const parte of partes) {
    if (!parte) return MAL_ARMADO
    if (parte.length > 63) return 'Una parte del nombre del sitio pasa los 63 caracteres que permite una dirección real.'
    if (!/^[a-z0-9-]+$/.test(parte)) return 'El nombre del sitio tiene caracteres que no pueden ir en una dirección real.'
    if (parte.startsWith('-') || parte.endsWith('-')) return MAL_ARMADO
    if (parte.startsWith('xn--')) {
      if (decodificarEtiqueta(parte) === parte) return 'Una parte del nombre usa punycode (xn--) que no se puede leer.'
    } else if (parte.slice(2, 4) === '--') {
      return MAL_ARMADO
    }
  }
  return null
}

function escriturasDe(etiqueta) {
  const escrituras = new Set()
  for (const letra of etiqueta) {
    if (/\p{Script=Latin}/u.test(letra)) escrituras.add('latina')
    else if (/\p{Script=Cyrillic}/u.test(letra)) escrituras.add('cirilica')
    else if (/\p{Script=Greek}/u.test(letra)) escrituras.add('griega')
    else if (/\p{L}/u.test(letra)) escrituras.add('otra')
  }
  return escrituras
}

function mezclaAlfabetos(etiqueta) {
  const escrituras = escriturasDe(etiqueta)
  return escrituras.has('latina') && (escrituras.has('cirilica') || escrituras.has('griega'))
}

function imitaLatinas(etiqueta) {
  const escrituras = escriturasDe(etiqueta)
  if (escrituras.has('latina') || !(escrituras.has('cirilica') || escrituras.has('griega'))) return false
  return [...etiqueta].every((letra) => HOMO[letra] || !/\p{L}/u.test(letra))
}

function decodificar(texto) {
  try {
    return decodeURIComponent(texto)
  } catch {
    return texto
  }
}

function invalido(entrada, motivo, host = '') {
  return { estado: 'invalido', entrada, host, motivo }
}

export function leerEnlace(entrada) {
  const texto = typeof entrada === 'string' ? entrada.trim() : ''
  if (!texto) return null

  if (INVISIBLES.test(texto)) return invalido(texto, 'Tiene caracteres invisibles metidos en el medio.')
  if (ESPACIOS.test(texto)) return invalido(texto, 'Tiene espacios o saltos de línea en el medio.')

  const completo = completarEsquema(texto)
  const escrito = hostEscrito(completo)

  let url
  try {
    url = new URL(completo)
  } catch {
    return invalido(texto, 'No se puede leer como una dirección web.', escrito)
  }

  const esquema = url.protocol.slice(0, -1)
  if (ESQUEMAS_PELIGROSOS.has(esquema)) return { estado: 'peligroso', entrada: texto, esquema, href: url.href }
  if (esquema !== 'http' && esquema !== 'https') return { estado: 'otra-app', entrada: texto, esquema, href: url.href }

  if (!url.hostname) return invalido(texto, 'No tiene el nombre de un sitio.', escrito)
  const puntoFinal = url.hostname.endsWith('.')
  const host = puntoFinal ? url.hostname.slice(0, -1) : url.hostname

  let tipoHost = 'dominio'
  let dominio = host
  let etiqueta = ''
  let subdominio = ''
  if (host.startsWith('[')) {
    tipoHost = 'ipv6'
  } else if (IPV4.test(host)) {
    tipoHost = 'ipv4'
  } else {
    const problema = problemaDeHost(host)
    if (problema) return invalido(texto, problema, escrito)
    const partes = partirDominio(host, PSL)
    if (!partes.isIcann && !partes.isPrivate) {
      return invalido(texto, `Termina en .${host.split('.').pop()}, una extensión que no existe.`, escrito)
    }
    if (!partes.domain) return invalido(texto, `Es solo una extensión (${host}), no el nombre de un sitio.`, escrito)
    dominio = partes.domain
    etiqueta = partes.domainWithoutSuffix ?? ''
    subdominio = partes.subdomain ?? ''
  }

  const hostUnicode = host.split('.').map(decodificarEtiqueta).join('.')
  const etiquetas = hostUnicode.split('.')
  const escritoNormal = escrito.toLowerCase().normalize('NFC').replace(/\.$/, '')

  return {
    estado: 'web',
    entrada: texto,
    url,
    href: url.href,
    esquema,
    host,
    hostUnicode,
    escrito,
    puntoFinal,
    tipoHost,
    formaIp: tipoHost === 'ipv4' ? formaIp(escrito) : null,
    dominio,
    etiqueta,
    subdominio,
    subdominios: subdominio ? subdominio.split('.').length : 0,
    usuario: url.username || url.password ? decodificar(url.username) : null,
    puerto: url.port,
    disfrazado: tipoHost === 'dominio' && escritoNormal !== host && escritoNormal !== hostUnicode,
    mezclaAlfabetos: etiquetas.some(mezclaAlfabetos),
    imitaLatinas: etiquetas.some(imitaLatinas),
    barraInvertida: texto.includes('\\'),
    demasiadoLarga: texto.length > LARGO_MAXIMO,
  }
}
