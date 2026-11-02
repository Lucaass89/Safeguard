import { readFileSync } from 'node:fs'
import datosMarcas from '../src/data/marcas.json' with { type: 'json' }
import { dominioRegistrable } from '../src/lib/enlace.js'

export const TRANCO = {
  id: 'V354N',
  fecha: '2026-11-01',
  url: 'https://tranco-list.eu/list/V354N/1000000',
  cantidad: 1000,
}

export function leerTranco() {
  const texto = readFileSync(new URL(`./datos/tranco-${TRANCO.id}-${TRANCO.cantidad}.csv`, import.meta.url), 'utf8')
  return texto
    .split('\n')
    .map((fila) => fila.trim().split(',')[1])
    .filter(Boolean)
}

const ARGENTINOS = [
  'clarin.com', 'lanacion.com.ar', 'infobae.com', 'pagina12.com.ar', 'tn.com.ar', 'ole.com.ar',
  'perfil.com', 'ambito.com', 'cronista.com', 'lavoz.com.ar', 'losandes.com.ar', 'mitelefe.com',
  'eltrecetv.com.ar', 'mercadolibre.com.ar', 'mercadopago.com.ar', 'argentina.gob.ar',
  'buenosaires.gob.ar', 'afip.gob.ar', 'arca.gob.ar', 'anses.gob.ar', 'pami.org.ar', 'sube.gob.ar',
  'bna.com.ar', 'bancoprovincia.com.ar', 'bancociudad.com.ar', 'santander.com.ar', 'bbva.com.ar',
  'macro.com.ar', 'galicia.ar', 'icbc.com.ar', 'supervielle.com.ar', 'bancopatagonia.com.ar',
  'uala.com.ar', 'naranjax.com', 'brubank.com', 'modo.com.ar', 'personal.com.ar', 'movistar.com.ar',
  'claro.com.ar', 'correoargentino.com.ar', 'andreani.com', 'pedidosya.com.ar', 'rappi.com.ar',
  'despegar.com.ar', 'fravega.com', 'garbarino.com', 'carrefour.com.ar', 'jumbo.com.ar',
  'rapipago.com.ar', 'pagofacil.com.ar', 'osde.com.ar', 'swissmedical.com.ar', 'uba.ar',
  'utn.edu.ar', 'conicet.gov.ar', 'zonaprop.com.ar', 'argenprop.com', 'bumeran.com.ar',
]

const LARGAS = [
  'https://www.google.com/search?q=como+sacar+turno+en+anses&sca_esv=a1b2c3d4e5f6&source=hp&ei=Zk9kZ3x8N4Ky5OUPq9-q8Ak&iflsig=AL9hbdgAAAAAZ2RdVk&oq=como+sacar+turno&gs_lp=Egdnd3Mtd2l6Ihljb21vIHNhY2FyIHR1cm5vIGVuIGFuc2VzMgUQABiABDIGEAAYFhgeMgYQABgWGB5I&sclient=gws-wiz&uact=5',
  'https://www.google.com.ar/search?q=clima+buenos+aires&rlz=1C1GCEA_enAR1000AR1000&oq=clima&aqs=chrome.0.69i59j69i57.1234j0j7&sourceid=chrome&ie=UTF-8',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG&index=3&t=42s',
  'https://articulo.mercadolibre.com.ar/MLA-1234567890-zapatillas-running-hombre-_JM#position=3&search_layout=grid&type=item&tracking_id=8f2c1a4e-6b3d-4f0a-9c7e-1d2b3a4c5e6f',
  'https://www.amazon.com/dp/B08N5WRWNW/ref=sr_1_1?crid=2M096C61O4MLT&keywords=echo+dot&qid=1700000000&sprefix=echo%2Caps%2C250&sr=8-1',
  'https://www.lanacion.com.ar/economia/el-dolar-hoy-nid01112026/?utm_source=whatsapp&utm_medium=social&utm_campaign=compartir',
  'https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F&service=mail&flowName=GlifWebSignIn&flowEntry=ServiceLogin',
  'https://www.facebook.com/login/?next=https%3A%2F%2Fwww.facebook.com%2Fgroups%2F1234567890%2F',
  'https://www.argentina.gob.ar/servicio/sacar-turno-para-tramitar-el-dni?utm_source=google&utm_medium=cpc',
  'https://www.mercadopago.com.ar/activities?filters=status%3Dapproved&page=2&sort=date_created',
  'https://www.infobae.com/politica/2026/11/01/nota-de-ejemplo/?outputType=amp-type&utm_source=twitter',
  'https://es.wikipedia.org/wiki/Buenos_Aires?action=history&offset=&limit=50',
]

