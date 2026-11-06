import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { parse as partirDominio } from 'npm:tldts@7.4.18'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_SALTOS = 5
const TIEMPO_SALTO_MS = 4000
const TIEMPO_TOTAL_MS = 12_000
const MAX_PAGINA = 65_536
const MAX_RDAP = 200_000
const MAX_CRT = 200_000
const AGENTE = 'SafeGuard-SafeLink/1.0 (+https://safeguardd.vercel.app)'

type Fallo = 'no_resuelve' | 'dns' | 'bloqueado' | 'protocolo' | 'tls' | 'tiempo' | 'conexion' | 'saltos'

const ERRORES: Record<Fallo, string> = {
  no_resuelve: 'El dominio no existe o no tiene servidor',
  dns: 'No se pudo resolver el dominio',
  bloqueado: 'La dirección apunta a una red interna',
  protocolo: 'La redirección sale de http o https',
  tls: 'La conexión segura falló',
  tiempo: 'El sitio tardó demasiado',
  conexion: 'El sitio no aceptó la conexión',
  saltos: 'Demasiadas redirecciones',
}

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function sinCorchetes(host: string) {
  return host.replace(/^\[|\]$/g, '').toLowerCase()
}

function dominioRegistrable(host: string) {
  const limpio = sinCorchetes(host).replace(/\.$/, '')
  if (esIpv4(limpio) || limpio.includes(':')) return limpio
  return partirDominio(limpio, { allowPrivateDomains: true }).domain ?? limpio
}

function esIpv4(texto: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(texto)
}

function ipv4Interna(ip: string) {
  const [a, b, c] = ip.split('.').map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  )
}

function gruposIpv6(ip: string): number[] | null {
  let texto = ip.split('%')[0]
  const v4 = texto.match(/(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (v4) {
    const [a, b, c, d] = v4[1].split('.').map(Number)
    texto = texto.slice(0, -v4[1].length) + `${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const [cabeza, cola, ...resto] = texto.split('::')
  if (resto.length) return null
  const izquierda = cabeza ? cabeza.split(':') : []
  const derecha = cola === undefined ? [] : cola ? cola.split(':') : []
  const faltan = 8 - izquierda.length - derecha.length
  if (cola === undefined ? faltan !== 0 : faltan < 1) return null
  const grupos = [...izquierda, ...Array(cola === undefined ? 0 : faltan).fill('0'), ...derecha]
  const numeros = grupos.map((g) => (/^[0-9a-f]{1,4}$/i.test(g) ? parseInt(g, 16) : NaN))
  return numeros.some(Number.isNaN) ? null : numeros
}

function ipv6Interna(ip: string) {
  const g = gruposIpv6(ip)
  if (!g) return true
  const ceros = (desde: number, hasta: number) => g.slice(desde, hasta).every((x) => x === 0)
  const v4 = (alto: number, bajo: number) => `${alto >> 8}.${alto & 255}.${bajo >> 8}.${bajo & 255}`
  if (ceros(0, 7) && (g[7] === 0 || g[7] === 1)) return true
  if (ceros(0, 5) && g[5] === 0xffff) return ipv4Interna(v4(g[6], g[7]))
  if (g[0] === 0x64 && g[1] === 0xff9b && ceros(2, 6)) return ipv4Interna(v4(g[6], g[7]))
  if (g[0] === 0x2002) return ipv4Interna(v4(g[1], g[2]))
  return (
    (g[0] & 0xfe00) === 0xfc00 ||
    (g[0] & 0xffc0) === 0xfe80 ||
    (g[0] & 0xff00) === 0xff00 ||
    (g[0] === 0x2001 && g[1] === 0x0db8) ||
    ceros(0, 6)
  )
}

function ipInterna(ip: string) {
  return ip.includes(':') ? ipv6Interna(ip) : ipv4Interna(ip)
}

function nombreInterno(host: string) {
  return (
    !host.includes('.') ||
    host === 'localhost' ||
    /\.(localhost|local|internal|intranet|lan|home|corp|arpa)$/.test(host) ||
    host === 'metadata.google.internal'
  )
}

type Resolucion = { estado: 'ok'; ips: string[] } | { estado: 'no_resuelve' } | { estado: 'fallo' }

async function resolverConDeno(host: string): Promise<Resolucion | null> {
  if (typeof Deno.resolveDns !== 'function') return null
  const opciones = { signal: AbortSignal.timeout(3000) }
  const [a, aaaa] = await Promise.allSettled([
    Deno.resolveDns(host, 'A', opciones),
    Deno.resolveDns(host, 'AAAA', opciones),
  ])
  const ips = [a, aaaa].flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
  if (ips.length) return { estado: 'ok', ips }
  const noEncontrado = (r: PromiseSettledResult<string[]>) =>
    r.status === 'rejected' && r.reason instanceof Deno.errors.NotFound
  if (noEncontrado(a) && noEncontrado(aaaa)) return { estado: 'no_resuelve' }
  return null
}

async function resolverConDoh(host: string): Promise<Resolucion> {
  const consultas = await Promise.all(
    ['A', 'AAAA'].map(async (tipo) => {
      try {
        const res = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${tipo}`,
          { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(3000) },
        )
        if (!res.ok) return null
        const texto = await leerAcotado(res, 20_000)
        return texto ? (JSON.parse(texto) as { Status?: number; Answer?: { type: number; data: string }[] }) : null
      } catch {
        return null
      }
    }),
  )
  if (consultas.some((c) => !c)) return { estado: 'fallo' }
  if (consultas.some((c) => c!.Status === 3)) return { estado: 'no_resuelve' }
  if (consultas.some((c) => c!.Status !== 0)) return { estado: 'fallo' }
  const ips = consultas.flatMap((c) => (c!.Answer ?? []).filter((r) => r.type === 1 || r.type === 28).map((r) => r.data))
  return ips.length ? { estado: 'ok', ips } : { estado: 'no_resuelve' }
}

