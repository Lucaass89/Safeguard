import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { PASOS_INSTALAR } from '../../src/lib/instalarExtension.js'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const AQUI = dirname(fileURLToPath(import.meta.url))
const FRONTEND = join(AQUI, '..', '..')
const CAPTURAS = join(FRONTEND, 'public', 'capturas')
const TIEMPOS = join(FRONTEND, 'src', 'data', 'instalarExtension.json')
const MANIFIESTO = join(FRONTEND, '..', 'extension', 'manifest.json')
const TRABAJO = join(tmpdir(), 'safeguard-instalar-extension')
const TEMAS = (process.env.SG_TEMAS ?? 'claro,oscuro').split(',')
const CUADROS = 25
const FOTO = 18.4

function ffmpeg(...args) {
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
}

const version = JSON.parse(readFileSync(MANIFIESTO, 'utf8')).version
const pasos = PASOS_INSTALAR.map(({ id, titulo, texto }) => ({ id, titulo, texto }))
const navegador = await chromium.launch()
let tiempos = null

for (const tema of TEMAS) {
  const carpeta = join(TRABAJO, tema)
  rmSync(carpeta, { recursive: true, force: true })
  mkdirSync(carpeta, { recursive: true })

  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } })
  await pagina.goto(pathToFileURL(join(AQUI, 'escena.html')).href, { waitUntil: 'networkidle' })
  await pagina.evaluate(() => document.fonts.ready)
  tiempos = await pagina.evaluate((datos) => window.iniciar(datos), { tema, version, pasos })

  const total = Math.round(tiempos.duracion * CUADROS)
  for (let cuadro = 0; cuadro < total; cuadro += 1) {
    await pagina.evaluate((t) => window.render(t), cuadro / CUADROS)
    await pagina.screenshot({ path: join(carpeta, `${String(cuadro).padStart(5, '0')}.png`) })
  }
  await pagina.close()

  const video = join(CAPTURAS, `instalar-extension-${tema}.mp4`)
  ffmpeg(
    '-framerate', String(CUADROS), '-i', join(carpeta, '%05d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', video,
  )
  const foto = join(carpeta, 'foto.png')
  ffmpeg('-ss', String(FOTO), '-i', video, '-frames:v', '1', '-update', '1', foto)
  ffmpeg('-i', foto, '-c:v', 'libwebp', '-quality', '80', join(CAPTURAS, `instalar-extension-${tema}.webp`))
  console.log(`listo: ${video}`)
}

await navegador.close()
writeFileSync(TIEMPOS, `${JSON.stringify({ duracion: tiempos.duracion, inicios: tiempos.inicios }, null, 2)}\n`)
