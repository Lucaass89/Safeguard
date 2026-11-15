import { execFileSync } from 'node:child_process'
import { Buffer } from 'node:buffer'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium, devices } = require('playwright')

const AQUI = dirname(fileURLToPath(import.meta.url))
const FRONTEND = join(AQUI, '..', '..')
const CAPTURAS = join(FRONTEND, 'public', 'capturas')
const TIEMPOS = join(FRONTEND, 'src', 'data', 'recorridoApp.json')
const TRABAJO = join(tmpdir(), 'safeguard-recorrido')
const CAMARA = join(TRABAJO, 'camara.y4m')
const PDF = join(AQUI, 'aviso-cuenta.pdf')

const BASE = process.env.SG_BASE ?? 'http://localhost:5173'
const CORREO = process.env.SG_DEMO_CORREO ?? 'cuenta.demo@example.com'
const CLAVE = process.env.SG_DEMO_CLAVE
const TEMAS = (process.env.SG_TEMAS ?? 'oscuro,claro').split(',')
const ORDEN = ['qr', 'enlace', 'mensaje', 'pdf', 'faro', 'ingreso', 'perfil']
const ANCHO = 412
const ALTO = 839

function ffmpeg(...args) {
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
}

function duracion(archivo) {
  const salida = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', archivo])
  return Number.parseFloat(salida.toString())
}

function prepararCamara() {
  ffmpeg(
    '-loop', '1', '-i', join(AQUI, 'cartel-qr.png'), '-t', '9',
    '-vf', "crop=w=960:h=1280:x='min(960,max(0,if(lt(t,1.2),40*t,48+912*min(1,(t-1.2)/1.1))+10*sin(t*3)))':y='8*cos(t*2.5)',scale=480:640,fps=30,format=yuv420p",
    '-f', 'yuv4mpegpipe', CAMARA,
  )
}

async function ingresar(pagina, { lento = false } = {}) {
  await pagina.goto(`${BASE}/ingresar`, { waitUntil: 'networkidle' })
  const correo = pagina.getByLabel('Correo')
  const clave = pagina.getByLabel('Contraseña')
  if (lento) {
    await correo.pressSequentially(CORREO, { delay: 40 })
    await pagina.waitForTimeout(300)
    await clave.pressSequentially(CLAVE, { delay: 40 })
    await pagina.waitForTimeout(500)
  } else {
    await correo.fill(CORREO)
    await clave.fill(CLAVE)
  }
  await pagina.getByRole('button', { name: 'Ingresar', exact: true }).last().click()
  await pagina.waitForURL((url) => !url.pathname.startsWith('/ingresar'), { timeout: 20000 })
}

async function contexto(navegador, tema, sesion, idUsuario) {
  const telefono = devices['Pixel 7']
  const ctx = await navegador.newContext({
    ...telefono,
    viewport: { width: ANCHO, height: ALTO },
    deviceScaleFactor: 2,
    userAgent: `${telefono.userAgent} SafeGuardApp`,
    permissions: ['camera'],
    storageState: sesion,
  })
  await ctx.addInitScript(([t, id]) => {
    localStorage.setItem('sg-tema', t)
    if (id) sessionStorage.setItem('sg-recibido', id)
  }, [tema, idUsuario])
  return ctx
}

