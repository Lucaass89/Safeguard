const TLD_BARATOS = new Set([
  'xyz',
  'top',
  'click',
  'link',
  'gq',
  'tk',
  'ml',
  'cf',
  'ga',
  'work',
  'zip',
  'mov',
  'country',
  'support',
  'rest',
  'buzz',
  'quest',
  'sbs',
  'cfd',
  'icu',
  'monster',
  'bond',
  'cyou',
  'lol',
  'pw',
])

export const ACORTADORES = new Set([
  'bit.ly',
  'bitly.com',
  'cutt.ly',
  'cutt.us',
  'tinyurl.com',
  'tiny.one',
  't.co',
  't.ly',
  't.me',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'rb.gy',
  'rebrand.ly',
  'shorturl.at',
  'short.io',
  's.id',
  'tiny.cc',
  'lnkd.in',
  'wa.me',
  'vm.tiktok.com',
  'n9.cl',
  'acortar.link',
  'buff.ly',
  'clck.ru',
  'adf.ly',
  'ouo.io',
  'discord.gg',
])

const SUFIJOS_DOBLES = new Set([
  'com.ar',
  'gob.ar',
  'gov.ar',
  'org.ar',
  'net.ar',
  'edu.ar',
  'com.br',
  'com.mx',
  'co.uk',
  'com.co',
  'com.uy',
  'com.cl',
  'com.pe',
  'com.ec',
  'com.ve',
])

const TUNELES = [
  'ngrok.io',
  'ngrok.app',
  'ngrok-free.app',
  'trycloudflare.com',
  'workers.dev',
  'pages.dev',
  'web.app',
  'firebaseapp.com',
  'netlify.app',
  'vercel.app',
  'github.io',
  'blogspot.com',
  'wixsite.com',
  'weebly.com',
  'duckdns.org',
  'ddns.net',
  'hopto.org',
  'no-ip.org',
  'glitch.me',
  'repl.co',
  '000webhostapp.com',
  'myftpupload.com',
  'godaddysites.com',
  'webcindario.com',
  'rf.gd',
  'epizy.com',
]

const RELLENO = new Set([
  'login',
  'signin',
  'signup',
  'secure',
  'seguro',
  'security',
  'seguridad',
  'support',
  'soporte',
  'online',
  'cuenta',
  'cuentas',
  'verificar',
  'verificacion',
  'app',
  'oficial',
  'ayuda',
  'help',
  'update',
  'pay',
  'pago',
  'pagos',
  'info',
  'web',
  'mail',
  'account',
  'auth',
  'acceso',
  'alert',
  'alerta',
  'alertas',
  'service',
  'servicio',
  'cliente',
  'clientes',
  'factura',
  'billing',
  'wallet',
  'billetera',
  'centro',
  'center',
  'confirm',
  'confirma',
  'confirmar',
  'restore',
  'recuperar',
  'recuperacion',
  'unlock',
  'desbloqueo',
  'notice',
  'aviso',
  'banco',
  'bank',
  'gob',
  'gov',
  'shop',
  'tienda',
  'store',
  'validar',
  'validation',
  'suspend',
  'suspendida',
  'bloqueo',
  'bloqueada',
  'recovery',
])

