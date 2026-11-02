import { aLatin, decodificarEtiqueta, dominioRegistrable, HOMO, leerEnlace, partesDominio } from './enlace.js'
import {
  hostParaComparar,
  marcaEnCamino,
  marcaEnTexto,
  marcaOficialDe,
  parecidoAMarca,
  plataformaDe,
} from './marcas.js'

export { marcaEnTexto }

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

const PARAM_REDIR =
  /^(url|redirect|redir|redirect_uri|next|dest|destination|goto|return|return_url|returnurl|continue|rurl|next_url)$/i

const CONFUSOS = { 0: 'o', 1: 'l', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b' }

// Un dominio que imita a una marca queda al menos en Sospechoso; con otra señal fuerte, en Peligroso.
const PUNTOS_PARECIDO = 35
const PISO_PARECIDO_FUERTE = 60

const AVISO_ACORTADOR = 'Es un acortador: no se ve a dónde lleva hasta abrirlo.'

export function nivelDesde(puntos, sinVerificar = false) {
  if (puntos >= 55) return 'rojo'
  if (puntos >= 20) return 'amarillo'
  return sinVerificar ? 'gris' : 'verde'
}

export function marcarSinVerificar(resultado, frase) {
  return {
    ...resultado,
    sinVerificar: true,
    nivel: nivelDesde(resultado.puntuacion, true),
    motivos: motivosLimpios([...resultado.motivos, frase]),
  }
}

export function dominioBase(host) {
  return dominioRegistrable(host)
}

export function esDominioOficial(dominio) {
  if (!dominio) return false
  return marcaOficialDe(dominioBase(dominio)) !== null
}

export function dominioEsMarca(dominio, id) {
  if (!dominio || !id) return false
  return marcaOficialDe(dominioBase(dominio))?.id === id
}

function decodificarSeguro(texto) {
  try {
    return decodeURIComponent(texto)
  } catch {
    return texto
  }
}

function hostDe(direccion) {
  try {
    return new URL(direccion).hostname
  } catch {
    return ''
  }
}

function leerConfusos(texto, uno = 'l') {
  const letras = [...texto]
  const cambiadas = []
  const origen = []
  let leido = ''
  for (let i = 0; i < letras.length; i++) {
    const letra = letras[i]
    const par = { rn: 'm', vv: 'w' }[`${letra}${letras[i + 1] ?? ''}`]
    if (CONFUSOS[letra]) {
      cambiadas.push(i)
      origen.push([i])
      leido += letra === '1' ? uno : CONFUSOS[letra]
    } else if (par) {
      cambiadas.push(i, i + 1)
      origen.push([i, i + 1])
      leido += par
      i += 1
    } else {
      origen.push([i])
      leido += letra
    }
  }
  return { leido, cambiadas, origen }
}

function tramos(texto, marcadas) {
  const salida = []
  for (const [indice, letra] of [...texto].entries()) {
    const trucho = marcadas.has(indice)
    const ultimo = salida[salida.length - 1]
    if (ultimo && ultimo.trucho === trucho) ultimo.texto += letra
    else salida.push({ texto: letra, trucho })
  }
  return salida
}

function engana(lectura, termino) {
  if (lectura.cambiadas.length === 0) return false
  return lectura.leido.includes(termino) || (lectura.leido.length >= 4 && termino.includes(lectura.leido))
}

function diferenciaPorLetras(host, termino) {
  const visto = []
  const leido = []
  const marcasVisto = new Set()
  const marcasLeido = new Set()
  let posVisto = 0
  let posLeido = 0

  for (const parte of host.split(/([.-])/)) {
    let lectura = leerConfusos(parte)
    if (!engana(lectura, termino)) lectura = leerConfusos(parte, 'i')
    const cambia = engana(lectura, termino)
    if (cambia) {
      for (const indice of lectura.cambiadas) marcasVisto.add(posVisto + indice)
      lectura.origen.forEach((indices, posicion) => {
        if (indices.some((indice) => lectura.cambiadas.includes(indice))) marcasLeido.add(posLeido + posicion)
      })
    }
    visto.push(parte)
    leido.push(cambia ? lectura.leido : parte)
    posVisto += [...parte].length
    posLeido += [...(cambia ? lectura.leido : parte)].length
  }

  if (marcasVisto.size === 0) return null
  return {
    rotulo: 'Se lee como',
    visto: tramos(visto.join(''), marcasVisto),
    real: tramos(leido.join(''), marcasLeido),
  }
}

function diferenciaPorAlfabeto(host) {
  const decodificado = host
    .split('.')
    .map((parte) => decodificarEtiqueta(parte))
    .join('.')
    .toLowerCase()
  const letras = [...decodificado]
  const marcadas = new Set(letras.flatMap((letra, indice) => (HOMO[letra] ? [indice] : [])))
  if (marcadas.size === 0) return null
  return {
    rotulo: 'Se lee como',
    visto: tramos(decodificado, marcadas),
    real: tramos(aLatin(decodificado), marcadas),
  }
}

function diferenciaPorParecido(host, base, termino) {
  const etiqueta = base.split('.')[0]
  const lectura = leerConfusos(etiqueta)
  const leido = lectura.leido
  let corte = 0
  while (corte < leido.length && corte < termino.length && leido[corte] === termino[corte]) corte += 1

  const marcasEtiqueta = new Set(lectura.cambiadas)
  const marcasReal = new Set()
  if (leido.length >= termino.length && corte < leido.length) {
    for (const indice of lectura.origen[corte]) marcasEtiqueta.add(indice)
  }
  if (leido.length <= termino.length && corte < termino.length) marcasReal.add(corte)

  const desplazamiento = [...host].length - [...base].length
  const marcasVisto = new Set([...marcasEtiqueta].map((indice) => indice + desplazamiento))
  return {
    rotulo: 'Se parece a',
    visto: tramos(host, marcasVisto),
    real: tramos(termino, marcasReal),
  }
}

function armarDiferencia(host, base, hallazgo) {
  const limpio = host.replace(/^www\./, '')
  let diferencia = null
  if (hallazgo.como === 'alfabeto') diferencia = diferenciaPorAlfabeto(limpio)
  else if (hallazgo.como === 'letras') diferencia = diferenciaPorLetras(limpio, hallazgo.termino)
  else if (hallazgo.como === 'parecido' && hallazgo.completo) {
    diferencia = diferenciaPorParecido(limpio, base, hallazgo.termino)
  }
  return diferencia ? { ...diferencia, frase: fraseMarca(hallazgo) } : null
}

export function diferenciaDominio(host) {
  if (!host) return null
  const limpio = host.toLowerCase()
  const partes = partesDominio(limpio)
  const hallazgo = parecidoAMarca(partes)
  return hallazgo ? armarDiferencia(limpio, partes.dominio, hallazgo) : null
}

function fraseMarca(hallazgo) {
  const marca = `${hallazgo.nombre} (${hallazgo.oficial})`
  if (hallazgo.como === 'alfabeto') return `Usa letras de otro alfabeto para parecerse a ${marca}.`
  if (hallazgo.como === 'letras') return `Cambia letras por números o signos parecidos para parecerse a ${marca}.`
  if (hallazgo.como === 'parecido') return `El nombre "${hallazgo.visto}" se parece a ${marca}, pero no es su dominio.`
  if (hallazgo.como === 'subdominio') {
    return `Pone "${hallazgo.visto}" al principio para parecer ${hallazgo.nombre}, pero el sitio es ${hallazgo.dominio}.`
  }
  return `Usa el nombre de ${hallazgo.nombre}, pero no es su dominio oficial (${hallazgo.oficial}).`
}

function resumenMarca(hallazgo) {
  return hallazgo ? { marca: hallazgo.marca, nombre: hallazgo.nombre, oficial: hallazgo.oficial } : null
}

export function peorEnlace(enlaces) {
  if (!enlaces?.length) return null
  return enlaces.reduce((mejor, actual) => (actual.puntuacion > mejor.puntuacion ? actual : mejor))
}

export const SIN_FORMATO = 'El enlace no tiene un formato válido.'

const ESQUEMA_PELIGROSO = {
  javascript: 'No abre un sitio: el enlace es código (javascript:) que se ejecuta en tu navegador.',
  vbscript: 'No abre un sitio: el enlace es código (vbscript:) que se ejecuta en tu equipo.',
  data: 'No abre un sitio: trae una página o un archivo metido en la propia dirección (data:), sin un dominio detrás.',
}

const FORMA_IP = {
  hexadecimal: 'en hexadecimal',
  octal: 'con ceros adelante (octal)',
  numero: 'como un solo número',
}

function sinSitio(lectura) {
  const comun = { url: lectura.href ?? lectura.entrada, host: lectura.host ?? '', sinSitio: true, diferencia: null }
  if (lectura.estado === 'peligroso') {
    return {
      ...comun,
      dominio: `${lectura.esquema}:`,
      puntuacion: 90,
      nivel: 'rojo',
      sinVerificar: false,
      senales: [{ id: 'esquema_peligroso', puntos: 90 }],
      motivos: [
        ESQUEMA_PELIGROSO[lectura.esquema] ??
          `No abre un sitio: apunta a un archivo (${lectura.esquema}:), no a una página web.`,
      ],
    }
  }
  if (lectura.estado === 'otra-app') {
    return {
      ...comun,
      dominio: `${lectura.esquema}:`,
      puntuacion: 0,
      nivel: 'gris',
      sinVerificar: true,
      senales: [{ id: 'otra_app', puntos: 0 }],
      motivos: [`No es una dirección web: abre otra aplicación (${lectura.esquema}:), así que no la podemos revisar.`],
    }
  }

  const comparable = hostParaComparar(lectura.host)
  const hostTocado = comparable !== lectura.host.toLowerCase().replace(/\.$/, '')
  const marca = comparable ? parecidoAMarca(partesDominio(comparable), { invalido: hostTocado }) : null
  const puntuacion = marca ? PUNTOS_PARECIDO : 0
  return {
    ...comun,
    dominio: lectura.host || lectura.entrada.slice(0, 253),
    puntuacion,
    nivel: nivelDesde(puntuacion, true),
    sinVerificar: true,
    sinFormato: true,
    parecido: resumenMarca(marca),
    senales: [
      { id: 'sin_formato', puntos: 0 },
      ...(marca ? [{ id: 'marca_en_enlace_invalido', puntos: PUNTOS_PARECIDO }] : []),
    ],
    motivos: [
      SIN_FORMATO,
      lectura.motivo,
      ...(marca ? [`Imita el nombre de ${marca.nombre} (${marca.oficial}), pero no es su dirección.`] : []),
    ],
  }
}

export function analizar(entrada) {
  const lectura = leerEnlace(entrada)
  if (!lectura) return null
  if (lectura.estado !== 'web') return sinSitio(lectura)

  const { url, host, dominio: base } = lectura
  const tld = host.split('.').pop()
  const plataforma = plataformaDe(host)
  const oficial = esDominioOficial(base) && !plataforma
  const motivos = []
  const senales = []
  let puntos = 0
  let fuertes = 0

  const sumar = (id, cantidad, frase, fuerte = false) => {
    puntos += cantidad
    if (fuerte) fuertes += 1
    motivos.push(frase)
    senales.push({ id, puntos: cantidad })
  }
  const anotar = (id, frase) => {
    motivos.push(frase)
    senales.push({ id, puntos: 0 })
  }

  if (lectura.usuario !== null) {
    sumar(
      'arroba_userinfo',
      60,
      lectura.usuario
        ? `Lo que va antes de la arroba (${lectura.usuario}) no es el sitio: el enlace abre ${host}.`
        : `Esconde el destino real detrás de una arroba: el enlace abre ${host}.`,
      true,
    )
  }

  if (lectura.barraInvertida) {
    sumar('barra_invertida', 30, `Usa una barra invertida (\\) para confundir: el navegador abre ${host}.`, true)
  }

  if (lectura.tipoHost !== 'dominio') {
    sumar('ip', 40, 'Lleva a una dirección IP, no a un nombre de sitio.', true)
    if (lectura.formaIp) {
      sumar('ip_disfrazada', 25, `La IP está escrita ${FORMA_IP[lectura.formaIp]} para que no se reconozca: es ${host}.`, true)
    }
  }

  if (lectura.disfrazado && !oficial) {
    sumar(
      'nombre_disfrazado',
      30,
      `El nombre del sitio está escrito disfrazado (${lectura.escrito}): el navegador lo abre como ${lectura.hostUnicode}.`,
      true,
    )
  }

  const marca = lectura.tipoHost === 'dominio' ? parecidoAMarca(lectura) : null
  if (marca) sumar(`marca_${marca.como}`, PUNTOS_PARECIDO, fraseMarca(marca))

  if (marca?.como === 'alfabeto') {
    fuertes += 1
  } else if (lectura.mezclaAlfabetos) {
    sumar('mezcla_alfabetos', 45, 'Mezcla letras latinas con letras de otro alfabeto que se ven iguales.', true)
  } else if (lectura.imitaLatinas) {
    sumar(
      'imita_latinas',
      40,
      `Está escrito con letras de otro alfabeto que imitan a las latinas: parece "${aLatin(lectura.hostUnicode)}", pero no lo es.`,
      true,
    )
  }

  if (!oficial && EXT_PELIGROSA.test(`${url.pathname}${url.search}`)) {
    sumar('descarga_ejecutable', 55, 'El enlace descarga un programa, una app o un archivo que puede ejecutarse.', true)
  }

  if (url.protocol === 'http:') {
    sumar('sin_https', 20, 'No tiene candado: es http, no https. Una página que pide datos no debería estar así.')
  }

  if (!oficial && TLD_BARATOS.has(tld)) {
    sumar('tld_barato', 20, `El final .${tld} se usa mucho en sitios truchos.`, true)
  }

  if (plataforma?.tipo === 'acortador') {
    anotar('acortador', AVISO_ACORTADOR)
  } else if (plataforma?.tipo === 'temporal') {
    sumar(
      'direccion_temporal',
      18,
      `Está en ${plataforma.plataforma}, un servicio de direcciones temporales: cualquiera arma una en minutos.`,
      true,
    )
  } else if (plataforma?.tipo === 'contenido') {
    anotar('contenido_de_terceros', `${plataforma.plataforma} es un sitio conocido, pero el contenido lo creó otra persona.`)
    if (marca) fuertes += 1
  }

  const { subdominios } = lectura
  if (!oficial && subdominios > 3) {
    sumar('muchos_subdominios', 12, 'Tiene demasiados subdominios, un truco típico para parecer oficial.')
  }

  const prefijoW = subdominios > 0 ? host.match(/^(w{2}|w{4,})\./)?.[1] : null
  if (prefijoW) {
    sumar('prefijo_www_falso', 20, `Empieza con "${prefijoW}." en vez de "www.", un truco para que parezca una dirección real.`, true)
  }

  const etiqueta = decodificarEtiqueta(base.split('.')[0])
  if (!oficial && etiqueta.split('-').length - 1 >= 3) {
    sumar('muchos_guiones', 15, 'El dominio está armado con muchos guiones, como un nombre inventado.')
  }

  if (url.port && !['80', '443', '8080', '8443'].includes(url.port)) {
    sumar('puerto_raro', 15, `Usa el puerto ${url.port}, que no es el de una página común.`)
  }

  const texto = `${host}${url.pathname}${url.search}`.toLowerCase()
  if (!oficial && PALABRAS_GANCHO.some((p) => texto.includes(p))) {
    sumar('palabras_gancho', 10, 'El enlace usa palabras de urgencia o premio.')
  }

  if (!oficial && RUTA_SENSIBLE.test(`${url.pathname}${url.search}`)) {
    sumar(
      'ruta_sensible',
      12,
      'La dirección abre una página para entrar, verificar o recuperar una cuenta. En un sitio que no es el oficial, eso sirve para robar la clave.',
      true,
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
      'nombre_senuelo',
      18,
      'El nombre del sitio habla de pagos, seguridad o una cuenta. Así se disfrazan las páginas que piden datos.',
      true,
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
          sumar('parametro_redireccion', 32, `Un parámetro de la dirección manda a otro sitio (${destino.hostname}).`, true)
          break
        }
      } catch {
        /* un parámetro que no es una dirección no suma */
      }
    }
  }

  if ([...url.searchParams.keys()].some((clave) => /password|passwd|clave/i.test(clave))) {
    sumar('clave_en_url', 35, 'La dirección lleva una clave a la vista.', true)
  }

  const codificados = url.href.match(/%[0-9a-f]{2}/gi) ?? []
  if (!oficial && codificados.length >= 8) {
    sumar('texto_codificado', 12, 'La dirección esconde parte del texto con caracteres codificados.')
  }

  if (!oficial) {
    const enCamino = marcaEnCamino(url)
    if (
      enCamino &&
      enCamino.marca !== marca?.marca &&
      marcaOficialDe(base)?.id !== enCamino.marca &&
      (enCamino.sensible || enCamino.nombraOficial || plataforma?.tipo === 'contenido')
    ) {
      sumar(
        'marca_en_camino',
        25,
        `Nombra a ${enCamino.nombre} en ${enCamino.donde === 'camino' ? 'el camino de la dirección' : 'un parámetro'}, pero el sitio es ${plataforma ? host : base}, no el oficial (${enCamino.oficial}).`,
      )
    }
  }

  const camino = decodificarSeguro(`${url.pathname}${url.search}${url.hash}`)

  if (/https?:\/\//i.test(url.pathname) || /https?:\/\//i.test(url.hash)) {
    sumar('enlace_escondido', 32, 'La dirección esconde otro enlace adentro.', true)
  }

  if (
    /\.(pdf|jpg|jpeg|png|docx?|xlsx?|txt)\.(apk|exe|scr|bat|cmd|msi|hta|lnk|iso|js|html|htm)(?=$|[?#])/i.test(
      camino,
    )
  ) {
    sumar('doble_extension', 48, 'El archivo muestra una extensión inofensiva y otra que puede ejecutarse.', true)
  } else if (!oficial && /\.(html|htm|svg)(?=$|[?#])/i.test(url.pathname)) {
    sumar('pagina_suelta', 16, 'Abre una página suelta, no el sitio de siempre.')
  }

  if ([...url.searchParams.values()].some((valor) => /^[A-Za-z0-9+/_=-]{48,}$/.test(valor))) {
    sumar('dato_codificado', 12, 'Un dato de la dirección viene codificado y no se puede leer.')
  }

  // Solo cuenta si después viene algo con forma de dominio: "/@-34.60,-58.38" en Maps no lo es.
  if (/@[\p{L}\p{N}-]+\.[\p{L}]{2,}/u.test(decodificarSeguro(url.pathname))) {
    sumar('arroba_en_camino', 25, 'Hay una arroba en el camino de la dirección.', true)
  }

  if (/(javascript|data|vbscript):/i.test(camino)) {
    sumar('codigo_en_camino', 50, 'La dirección intenta ejecutar algo o incrustar datos, no abrir un sitio.', true)
  }

  if (/(?:^|[?&])(?:cbu|cvu|cvv|tarjeta|dni)=/i.test(url.search)) {
    sumar('datos_personales_en_url', 28, 'La dirección lleva datos de una cuenta, una tarjeta o un documento.', true)
  }

  if (!oficial && lectura.hostUnicode.split('.').some((parte) => parte.length >= 28)) {
    sumar('etiqueta_larga', 10, 'Una parte del nombre del sitio es demasiado larga para un dominio habitual.')
  }

  if (lectura.demasiadoLarga) {
    anotar('demasiado_larga', `Es una dirección muy larga (${lectura.entrada.length} caracteres), demasiado para abrir el sitio y revisarlo.`)
  }

  if (marca && fuertes > 0) {
    const antes = puntos
    puntos = Math.max(puntos, PISO_PARECIDO_FUERTE)
    if (puntos > antes) senales.push({ id: 'piso_marca_mas_senal_fuerte', puntos: puntos - antes })
  }

  if (motivos.length === 0) {
    motivos.push('No aparecen señales fuertes en la dirección.')
  }

  const sinVerificar = Boolean(lectura.demasiadoLarga || plataforma)
  return {
    url: url.href,
    host,
    dominio: base,
    puntuacion: Math.min(100, puntos),
    nivel: nivelDesde(puntos, sinVerificar),
    sinVerificar,
    demasiadoLarga: lectura.demasiadoLarga,
    parecido: resumenMarca(marca),
    plataforma,
    motivos,
    senales,
    diferencia: marca ? armarDiferencia(host, base, marca) : null,
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
  if (nivel === 'gris') {
    return 'No lo abras hasta confirmarlo. Si dice ser un banco, un organismo o una tienda, entrá escribiendo vos la dirección oficial.'
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

  return {
    ...local,
    puntuacion,
    nivel: nivelDesde(puntuacion, local.sinVerificar),
    motivos: motivosLimpios(motivos),
  }
}

function sumarDestino(actual, puntos, urlDestino, frase) {
  const destino = analizar(urlDestino)
  if (!destino) {
    actual.motivos.push(frase)
    return puntos
  }
  actual.motivos.push(frase)
  actual.motivos.push(...destino.motivos.filter((m) => !m.startsWith('No aparecen')))
  if (destino.sinVerificar) actual.sinVerificar = true
  return Math.max(puntos, destino.puntuacion)
}

export const FALLO_AL_SEGUIR = {
  no_resuelve: 'El dominio no existe o no apunta a ningún servidor, así que no hay un sitio para revisar.',
  dns: 'No pudimos averiguar a qué servidor apunta el sitio.',
  bloqueado: 'La dirección apunta a una red interna o privada (como un router o un servidor local), así que por seguridad no la abrimos.',
  protocolo: 'Una redirección intenta abrir algo que no es una página web, así que no la seguimos.',
  tls: 'La conexión segura con el sitio falló: el certificado no es válido o está mal configurado.',
  tiempo: 'El sitio tardó demasiado en responder y cortamos la espera.',
  conexion: 'El sitio no aceptó la conexión.',
  saltos: 'El enlace redirige más de 5 veces seguidas, así que cortamos ahí sin llegar al destino.',
}

const sinSenales = (m) => m.startsWith('No aparecen')

function recorridoDe(extra) {
  const cadena = Array.isArray(extra.cadena) ? extra.cadena.filter((paso) => typeof paso === 'string') : []
  if (extra.meta_destino && cadena.at(-1) !== extra.meta_destino) cadena.push(extra.meta_destino)
  return cadena
}

export function combinarConEnriquecimiento(local, extra) {
  if (!extra) return local

  const actual = { ...local, motivos: [...local.motivos] }
  let puntos = actual.puntuacion
  let fuertes = 0
  const desdeAcortador = local.plataforma?.tipo === 'acortador'
  const destino = extra.destino ? analizar(extra.destino) : null
  const cadena = recorridoDe(extra)
  if (cadena.length > 1) actual.cadena = cadena
  if (extra.fallo) actual.falloAlSeguir = extra.fallo

  if (destino && destino.dominio !== local.dominio) {
    puntos = Math.max(puntos, destino.puntuacion)
    actual.destino = destino.url
    actual.dominioDestino = destino.dominio
    actual.diferencia = destino.diferencia ?? actual.diferencia
    actual.parecido = destino.parecido ?? actual.parecido
    if (desdeAcortador) {
      actual.plataforma = destino.plataforma
      actual.sinVerificar = Boolean(local.demasiadoLarga || destino.sinVerificar)
    } else {
      actual.sinVerificar = Boolean(actual.sinVerificar || destino.sinVerificar)
    }
    const aviso = destino.sinSitio
      ? desdeAcortador
        ? 'El acortador no lleva a una página web.'
        : 'La redirección no lleva a una página web.'
      : desdeAcortador
        ? `El acortador lleva a ${destino.dominio}.`
        : `La dirección te manda a otro sitio: ${destino.dominio}.`
    actual.motivos = [
      ...actual.motivos.filter((m) => m !== AVISO_ACORTADOR),
      aviso,
      ...destino.motivos.filter((m) => !sinSenales(m) && (extra.fallo || m !== AVISO_ACORTADOR)),
    ]
  } else if (!destino && desdeAcortador && extra.destino) {
    actual.motivos.push(`El acortador termina en ${extra.destino}.`)
  }

  const vistos = new Set([local.dominio, destino?.dominio])
  for (const paso of cadena.slice(1, -1)) {
    const intermedio = analizar(paso)
    if (!intermedio || vistos.has(intermedio.dominio)) continue
    vistos.add(intermedio.dominio)
    if (intermedio.nivel !== 'amarillo' && intermedio.nivel !== 'rojo') continue
    puntos = Math.max(puntos, intermedio.puntuacion)
    actual.parecido ??= intermedio.parecido
    actual.motivos.push(
      `En el camino pasa por ${intermedio.dominio}.`,
      ...intermedio.motivos.filter((m) => m !== AVISO_ACORTADOR && !sinSenales(m)),
    )
  }

  // Que un dominio parecido a una marca redirija al sitio real no lo limpia: queda en Sospechoso.
  if (local.parecido && destino && !destino.sinSitio && destino.dominio !== local.dominio && esDominioOficial(destino.dominio)) {
    puntos = Math.max(puntos, PUNTOS_PARECIDO)
    actual.motivos.push(
      `Termina en ${destino.dominio}, que es un sitio oficial, pero la dirección original imita a ${local.parecido.nombre}: que redirija a un sitio real no la vuelve confiable.`,
    )
  }

  if (extra.fallo) {
    actual.sinVerificar = true
    actual.motivos.push(FALLO_AL_SEGUIR[extra.fallo] ?? FALLO_AL_SEGUIR.conexion)
  }

  const dominioFinal = extra.dominio || actual.dominioDestino || actual.dominio
  const hostFinal = hostDe(extra.destino) || local.host
  const deTerceros = Boolean(plataformaDe(hostFinal))
  const oficial = esDominioOficial(dominioFinal) && !deTerceros
  // En una plataforma de terceros, la edad y el certificado son de la plataforma, no de quien armó el contenido.
  const juzgaDominio = !oficial && !deTerceros

  if (typeof extra.edad_dias === 'number' && juzgaDominio) {
    const dias = extra.edad_dias
    if (dias < 7) puntos += 45
    else if (dias < 30) puntos += 25
    else if (dias < 90) puntos += 15
    if (dias < 30) fuertes += 1
  }

  if (extra.frase_edad && juzgaDominio) actual.motivos.push(extra.frase_edad)
  if (extra.frase_certificado && juzgaDominio) {
    actual.motivos.push(extra.frase_certificado)
    if (extra.cert_dias != null && extra.cert_dias < 14) puntos += 15
  }

  if (extra.archivo_peligroso) {
    puntos += 55
    fuertes += 1
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

  if (!oficial && extra.formulario_otro) {
    puntos += 40
    fuertes += 1
    actual.motivos.push(`El formulario envía lo que escribís a ${extra.formulario_otro}.`)
  }

  if (!oficial && extra.script_otro) {
    puntos += 32
    fuertes += 1
    actual.motivos.push(`Un script de la página abre ${extra.script_otro}.`)
  }

  if (!oficial && extra.iframe_otro) {
    puntos += 18
    actual.motivos.push(`La página incrusta otro sitio (${extra.iframe_otro}).`)
  }

  if (!oficial && extra.pide_datos && !extra.formulario_clave) {
    puntos += 14
    actual.motivos.push('El texto de la página pide una clave, un CBU o datos de una tarjeta.')
  }

  if (!oficial && extra.formulario_clave) {
    fuertes += 1
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

  if (actual.parecido && fuertes > 0) puntos = Math.max(puntos, PISO_PARECIDO_FUERTE)

  puntos = Math.min(100, puntos)
  const motivos = motivosLimpios(actual.motivos)
  if (motivos.length === 0) motivos.push('No aparecen señales fuertes en la dirección.')

  return { ...actual, motivos, puntuacion: puntos, nivel: nivelDesde(puntos, actual.sinVerificar) }
}
