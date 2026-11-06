import { analizar } from './analisis.js'

const INVISIBLES = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/
const BINARIO = /[\uFFFD\u0000-\u0008\u000E-\u001F]/
const ENLACE_EN_TEXTO = /\bhttps?:\/\/[^\s<>"']+/i

const NO_VERIFICABLE = 'No pudimos verificarlo'
const RECEPTOR =
  'SafeLink no puede verificar a quién le llega la plata. Antes de pagar, confirmá que el nombre sea el de quien te cobra: un QR pegado encima del original manda la plata a otra cuenta.'

const MONEDAS = { '032': '$', '840': 'US$', '978': '€' }

function campos(texto, separador = ';') {
  const salida = {}
  let actual = ''
  let escapado = false
  const partes = []
  for (const letra of texto) {
    if (escapado) {
      actual += letra
      escapado = false
    } else if (letra === '\\') {
      escapado = true
    } else if (letra === separador) {
      partes.push(actual)
      actual = ''
    } else {
      actual += letra
    }
  }
  if (actual) partes.push(actual)
  for (const parte of partes) {
    const corte = parte.indexOf(':')
    if (corte <= 0) continue
    const clave = parte.slice(0, corte).toUpperCase()
    const valor = parte.slice(corte + 1)
    salida[clave] = salida[clave] ? [...[].concat(salida[clave]), valor] : valor
  }
  return salida
}

function primero(valor) {
  return Array.isArray(valor) ? valor[0] : valor
}

function todos(valor) {
  return valor == null ? [] : [].concat(valor)
}

function decodificar(texto) {
  try {
    return decodeURIComponent(texto)
  } catch {
    return texto
  }
}

function sinVerificar(crudo, titulo, motivo) {
  return { tipo: 'desconocido', titulo, datos: [], consejo: motivo, crudo, sinVerificar: true }
}


export function leerTlv(texto) {
  const salida = []
  let i = 0
  while (i < texto.length) {
    const id = texto.slice(i, i + 2)
    const largo = texto.slice(i + 2, i + 4)
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(largo)) return null
    const fin = i + 4 + Number(largo)
    if (fin > texto.length) return null
    salida.push([id, texto.slice(i + 4, fin)])
    i = fin
  }
  return salida
}

