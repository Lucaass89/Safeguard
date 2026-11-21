import { execFileSync } from 'node:child_process'
import process from 'node:process'
import { avisoEstafas, fechaDeEdicion, hayEdicionNueva } from '../../src/lib/avisoEstafas.js'
import { EDICION } from '../../src/lib/estafasSemana.js'
import { enviarATema } from './firebase.mjs'

const ARCHIVO = 'frontend/src/lib/estafasSemana.js'

function anterior() {
  try {
    return fechaDeEdicion(execFileSync('git', ['show', `HEAD^:${ARCHIVO}`], { encoding: 'utf8' }))
  } catch {
    return null
  }
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
await enviarATema(cuenta, 'estafas', aviso, { validar: prueba })
console.log(prueba ? `Prueba correcta: Firebase aceptó la clave y el aviso, sin mandarlo (${aviso.texto})` : `Aviso enviado: ${aviso.texto}`)