async function revisarHost(hostname: string): Promise<Fallo | null> {
  const host = sinCorchetes(hostname).replace(/\.$/, '')
  if (esIpv4(host) || host.includes(':')) return ipInterna(host) ? 'bloqueado' : null
  if (nombreInterno(host)) return 'bloqueado'

  let resolucion: Resolucion | null = null
  try {
    resolucion = await resolverConDeno(host)
  } catch {
    resolucion = null
  }
  if (!resolucion || resolucion.estado === 'no_resuelve') resolucion = await resolverConDoh(host)

  if (resolucion.estado === 'no_resuelve') return 'no_resuelve'
  if (resolucion.estado === 'fallo') return 'dns'
  return resolucion.ips.some(ipInterna) ? 'bloqueado' : null
}

function clasificarError(error: unknown): Fallo {
  const nombre = error instanceof Error ? error.name : ''
  const partes: string[] = []
  for (let actual: unknown = error; actual && partes.length < 4; actual = (actual as { cause?: unknown }).cause) {
    partes.push(actual instanceof Error ? actual.message : String(actual))
  }
  const mensaje = partes.join(' ').toLowerCase()
  if (nombre === 'TimeoutError' || nombre === 'AbortError' || mensaje.includes('timed out')) return 'tiempo'
  if (/certificate|tls|ssl|handshake/.test(mensaje)) return 'tls'
  if (/dns error|failed to lookup|name or service not known|no such host/.test(mensaje)) return 'dns'
  return 'conexion'
}

async function cerrar(res: Response) {
  try {
    await res.body?.cancel()
  } catch {
    /* el cuerpo ya estaba cerrado */
  }
}

