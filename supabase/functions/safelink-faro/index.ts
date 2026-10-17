import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PELIGROSO = [
  /\b(abrilo|abrila|abrelo|abrela|abrir(lo|la|los|las)?|abri el|abri la|abri este)\b/,
  /\b(descargalo|descargala|descargar(lo|la)?|descarga el|bajalo|baja el archivo)\b/,
  /\b(responde(le|les|lo)?|responder(le|les)?|contestale|contestar(le|les)?)\b/,
  /\b(pagalo|pagala|pagar|transferi|hace la transferencia|manda la plata)\b/,
  /\b(carga|cargar|ingresa|ingresar|escribi|pone|poner|pongas|manda|envia)\b[^.]{0,40}\b(clave|claves|dato|datos|codigo|cbu|tarjeta|contrasena)\b/,
  /\b(hace|hacer) (clic|click)\b/,
  /\b(entra|entre) (al|a ese|en el enlace|en el link|al enlace|al link)\b/,
  /\b(segui|seguir) (el mensaje|el enlace|ese enlace|ese link|ese mensaje)\b/,
  /\b(podes|puede|conviene|esta bien|es seguro|dale)\b[^.]{0,30}\b(abrir|abrilo|descarg|respond|pagar|entrar|seguir|hacer clic)\b/,
  /\b(es seguro|esta todo bien|podes confiar|no es peligroso|no hay riesgo)\b/,
]

const DUDOSO = [
  /\b(segui|seguir) (el mensaje|el enlace|ese mensaje|ese enlace)\b/,
  /\b(hace|hacer) lo que (dice|pide)\b/,
  /\b(abrilo|abrelo|abrir(lo|la)?|hace clic|hacer clic|entra al enlace|entra al link)\b/,
  /\b(podes|puede|conviene|esta bien)\b[^.]{0,30}\b(seguir|abrir|entrar|hacer clic)\b/,
]

const SEGURO = [
  /\b(pone|poner|pongas|ingresa|ingresar|carga|cargar|escribi|manda|envia|pasa)\b[^.]{0,40}\b(clave|codigo|contrasena|cbu|tarjeta)\b/,
  /\b(paga|pagar|pagalo|transferi)\b[^.]{0,40}\b(enlace|link|mensaje|ahi|aca)\b/,
  /\b(podes|puede)\b[^.]{0,40}\b(pagar|poner la clave|ingresar la clave|cargar los datos)\b/,
]

type Nivel = 'Seguro' | 'Dudoso' | 'Peligroso'
type Modo = 'simple' | 'tecnico' | 'avanzado'
type Caso = { url: string; dominio: string; puntuacion: number | null; canal: string }
type Turno = { rol: 'faro' | 'vos'; texto: string }

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function plano(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function recortar(texto: string, tope: number) {
  return texto
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\bwww\.\S+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, tope)
    .trim()
}

