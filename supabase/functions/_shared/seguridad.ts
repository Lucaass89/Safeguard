const ORIGENES = new Set([
  'https://safeguard-ar.vercel.app',
  'https://safeguardd.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
])

const EXTENSION = /^chrome-extension:\/\/[a-p]{32}$/

export function origenPermitido(origen: string | null) {
  if (!origen) return null
  if (ORIGENES.has(origen) || EXTENSION.test(origen)) return origen
  return null
}

export function conCors(manejar: (req: Request) => Response | Promise<Response>) {
  return async (req: Request) => {
    const origen = origenPermitido(req.headers.get('Origin'))
    const respuesta = await manejar(req)
    const cabeceras = new Headers(respuesta.headers)
    cabeceras.delete('Access-Control-Allow-Origin')
    if (origen) cabeceras.set('Access-Control-Allow-Origin', origen)
    cabeceras.append('Vary', 'Origin')
    return new Response(respuesta.body, {
      status: respuesta.status,
      statusText: respuesta.statusText,
      headers: cabeceras,
    })
  }
}

export function ipDe(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() ?? ''
  return /^[0-9a-fA-F:.]{3,64}$/.test(ip) ? ip : ''
}

type ClienteRpc = {
  rpc: (nombre: string, argumentos: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>
}

export async function pasaLimite(cliente: ClienteRpc, clave: string, maximo: number, segundos: number) {
  const { data, error } = await cliente.rpc('limite_pasar', { p_clave: clave, p_max: maximo, p_segundos: segundos })
  if (error) return true
  return data === true
}

export function demasiados(mensaje = 'Hiciste muchas consultas seguidas. Esperá unos minutos y volvé a probar.') {
  return new Response(JSON.stringify({ error: mensaje, motivo: 'limite' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': '600' },
  })
}