const MAPAS = [
  'https://www.google.com/maps/place/Obelisco/@-34.6037389,-58.3815704,17z/data=!3m1!4b1!4m6!3m5!1s0x95bccacb9f8ff113:0x22d3cefdb6b5d9a2!8m2!3d-34.6037389!4d-58.3815704',
  'https://www.google.com.ar/maps/dir/-34.6037,-58.3816/-34.5875,-58.3974/@-34.5956,-58.3895,15z',
  'https://maps.google.com/?q=-34.6037,-58.3816',
  'https://www.google.com/maps/search/?api=1&query=farmacia+cerca',
  'https://maps.app.goo.gl/7Xk2pQhZ9aBcDeF8A',
  'https://goo.gl/maps/AbCdEf123',
]

const ACORTADORES = [
  'https://bit.ly/3xYzAbc', 'https://tinyurl.com/2p8k4xyz', 'https://forms.gle/AbCdEfGh123',
  'https://t.co/AbCdEf1234', 'https://lnkd.in/dAbCdEf', 'https://vm.tiktok.com/ZMabc123/',
  'https://1drv.ms/w/s!AbCdEf', 'https://cutt.ly/abc123', 'https://rb.gy/abc12',
]

const SUBDOMINIOS = [
  'https://mail.google.com/mail/u/0/#inbox', 'https://accounts.google.com/', 'https://es.wikipedia.org/wiki/Argentina',
  'https://web.whatsapp.com/', 'https://api.whatsapp.com/send?phone=5491100000000', 'https://m.facebook.com/',
  'https://login.microsoftonline.com/', 'https://outlook.live.com/mail/0/', 'https://www.instagram.com/p/C0AbCdEf/',
  'https://auth.afip.gob.ar/contribuyente_/login.xhtml', 'https://developer.mozilla.org/es/docs/Web/HTTP',
  'https://store.steampowered.com/app/730/', 'https://help.netflix.com/es/', 'https://www.mercadolibre.com.ar/ayuda',
  'https://docs.google.com/document/d/1AbCdEf/edit', 'https://www.bna.com.ar/Personas',
]

export const REGRESIONES = [
  { url: 'wwww.tikt0ok.-com', nivel: 'amarillo', marca: 'tiktok' },
  { url: "wwww.tikt'ok.-com", nivel: 'amarillo', marca: 'tiktok' },
  { url: 'www.g0ogle.com', nivel: 'amarillo', marca: 'google' },
  { url: 'tikt0ok.com', nivel: 'amarillo', marca: 'tiktok' },
]

const punycode = (unicode) => new URL(`https://${unicode}/`).hostname

// Casos de la fase 1. `niveles` es lo único aceptable para cada uno.
const BORDES = [
  { url: 'https://www.bna.com.ar@192.168.0.10/login', esperado: 'malicioso', niveles: ['rojo'], tecnica: 'userinfo' },
  { url: 'https://mercadopago.com.ar@pagos-seguros.xyz/', esperado: 'malicioso', niveles: ['rojo'], tecnica: 'userinfo' },
  { url: 'https://google.com%40evil.com', esperado: 'malicioso', niveles: ['amarillo', 'rojo'], tecnica: 'userinfo-codificado' },
  { url: 'http://2130706433/', esperado: 'malicioso', niveles: ['rojo'], tecnica: 'ip-decimal' },
  { url: 'http://0x7f000001/', esperado: 'malicioso', niveles: ['rojo'], tecnica: 'ip-hexadecimal' },
  { url: 'http://0177.0.0.1/', esperado: 'malicioso', niveles: ['rojo'], tecnica: 'ip-octal' },
  { url: `https://${punycode('аррӏе.com')}/`, esperado: 'malicioso', niveles: ['amarillo', 'rojo'], tecnica: 'punycode' },
  { url: `https://${punycode('pаypal.com')}/`, esperado: 'malicioso', niveles: ['amarillo', 'rojo'], tecnica: 'punycode' },
  { url: 'https://раураl.com/', esperado: 'malicioso', niveles: ['amarillo', 'rojo'], tecnica: 'unicode' },
  { url: 'https://paypal.com.verificar-cuenta.xyz/', esperado: 'malicioso', niveles: ['amarillo', 'rojo'], tecnica: 'subdominio-marca' },
  { url: 'https://www.google.com\\@evil.example/', esperado: 'malicioso', niveles: ['amarillo', 'rojo'], tecnica: 'barra-invertida' },
  { url: `https://${punycode('münchen.de')}/`, esperado: 'legitimo', niveles: ['verde'], tecnica: 'idn-latino' },
]

// Sustituciones que el motor sabe deshacer (números y pares de letras) y homóglifos cirílicos.
const LEET = { o: '0', i: '1', l: '1', e: '3', a: '4', s: '5', t: '7', b: '8' }
const PARES = { m: 'rn', w: 'vv' }
const CIRILICAS = { a: 'а', e: 'е', o: 'о', p: 'р', c: 'с', x: 'х', y: 'у', i: 'і', s: 'ѕ', j: 'ј' }

function unaPorLetra(nombre, tabla) {
  const vistas = new Set()
  const salida = []
  for (const [indice, letra] of [...nombre].entries()) {
    if (!tabla[letra] || vistas.has(letra)) continue
    vistas.add(letra)
    salida.push(nombre.slice(0, indice) + tabla[letra] + nombre.slice(indice + 1))
  }
  return salida
}