function sinEmojis(texto: string) {
  return texto
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\uFE0F\u200D]/g, '')
    .replace(/[*_`#]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function oraciones(texto: string) {
  return texto
    .split(/(?<=[.!?])\s+/)
    .map((parte) => parte.trim())
    .filter(Boolean)
}

function afirma(frase: string, patron: RegExp) {
  const re = new RegExp(patron.source, 'g')
  let hallazgo = re.exec(frase)
  while (hallazgo) {
    const antes = frase.slice(Math.max(0, hallazgo.index - 42), hallazgo.index)
    const tramo = antes.split(/\bpero\b/).pop() ?? antes
    if (!/\b(no|nunca|ni|sin|jamas|tampoco)\b/.test(tramo)) return true
    hallazgo = re.exec(frase)
  }
  return false
}

function contradice(nivel: Nivel, texto: string) {
  const patrones = nivel === 'Peligroso' ? PELIGROSO : nivel === 'Dudoso' ? DUDOSO : SEGURO
  return oraciones(plano(sinEmojis(texto))).some((frase) => patrones.some((patron) => afirma(frase, patron)))
}

function leer(body: unknown) {
  if (!body || typeof body !== 'object') return null
  const datos = body as Record<string, unknown>
  const nivel = datos.nivel
  if (nivel !== 'Seguro' && nivel !== 'Dudoso' && nivel !== 'Peligroso') return null

  const motivos = Array.isArray(datos.motivos)
    ? datos.motivos
        .filter((motivo): motivo is string => typeof motivo === 'string')
        .map((motivo) => recortar(motivo, 240))
        .filter(Boolean)
        .slice(0, 8)
    : []

  const pregunta = typeof datos.pregunta === 'string' ? recortar(datos.pregunta, 600) : ''
  if (!pregunta || !/[a-z0-9]/i.test(plano(pregunta))) return null

  const modo: Modo = datos.modo === 'tecnico' || datos.modo === 'avanzado' ? datos.modo : 'simple'
  const crudo = datos.caso && typeof datos.caso === 'object' ? datos.caso as Record<string, unknown> : {}
  const url = typeof crudo.url === 'string' ? crudo.url.replace(/\s+/g, ' ').trim().slice(0, 300) : ''
  const dominio = typeof crudo.dominio === 'string' ? recortar(crudo.dominio, 120) : ''
  const canal = crudo.canal === 'enlace' || crudo.canal === 'whatsapp' || crudo.canal === 'pdf' || crudo.canal === 'correo'
    ? crudo.canal
    : ''
  const puntuacion = typeof crudo.puntuacion === 'number' && Number.isFinite(crudo.puntuacion)
    ? Math.max(0, Math.min(100, Math.round(crudo.puntuacion)))
    : null
  const caso: Caso = { url, dominio, puntuacion, canal }

  const turnos = Array.isArray(datos.turnos)
    ? datos.turnos.slice(-6).flatMap((turno) => {
        if (!turno || typeof turno !== 'object') return []
        const fila = turno as { rol?: unknown; texto?: unknown }
        const rol = fila.rol === 'vos' ? 'vos' : fila.rol === 'faro' ? 'faro' : ''
        const texto = typeof fila.texto === 'string' ? recortar(fila.texto, 700) : ''
        if (!rol || !texto) return []
        return [{ rol, texto }] satisfies Turno[]
      })
    : []

  return { nivel, motivos, pregunta, turnos, modo, caso }
}

function forma(modo: Modo) {
  if (modo === 'tecnico') {
    return 'Forma técnica: nombrá las señales con las palabras del caso (dominio, acortador, marca, SPF, puntaje). Hasta seis oraciones, sin emojis.'
  }
  if (modo === 'avanzado') {
    return 'Forma avanzada: explicá cómo se suman las señales, qué prueba este caso y qué no prueba. Podés numerar las señales. Hasta ocho oraciones, sin emojis.'
  }
  return 'Forma simple: palabras de todos los días, sin jerga. Hasta cuatro oraciones, sin emojis y sin listas.'
}

function instrucciones(nivel: Nivel, motivos: string[], modo: Modo, caso: Caso) {
  const lista = motivos.length > 0 ? motivos.map((motivo) => `- ${motivo}`).join('\n') : '- No hay un motivo extra en este caso.'
  const ficha = [
    caso.dominio ? `Dominio: ${caso.dominio}` : 'Dominio: no informado',
    caso.url ? `Entrada revisada: ${caso.url}` : 'Entrada revisada: no informada',
    caso.canal ? `Canal: ${caso.canal}` : 'Canal: no informado',
    caso.puntuacion == null ? 'Puntaje: no informado' : `Puntaje: ${caso.puntuacion}`,
  ].join('\n')
  return [
    'Sos Faro, el robot de SafeGuard. Analizás el caso de SafeLink que ya está decidido y respondés la pregunta que te hagan sobre ese caso.',
    'Podés explicar, resumir, dar un ejemplo parecido y contestar preguntas de hábito, de señales o de qué hacer ahora.',
    'Si la pregunta se va del caso, respondé en una oración y volvé a este resultado. No cambies el veredicto. No sanciona ni expongas a nadie.',
    'No te llega el mensaje de WhatsApp, el cuerpo del correo ni el PDF. No los pidas. Usá solo el caso de abajo.',
    'Un ejemplo es un caso parecido y genérico, sin pasos para armar un engaño.',
    'Un resumen es corto: qué se revisó, el color y la señal principal.',
    'Si piden analizar el caso, recorré las señales y cerrá con qué no hacer.',
    forma(modo),
    'Si el nivel es Peligroso, no digas que se abra, se descargue, se responda, se pague ni que se carguen claves o datos. Decí que no siga el mensaje, que no cargue claves ni datos, y que avise por otro canal.',
    'Si el nivel es Dudoso, no digas que se siga el mensaje.',
    'Si el nivel es Seguro, podés decir que no hubo señales fuertes, pero una clave, un código o un pago igual no se hacen desde un enlace que llegó en un mensaje.',
    `Nivel: ${nivel}`,
    'Caso:',
    ficha,
    'Motivos:',
    lista,
  ].join('\n')
}

function claveGemini() {
  return ['GEMINI_API_KEY', 'Gemini API Key', 'GEMINI_KEY', 'GOOGLE_API_KEY']
    .map((nombre) => Deno.env.get(nombre)?.trim() ?? '')
    .find(Boolean) ?? ''
}

function tope(modo: Modo) {
  if (modo === 'avanzado') return 8
  if (modo === 'tecnico') return 6
  return 4
}

async function pedirGemini(nivel: Nivel, motivos: string[], pregunta: string, turnos: Turno[], modo: Modo, caso: Caso) {
  const clave = claveGemini()
  if (!clave) return null

  const preferido = Deno.env.get('GEMINI_MODEL') || 'gemini-3.8-flash'
  const modelos = [...new Set([preferido, 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'])]
  const contents = [
    ...turnos.map((turno) => ({
      role: turno.rol === 'vos' ? 'user' : 'model',
      parts: [{ text: turno.texto }],
    })),
    { role: 'user', parts: [{ text: pregunta }] },
  ]
  const cuerpo = {
    systemInstruction: { parts: [{ text: instrucciones(nivel, motivos, modo, caso) }] },
    contents,
    generationConfig: { maxOutputTokens: modo === 'avanzado' ? 700 : 500 },
  }

  for (const modelo of modelos) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(20000),
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': clave,
        },
        body: JSON.stringify(cuerpo),
      },
    )
    if (res.status === 404) continue
    if (!res.ok) {
      const detalle = await res.text()
      console.log('faro-modelo', res.status, detalle.replace(/AIza[0-9A-Za-z_-]+/g, '').slice(0, 180))
      return null
    }
    const data = await res.json()
    const partes = data?.candidates?.[0]?.content?.parts
    if (!Array.isArray(partes)) return null
    const texto = sinEmojis(
      partes
        .filter((parte: { thought?: boolean; text?: string }) => !parte?.thought && typeof parte?.text === 'string')
        .map((parte: { text?: string }) => parte.text ?? '')
        .join(' '),
    )
    const corta = oraciones(texto).slice(0, tope(modo)).join(' ')
    if (!corta || contradice(nivel, corta)) return null
    return corta
  }

  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ respuesta: null }, 405)

  const autorizacion = req.headers.get('Authorization')
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
  if (!autorizacion || !url || !anon) return json({ respuesta: null }, 401)

  const comoUsuario = createClient(url, anon, {
    global: { headers: { Authorization: autorizacion } },
  })
  const { data, error } = await comoUsuario.auth.getUser()
  if (error || !data.user) return json({ respuesta: null }, 401)

  try {
    const consulta = leer(await req.json())
    if (!consulta) return json({ respuesta: null }, 400)
    const respuesta = await pedirGemini(
      consulta.nivel,
      consulta.motivos,
      consulta.pregunta,
      consulta.turnos,
      consulta.modo,
      consulta.caso,
    )
    return json({ respuesta })
  } catch {
    return json({ respuesta: null })
  }
})
