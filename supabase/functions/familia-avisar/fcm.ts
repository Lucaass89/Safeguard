type Cuenta = { client_email: string; private_key: string; project_id: string }

type Aviso = { titulo: string; texto: string; ruta?: string }

export function cuentaDeServicio(): Cuenta | null {
  const crudo = Deno.env.get('FCM_SERVICE_ACCOUNT') ?? ''
  if (!crudo) return null
  try {
    const cuenta = JSON.parse(crudo)
    if (!cuenta?.client_email || !cuenta?.private_key || !cuenta?.project_id) return null
    return cuenta
  } catch {
    return null
  }
}

function base64url(datos: Uint8Array | string) {
  const bytes = typeof datos === 'string' ? new TextEncoder().encode(datos) : datos
  let binario = ''
  for (const byte of bytes) binario += String.fromCharCode(byte)
  return btoa(binario).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

async function tokenDeAcceso(cuenta: Cuenta) {
  const ahora = Math.floor(Date.now() / 1000)
  const cabecera = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const cuerpo = base64url(
    JSON.stringify({
      iss: cuenta.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: ahora,
      exp: ahora + 3600,
    }),
  )
  const pem = cuenta.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const der = Uint8Array.from(atob(pem), (letra) => letra.charCodeAt(0))
  const clave = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const firma = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', clave, new TextEncoder().encode(`${cabecera}.${cuerpo}`))
  const respuesta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${cabecera}.${cuerpo}.${base64url(new Uint8Array(firma))}`,
    }),
  })
  if (!respuesta.ok) throw new Error('Firebase no dio acceso')
  const datos = await respuesta.json()
  return datos.access_token as string
}

export async function enviarAvisos(cuenta: Cuenta, tokens: string[], aviso: Aviso) {
  if (tokens.length === 0) return { enviados: 0, invalidos: [] as string[] }
  const acceso = await tokenDeAcceso(cuenta)
  const invalidos: string[] = []
  let enviados = 0

  for (const token of tokens) {
    const respuesta = await fetch(`https://fcm.googleapis.com/v1/projects/${cuenta.project_id}/messages:send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${acceso}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: aviso.titulo, body: aviso.texto },
          data: { titulo: aviso.titulo, texto: aviso.texto, ruta: aviso.ruta ?? '/' },
          android: { priority: 'high', notification: { channel_id: 'avisos' } },
        },
      }),
    })
    if (respuesta.ok) {
      enviados += 1
      continue
    }
    const error = await respuesta.json().catch(() => null)
    const codigo = JSON.stringify(error ?? {})
    if (respuesta.status === 404 || codigo.includes('UNREGISTERED') || codigo.includes('INVALID_ARGUMENT')) {
      invalidos.push(token)
    }
  }

  return { enviados, invalidos }
}
