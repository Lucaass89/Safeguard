import { analizar, dominioBase, dominioEsMarca, marcaEnTexto, nivelDesde, peorEnlace } from './analisis.js'

const URGENCIA = [
  'urgente',
  'inmediato',
  'últimas horas',
  'ultimas horas',
  'su cuenta será',
  'su cuenta sera',
  'verifique ahora',
  'verificá ahora',
  'último aviso',
  'ultimo aviso',
]
const GRATIS = new Set([
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
  'hotmail.com.ar',
  'outlook.es',
])
const AREAS = ['soporte', 'sistemas', 'rrhh', 'recursos humanos', 'gerencia', 'seguridad', 'facturación', 'facturacion']
const EXT_ADJUNTO = /\.(apk|exe|scr|bat|cmd|msi|dll|hta|lnk|iso|dmg|js|jse|vbs|vbe|ps1|docm|xlsm|html|htm)(?=$|")/i

function desplegar(bloque) {
  return bloque.replace(/\r\n[ \t]+/g, ' ').replace(/\n[ \t]+/g, ' ')
}

function separar(crudo) {
  const normal = crudo.replace(/\r\n/g, '\n')
  const corte = normal.search(/\n\s*\n/)
  const cabeza = corte === -1 ? normal : normal.slice(0, corte)
  const cuerpo = corte === -1 ? '' : normal.slice(corte).trim()
  const headers = {}
  for (const linea of desplegar(cabeza).split('\n')) {
    const i = linea.indexOf(':')
    if (i === -1) continue
    const clave = linea.slice(0, i).toLowerCase()
    headers[clave] = (headers[clave] ? `${headers[clave]} ` : '') + linea.slice(i + 1).trim()
  }
  return { headers, cuerpo }
}

function direccion(valor) {
  if (!valor) return { display: '', email: '', dominio: '' }
  const m = valor.match(/<?([\w.+-]+@([\w.-]+))>?/)
  const display = valor.replace(/<[^>]+>/, '').replace(/"/g, '').trim()
  return { display, email: m?.[1] ?? '', dominio: (m?.[2] ?? '').toLowerCase() }
}

function hostDe(valor) {
  const limpio = (valor ?? '').trim()
  if (!limpio) return ''
  try {
    const url = new URL(limpio.includes('://') ? limpio : `https://${limpio}`)
    return url.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function enlacesVisibles(cuerpo) {
  const hallados = []
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  for (const match of cuerpo.matchAll(re)) {
    const real = hostDe(match[1])
    const visible = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const visibleHost = hostDe(visible)
    if (!real || !visibleHost) continue
    if (dominioBase(real) !== dominioBase(visibleHost)) {
      hallados.push({ visible: visibleHost, real })
    }
  }
  return hallados.slice(0, 3)
}

function nombreArchivo(valor) {
  const limpio = valor.replace(/"/g, '').trim()
  try {
    return decodeURIComponent(limpio)
  } catch {
    return limpio
  }
}

export function analizarCorreo(crudo) {
  const texto = (crudo ?? '').trim()
  if (!texto) return null

  const { headers, cuerpo } = separar(texto)
  const from = direccion(headers.from)
  const reply = direccion(headers['reply-to'])
  const auth = (headers['authentication-results'] ?? '').toLowerCase()
  const senales = []
  let puntos = 0

  if (auth.includes('dmarc=fail')) {
    puntos += 45
    senales.push('DMARC falló: el dominio no autoriza este correo.')
  }
  if (auth.includes('spf=fail') || auth.includes('spf=softfail')) {
    puntos += 35
    senales.push('SPF falló: no salió del servidor que dice ser.')
  }
  if (auth.includes('dkim=fail')) {
    puntos += 25
    senales.push('La firma DKIM no coincide.')
  }

  const displayHost = from.display.match(/@([\w.-]+)/)?.[1]?.toLowerCase()
  if (displayHost && from.dominio && displayHost !== from.dominio) {
    puntos += 40
    senales.push(`El nombre muestra ${displayHost} pero escribe desde ${from.dominio}.`)
  }

  if (reply.dominio && from.dominio && dominioBase(reply.dominio) !== dominioBase(from.dominio)) {
    puntos += 25
    senales.push(`Si contestás, la respuesta se va a ${reply.dominio}, no al remitente.`)
  }

  const nombre = from.display.toLowerCase()
  if (GRATIS.has(from.dominio) && AREAS.some((a) => nombre.includes(a))) {
    puntos += 35
    senales.push('Ningún área de sistemas, RRHH o gerencia real escribe desde una cuenta personal.')
  }

  const marca = marcaEnTexto(from.display)
  if (marca && from.dominio && !dominioEsMarca(from.dominio, marca.marca)) {
    puntos += 50
    senales.push(`El nombre se hace pasar por ${marca.nombre} y escribe desde ${from.dominio}.`)
    if (auth.includes('dmarc=pass')) {
      senales.push('DMARC pasa porque el correo sale de ese dominio trucho, no del oficial.')
    }
  }

  const retorno = direccion(headers['return-path'])
  if (retorno.dominio && from.dominio && dominioBase(retorno.dominio) !== dominioBase(from.dominio)) {
    puntos += 25
    senales.push(`El Return-Path es ${retorno.dominio}, distinto de quien dice enviar.`)
  }

  const archivos = [...texto.matchAll(/filename\*?=(?:UTF-8''|"?)([^";\n]+)/gi)].map((m) =>
    nombreArchivo(m[1]),
  )
  const peligroso = archivos.find((nombreArchivo) => EXT_ADJUNTO.test(nombreArchivo.toLowerCase()))
  if (peligroso) {
    puntos += 45
    senales.push(`Trae un adjunto peligroso (${peligroso.split(/[/\\]/).pop()}).`)
  }

  for (const enlace of enlacesVisibles(cuerpo)) {
    puntos += 45
    senales.push(`El texto muestra ${enlace.visible}, pero el clic va a ${enlace.real}.`)
  }

  const plano = `${headers.subject ?? ''} ${cuerpo}`.toLowerCase()
  if (URGENCIA.some((p) => plano.includes(p))) {
    puntos += 10
    senales.push('El texto apura para que no pienses.')
  }

  const urls = [...(cuerpo.match(/https?:\/\/[^\s>]+/g) ?? [])]
  const enlaces = urls
    .map((u) => analizar(u.replace(/[>)],]+$/, '')))
    .filter(Boolean)
    .sort((a, b) => b.puntuacion - a.puntuacion)
  const peor = peorEnlace(enlaces)
  const puntuacion = Math.min(100, puntos + (peor?.puntuacion ?? 0))

  if (senales.length === 0 && enlaces.length === 0) {
    senales.push(
      auth.includes('dmarc=pass')
        ? 'El dominio autoriza este envío y no aparecen otras señales fuertes.'
        : 'No aparecen señales fuertes en los encabezados.',
    )
  }

  return {
    url: headers.subject || 'Correo sin asunto',
    asunto: headers.subject,
    dominio: from.dominio || enlaces[0]?.dominio || 'remitente-desconocido',
    puntuacion,
    nivel: nivelDesde(puntuacion),
    motivos: [
      ...senales,
      ...enlaces.flatMap((e) => e.motivos.filter((m) => !m.startsWith('No aparecen'))),
    ],
    senales,
    enlaces,
  }
}