function omisiones(nombre) {
  return [...nombre].map((_, i) => nombre.slice(0, i) + nombre.slice(i + 1))
}

function transposiciones(nombre) {
  const salida = []
  for (let i = 0; i < nombre.length - 1; i++) {
    if (nombre[i] === nombre[i + 1]) continue
    salida.push(nombre.slice(0, i) + nombre[i + 1] + nombre[i] + nombre.slice(i + 2))
  }
  return salida
}

function inserciones(nombre) {
  const salida = []
  for (let i = 0; i < nombre.length; i++) salida.push(nombre.slice(0, i + 1) + nombre[i] + nombre.slice(i + 1))
  for (let i = 1; i < nombre.length; i++) salida.push(`${nombre.slice(0, i)}-${nombre.slice(i)}`)
  return salida
}

function sufijoDe(dominio) {
  return dominio.slice(dominio.indexOf('.') + 1)
}

// Por debajo de cinco letras, un error de tipeo ya es otra palabra: el motor solo acepta la
// coincidencia exacta (ver umbral() en marcas.js), así que ahí solo se generan sustituciones.
const LARGO_MINIMO_EDICION = 5

export function typosquats() {
  const oficiales = new Set(datosMarcas.marcas.flatMap((marca) => marca.oficiales))
  const casos = []
  const vistos = new Set()
  // `dominio` es el host bien armado; los malformados no lo tienen y se evalúan tal cual.
  const agregar = (marca, tecnica, url, dominio = null) => {
    const clave = url.toLowerCase()
    if (vistos.has(clave)) return
    if (dominio && oficiales.has(dominioRegistrable(new URL(`https://${dominio}`).hostname))) return
    vistos.add(clave)
    casos.push({ url, esperado: 'malicioso', categoria: 'typosquat', tecnica, marca: marca.id })
  }

  for (const marca of datosMarcas.marcas) {
    const sufijo = sufijoDe(marca.oficiales[0])
    const excepciones = new Set(marca.excepciones ?? [])
    const nombres = new Set((marca.nombres ?? []).map((nombre) => nombre.toLowerCase().replace(/\s+/g, '')))
    const comunes = new Set(marca.comunes ?? [])

    for (const nombre of [...nombres, ...comunes]) {
      const tecnicas = [
        ['leet', unaPorLetra(nombre, LEET)],
        ['pares', unaPorLetra(nombre, PARES)],
        ['homoglifo', unaPorLetra(nombre, CIRILICAS)],
      ]
      if (nombres.has(nombre) && nombre.length >= LARGO_MINIMO_EDICION) {
        tecnicas.push(['omision', omisiones(nombre)], ['transposicion', transposiciones(nombre)], ['insercion', inserciones(nombre)])
      }
      for (const [tecnica, variantes] of tecnicas) {
        for (const variante of variantes) {
          if (variante === nombre || excepciones.has(variante) || nombres.has(variante)) continue
          agregar(marca, tecnica, `https://${variante}.${sufijo}/`, `${variante}.${sufijo}`)
        }
      }
    }

    const principal = marca.oficiales[0].split('.')[0]
    const truco = unaPorLetra(principal, LEET)[0] ?? `${principal}-pagos`
    const medio = Math.ceil(principal.length / 2)
    for (const entrada of [
      `wwww.${truco}.-com`,
      `wwww.${principal.slice(0, medio)}'${principal.slice(medio)}.-com`,
      `${principal}.-com`,
      `www.${truco}..com`,
    ]) {
      agregar(marca, 'malformado', entrada)
    }
    for (const prefijo of ['wwww', 'ww']) {
      agregar(marca, 'malformado', `${prefijo}.${truco}.${sufijo}`, `${truco}.${sufijo}`)
    }
  }
  return casos
}

export function construirCasos() {
  const legitimos = [
    ...leerTranco().map((dominio) => ({ url: `https://${dominio}/`, categoria: 'tranco' })),
    ...ARGENTINOS.map((dominio) => ({ url: `https://www.${dominio}/`, categoria: 'argentino' })),
    ...LARGAS.map((url) => ({ url, categoria: 'url-larga' })),
    ...MAPAS.map((url) => ({ url, categoria: 'mapas' })),
    ...ACORTADORES.map((url) => ({ url, categoria: 'acortador' })),
    ...SUBDOMINIOS.map((url) => ({ url, categoria: 'subdominio' })),
  ].map((caso) => ({ ...caso, esperado: 'legitimo' }))

  const bordes = BORDES.map((caso) => ({ ...caso, categoria: 'borde' }))
  const regresiones = REGRESIONES.map((caso) => ({
    url: caso.url,
    esperado: 'malicioso',
    categoria: 'regresion',
    tecnica: 'regresion',
    niveles: [caso.nivel],
    marca: caso.marca,
  }))

  return [...legitimos, ...typosquats(), ...bordes, ...regresiones]
}