async function grabar(navegador, tema, capitulo, { sesion, idUsuario, preparar, pasos }) {
  const ctx = await contexto(navegador, tema, sesion, idUsuario)
  const pagina = await ctx.newPage()
  await preparar(pagina)
  await pagina.waitForTimeout(500)
  const carpeta = join(TRABAJO, tema, capitulo)
  rmSync(carpeta, { recursive: true, force: true })
  mkdirSync(carpeta, { recursive: true })
  const cdp = await ctx.newCDPSession(pagina)
  const marcas = []
  let grabando = true
  cdp.on('Page.screencastFrame', async (cuadro) => {
    if (grabando) {
      writeFileSync(join(carpeta, `${String(marcas.length).padStart(5, '0')}.jpg`), Buffer.from(cuadro.data, 'base64'))
      marcas.push(cuadro.metadata.timestamp)
    }
    await cdp.send('Page.screencastFrameAck', { sessionId: cuadro.sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: ANCHO * 2, maxHeight: ALTO * 2 })
  await pagina.waitForTimeout(400)
  await pasos(pagina)
  const fin = Date.now() / 1000
  grabando = false
  await cdp.send('Page.stopScreencast')
  await ctx.close()

  let lista = ''
  marcas.forEach((marca, i) => {
    lista += `file '${String(i).padStart(5, '0')}.jpg'\nduration ${((marcas[i + 1] ?? fin) - marca).toFixed(4)}\n`
  })
  lista += `file '${String(marcas.length - 1).padStart(5, '0')}.jpg'\n`
  writeFileSync(join(carpeta, 'lista.txt'), lista)
  const video = join(TRABAJO, tema, `${capitulo}.mp4`)
  ffmpeg(
    '-f', 'concat', '-safe', '0', '-i', join(carpeta, 'lista.txt'), '-an',
    '-vf', 'scale=540:1100:flags=lanczos,fps=30,format=yuv420p',
    '-c:v', 'libx264', '-profile:v', 'high', '-crf', '25', '-preset', 'slow', '-g', '60', video,
  )
  console.log(`${tema} · ${capitulo}: ${duracion(video).toFixed(1)} s`)
}

async function revisarEnlace(pagina, direccion, lento) {
  const campo = pagina.locator('.slapp-entrada textarea')
  if (lento) await campo.pressSequentially(direccion, { delay: 50 })
  else await campo.fill(direccion)
  if (lento) await pagina.waitForTimeout(500)
  await pagina.getByRole('button', { name: 'Revisar' }).click()
  await pagina.getByText('Peligroso').first().waitFor({ timeout: 25000 })
}

function bajar(pagina, cuanto) {
  return pagina.evaluate((y) => window.scrollBy({ top: y, behavior: 'smooth' }), cuanto)
}

function mostrarUltimaPregunta(pagina) {
  return pagina
    .locator('.faro .faro-quien')
    .nth(-2)
    .evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' }))
}

function capitulos(sesion, idUsuario) {
  const logueado = { sesion, idUsuario }
  return {
    qr: {
      ...logueado,
      preparar: async (p) => {
        await p.goto(`${BASE}/safelink`, { waitUntil: 'networkidle' })
        await p.getByRole('button', { name: 'QR', exact: true }).click()
      },
      pasos: async (p) => {
        await p.waitForTimeout(800)
        await p.getByText('Abrir la cámara').click()
        await p.waitForURL(/\/safelink\/qr/)
        await p.waitForTimeout(900)
        await p.getByRole('button', { name: 'Usar la cámara' }).click()
        await p.getByText('Peligroso').first().waitFor({ timeout: 25000 })
        await p.waitForTimeout(1800)
        await bajar(p, 320)
        await p.waitForTimeout(2200)
      },
    },
    enlace: {
      ...logueado,
      preparar: (p) => p.goto(`${BASE}/safelink`, { waitUntil: 'networkidle' }),
      pasos: async (p) => {
        await p.waitForTimeout(700)
        await revisarEnlace(p, 'https://bna-acceso.com/clave', true)
        await p.waitForTimeout(2600)
      },
    },
    mensaje: {
      ...logueado,
      preparar: async (p) => {
        await p.goto(`${BASE}/safelink`, { waitUntil: 'networkidle' })
        await p.getByRole('button', { name: 'Mensaje', exact: true }).click()
      },
      pasos: async (p) => {
        await p.waitForTimeout(600)
        await p
          .locator('.slapp-entrada textarea')
          .pressSequentially('Hola ma, cambié de número, agendame este. Necesito que me transfieras $85.000 urgente.', { delay: 30 })
        await p.waitForTimeout(500)
        await p.getByRole('button', { name: 'Revisar' }).click()
        await p.getByText('Peligroso').first().waitFor({ timeout: 25000 })
        await p.waitForTimeout(2600)
      },
    },
    pdf: {
      ...logueado,
      preparar: async (p) => {
        await p.goto(`${BASE}/safelink`, { waitUntil: 'networkidle' })
        await p.getByRole('button', { name: 'PDF', exact: true }).click()
      },
      pasos: async (p) => {
        await p.waitForTimeout(800)
        const [selector] = await Promise.all([
          p.waitForEvent('filechooser'),
          p.getByRole('button', { name: 'Elegir archivo' }).click(),
        ])
        await selector.setFiles(PDF)
        await p.waitForTimeout(900)
        await p.getByRole('button', { name: 'Revisar' }).click()
        await p.getByText('Peligroso').first().waitFor({ timeout: 25000 })
        await p.waitForTimeout(1800)
        await bajar(p, 300)
        await p.waitForTimeout(2000)
      },
    },
    faro: {
      ...logueado,
      preparar: async (p) => {
        await p.goto(`${BASE}/safelink`, { waitUntil: 'networkidle' })
        await revisarEnlace(p, 'https://bna-acceso.com/clave', false)
      },
      pasos: async (p) => {
        await p.waitForTimeout(900)
        await p.getByRole('button', { name: /Faro/ }).click()
        await p.waitForTimeout(1200)
        await p.getByRole('button', { name: '¿Por qué dio este resultado?' }).click()
        await p.waitForTimeout(600)
        await mostrarUltimaPregunta(p)
        await p.waitForTimeout(2600)
        await p.getByRole('button', { name: '¿Qué pasa si ya hice clic?' }).click()
        await p.waitForTimeout(600)
        await mostrarUltimaPregunta(p)
        await p.waitForTimeout(3200)
      },
    },
    ingreso: {
      sesion: undefined,
      idUsuario: null,
      preparar: (p) => p.goto(`${BASE}/ingresar`, { waitUntil: 'networkidle' }),
      pasos: async (p) => {
        await p.waitForTimeout(1600)
        await p.getByRole('tab', { name: 'Crear cuenta' }).click()
        await p.waitForTimeout(1600)
        await p.getByRole('tab', { name: 'Ya tengo cuenta' }).click()
        await p.waitForTimeout(700)
        await p.getByLabel('Correo').pressSequentially(CORREO, { delay: 40 })
        await p.waitForTimeout(300)
        await p.getByLabel('Contraseña').pressSequentially(CLAVE, { delay: 40 })
        await p.waitForTimeout(500)
        await p.getByRole('button', { name: 'Ingresar', exact: true }).last().click()
        await p.getByRole('button', { name: 'Continuar' }).waitFor({ timeout: 20000 })
        await p.waitForTimeout(1800)
        await p.getByRole('button', { name: 'Continuar' }).click()
        await p.waitForTimeout(2200)
      },
    },
    perfil: {
      ...logueado,
      preparar: (p) => p.goto(`${BASE}/perfil`, { waitUntil: 'networkidle' }),
      pasos: async (p) => {
        await p.waitForTimeout(1500)
        for (let i = 0; i < 3; i += 1) {
          await bajar(p, 380)
          await p.waitForTimeout(1400)
        }
        await p.waitForTimeout(900)
      },
    },
  }
}

async function sesionDe(navegador, tema) {
  const ctx = await contexto(navegador, tema, undefined, null)
  const pagina = await ctx.newPage()
  await ingresar(pagina)
  const idUsuario = await pagina.evaluate(() => {
    const clave = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
    return clave ? JSON.parse(localStorage.getItem(clave))?.user?.id ?? null : null
  })
  const sesion = join(TRABAJO, `sesion-${tema}.json`)
  await ctx.storageState({ path: sesion })
  await ctx.close()
  return { sesion, idUsuario }
}

function unir(tema, largos, inicios) {
  const entradas = []
  const filtros = []
  ORDEN.forEach((capitulo, i) => {
    entradas.push('-i', join(TRABAJO, tema, `${capitulo}.mp4`))
    filtros.push(`[${i}:v]tpad=stop_mode=clone:stop_duration=2,trim=duration=${largos[capitulo]},setpts=PTS-STARTPTS[v${i}]`)
  })
  filtros.push(`${ORDEN.map((_, i) => `[v${i}]`).join('')}concat=n=${ORDEN.length}:v=1:a=0,fps=30,format=yuv420p[salida]`)
  const video = join(CAPTURAS, `recorrido-${tema}.mp4`)
  ffmpeg(
    ...entradas, '-filter_complex', filtros.join(';'), '-map', '[salida]', '-an',
    '-c:v', 'libx264', '-profile:v', 'high', '-crf', '25', '-preset', 'slow', '-g', '90',
    '-force_key_frames', ORDEN.map((c) => inicios[c]).join(','), '-movflags', '+faststart', video,
  )
  const foto = join(TRABAJO, `foto-${tema}.png`)
  ffmpeg('-ss', String(Math.max(inicios.enlace - 0.4, 0)), '-i', video, '-frames:v', '1', '-update', '1', foto)
  ffmpeg('-i', foto, '-c:v', 'libwebp', '-quality', '82', join(CAPTURAS, `recorrido-${tema}.webp`))
  console.log(`recorrido-${tema}.mp4: ${duracion(video).toFixed(1)} s`)
}

async function principal() {
  if (!CLAVE) {
    console.error('Falta SG_DEMO_CLAVE: la contraseña de la cuenta de prueba no se guarda en el repositorio.')
    process.exit(1)
  }
  mkdirSync(TRABAJO, { recursive: true })
  prepararCamara()
  const navegador = await chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-video-capture=${CAMARA}`],
  })
  for (const tema of TEMAS) {
    const { sesion, idUsuario } = await sesionDe(navegador, tema)
    const lista = capitulos(sesion, idUsuario)
    for (const capitulo of ORDEN) await grabar(navegador, tema, capitulo, lista[capitulo])
  }
  await navegador.close()

  const largos = Object.fromEntries(
    ORDEN.map((c) => [c, Math.ceil(Math.max(...TEMAS.map((t) => duracion(join(TRABAJO, t, `${c}.mp4`)))) * 10) / 10]),
  )
  const inicios = {}
  let total = 0
  for (const capitulo of ORDEN) {
    inicios[capitulo] = Math.round(total * 100) / 100
    total += largos[capitulo]
  }
  for (const tema of TEMAS) unir(tema, largos, inicios)
  writeFileSync(TIEMPOS, `${JSON.stringify({ duracion: Math.round(total * 100) / 100, inicios }, null, 2)}\n`)
  console.log(`Inicios guardados en ${TIEMPOS}`)
  console.log(readFileSync(TIEMPOS, 'utf8'))
}

principal().catch((error) => {
  console.error(error)
  process.exit(1)
})
