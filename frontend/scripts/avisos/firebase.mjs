import { createSign } from 'node:crypto'

export async function tokenDeAcceso(cuenta) {
  const ahora = Math.floor(Date.now() / 1000)
  const parte = (objeto) => Buffer.from(JSON.stringify(objeto)).toString('base64url')
  const sinFirmar = `${parte({ alg: 'RS256', typ: 'JWT' })}.${parte({
    iss: cuenta.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: ahora,
    exp: ahora + 3600,
  })}`
  const firma = createSign('RSA-SHA256').update(sinFirmar).sign(cuenta.private_key).toString('base64url')
  const respuesta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${sinFirmar}.${firma}`,
    }),
  })
  if (!respuesta.ok) throw new Error(`Firebase no dio acceso (${respuesta.status})`)
  return (await respuesta.json()).access_token
}

export async function enviarATema(cuenta, tema, aviso, { validar = false } = {}) {
  const acceso = await tokenDeAcceso(cuenta)
  const respuesta = await fetch(`https://fcm.googleapis.com/v1/projects/${cuenta.project_id}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${acceso}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      validate_only: validar,
      message: {
        topic: tema,
        notification: { title: aviso.titulo, body: aviso.texto },
        data: { titulo: aviso.titulo, texto: aviso.texto, ruta: aviso.ruta ?? '/' },
        android: { notification: { channel_id: 'avisos' } },
      },
    }),
  })
  if (!respuesta.ok) throw new Error(`Firebase respondió ${respuesta.status}: ${await respuesta.text()}`)
}