export function crc16(texto) {
  let crc = 0xffff
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function cbuValido(numero) {
  if (!/^\d{22}$/.test(numero)) return false
  const digitos = [...numero].map(Number)
  const control = (desde, pesos) => {
    const suma = pesos.reduce((total, peso, indice) => total + peso * digitos[desde + indice], 0)
    return (10 - (suma % 10)) % 10
  }
  return (
    control(0, [7, 1, 3, 9, 7, 1, 3]) === digitos[7] &&
    control(8, [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]) === digitos[21]
  )
}

function redDe(gui) {
  const texto = gui.toLowerCase()
  if (texto.includes('mercadopago') || texto.includes('mercadolibre')) return 'Mercado Pago'
  return gui
}

function leerPago(crudo) {
  const campos = leerTlv(crudo)
  if (!campos) {
    return sinVerificar(
      crudo,
      'Parece un código para pagar, pero está mal armado',
      `${NO_VERIFICABLE}: no se pudo leer como un QR de pago. No pagues con este código.`,
    )
  }
  const mapa = Object.fromEntries(campos)
  const datos = []
  const avisos = []

  datos.push(['Receptor', mapa['59']?.trim() || 'No figura en el código'])

  const redes = []
  const cuentas = []
  for (const [id, valor] of campos) {
    const numero = Number(id)
    if (numero < 26 || numero > 51) continue
    const internos = leerTlv(valor)
    if (!internos) continue
    for (const [sub, dato] of internos) {
      if (sub === '00' && dato) redes.push(redDe(dato))
      else if (/^\d{22}$/.test(dato)) cuentas.push(dato)
    }
  }
  if (redes.length) datos.push(['Red de cobro', [...new Set(redes)].join(', ')])
  for (const cuenta of new Set(cuentas)) {
    const tipo = cuenta.startsWith('000') ? 'CVU' : 'CBU'
    datos.push([tipo, cuenta])
    if (!cbuValido(cuenta)) avisos.push(`El ${tipo} del código no pasa la verificación de sus dígitos: puede estar mal o haber sido cambiado.`)
  }

  if (mapa['54']) {
    const moneda = MONEDAS[mapa['53']] ?? (mapa['53'] ? `Moneda ${mapa['53']}` : '')
    datos.push(['Monto', `${moneda} ${mapa['54']}`.trim()])
  } else {
    datos.push(['Monto', 'No viene en el código: lo escribís vos al pagar'])
  }
  if (mapa['60']) datos.push(['Ciudad', mapa['60'].trim()])

  const adicional = mapa['62'] ? leerTlv(mapa['62']) : null
  const referencia = adicional?.find(([sub]) => sub === '05' || sub === '01')?.[1]
  if (referencia) datos.push(['Referencia', referencia])
  if (mapa['01'] === '12') datos.push(['Tipo', 'Para un solo pago'])
  if (mapa['01'] === '11') datos.push(['Tipo', 'Fijo, se usa para varios pagos'])

  const ultimo = campos.at(-1)
  if (!ultimo || ultimo[0] !== '63' || ultimo[1].length !== 4) {
    avisos.push('El código no trae el control que llevan los QR de pago.')
  } else if (crc16(crudo.slice(0, -4)) !== ultimo[1].toUpperCase()) {
    avisos.push('El control del código no coincide: está dañado o alguien lo modificó.')
  }

  return {
    tipo: 'pago',
    titulo: 'Un código para pagar',
    datos,
    avisos,
    consejo: RECEPTOR,
    crudo,
  }
}

function leerCripto(crudo, esquema) {
  const [direccion, consulta = ''] = crudo.slice(esquema.length + 1).split('?')
  const parametros = new URLSearchParams(consulta)
  const datos = [['Billetera de destino', direccion || 'No figura en el código']]
  if (parametros.get('amount')) datos.push(['Monto', `${parametros.get('amount')} (${esquema})`])
  if (parametros.get('label')) datos.push(['A nombre de', parametros.get('label')])
  return {
    tipo: 'pago',
    titulo: 'Un pago con criptomonedas',
    datos,
    avisos: ['Un pago con criptomonedas no se puede cancelar ni reclamar.'],
    consejo: RECEPTOR,
    crudo,
  }
}


function leerWifi(crudo) {
  const datos = campos(crudo.slice(5))
  const nombre = primero(datos.S)
  if (!nombre) {
    return sinVerificar(crudo, 'Parece una red Wi-Fi, pero le falta el nombre', `${NO_VERIFICABLE}: el código no trae el nombre de la red.`)
  }
  const tipo = (primero(datos.T) || '').toUpperCase()
  const abierta = !tipo || tipo === 'NOPASS'
  const seguridad = abierta
    ? 'Abierta, sin clave'
    : tipo === 'WEP'
      ? 'WEP (vieja y fácil de romper)'
      : tipo === 'SAE'
        ? 'WPA3'
        : tipo
  const avisos = []
  if (abierta) avisos.push('Es una red abierta: cualquiera que esté cerca puede ver lo que mandás por ella.')
  if (tipo === 'WEP') avisos.push('WEP es una protección vieja: se rompe en minutos.')
  return {
    tipo: 'wifi',
    titulo: 'Una red Wi-Fi',
    datos: [
      ['Red', nombre],
      ['Seguridad', seguridad],
      ...(primero(datos.H)?.toLowerCase() === 'true' ? [['Visibilidad', 'Red oculta']] : []),
      ...(primero(datos.P) ? [['Clave', 'Viene incluida en el código']] : []),
    ],
    avisos,
    consejo: 'SafeLink no se conecta a la red. Si no sabés de quién es, no te conectes, y conectado a una red ajena no entres a tu banco ni pongas claves.',
    crudo,
  }
}

function numeroCorto(numero) {
  const digitos = numero.replace(/\D/g, '')
  return digitos.length > 0 && digitos.length <= 6
}

function leerSms(crudo, esquema) {
  const resto = crudo.slice(esquema.length + 1)
  let numero
  let texto
  if (esquema === 'smsto' || esquema === 'mmsto') {
    const corte = resto.indexOf(':')
    numero = corte === -1 ? resto : resto.slice(0, corte)
    texto = corte === -1 ? '' : resto.slice(corte + 1)
  } else {
    const [base, consulta = ''] = resto.split('?')
    numero = base.replace(/;$/, '')
    texto = new URLSearchParams(consulta).get('body') ?? ''
  }
  numero = decodificar(numero).trim()
  return {
    tipo: 'sms',
    titulo: 'Un SMS para mandar',
    datos: [['Número', numero || 'No figura en el código'], ['Mensaje', texto ? decodificar(texto) : 'Sin texto']],
    avisos: numeroCorto(numero) ? ['Es un número corto: suelen ser servicios que cobran por cada mensaje.'] : [],
    consejo: 'SafeLink no manda el mensaje. Si no sabés de quién es el número, no lo mandes.',
    crudo,
  }
}

function leerTelefono(crudo) {
  const numero = decodificar(crudo.slice(4)).trim()
  return {
    tipo: 'telefono',
    titulo: 'Un número para llamar',
    datos: [['Número', numero || 'No figura en el código']],
    avisos: numeroCorto(numero) ? ['Es un número corto: puede ser un servicio pago.'] : [],
    consejo: 'SafeLink no llama. Si no conocés el número, buscalo antes de llamar.',
    crudo,
  }
}

function leerCorreo(crudo, esquema) {
  let para
  let asunto
  let cuerpo
  if (esquema === 'mailto') {
    const [direccion, consulta = ''] = crudo.slice(7).split('?')
    const parametros = new URLSearchParams(consulta)
    para = decodificar(direccion)
    asunto = parametros.get('subject') ?? ''
    cuerpo = parametros.get('body') ?? ''
  } else {
    const datos = campos(crudo.slice(7))
    para = primero(datos.TO) ?? ''
    asunto = primero(datos.SUB) ?? ''
    cuerpo = primero(datos.BODY) ?? ''
  }
  return {
    tipo: 'correo',
    titulo: 'Un correo para mandar',
    datos: [
      ['Para', para || 'Sin dirección'],
      ...(asunto ? [['Asunto', asunto]] : []),
      ...(cuerpo ? [['Texto', cuerpo]] : []),
    ],
    avisos: [],
    consejo: 'SafeLink no manda el correo. Si te pide mandar datos o una clave, no lo hagas.',
    crudo,
  }
}

function leerUbicacion(crudo) {
  const [coordenadas, consulta = ''] = crudo.slice(4).split('?')
  const [lat, lng] = coordenadas.split(',').map(Number)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return sinVerificar(crudo, 'Parece una ubicación, pero las coordenadas no son válidas', `${NO_VERIFICABLE}: las coordenadas no existen.`)
  }
  const lugar = new URLSearchParams(consulta).get('q')
  return {
    tipo: 'ubicacion',
    titulo: 'Una ubicación',
    datos: [['Coordenadas', `${lat}, ${lng}`], ...(lugar ? [['Lugar', lugar]] : [])],
    avisos: [],
    consejo: 'SafeLink no abre el mapa por vos.',
    crudo,
  }
}

