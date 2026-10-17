import { analizar } from './analisis.js'

// eslint-disable-next-line no-control-regex
const INVISIBLES = /[\u0000-\u001F\u007F\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g

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
    if (corte > 0) salida[parte.slice(0, corte).toUpperCase()] = parte.slice(corte + 1)
  }
  return salida
}

function decodificar(texto) {
  try {
    return decodeURIComponent(texto)
  } catch {
    return texto
  }
}

function leerEmv(texto) {
  const salida = {}
  let i = 0
  while (i + 4 <= texto.length) {
    const id = texto.slice(i, i + 2)
    const largo = Number.parseInt(texto.slice(i + 2, i + 4), 10)
    if (Number.isNaN(largo)) break
    salida[id] = texto.slice(i + 4, i + 4 + largo)
    i += 4 + largo
  }
  return salida
}

function lineaVcard(texto, clave) {
  const fila = texto.split(/\r?\n/).find((linea) => linea.toUpperCase().startsWith(clave))
  if (!fila) return null
  return fila.slice(fila.indexOf(':') + 1).trim() || null
}

function web(crudo) {
  const limpio = crudo.replace(INVISIBLES, '').trim()
  if (!limpio || /\s/.test(limpio)) return null
  const local = analizar(limpio)
  if (!local) return null
  const host = local.host ?? ''
  if (!host.includes('.') && !host.includes(':')) return null
  return { tipo: 'web', valor: limpio, invisibles: limpio !== crudo.trim(), local }
}

export function leerQr(valor) {
  const crudo = (valor ?? '').trim()
  if (!crudo) return { tipo: 'texto', titulo: 'Texto vacío', datos: [] }

  const esquema = crudo.match(/^([a-z][a-z0-9+-]*):/i)?.[1]?.toLowerCase()

  if (!esquema || esquema === 'http' || esquema === 'https') {
    if (/^000201/.test(crudo)) {
      const emv = leerEmv(crudo)
      const datos = []
      if (emv['59']) datos.push(['A nombre de', emv['59'].trim()])
      if (emv['60']) datos.push(['Ciudad', emv['60'].trim()])
      if (emv['54']) datos.push(['Monto', `$ ${emv['54']}`])
      return {
        tipo: 'pago',
        titulo: 'Un código para pagar',
        datos,
        consejo: 'Antes de pagar, fijate que el nombre sea el de quien te cobra. Un QR pegado encima del original manda la plata a otra cuenta.',
      }
    }

    const encontrado = web(crudo)
    if (encontrado) return encontrado
    return { tipo: 'texto', titulo: 'Un texto, no una dirección web', datos: [['Dice', crudo]] }
  }

  if (esquema === 'wifi') {
    const datos = campos(crudo.slice(5))
    const seguridad = (datos.T || '').toUpperCase()
    return {
      tipo: 'wifi',
      titulo: 'Una red Wi-Fi',
      datos: [
        ['Red', datos.S || 'Sin nombre'],
        ['Seguridad', !seguridad || seguridad === 'NOPASS' ? 'Abierta, sin clave' : seguridad],
        ...(datos.P ? [['Clave', 'Viene incluida en el código']] : []),
      ],
      consejo: 'SafeLink no se conecta. Si no sabés de quién es la red, no te conectes: quien la armó puede ver lo que mandás.',
    }
  }

  if (esquema === 'mailto' || esquema === 'matmsg') {
    let para
    let asunto
    if (esquema === 'mailto') {
      const [direccion, consulta = ''] = crudo.slice(7).split('?')
      para = decodificar(direccion)
      asunto = decodificar(new URLSearchParams(consulta).get('subject') ?? '')
    } else {
      const datos = campos(crudo.slice(7))
      para = datos.TO ?? ''
      asunto = datos.SUB ?? ''
    }
    return {
      tipo: 'correo',
      titulo: 'Un correo para mandar',
      datos: [['Para', para || 'Sin dirección'], ...(asunto ? [['Asunto', asunto]] : [])],
      consejo: 'Si te pide mandar datos o una clave a esa dirección, no lo hagas.',
    }
  }

  if (esquema === 'tel') {
    return {
      tipo: 'telefono',
      titulo: 'Un número para llamar',
      datos: [['Número', decodificar(crudo.slice(4))]],
      consejo: 'Si no conocés el número, buscalo antes de llamar.',
    }
  }

  if (esquema === 'sms' || esquema === 'smsto') {
    const resto = crudo.slice(esquema.length + 1)
    const [numero, ...texto] = esquema === 'smsto' ? resto.split(':') : resto.split('?body=')
    return {
      tipo: 'sms',
      titulo: 'Un SMS para mandar',
      datos: [['Número', decodificar(numero)], ...(texto.length ? [['Mensaje', decodificar(texto.join(':'))]] : [])],
      consejo: 'Algunos números cobran por cada mensaje. Si no sabés de quién es, no lo mandes.',
    }
  }

  if (esquema === 'geo') {
    return {
      tipo: 'ubicacion',
      titulo: 'Una ubicación',
      datos: [['Coordenadas', crudo.slice(4).split('?')[0]]],
    }
  }

  if (esquema === 'begin' && /^begin:vcard/i.test(crudo)) {
    const datos = [
      ['Nombre', lineaVcard(crudo, 'FN') ?? lineaVcard(crudo, 'N:') ?? 'Sin nombre'],
      ...(lineaVcard(crudo, 'TEL') ? [['Teléfono', lineaVcard(crudo, 'TEL')]] : []),
      ...(lineaVcard(crudo, 'EMAIL') ? [['Correo', lineaVcard(crudo, 'EMAIL')]] : []),
      ...(lineaVcard(crudo, 'URL') ? [['Sitio', lineaVcard(crudo, 'URL')]] : []),
    ]
    return { tipo: 'contacto', titulo: 'Un contacto para guardar', datos }
  }

  if (esquema === 'begin' && /^begin:vevent/i.test(crudo)) {
    return {
      tipo: 'evento',
      titulo: 'Un evento para el calendario',
      datos: [['Evento', lineaVcard(crudo, 'SUMMARY') ?? 'Sin nombre']],
    }
  }

  if (esquema === 'javascript' || esquema === 'data' || esquema === 'file') {
    return {
      tipo: 'peligro',
      titulo: 'Un código que intenta ejecutar algo',
      datos: [['Empieza con', `${esquema}:`]],
      consejo: 'Un QR común no trae esto. No lo abras con otra app.',
    }
  }

  return {
    tipo: 'app',
    titulo: 'Un código que abre otra app',
    datos: [['Abre', `${esquema}:`], ['Dice', crudo]],
    consejo: 'No es una página web, así que SafeLink no la puede revisar. Si no sabés qué app abre, no sigas.',
  }
}