async function leerAcotado(res: Response, maximo: number, cortar = false) {
  const reader = res.body?.getReader()
  if (!reader) return ''
  const partes: Uint8Array[] = []
  let total = 0
  try {
    while (total < maximo) {
      const { done, value } = await reader.read()
      if (done || !value) break
      partes.push(value)
      total += value.byteLength
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  if (total > maximo && !cortar) return null
  return new TextDecoder('utf-8', { fatal: false }).decode(unir(partes).slice(0, maximo))
}

function unir(partes: Uint8Array[]) {
  const total = partes.reduce((suma, parte) => suma + parte.byteLength, 0)
  const salida = new Uint8Array(total)
  let offset = 0
  for (const parte of partes) {
    salida.set(parte, offset)
    offset += parte.byteLength
  }
  return salida
}

type Recorrido = { cadena: string[]; fallo: Fallo | null; res: Response | null }

async function seguir(urlInicial: string): Promise<Recorrido> {
  const cadena: string[] = []
  const limite = Date.now() + TIEMPO_TOTAL_MS
  let actual: URL
  try {
    actual = new URL(urlInicial)
  } catch {
    return { cadena, fallo: 'protocolo', res: null }
  }

  for (let salto = 0; ; salto++) {
    actual.hash = ''
    actual.username = ''
    actual.password = ''
    cadena.push(actual.href)
    if (actual.protocol !== 'http:' && actual.protocol !== 'https:') {
      return { cadena, fallo: 'protocolo', res: null }
    }

    const prohibido = await revisarHost(actual.hostname)
    if (prohibido) return { cadena, fallo: prohibido, res: null }

    const restante = limite - Date.now()
    if (restante <= 0) return { cadena, fallo: 'tiempo', res: null }

    let res: Response
    try {
      res = await fetch(actual.href, {
        method: 'GET',
        redirect: 'manual',
        credentials: 'omit',
        signal: AbortSignal.timeout(Math.min(TIEMPO_SALTO_MS, restante)),
        headers: {
          'User-Agent': AGENTE,
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
        },
      })
    } catch (error) {
      return { cadena, fallo: clasificarError(error), res: null }
    }

    const loc = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null
    if (!loc) return { cadena, fallo: null, res }

    await cerrar(res)
    if (salto >= MAX_SALTOS) return { cadena, fallo: 'saltos', res: null }
    try {
      actual = new URL(loc, actual)
    } catch {
      return { cadena, fallo: 'protocolo', res: null }
    }
  }
}

function esArchivoPeligroso(tipo: string, disposicion: string, url: string) {
  const nombre = `${disposicion} ${new URL(url).pathname}`.toLowerCase()
  if (/\.(apk|exe|scr|bat|cmd|msi|dll|hta|lnk|iso|dmg|js|jse|vbs|vbe|ps1)(?:$|[?#\s"])/.test(nombre)) {
    return true
  }
  return (
    tipo.includes('android.package-archive') ||
    tipo.includes('x-msdownload') ||
    tipo.includes('x-msdos-program')
  )
}

function otroSitio(crudo: string | undefined, base: string) {
  if (!crudo) return null
  try {
    const destino = new URL(crudo, base)
    const origen = new URL(base)
    if (destino.protocol !== 'http:' && destino.protocol !== 'https:') return null
    if (destino.hostname === origen.hostname) return null
    return destino.hostname
  } catch {
    return null
  }
}

const PAGINA_VACIA = {
  titulo: null as string | null,
  formulario_clave: false,
  archivo_peligroso: false,
  meta_destino: null as string | null,
  formulario_otro: null as string | null,
  script_otro: null as string | null,
  iframe_otro: null as string | null,
  pide_datos: false,
}

async function mirarPagina(res: Response, url: string) {
  try {
    const tipo = (res.headers.get('content-type') ?? '').toLowerCase()
    const disposicion = res.headers.get('content-disposition') ?? ''
    const archivo = esArchivoPeligroso(tipo, disposicion, url)
    const esHtml = tipo.includes('html') || tipo.includes('text/plain')
    if (archivo || !esHtml) {
      await cerrar(res)
      return { ...PAGINA_VACIA, archivo_peligroso: archivo }
    }

    const crudo = (await leerAcotado(res, MAX_PAGINA, true)) ?? ''
    const lower = crudo.toLowerCase()
    const formulario =
      /type\s*=\s*["']?password\b/.test(lower) ||
      /name\s*=\s*["']?(password|passwd|clave|otp)\b/.test(lower)
    const titulo = crudo.match(/<title[^>]*>([^<]{0,140})/i)?.[1]?.replace(/\s+/g, ' ').trim() || null
    const action = crudo.match(/<form\b[^>]*\baction\s*=\s*["']([^"']+)/i)?.[1]
    const script = crudo.match(
      /(?:location\.(?:href|replace|assign)|window\.open)\s*\(\s*["'](https?:\/\/[^"']+)/i,
    )?.[1]
    const iframe = crudo.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)/i)?.[1]
    const visible = crudo.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ')
    const pide_datos = /\b(contrase[nñ]a|clave|cbu|cvu|cvv|n[uú]mero de tarjeta|dni)\b/i.test(visible)
    const metaCrudo =
      crudo.match(/http-equiv\s*=\s*["']refresh["'][^>]*content\s*=\s*["'][^"']*?\burl\s*=\s*([^"'\s>]+)/i)?.[1] ??
      crudo.match(/content\s*=\s*["'][^"']*?\burl\s*=\s*([^"'\s>]+)["'][^>]*http-equiv\s*=\s*["']refresh["']/i)?.[1] ??
      null
    let meta_destino: string | null = null
    if (metaCrudo) {
      try {
        const destino = new URL(metaCrudo, url)
        if (
          (destino.protocol === 'http:' || destino.protocol === 'https:') &&
          destino.hostname !== new URL(url).hostname
        ) {
          meta_destino = destino.href
        }
      } catch {
        meta_destino = null
      }
    }
    return {
      titulo,
      formulario_clave: formulario,
      archivo_peligroso: false,
      meta_destino,
      formulario_otro: otroSitio(action, url),
      script_otro: otroSitio(script, url),
      iframe_otro: otroSitio(iframe, url),
      pide_datos,
    }
  } catch {
    await cerrar(res)
    return PAGINA_VACIA
  }
}

function fraseEdad(dias: number | null) {
  if (dias == null) return null
  if (dias < 1) return 'Este sitio se registró hoy.'
  if (dias === 1) return 'Este sitio se registró ayer.'
  if (dias < 7) return `Este sitio se registró hace ${dias} días.`
  if (dias < 30) return `Este dominio tiene menos de un mes (${dias} días).`
  const meses = Math.round(dias / 30)
  if (dias < 365) return `Este dominio se registró hace ${meses} mes${meses === 1 ? '' : 'es'}.`
  const anios = Math.round(dias / 365)
  if (anios === 1) return 'Este dominio tiene alrededor de un año: es un dato a favor.'
  return `Este dominio lleva ${anios} años registrado: es un dato a favor.`
}

function fraseCert(dias: number | null) {
  if (dias == null) return null
  if (dias < 2) return 'El certificado se emitió hace muy poco, casi no tuvo tiempo de ser un sitio real.'
  if (dias < 14) return `El certificado se emitió hace ${dias} días.`
  return null
}

async function edadDominio(dominio: string) {
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(dominio)}`, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: 'application/rdap+json, application/json', 'User-Agent': AGENTE },
    })
    if (!res.ok) {
      await cerrar(res)
      return { edad_dias: null, registrado_en: null }
    }
    const texto = await leerAcotado(res, MAX_RDAP)
    if (!texto) return { edad_dias: null, registrado_en: null }
    const data = JSON.parse(texto)
    const eventos = Array.isArray(data.events) ? data.events : []
    const alta = eventos.find((e: { eventAction?: string }) => e.eventAction === 'registration')
    if (!alta?.eventDate) return { edad_dias: null, registrado_en: null }
    const fecha = new Date(alta.eventDate)
    const dias = Math.max(0, Math.floor((Date.now() - fecha.getTime()) / 86_400_000))
    return { edad_dias: dias, registrado_en: fecha.toISOString() }
  } catch {
    return { edad_dias: null, registrado_en: null }
  }
}

async function edadCertificado(dominio: string) {
  try {
    const res = await fetch(`https://crt.sh/?q=${encodeURIComponent(dominio)}&output=json`, {
      signal: AbortSignal.timeout(4000),
      headers: { 'User-Agent': AGENTE },
    })
    if (!res.ok) {
      await cerrar(res)
      return { cert_dias: null }
    }
    const texto = await leerAcotado(res, MAX_CRT)
    if (!texto) return { cert_dias: null }
    const filas = JSON.parse(texto) as { not_before?: string }[]
    if (!Array.isArray(filas) || filas.length === 0) return { cert_dias: null }
    const fechas = filas
      .map((f) => (f.not_before ? new Date(f.not_before.replace(' ', 'T') + 'Z') : null))
      .filter((d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()))
    if (fechas.length === 0) return { cert_dias: null }
    const masNueva = fechas.reduce((a, b) => (a > b ? a : b))
    const dias = Math.max(0, Math.floor((Date.now() - masNueva.getTime()) / 86_400_000))
    return { cert_dias: dias }
  } catch {
    return { cert_dias: null }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string' || url.length > 2048) {
      return json({ error: 'Falta la dirección' }, 400)
    }

    const partida = url.includes('://') ? url : `https://${url}`
    const { cadena, fallo, res } = await seguir(partida)
    const destino = cadena.at(-1) ?? null
    const dominio = (destino && dominioRegistrable(new URL(destino).hostname)) || null

    if (fallo || !res || !destino || !dominio) {
      if (res) await cerrar(res)
      const motivo = fallo ?? 'conexion'
      return json({ error: ERRORES[motivo], fallo: motivo, cadena, destino, dominio })
    }

    const juzgable = !esIpv4(dominio) && !dominio.includes(':')
    const [rdap, cert, pagina] = await Promise.all([
      juzgable ? edadDominio(dominio) : { edad_dias: null, registrado_en: null },
      juzgable ? edadCertificado(dominio) : { cert_dias: null },
      mirarPagina(res, destino),
    ])

    return json({
      destino,
      cadena,
      acortado: cadena.length > 1,
      dominio,
      registrado_en: rdap.registrado_en,
      edad_dias: rdap.edad_dias,
      cert_dias: cert.cert_dias,
      frase_edad: fraseEdad(rdap.edad_dias),
      frase_certificado: fraseCert(cert.cert_dias),
      titulo: pagina.titulo,
      formulario_clave: pagina.formulario_clave,
      archivo_peligroso: pagina.archivo_peligroso,
      meta_destino: pagina.meta_destino,
      formulario_otro: pagina.formulario_otro,
      script_otro: pagina.script_otro,
      iframe_otro: pagina.iframe_otro,
      pide_datos: pagina.pide_datos,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo enriquecer' }, 400)
  }
})