const MARCAS = [
  {
    id: 'mercadolibre',
    nombre: 'Mercado Libre',
    grupos: [['mercadolibre'], ['mercado', 'libre']],
    oficial: [
      'mercadolibre.com',
      'mercadolibre.com.ar',
      'mercadolibre.com.mx',
      'mercadolibre.cl',
      'mercadolibre.com.co',
      'mercadolibre.com.uy',
      'mercadolibre.com.pe',
      'mercadolibre.com.ec',
      'mercadolibre.com.ve',
    ],
  },
  {
    id: 'mercadopago',
    nombre: 'Mercado Pago',
    grupos: [['mercadopago'], ['mercado', 'pago']],
    oficial: [
      'mercadopago.com',
      'mercadopago.com.ar',
      'mercadopago.com.mx',
      'mercadopago.cl',
      'mercadopago.com.co',
      'mercadopago.com.uy',
      'mercadopago.com.pe',
    ],
  },
  { id: 'afip', nombre: 'AFIP', grupos: [['afip']], oficial: ['afip.gob.ar'] },
  { id: 'arca', nombre: 'ARCA', grupos: [['arca']], oficial: ['arca.gob.ar'] },
  { id: 'anses', nombre: 'ANSES', grupos: [['anses']], oficial: ['anses.gob.ar'] },
  { id: 'pami', nombre: 'PAMI', grupos: [['pami']], oficial: ['pami.org.ar'] },
  {
    id: 'correoargentino',
    nombre: 'Correo Argentino',
    grupos: [['correoargentino'], ['correo', 'argentino']],
    oficial: ['correoargentino.com.ar'],
  },
  {
    id: 'whatsapp',
    nombre: 'WhatsApp',
    grupos: [['whatsapp']],
    oficial: ['whatsapp.com', 'whatsapp.net'],
  },
  { id: 'instagram', nombre: 'Instagram', grupos: [['instagram']], oficial: ['instagram.com'] },
  {
    id: 'facebook',
    nombre: 'Facebook',
    grupos: [['facebook']],
    oficial: ['facebook.com', 'fb.com'],
  },
  {
    id: 'google',
    nombre: 'Google',
    grupos: [['google'], ['gmail'], ['youtube']],
    oficial: ['google.com', 'google.com.ar', 'gmail.com', 'youtube.com', 'gstatic.com', 'googleapis.com'],
  },
  {
    id: 'microsoft',
    nombre: 'Microsoft',
    grupos: [['microsoft'], ['outlook'], ['office365']],
    oficial: ['microsoft.com', 'live.com', 'office.com', 'outlook.com', 'office365.com', 'microsoftonline.com'],
  },
  {
    id: 'apple',
    nombre: 'Apple',
    grupos: [['apple'], ['icloud']],
    oficial: ['apple.com', 'icloud.com'],
  },
  { id: 'netflix', nombre: 'Netflix', grupos: [['netflix']], oficial: ['netflix.com'] },
  { id: 'paypal', nombre: 'PayPal', grupos: [['paypal']], oficial: ['paypal.com'] },
  { id: 'binance', nombre: 'Binance', grupos: [['binance']], oficial: ['binance.com'] },
  {
    id: 'steam',
    nombre: 'Steam',
    grupos: [['steam'], ['steampowered']],
    oficial: ['steam.com', 'steampowered.com', 'steamcommunity.com'],
  },
  { id: 'discord', nombre: 'Discord', grupos: [['discord']], oficial: ['discord.com'] },
  { id: 'telegram', nombre: 'Telegram', grupos: [['telegram']], oficial: ['telegram.org'] },
  {
    id: 'pedidosya',
    nombre: 'PedidosYa',
    grupos: [['pedidosya'], ['pedidos', 'ya']],
    oficial: ['pedidosya.com', 'pedidosya.com.ar'],
  },
  { id: 'rappi', nombre: 'Rappi', grupos: [['rappi']], oficial: ['rappi.com', 'rappi.com.ar'] },
  { id: 'claro', nombre: 'Claro', grupos: [['claro']], oficial: ['claro.com', 'claro.com.ar'] },
  { id: 'personal', nombre: 'Personal', grupos: [['personal']], oficial: ['personal.com.ar'] },
  { id: 'movistar', nombre: 'Movistar', grupos: [['movistar']], oficial: ['movistar.com.ar'] },
  { id: 'osde', nombre: 'OSDE', grupos: [['osde']], oficial: ['osde.com.ar'] },
  {
    id: 'galicia',
    nombre: 'Banco Galicia',
    grupos: [['bancogalicia'], ['banco', 'galicia']],
    oficial: ['bancogalicia.com', 'bancogalicia.com.ar'],
  },
  {
    id: 'macro',
    nombre: 'Banco Macro',
    grupos: [['macro'], ['banco', 'macro']],
    oficial: ['macro.com.ar'],
  },
  {
    id: 'bbva',
    nombre: 'BBVA',
    grupos: [['bbva']],
    oficial: ['bbva.com', 'bbva.com.ar'],
  },
  {
    id: 'nacion',
    nombre: 'Banco Nación',
    grupos: [['bancanacion'], ['bna'], ['banco', 'nacion']],
    oficial: ['bna.com.ar'],
  },
  {
    id: 'provincia',
    nombre: 'Banco Provincia',
    grupos: [['bancoprovincia'], ['banco', 'provincia']],
    oficial: ['bancoprovincia.com.ar'],
  },
  {
    id: 'ciudad',
    nombre: 'Banco Ciudad',
    grupos: [['bancociudad'], ['banco', 'ciudad']],
    oficial: ['bancociudad.com.ar'],
  },
  { id: 'icbc', nombre: 'ICBC', grupos: [['icbc']], oficial: ['icbc.com.ar'] },
  { id: 'hsbc', nombre: 'HSBC', grupos: [['hsbc']], oficial: ['hsbc.com.ar', 'hsbc.com'] },
  {
    id: 'patagonia',
    nombre: 'Banco Patagonia',
    grupos: [['bancopatagonia'], ['banco', 'patagonia']],
    oficial: ['bancopatagonia.com.ar'],
  },
  {
    id: 'supervielle',
    nombre: 'Supervielle',
    grupos: [['supervielle']],
    oficial: ['supervielle.com.ar'],
  },
  {
    id: 'credicoop',
    nombre: 'Credicoop',
    grupos: [['credicoop'], ['bancocredicoop']],
    oficial: ['bancocredicoop.coop'],
  },
  { id: 'brubank', nombre: 'Brubank', grupos: [['brubank']], oficial: ['brubank.com'] },
  { id: 'uala', nombre: 'Ualá', grupos: [['uala']], oficial: ['uala.com.ar'] },
  { id: 'modo', nombre: 'MODO', grupos: [['modo']], oficial: ['modo.com.ar'] },
  {
    id: 'naranja',
    nombre: 'Naranja X',
    grupos: [['naranjax'], ['tarjetanaranja']],
    oficial: ['naranjax.com', 'tarjetanaranja.com.ar'],
  },
  {
    id: 'santander',
    nombre: 'Santander',
    grupos: [['santander'], ['santanderrio']],
    oficial: ['santander.com', 'santander.com.ar', 'santanderrio.com.ar'],
  },
  { id: 'amazon', nombre: 'Amazon', grupos: [['amazon']], oficial: ['amazon.com', 'amazon.es'] },
  { id: 'linkedin', nombre: 'LinkedIn', grupos: [['linkedin']], oficial: ['linkedin.com'] },
]

