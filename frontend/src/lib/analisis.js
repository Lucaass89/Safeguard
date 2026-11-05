import { aLatin, decodificarEtiqueta, dominioRegistrable, HOMO, leerEnlace, partesDominio } from './enlace.js'
import {
  hostParaComparar,
  marcaEnCamino,
  marcaEnTexto,
  marcaOficialDe,
  parecidoAMarca,
  plataformaDe,
} from './marcas.js'
import { nivelPorPuntaje, nuevaSenal, pesoConTope, PUNTAJE, puntajeFinal } from './puntaje.js'

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

// Se buscan solo en el camino y los parámetros: en el nombre del sitio ya cuenta NOMBRES_SENUELO.
const PALABRAS_GANCHO = [
  'premio',
  'ganaste',
  'urgente',
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

const NOMBRES_SENUELO = new Set([
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

const PUNTOS_PARECIDO = PUNTAJE.marca.pesoDudoso
const PISO_PARECIDO_FUERTE = 60

export function pesoDeMarca(marca, config = PUNTAJE.marca) {
  const evidente =
    ['letras', 'alfabeto', 'subdominio'].includes(marca.como) || (marca.termino ?? '').length >= config.largoEvidente
  return evidente ? config.pesoEvidente : config.pesoDudoso
}

const AVISO_ACORTADOR = 'Es un acortador: no se ve a dónde lleva hasta abrirlo.'

export function nivelDesde(puntos, sinVerificar = false) {
  return nivelPorPuntaje(puntos, sinVerificar)
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
    const motivo =
      ESQUEMA_PELIGROSO[lectura.esquema] ?? `No abre un sitio: apunta a un archivo (${lectura.esquema}:), no a una página web.`
    return {
      ...comun,
      dominio: `${lectura.esquema}:`,
      puntuacion: 90,
      nivel: 'rojo',
      sinVerificar: false,
      senales: [nuevaSenal({ id: 'esquema_peligroso', grupo: 'engano', peso: 90, texto: motivo, fuerza: 'fuerte' })],
      motivos: [motivo],
    }
  }
  if (lectura.estado === 'otra-app') {
    const motivo = `No es una dirección web: abre otra aplicación (${lectura.esquema}:), así que no la podemos revisar.`
    return {
      ...comun,
      dominio: `${lectura.esquema}:`,
      puntuacion: 0,
      nivel: 'gris',
      sinVerificar: true,
      senales: [nuevaSenal({ id: 'otra_app', grupo: 'aviso', peso: 0, texto: motivo, fuerza: null })],
      motivos: [motivo],
    }
  }

  const comparable = hostParaComparar(lectura.host)
  const hostTocado = comparable !== lectura.host.toLowerCase().replace(/\.$/, '')
  const marca = comparable ? parecidoAMarca(partesDominio(comparable), { invalido: hostTocado }) : null
  const puntuacion = marca ? PUNTOS_PARECIDO : 0
  const fraseMarcaInvalida = marca ? `Imita el nombre de ${marca.nombre} (${marca.oficial}), pero no es su dirección.` : null
  return {
    ...comun,
    dominio: lectura.host || lectura.entrada.slice(0, 253),
    puntuacion,
    nivel: nivelDesde(puntuacion, true),
    sinVerificar: true,
    sinFormato: true,
    parecido: resumenMarca(marca),
    senales: [
      nuevaSenal({ id: 'sin_formato', grupo: 'aviso', peso: 0, texto: SIN_FORMATO, fuerza: null }),
      ...(marca
        ? [
            nuevaSenal({
              id: 'marca_en_enlace_invalido',
              grupo: 'marca',
              peso: PUNTOS_PARECIDO,
              texto: fraseMarcaInvalida,
              fuerza: 'fuerte',
            }),
          ]
        : []),
    ],
    motivos: [SIN_FORMATO, lectura.motivo, ...(marca ? [fraseMarcaInvalida] : [])],
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
  // Señales fuertes o medias que acompañan a una marca imitada (la marca sola no cuenta).
  let refuerzos = 0

  const sumar = (id, peso, texto, fuerza, grupo) => {
    const aplicado = pesoConTope(peso, grupo, senales)
    puntos += aplicado
    if (grupo !== 'marca' && fuerza !== 'debil') refuerzos += 1
    motivos.push(texto)
    senales.push(nuevaSenal({ id, grupo, peso: aplicado, texto, fuerza }))
  }
  const anotar = (id, texto) => {
    motivos.push(texto)
    senales.push(nuevaSenal({ id, grupo: 'aviso', peso: 0, texto, fuerza: 'debil' }))
  }

  if (lectura.usuario !== null) {
    sumar(
      'arroba_userinfo',
      60,
      lectura.usuario
        ? `Lo que va antes de la arroba (${lectura.usuario}) no es el sitio: el enlace abre ${host}.`
        : `Esconde el destino real detrás de una arroba: el enlace abre ${host}.`,
      'fuerte',
      'engano',
    )
  }

  if (lectura.barraInvertida) {
    sumar('barra_invertida', 30, `Usa una barra invertida (\\) para confundir: el navegador abre ${host}.`, 'fuerte', 'engano')
  }

  if (lectura.tipoHost !== 'dominio') {
    sumar('ip', 40, 'Lleva a una dirección IP, no a un nombre de sitio.', 'fuerte', 'engano')
    if (lectura.formaIp) {
      sumar(
        'ip_disfrazada',
        25,
        `La IP está escrita ${FORMA_IP[lectura.formaIp]} para que no se reconozca: es ${host}.`,
        'fuerte',
        'engano',
      )
    }
  }

  if (lectura.disfrazado && !oficial) {
    sumar(
      'nombre_disfrazado',
      30,
      `El nombre del sitio está escrito disfrazado (${lectura.escrito}): el navegador lo abre como ${lectura.hostUnicode}.`,
      'fuerte',
      'engano',
    )
  }

  const marca = lectura.tipoHost === 'dominio' ? parecidoAMarca(lectura) : null
  if (marca) sumar(`marca_${marca.como}`, pesoDeMarca(marca), fraseMarca(marca), 'fuerte', 'marca')

  if (marca?.como === 'alfabeto') {
    refuerzos += 1
  } else if (lectura.mezclaAlfabetos) {
    sumar('mezcla_alfabetos', 45, 'Mezcla letras latinas con letras de otro alfabeto que se ven iguales.', 'fuerte', 'engano')
  } else if (lectura.imitaLatinas) {
    sumar(
      'imita_latinas',
      40,
      `Está escrito con letras de otro alfabeto que imitan a las latinas: parece "${aLatin(lectura.hostUnicode)}", pero no lo es.`,
      'fuerte',
      'engano',
    )
  } else if (!oficial && !lectura.disfrazado && host.split('.').some((parte) => parte.startsWith('xn--'))) {
    // Las señales de arriba ya explican el caso cuando el nombre imita a otro; acá queda el resto (ñ, acentos).
    sumar(
      'punycode',
      PUNTAJE.punycode.peso,
      `El nombre del sitio usa letras especiales (${lectura.hostUnicode}): a veces se usan para imitar a otro sitio, así que fijate bien cómo está escrito.`,
      'debil',
      'debiles',
    )
  }

  if (!oficial && EXT_PELIGROSA.test(`${url.pathname}${url.search}`)) {
    sumar(
      'descarga_ejecutable',
      55,
      'El enlace descarga un programa, una app o un archivo que puede ejecutarse.',
      'fuerte',
      'archivo',
    )
  }

  if (url.protocol === 'http:') {
    sumar(
      'sin_https',
      20,
      'No tiene candado: es http, no https. Una página que pide datos no debería estar así.',
      'debil',
      'debiles',
    )
  }

  if (!oficial && TLD_BARATOS.has(tld)) {
    sumar('tld_barato', 20, `El final .${tld} se usa mucho en sitios truchos.`, 'debil', 'debiles')
  }

  if (plataforma?.tipo === 'acortador') {
    anotar('acortador', AVISO_ACORTADOR)
  } else if (plataforma?.tipo === 'temporal') {
    sumar(
      'direccion_temporal',
      18,
      `Está en ${plataforma.plataforma}, un servicio de direcciones temporales: cualquiera arma una en minutos.`,
      'media',
      'plataforma',
    )
  } else if (plataforma?.tipo === 'contenido') {
    anotar('contenido_de_terceros', `${plataforma.plataforma} es un sitio conocido, pero el contenido lo creó otra persona.`)
    if (marca) refuerzos += 1
  }

  const { subdominios } = lectura
  if (!oficial && subdominios > 3) {
    sumar('muchos_subdominios', 12, 'Tiene demasiados subdominios, un truco típico para parecer oficial.', 'debil', 'debiles')
  }

  const prefijoW = subdominios > 0 ? host.match(/^(w{2}|w{4,})\./)?.[1] : null
  if (prefijoW) {
    sumar(
      'prefijo_www_falso',
      20,
      `Empieza con "${prefijoW}." en vez de "www.", un truco para que parezca una dirección real.`,
      'fuerte',
      'engano',
    )
  }

  const etiqueta = decodificarEtiqueta(base.split('.')[0])
  if (!oficial && etiqueta.split('-').length - 1 >= 3) {
    sumar('muchos_guiones', 15, 'El dominio está armado con muchos guiones, como un nombre inventado.', 'debil', 'debiles')
  }

  if (url.port && !['80', '443', '8080', '8443'].includes(url.port)) {
    sumar('puerto_raro', 15, `Usa el puerto ${url.port}, que no es el de una página común.`, 'debil', 'debiles')
  }

  const rutaSensible = !oficial && RUTA_SENSIBLE.test(`${url.pathname}${url.search}`)
  if (rutaSensible) {
    sumar(
      'ruta_sensible',
      12,
      'La dirección abre una página para entrar, verificar o recuperar una cuenta. En un sitio que no es el oficial, eso sirve para robar la clave.',
      'media',
      'pagina',
    )
  }

  const partesNombre = etiqueta.split('-').filter(Boolean)
  const nombrePegado = etiqueta.replace(/-/g, '')
  const senuelo =
    partesNombre.find((parte) => NOMBRES_SENUELO.has(parte)) ??
    nombrePegado.match(/pagos|seguridad|verificacion|billetera/)?.[0]
  if (!oficial && senuelo) {
    // Junto a una marca imitada es el armado típico ("marca.pagos-seguridad.com"); sola es una palabra más.
    sumar(
      'nombre_senuelo',
      18,
      `El nombre del sitio incluye "${senuelo}", una palabra que usan las páginas truchas para parecer un trámite oficial.`,
      marca ? 'media' : 'debil',
      'palabras',
    )
  }

  const rutaTexto = decodificarSeguro(`${url.pathname}${url.search}`).toLowerCase()
  const gancho = rutaSensible ? null : PALABRAS_GANCHO.find((p) => rutaTexto.includes(p))
  if (!oficial && gancho) {
    sumar('palabras_gancho', 10, `La dirección usa una palabra de urgencia o de premio ("${gancho}").`, 'debil', 'palabras')
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
          sumar(
            'parametro_redireccion',
            32,
            `Un parámetro de la dirección manda a otro sitio (${destino.hostname}).`,
            'media',
            'redireccion',
          )
          break
        }
      } catch {
        /* un parámetro que no es una dirección no suma */
      }
    }
  }

  if ([...url.searchParams.keys()].some((clave) => /password|passwd|clave/i.test(clave))) {
    sumar('clave_en_url', 35, 'La dirección lleva una clave a la vista.', 'media', 'datos')
  }

  const codificados = url.href.match(/%[0-9a-f]{2}/gi) ?? []
  if (!oficial && codificados.length >= 8) {
    sumar('texto_codificado', 12, 'La dirección esconde parte del texto con caracteres codificados.', 'debil', 'debiles')
  }

  if (!oficial) {
    const enCamino = marcaEnCamino(url)
    const nombrada =
      enCamino && enCamino.marca !== marca?.marca && marcaOficialDe(base)?.id !== enCamino.marca ? enCamino : null
    const donde = nombrada?.donde === 'camino' ? 'el camino de la dirección' : 'un parámetro'
    const sitio = plataforma ? host : base
    // Una nota de un diario que nombra a la marca no cuenta; con un dominio de trámite o una página para entrar, sí.
    if (nombrada && (rutaSensible || senuelo)) {
      sumar(
        'marca_en_camino',
        PUNTAJE.marca.pesoEnRutaConContexto,
        rutaSensible
          ? `Nombra a ${nombrada.nombre} en ${donde} y abre una página para entrar o verificar una cuenta, pero el sitio es ${sitio}, no el oficial (${nombrada.oficial}).`
          : `Nombra a ${nombrada.nombre} en ${donde} de un sitio con nombre de trámite (${sitio}), que no es el oficial (${nombrada.oficial}).`,
        'fuerte',
        'marca_camino',
      )
    } else if (nombrada && (nombrada.sensible || nombrada.nombraOficial || plataforma?.tipo === 'contenido')) {
      sumar(
        'marca_en_camino',
        PUNTAJE.marca.pesoEnRuta,
        `Nombra a ${nombrada.nombre} en ${donde}, pero el sitio es ${sitio}, no el oficial (${nombrada.oficial}).`,
        'media',
        'marca_camino',
      )
    }
  }

  const camino = decodificarSeguro(`${url.pathname}${url.search}${url.hash}`)

  if (/https?:\/\//i.test(url.pathname) || /https?:\/\//i.test(url.hash)) {
    sumar('enlace_escondido', 32, 'La dirección esconde otro enlace adentro.', 'fuerte', 'engano')
  }

  if (
    /\.(pdf|jpg|jpeg|png|docx?|xlsx?|txt)\.(apk|exe|scr|bat|cmd|msi|hta|lnk|iso|js|html|htm)(?=$|[?#])/i.test(
      camino,
    )
  ) {
    sumar(
      'doble_extension',
      48,
      'El archivo muestra una extensión inofensiva y otra que puede ejecutarse.',
      'fuerte',
      'archivo',
    )
  } else if (!oficial && /\.(html|htm|svg)(?=$|[?#])/i.test(url.pathname)) {
    sumar('pagina_suelta', 16, 'Abre una página suelta, no el sitio de siempre.', 'debil', 'debiles')
  }

  if ([...url.searchParams.values()].some((valor) => /^[A-Za-z0-9+/_=-]{48,}$/.test(valor))) {
    sumar('dato_codificado', 12, 'Un dato de la dirección viene codificado y no se puede leer.', 'debil', 'debiles')
  }

  // Solo cuenta si después viene algo con forma de dominio: "/@-34.60,-58.38" en Maps no lo es.
  if (/@[\p{L}\p{N}-]+\.[\p{L}]{2,}/u.test(decodificarSeguro(url.pathname))) {
    sumar('arroba_en_camino', 25, 'Hay una arroba en el camino de la dirección.', 'media', 'camino')
  }

  if (/(javascript|data|vbscript):/i.test(camino)) {
    sumar(
      'codigo_en_camino',
      50,
      'La dirección intenta ejecutar algo o incrustar datos, no abrir un sitio.',
      'fuerte',
      'engano',
    )
  }

  if (/(?:^|[?&])(?:cbu|cvu|cvv|tarjeta|dni)=/i.test(url.search)) {
    sumar(
      'datos_personales_en_url',
      28,
      'La dirección lleva datos de una cuenta, una tarjeta o un documento.',
      'media',
      'datos',
    )
  }

  if (!oficial && lectura.hostUnicode.split('.').some((parte) => parte.length >= 28)) {
    sumar(
      'etiqueta_larga',
      10,
      'Una parte del nombre del sitio es demasiado larga para un dominio habitual.',
      'debil',
      'debiles',
    )
  }

  if (lectura.demasiadoLarga) {
    anotar('demasiado_larga', `Es una dirección muy larga (${lectura.entrada.length} caracteres), demasiado para abrir el sitio y revisarlo.`)
  }

  if (marca && refuerzos > 0) {
    const antes = puntos
    puntos = Math.max(puntos, PISO_PARECIDO_FUERTE)
    if (puntos > antes) {
      senales.push(
        nuevaSenal({ id: 'piso_marca_mas_senal_fuerte', grupo: 'marca', peso: puntos - antes, texto: null, fuerza: 'fuerte' }),
      )
    }
  }

  puntos = cerrarPuntaje(puntos, senales)

  if (motivos.length === 0) {
    motivos.push('No aparecen señales fuertes en la dirección.')
  }

  const sinVerificar = Boolean(lectura.demasiadoLarga || plataforma)
  return {
    url: url.href,
    host,
    dominio: base,
    puntuacion: puntos,
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

// Aplica la regla de que sin una señal fuerte (o dos medias) no se llega a Peligroso, y deja anotado el recorte.
function cerrarPuntaje(puntos, senales) {
  const final = puntajeFinal(puntos, senales)
  if (final < Math.min(100, puntos)) {
    senales.push(
      nuevaSenal({ id: 'tope_sin_senal_fuerte', grupo: 'regla', peso: final - Math.min(100, puntos), texto: null, fuerza: null }),
    )
  }
  return final
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
    return 'Encontramos algo raro en este enlace, aunque no alcanza para decir que es una estafa: abajo te contamos qué. Antes de seguir, chequeá que la dirección sea exactamente la del sitio oficial y desconfiá si te apuran o te piden claves, códigos o datos de una tarjeta.'
  }
  if (nivel === 'gris') {
    return 'No lo abras hasta confirmarlo. Si dice ser un banco, un organismo o una tienda, entrá escribiendo vos la dirección oficial.'
  }
  return 'No encontramos señales de riesgo. Esto no garantiza que el sitio sea seguro: antes de poner una clave, fijate que la dirección sea exactamente la del sitio oficial.'
}

export function combinarConAmenaza(local, amenaza) {
  if (!amenaza) return { ...local, motivos: motivosLimpios(local.motivos) }

  const piso = amenaza.nivel === 'rojo' ? 90 : amenaza.nivel === 'amarillo' ? 45 : 0
  const puntuacion = Math.max(local.puntuacion, piso)
  const motivos = motivosLimpios(local.motivos)
  const senales = [...(local.senales ?? [])]
  const anotar = (id, texto, fuerza) => {
    motivos.unshift(texto)
    senales.push(nuevaSenal({ id, grupo: 'base_safelink', peso: puntuacion - local.puntuacion, texto, fuerza }))
  }

  if (amenaza.nivel === 'rojo') {
    const veces = amenaza.veces_reportado
    anotar(
      'denunciado_en_safelink',
      veces > 1
        ? `Este dominio ya fue denunciado en la base de SafeLink (${veces} veces).`
        : 'Este dominio ya fue denunciado en la base de SafeLink.',
      'fuerte',
    )
  } else if (amenaza.nivel === 'amarillo') {
    anotar('senalado_en_safelink', 'Este dominio ya fue señalado en la base de SafeLink. Conviene mirarlo otra vez.', 'media')
  }

  return {
    ...local,
    senales,
    puntuacion,
    nivel: nivelDesde(puntuacion, local.sinVerificar),
    motivos: motivosLimpios(motivos),
  }
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

// La edad solo suma cuando el dominio es de verdad nuevo: "hace 6 meses" no es una señal de riesgo.
export function riesgoPorEdad(dias, config = PUNTAJE.edad) {
  if (dias >= config.recienteDias) return null
  const cuando = dias < 1 ? 'hoy' : dias === 1 ? 'ayer' : `hace ${dias} días`
  return {
    puntos: dias < config.muyRecienteDias ? config.pesoMuyReciente : config.pesoReciente,
    fuerza: 'media',
    frase: `El dominio es muy reciente (se registró ${cuando}): los sitios truchos suelen tener pocos días de vida.`,
  }
}

export function riesgoPorCertificado(dias) {
  if (dias >= 14) return null
  const cuando = dias < 2 ? 'hace menos de dos días' : `hace ${dias} días`
  return {
    puntos: 15,
    frase: `El certificado del sitio (el candado) se emitió ${cuando}: casi no hubo tiempo de que fuera un sitio conocido.`,
  }
}

function recorridoDe(extra) {
  const cadena = Array.isArray(extra.cadena) ? extra.cadena.filter((paso) => typeof paso === 'string') : []
  if (extra.meta_destino && cadena.at(-1) !== extra.meta_destino) cadena.push(extra.meta_destino)
  return cadena
}

const deOtroLado = (senales, origen) => (senales ?? []).map((senal) => ({ ...senal, origen }))

export function combinarConEnriquecimiento(local, extra) {
  if (!extra) return local

  const actual = { ...local, motivos: [...local.motivos], senales: [...(local.senales ?? [])] }
  let puntos = actual.puntuacion
  let refuerzos = 0
  const sumar = (id, peso, texto, fuerza, grupo) => {
    const aplicado = pesoConTope(peso, grupo, actual.senales)
    puntos += aplicado
    if (fuerza !== 'debil') refuerzos += 1
    actual.motivos.push(texto)
    actual.senales.push(nuevaSenal({ id, grupo, peso: aplicado, texto, fuerza }))
  }

  const desdeAcortador = local.plataforma?.tipo === 'acortador'
  const destino = extra.destino ? analizar(extra.destino) : null
  const cadena = recorridoDe(extra)
  if (cadena.length > 1) actual.cadena = cadena
  if (extra.fallo) actual.falloAlSeguir = extra.fallo

  if (destino && destino.dominio !== local.dominio) {
    puntos = Math.max(puntos, destino.puntuacion)
    actual.senales.push(...deOtroLado(destino.senales, 'destino'))
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
    actual.senales.push(...deOtroLado(intermedio.senales, 'camino'))
    actual.parecido ??= intermedio.parecido
    actual.motivos.push(
      `En el camino pasa por ${intermedio.dominio}.`,
      ...intermedio.motivos.filter((m) => m !== AVISO_ACORTADOR && !sinSenales(m)),
    )
  }

  // Que un dominio parecido a una marca redirija al sitio real no lo limpia, pero sin otra señal suele ser
  // un dominio defensivo de la propia marca: queda en Precaución.
  if (local.parecido && destino && !destino.sinSitio && destino.dominio !== local.dominio && esDominioOficial(destino.dominio)) {
    const otraSenal = (local.senales ?? []).some(
      (senal) => senal.puntos > 0 && senal.grupo !== 'marca' && senal.fuerza !== 'debil',
    )
    puntos = otraSenal
      ? Math.max(puntos, PUNTOS_PARECIDO)
      : Math.min(Math.max(puntos, PUNTOS_PARECIDO), PUNTAJE.umbrales.peligroso - 1)
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

  const edad = typeof extra.edad_dias === 'number' && juzgaDominio ? riesgoPorEdad(extra.edad_dias) : null
  if (edad) sumar('dominio_reciente', edad.puntos, edad.frase, edad.fuerza, 'edad')

  const certificado = typeof extra.cert_dias === 'number' && juzgaDominio ? riesgoPorCertificado(extra.cert_dias) : null
  if (certificado) sumar('certificado_reciente', certificado.puntos, certificado.frase, 'debil', 'debiles')

  if (extra.archivo_peligroso) {
    sumar('destino_descarga', 55, 'El destino es una descarga de programa o de aplicación.', 'fuerte', 'archivo')
  }

  if (extra.meta_destino) {
    const meta = analizar(extra.meta_destino)
    actual.motivos.push('La página se redirige sola hacia otro sitio.')
    if (meta) {
      actual.motivos.push(...meta.motivos.filter((m) => !sinSenales(m)))
      actual.senales.push(...deOtroLado(meta.senales, 'redireccion_automatica'))
      if (meta.sinVerificar) actual.sinVerificar = true
      puntos = Math.max(puntos, meta.puntuacion)
    }
  }

  if (!oficial && extra.formulario_otro) {
    sumar('formulario_a_otro_sitio', 40, `El formulario envía lo que escribís a ${extra.formulario_otro}.`, 'fuerte', 'pagina')
  }

  if (!oficial && extra.script_otro) {
    sumar('script_abre_otro_sitio', 32, `Un script de la página abre ${extra.script_otro}.`, 'media', 'pagina_script')
  }

  if (!oficial && extra.iframe_otro) {
    sumar('incrusta_otro_sitio', 18, `La página incrusta otro sitio (${extra.iframe_otro}).`, 'debil', 'debiles')
  }

  if (!oficial && extra.pide_datos && !extra.formulario_clave) {
    sumar('pide_datos', 14, 'El texto de la página pide una clave, un CBU o datos de una tarjeta.', 'debil', 'debiles')
  }

  if (!oficial && extra.formulario_clave) {
    const marca = extra.titulo ? marcaEnTexto(extra.titulo) : null
    if (marca) {
      sumar(
        'pide_clave_con_marca',
        50,
        `Pide una clave y el título menciona ${marca.nombre}, pero el sitio no es el oficial.`,
        'fuerte',
        'pagina_clave',
      )
    } else if (typeof extra.edad_dias === 'number' && extra.edad_dias < 120) {
      sumar('pide_clave_dominio_nuevo', 35, 'Pide una clave en un dominio de menos de cuatro meses.', 'media', 'pagina_clave')
    } else {
      sumar('pide_clave', 18, 'La página pide una clave.', 'debil', 'debiles')
    }
  }

  if (actual.parecido && refuerzos > 0) puntos = Math.max(puntos, PISO_PARECIDO_FUERTE)

  actual.senales = actual.senales.filter((senal) => senal.id !== 'tope_sin_senal_fuerte')
  puntos = cerrarPuntaje(puntos, actual.senales)
  const motivos = motivosLimpios(actual.motivos)
  if (motivos.length === 0) motivos.push('No aparecen señales fuertes en la dirección.')

  return { ...actual, motivos, puntuacion: puntos, nivel: nivelDesde(puntos, actual.sinVerificar) }
}