function lineasVcard(texto) {
  return texto.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
}

function valoresVcard(lineas, clave) {
  return lineas
    .filter((linea) => {
      const nombre = linea.slice(0, linea.indexOf(':')).split(';')[0].toUpperCase()
      return nombre === clave || nombre.endsWith(`.${clave}`)
    })
    .map((linea) => linea.slice(linea.indexOf(':') + 1).replace(/\\([,;\\])/g, '$1').replace(/\\n/gi, ' ').trim())
    .filter(Boolean)
}

function contacto(crudo, { nombre, organizacion, telefonos, correos, sitios, direccion }) {
  const datos = [['Nombre', nombre || 'Sin nombre']]
  if (organizacion) datos.push(['Empresa', organizacion])
  for (const telefono of telefonos) datos.push(['Teléfono', telefono])
  for (const correo of correos) datos.push(['Correo', correo])
  for (const sitio of sitios) datos.push(['Sitio', sitio])
  if (direccion) datos.push(['Dirección', direccion])
  return {
    tipo: 'contacto',
    titulo: 'Un contacto para guardar',
    datos,
    avisos: [],
    consejo: 'SafeLink no lo guarda en tu agenda. Un contacto con el nombre de un banco o un organismo puede ser falso.',
    crudo,
    enlace: sitios.find((sitio) => /^https?:\/\//i.test(sitio)) ?? null,
  }
}

function leerVcard(crudo) {
  const lineas = lineasVcard(crudo)
  const nombre = valoresVcard(lineas, 'FN')[0] ?? valoresVcard(lineas, 'N')[0]?.split(';').filter(Boolean).reverse().join(' ')
  return contacto(crudo, {
    nombre,
    organizacion: valoresVcard(lineas, 'ORG')[0]?.replace(/;/g, ' ').trim(),
    telefonos: valoresVcard(lineas, 'TEL'),
    correos: valoresVcard(lineas, 'EMAIL'),
    sitios: valoresVcard(lineas, 'URL'),
    direccion: valoresVcard(lineas, 'ADR')[0]?.split(';').filter(Boolean).join(', '),
  })
}

function leerMecard(crudo) {
  const datos = campos(crudo.slice(7))
  const nombre = primero(datos.N)?.split(',').filter(Boolean).reverse().join(' ')
  return contacto(crudo, {
    nombre,
    organizacion: primero(datos.ORG),
    telefonos: todos(datos.TEL),
    correos: todos(datos.EMAIL),
    sitios: todos(datos.URL),
    direccion: primero(datos.ADR),
  })
}

function leerEvento(crudo) {
  const lineas = lineasVcard(crudo)
  const datos = [['Evento', valoresVcard(lineas, 'SUMMARY')[0] ?? 'Sin nombre']]
  const inicio = valoresVcard(lineas, 'DTSTART')[0]
  const lugar = valoresVcard(lineas, 'LOCATION')[0]
  if (inicio) datos.push(['Empieza', inicio])
  if (lugar) datos.push(['Lugar', lugar])
  return { tipo: 'evento', titulo: 'Un evento para el calendario', datos, avisos: [], consejo: null, crudo }
}

function web(crudo) {
  const texto = crudo.trim()
  if (!texto || /\s/.test(texto)) return null
  const local = analizar(texto)
  if (!local) return null
  if (local.sinFormato && !/^https?:/i.test(texto) && !local.host.includes('.')) return null
  return { tipo: 'web', valor: texto, invisibles: INVISIBLES.test(texto), local, crudo }
}

export function leerQr(valor) {
  const crudo = typeof valor === 'string' ? valor : ''
  if (!crudo.trim()) return sinVerificar(crudo, 'El código está vacío', `${NO_VERIFICABLE}: el código no trae nada.`)
  if (BINARIO.test(crudo)) {
    return sinVerificar(crudo, 'El código trae datos que no son texto', `${NO_VERIFICABLE}: no es un formato que conozcamos.`)
  }

  const limpio = crudo.trim()
  const esquema = limpio.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase()

  if (/^000201/.test(limpio)) return leerPago(limpio)

  if (!esquema || esquema === 'http' || esquema === 'https') {
    const encontrado = web(limpio)
    if (encontrado) return encontrado
    const enlace = limpio.match(ENLACE_EN_TEXTO)?.[0] ?? null
    return {
      tipo: 'texto',
      titulo: 'Un texto, no una dirección web',
      datos: [],
      avisos: enlace ? ['Adentro del texto hay un enlace. No lo revisamos hasta que lo pidas.'] : [],
      consejo: null,
      crudo,
      enlace,
    }
  }

  if (esquema === 'wifi') return leerWifi(limpio)
  if (esquema === 'mailto' || esquema === 'matmsg') return leerCorreo(limpio, esquema)
  if (esquema === 'tel') return leerTelefono(limpio)
  if (esquema === 'sms' || esquema === 'smsto' || esquema === 'mmsto') return leerSms(limpio, esquema)
  if (esquema === 'geo') return leerUbicacion(limpio)
  if (esquema === 'mecard') return leerMecard(limpio)
  if (esquema === 'begin' && /^begin:vcard/i.test(limpio)) return leerVcard(limpio)
  if (esquema === 'begin' && /^begin:vevent/i.test(limpio)) return leerEvento(limpio)
  if (esquema === 'bitcoin' || esquema === 'ethereum' || esquema === 'litecoin') return leerCripto(limpio, esquema)

  if (esquema === 'javascript' || esquema === 'vbscript' || esquema === 'data' || esquema === 'file') {
    return {
      tipo: 'peligro',
      titulo: 'Un código que intenta ejecutar algo',
      datos: [['Empieza con', `${esquema}:`]],
      avisos: [],
      consejo: 'Un QR común no trae esto. No lo abras con otra app.',
      crudo,
    }
  }

  return {
    ...sinVerificar(
      crudo,
      'Un código que abre otra app',
      `${NO_VERIFICABLE}: no es una página web, así que SafeLink no lo puede revisar. Si no sabés qué app abre, no sigas.`,
    ),
    datos: [['Abre', `${esquema}:`]],
  }
}