const PALABRAS_GANCHO = [
  'premio',
  'ganaste',
  'urgente',
  'verificar',
  'actualizar',
  'suspendid',
  'bloque',
  'regalo',
  'gratis',
  'sorteo',
  'factura',
  'paquete',
  'impuesto',
]

const RUTA_SENSIBLE =
  /(login|signin|verify|verification|wallet|seed|confirmar-cuenta|verificar-cuenta|actualizar-datos|recuperar-clave|secure-login)/i

const EXT_PELIGROSA =
  /\.(apk|exe|scr|bat|cmd|msi|dll|hta|lnk|iso|dmg|jse|vbs|vbe|ps1|docm|xlsm)(?=$|[?#])/i

const PARAM_REDIR = /^(url|redirect|redir|next|dest|destination|goto|return|continue|rurl)$/i

const GENERICOS = new Set([
  'personal',
  'claro',
  'macro',
  'naranja',
  'ciudad',
  'provincia',
  'nacion',
  'modo',
  'steam',
  'pago',
  'libre',
  'mercado',
  'banco',
  'correo',
])

const SOLO_HOST = new Set([
  'personal',
  'claro',
  'macro',
  'naranja',
  'ciudad',
  'provincia',
  'nacion',
  'modo',
  'steam',
  'pago',
  'libre',
  'ya',
  'mercado',
  'banco',
  'correo',
  'argentino',
  'pedidos',
])

const EN_TEXTO = new Set(['afip', 'arca', 'bbva', 'icbc', 'hsbc', 'osde', 'uala', 'pami', 'anses', 'bna'])

const ES_IP = /^\d{1,3}(\.\d{1,3}){3}$/
const ES_IP_LARGA = /^\d{8,10}$/

const CONFUSOS = { 0: 'o', 1: 'l', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b' }

export function nivelDesde(puntos) {
  if (puntos >= 55) return 'rojo'
  if (puntos >= 20) return 'amarillo'
  return 'verde'
}

export function dominioBase(host) {
  const limpio = host.replace(/^www\./, '').toLowerCase()
  if (ES_IP.test(limpio) || ES_IP_LARGA.test(limpio)) return limpio
  const partes = limpio.split('.')
  if (partes.length <= 2) return limpio
  const dosNiveles = partes.slice(-2).join('.')
  return SUFIJOS_DOBLES.has(dosNiveles) ? partes.slice(-3).join('.') : dosNiveles
}

export function esAcortador(host) {
  return ACORTADORES.has(dominioBase(host.replace(/^www\./, '')))
}

export function esDominioOficial(dominio) {
  if (!dominio) return false
  const base = dominioBase(dominio)
  return MARCAS.some((marca) => marca.oficial.includes(base))
}

export function dominioEsMarca(dominio, id) {
  if (!dominio || !id) return false
  const base = dominioBase(dominio)
  return MARCAS.some((marca) => marca.id === id && marca.oficial.includes(base))
}

function normalizar(texto) {
  return texto.replace(/[0134578]/g, (c) => CONFUSOS[c]).replace(/rn/g, 'm')
}

function distancia(a, b) {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
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

function decodificarEtiqueta(etiqueta) {
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

const HOMO = {
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
}

function aLatin(texto) {
  return [...texto.toLowerCase()].map((letra) => HOMO[letra] ?? letra).join('')
}

function decodificarHost(host) {
  return aLatin(
    host
      .split('.')
      .map((parte) => decodificarEtiqueta(parte))
      .join('.'),
  )
}

function restoSospechoso(resto, token) {
  if (!resto) return false
  if (/^\d+$/.test(resto)) return true
  if (resto === 'ar' || resto === 'com') return token.length >= 8
  return RELLENO.has(resto)
}

function labelCoincide(label, token) {
  if (label === token) return true
  if (token.length >= 12 && label.includes(token)) return true
  if (label.startsWith(token) && restoSospechoso(label.slice(token.length), token)) return true
  if (label.endsWith(token) && restoSospechoso(label.slice(0, -token.length), token)) return true
  return false
}

function grupoEn(labels, grupo) {
  const ok = grupo.every((token) => labels.some((label) => labelCoincide(label, token)))
  if (!ok) return false
  if (grupo.length === 1 && GENERICOS.has(grupo[0])) {
    return labels.some(
      (label) => label !== grupo[0] && (RELLENO.has(label) || labelCoincide(label, grupo[0])),
    )
  }
  return true
}

function labelsDe(host) {
  return host
    .toLowerCase()
    .split(/\.|-/)
    .map((parte) => parte.normalize('NFD').replace(/\p{Diacritic}/gu, ''))
    .filter((parte) => parte && !['com', 'ar', 'www', 'gob', 'gov', 'org', 'net'].includes(parte))
}

function tokenEnTexto(token, palabras, compacto, grupo) {
  if (SOLO_HOST.has(token) && grupo.length === 1) return false
  if (palabras.includes(token)) {
    if (token.length >= 6 || EN_TEXTO.has(token) || grupo.length > 1) return true
    return false
  }
  return token.length >= 8 && compacto.includes(token)
}

export function marcaEnTexto(texto) {
  const plano = (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  if (!plano) return null
  const palabras = plano.split(/[^a-z0-9]+/).filter(Boolean)
  const compacto = palabras.join('')
  for (const marca of MARCAS) {
    for (const grupo of marca.grupos) {
      const tokens = grupo.map(normalizar)
      if (tokens.every((token) => tokenEnTexto(token, palabras, compacto, tokens))) {
        return { marca: marca.id, nombre: marca.nombre }
      }
    }
  }
  return null
}

function suplantacion(host, base) {
  if (esDominioOficial(base)) return null
  const decodificado = decodificarHost(host)
  const alfabeto = decodificado !== host
  const labels = labelsDe(decodificado)
  const etiqueta = normalizar(base.split('.')[0])

  for (const marca of MARCAS) {
    if (marca.grupos.some((grupo) => grupoEn(labels, grupo))) {
      return {
        nombre: marca.nombre,
        como: alfabeto ? 'alfabeto' : 'nombre',
      }
    }
  }

  const cambiados = labels.map(normalizar)
  if (cambiados.join() !== labels.join()) {
    for (const marca of MARCAS) {
      if (marca.grupos.some((grupo) => grupoEn(cambiados, grupo))) {
        return { nombre: marca.nombre, como: 'letras' }
      }
    }
  }

  for (const marca of MARCAS) {
    for (const grupo of marca.grupos) {
      if (grupo.length !== 1 || grupo[0].length < 8) continue
      const d = distancia(etiqueta, grupo[0])
      if (d === 1 && Math.abs(etiqueta.length - grupo[0].length) <= 1) {
        return { nombre: marca.nombre, como: 'parecido' }
      }
    }
  }

  return null
}

function fraseMarca(hallazgo) {
  if (hallazgo.como === 'alfabeto') {
    return `Usa letras de otro alfabeto para parecer ${hallazgo.nombre}.`
  }
  if (hallazgo.como === 'letras') {
    return `Cambia letras o números para parecerse a ${hallazgo.nombre}.`
  }
  if (hallazgo.como === 'parecido') {
    return `El dominio se parece a ${hallazgo.nombre}: típico de una imitación.`
  }
  return `Mete el nombre de ${hallazgo.nombre} en un dominio que no es el oficial.`
}

function esTunel(host, base) {
  return TUNELES.some((tunel) => host === tunel || host.endsWith(`.${tunel}`) || base === tunel)
}

export function peorEnlace(enlaces) {
  if (!enlaces?.length) return null
  return enlaces.reduce((mejor, actual) => (actual.puntuacion > mejor.puntuacion ? actual : mejor))
}

export function analizar(entrada) {
  const crudo = (entrada ?? '').trim()
  if (!crudo) return null

  let url
  try {
    url = new URL(crudo.includes('://') ? crudo : `https://${crudo}`)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  const host = url.hostname.toLowerCase()
  const base = dominioBase(host)
  const tld = base.split('.').pop()
  const oficial = esDominioOficial(base)
  const motivos = []
  let puntos = 0

  const sumar = (cantidad, frase) => {
    puntos += cantidad
    motivos.push(frase)
  }

  if (url.username || url.password) {
    sumar(60, 'Esconde el destino real detrás de una arroba.')
  }

  if (ES_IP.test(host) || ES_IP_LARGA.test(host) || host.includes(':')) {
    sumar(40, 'Lleva a una dirección IP, no a un nombre de sitio.')
  }

  const marca = suplantacion(host, base)
  if (marca) sumar(marca.como === 'parecido' ? 55 : 62, fraseMarca(marca))
  else if (host.includes('xn--')) {
    sumar(32, 'Usa caracteres disfrazados (punycode) para parecer otra marca.')
  }

  if (!oficial && EXT_PELIGROSA.test(`${url.pathname}${url.search}`)) {
    sumar(55, 'El enlace descarga un programa, una app o un archivo que puede ejecutarse.')
  }

  if (url.protocol === 'http:') {
    sumar(20, 'No tiene candado: es http, no https. Una página que pide datos no debería estar así.')
  }

  if (!oficial && TLD_BARATOS.has(tld)) {
    sumar(20, `El final .${tld} se usa mucho en sitios truchos.`)
  }

  if (esAcortador(host)) {
    sumar(22, 'Es un acortador: no se ve a dónde lleva hasta abrirlo.')
  }

  if (!oficial && esTunel(host, base)) {
    sumar(18, 'Está en un hosting gratuito o temporal. Muchos engaños se arman ahí y después se borran.')
  }

  const subdominios = host.split('.').length - base.split('.').length
  if (!oficial && subdominios > 3) {
    sumar(12, 'Tiene demasiados subdominios, un truco típico para parecer oficial.')
  }

  const etiqueta = base.split('.')[0]
  if (!oficial && etiqueta.split('-').length - 1 >= 3) {
    sumar(15, 'El dominio está armado con muchos guiones, como un nombre inventado.')
  }

  if (url.port && !['80', '443', '8080', '8443'].includes(url.port)) {
    sumar(15, `Usa el puerto ${url.port}, que no es el de una página común.`)
  }

  const texto = `${host}${url.pathname}${url.search}`.toLowerCase()
  if (!oficial && PALABRAS_GANCHO.some((p) => texto.includes(p))) {
    sumar(10, 'El enlace usa palabras de urgencia o premio.')
  }

  if (!oficial && RUTA_SENSIBLE.test(`${url.pathname}${url.search}`)) {
    sumar(
      12,
      'La dirección abre una página para entrar, verificar o recuperar una cuenta. En un sitio que no es el oficial, eso sirve para robar la clave.',
    )
  }

  const partesNombre = etiqueta.split('-').filter(Boolean)
  const senuelo = new Set([
    'pago',
    'pagos',
    'seguridad',
    'verificar',
    'verificacion',
    'soporte',
    'factura',
    'banco',
    'billetera',
    'cuenta',
    'acceso',
    'clave',
    'premio',
    'sorteo',
  ])
  const nombrePegado = etiqueta.replace(/-/g, '')
  if (
    !oficial &&
    (partesNombre.some((parte) => senuelo.has(parte)) ||
      /pagos|seguridad|verificacion|billetera/.test(nombrePegado))
  ) {
    sumar(
      18,
      'El nombre del sitio habla de pagos, seguridad o una cuenta. Así se disfrazan las páginas que piden datos.',
    )
  }

  if (!oficial) {
    for (const [clave, valor] of url.searchParams) {
      if (!PARAM_REDIR.test(clave) || !valor) continue
      try {
        const destino = new URL(valor, url)
        if (
          destino.hostname &&
          destino.hostname !== host &&
          (destino.protocol === 'http:' || destino.protocol === 'https:')
        ) {
          sumar(32, `Un parámetro de la dirección manda a otro sitio (${destino.hostname}).`)
          break
        }
      } catch {
        /* un parámetro que no es una dirección no suma */
      }
    }
  }

  if ([...url.searchParams.keys()].some((clave) => /password|passwd|clave/i.test(clave))) {
    sumar(35, 'La dirección lleva una clave a la vista.')
  }

  const codificados = url.href.match(/%[0-9a-f]{2}/gi) ?? []
  if (!oficial && codificados.length >= 8) {
    sumar(12, 'La dirección esconde parte del texto con caracteres codificados.')
  }

  if (motivos.length === 0) {
    motivos.push('No aparecen señales fuertes en la dirección.')
  }

  return {
    url: url.href,
    host,
    dominio: base,
    puntuacion: Math.min(100, puntos),
    nivel: nivelDesde(puntos),
    motivos,
  }
}

export function motivosLimpios(lista) {
  const vistos = new Set()
  const frases = []

  for (const item of lista ?? []) {
    const sinPrefijo = String(item).replace(/(?:ya está en la base regional:\s*)+/gi, '')
    for (const parte of sinPrefijo.split(/(?<=\.)\s+/)) {
      const frase = parte.replace(/\s+/g, ' ').trim()
      const clave = frase.toLowerCase()
      if (!frase || clave.startsWith('no aparecen') || clave.startsWith('ya está en la base regional')) continue
      if (vistos.has(clave)) continue
      vistos.add(clave)
      frases.push(frase)
    }
  }

  return frases
}

export function queHacer(nivel) {
  if (nivel === 'rojo') {
    return 'No lo abras. No escribas claves, códigos, un CBU ni datos de una tarjeta. Si ya entraste, cerrá la página y no completes nada.'
  }
  if (nivel === 'amarillo') {
    return 'Frená antes de abrirlo. Si es un banco, un organismo o una tienda, entrá escribiendo vos la dirección oficial, no desde este enlace.'
  }
  return 'No hay señales fuertes. Antes de poner una clave, fijate que el dominio sea exactamente el del sitio oficial.'
}

export function combinarConAmenaza(local, amenaza) {
  if (!amenaza) return { ...local, motivos: motivosLimpios(local.motivos) }

  const piso = amenaza.nivel === 'rojo' ? 90 : amenaza.nivel === 'amarillo' ? 45 : 0
  const puntuacion = Math.max(local.puntuacion, piso)
  const motivos = motivosLimpios(local.motivos)

  if (amenaza.nivel === 'rojo') {
    const veces = amenaza.veces_reportado
    motivos.unshift(
      veces > 1
        ? `Este dominio ya fue denunciado en la base de SafeLink (${veces} veces).`
        : 'Este dominio ya fue denunciado en la base de SafeLink.',
    )
  } else if (amenaza.nivel === 'amarillo') {
    motivos.unshift('Este dominio ya fue señalado en la base de SafeLink. Conviene mirarlo otra vez.')
  }

  return { ...local, puntuacion, nivel: nivelDesde(puntuacion), motivos: motivosLimpios(motivos) }
}

function sumarDestino(actual, puntos, urlDestino, frase) {
  const destino = analizar(urlDestino)
  if (!destino) {
    actual.motivos.push(frase)
    return puntos
  }
  actual.motivos.push(frase)
  actual.motivos.push(...destino.motivos.filter((m) => !m.startsWith('No aparecen')))
  return Math.max(puntos, destino.puntuacion)
}

export function combinarConEnriquecimiento(local, extra) {
  if (!extra) return local

  const actual = { ...local, motivos: [...local.motivos] }
  let puntos = actual.puntuacion
  const dominioFinal = extra.dominio || actual.dominioDestino || actual.dominio
  const oficial = esDominioOficial(dominioFinal)

  if (extra.destino && extra.acortado) {
    const destino = analizar(extra.destino)
    if (destino) {
      puntos = Math.max(puntos, destino.puntuacion)
      actual.destino = destino.url
      actual.dominioDestino = destino.dominio
      actual.motivos = [
        ...actual.motivos.filter((m) => !m.includes('acortador')),
        `El acortador lleva a ${destino.dominio}.`,
        ...destino.motivos.filter((m) => !m.startsWith('No aparecen')),
      ]
    } else {
      actual.motivos.push(`El acortador termina en ${extra.destino}.`)
    }
  }

  if (typeof extra.edad_dias === 'number' && !oficial) {
    const dias = extra.edad_dias
    if (dias < 7) puntos += 45
    else if (dias < 30) puntos += 25
    else if (dias < 90) puntos += 15
  }

  if (extra.frase_edad && !oficial) actual.motivos.push(extra.frase_edad)
  if (extra.frase_certificado && !oficial) {
    actual.motivos.push(extra.frase_certificado)
    if (extra.cert_dias != null && extra.cert_dias < 14) puntos += 15
  }

  if (extra.archivo_peligroso) {
    puntos += 55
    actual.motivos.push('El destino es una descarga de programa o de aplicación.')
  }

  if (extra.meta_destino) {
    puntos = sumarDestino(
      actual,
      puntos,
      extra.meta_destino,
      'La página se redirige sola hacia otro sitio.',
    )
  }

  if (!oficial && extra.formulario_clave) {
    const marca = extra.titulo ? marcaEnTexto(extra.titulo) : null
    if (marca) {
      puntos += 50
      actual.motivos.push(
        `Pide una clave y el título menciona ${marca.nombre}, pero el sitio no es el oficial.`,
      )
    } else if (typeof extra.edad_dias === 'number' && extra.edad_dias < 120) {
      puntos += 35
      actual.motivos.push('Pide una clave y el dominio es reciente.')
    } else {
      puntos += 18
      actual.motivos.push('La página pide una clave.')
    }
  }

  puntos = Math.min(100, puntos)
  const motivos = motivosLimpios(actual.motivos)
  if (motivos.length === 0) motivos.push('No aparecen señales fuertes en la dirección.')

  return { ...actual, motivos, puntuacion: puntos, nivel: nivelDesde(puntos) }
}
