import process from 'node:process'
import { armarAnuncio } from '../../src/lib/anuncio.js'
import { enviarATema } from './firebase.mjs'

const crudo = process.env.FCM_SERVICE_ACCOUNT
if (!crudo) {
  console.error('Falta el secreto FCM_SERVICE_ACCOUNT.')
  process.exit(1)
}

const armado = armarAnuncio({
  titulo: process.env.TITULO,
  texto: process.env.TEXTO,
  tema: process.env.TEMA,
  ruta: process.env.RUTA,
})
if (armado.error) {
  console.error(armado.error)
  process.exit(1)
}

await enviarATema(JSON.parse(crudo), armado.tema, armado.aviso)
console.log(`Aviso enviado al tema ${armado.tema}: ${armado.aviso.titulo} · ${armado.aviso.texto}`)
