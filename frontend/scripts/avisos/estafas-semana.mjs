import { execFileSync } from 'node:child_process'
import { createSign } from 'node:crypto'
import process from 'node:process'
import { avisoEstafas, fechaDeEdicion, hayEdicionNueva } from '../../src/lib/avisoEstafas.js'
import { EDICION } from '../../src/lib/estafasSemana.js'

const ARCHIVO = 'frontend/src/lib/estafasSemana.js'

function anterior() {
  try {
    return fechaDeEdicion(execFileSync('git', ['show', `HEAD^:${ARCHIVO}`], { encoding: 'utf8' }))
  } catch {
    return null
  }
}

async function tokenDeAcceso(cuenta) {
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

const crudo = process.env.FCM_SERVICE_ACCOUNT
const prueba = process.env.PRUEBA === 'true'
if (!crudo) {
  console.log('Falta el secreto FCM_SERVICE_ACCOUNT: no se manda el aviso.')
  process.exit(prueba ? 1 : 0)
}

if (!prueba && !hayEdicionNueva(anterior(), EDICION.fecha)) {
  console.log('La edición no cambió: no se manda el aviso.')
  process.exit(0)
}

const aviso = avisoEstafas(EDICION)
if (!aviso) {
  console.log('La edición no tiene estafas: no se manda el aviso.')
  process.exit(0)
}

const cuenta = JSON.parse(crudo)
const acceso = await tokenDeAcceso(cuenta)
const respuesta = await fetch(`https://fcm.googleapis.com/v1/projects/${cuenta.project_id}/messages:send`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${acceso}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    validate_only: prueba,
    message: {
      topic: 'estafas',
      notification: { title: aviso.titulo, body: aviso.texto },
      data: { titulo: aviso.titulo, texto: aviso.texto, ruta: aviso.ruta },
      android: { notification: { channel_id: 'avisos' } },
    },
  }),
})
if (!respuesta.ok) {
  console.error(`Firebase respondió ${respuesta.status}: ${await respuesta.text()}`)
  process.exit(1)
}
console.log(prueba ? `Prueba correcta: Firebase aceptó la clave y el aviso, sin mandarlo (${aviso.texto})` : `Aviso enviado: ${aviso.texto}`)
