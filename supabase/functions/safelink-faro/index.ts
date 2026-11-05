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

// En ningún nivel se dice que un sitio es seguro o que algo está garantizado.
const NUNCA = [/\bes seguro\b/, /\bgarantizad[oa]s?\b/, /\bdudoso\b/]

type Nivel = 'Seguro' | 'Dudoso' | 'Peligroso'
type Modo = 'simple' | 'tecnico' | 'avanzado'
type Caso = { url: string; dominio: string; puntuacion: number | null; canal: string; sinContenido: boolean }
type Turno = { rol: 'faro' | 'vos'; texto: string }
type Senal = { id: string; grupo: string; fuerza: string; peso: number; texto: string }
type VirusTotal = { maliciosos: number; total: number } | null
type Umbrales = { precaucion: number; peligroso: number }

const TITULOS = ['Peligroso', 'Precaución', 'Seguro', 'Sin señales de riesgo']
const TITULO_DE: Record<Nivel, string> = { Peligroso: 'Peligroso', Dudoso: 'Precaución', Seguro: 'Sin señales de riesgo' }
const NIVEL_DE: Record<string, Nivel> = {
  Peligroso: 'Peligroso',
  Precaución: 'Dudoso',
  Seguro: 'Seguro',
  'Sin señales de riesgo': 'Seguro',
}

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

// A Gemini le llegan el sitio y la ruta; la query y el fragmento pueden traer datos personales o tokens.
function sinConsulta(texto: string) {
  if (!/^[a-z][a-z0-9+.-]*:/i.test(texto)) return texto
  try {
    const url = new URL(texto)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return url.protocol
    return `${url.protocol}//${url.host}${url.pathname}`
  } catch {
    return texto.split(/[?#]/)[0]
  }
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

const ITEM = /^\d{1,2}[.)]\s+/

// Una lista numerada pegada en un párrafo pasa a un ítem por línea, para que se muestre como lista.
function separarItems(texto: string) {
  return texto
    .split('\n')
    .flatMap((linea) => (/(^|\s)1[.)]\s/.test(linea) && /\s2[.)]\s/.test(linea) ? linea.split(/\s+(?=\d{1,2}[.)]\s+\S)/) : [linea]))
    .map((linea) => linea.trim())
    .filter(Boolean)
}

// Oraciones completas hasta el tope del modo, sin perder los saltos de línea ni partir los ítems.
function cerradas(texto: string, modo: Modo) {
  let quedan = tope(modo)
  let items = 0
  const lineas: string[] = []
  for (const linea of separarItems(texto)) {
    if (ITEM.test(linea)) {
      if (items >= 10 || !/[.!?]$/.test(linea)) continue
      items += 1
      lineas.push(linea)
      continue
    }
    if (quedan <= 0) continue
    const completas = oraciones(linea)
      .filter((parte, indice, todas) => /[.!?]$/.test(parte) || (indice === todas.length - 1 && /:$/.test(parte)))
      .slice(0, quedan)
    quedan -= completas.length
    if (completas.length) lineas.push(completas.join(' '))
  }
  return lineas.join('\n')
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
  const patrones = [...(nivel === 'Peligroso' ? PELIGROSO : nivel === 'Dudoso' ? DUDOSO : SEGURO), ...NUNCA]
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
  const url = typeof crudo.url === 'string' ? sinConsulta(crudo.url.replace(/\s+/g, ' ').trim()).slice(0, 300) : ''
  const dominio = typeof crudo.dominio === 'string' ? recortar(crudo.dominio, 120) : ''
  const canal = ['enlace', 'whatsapp', 'pdf', 'correo', 'qr'].includes(crudo.canal as string) ? crudo.canal as string : ''
  const puntuacion = typeof crudo.puntuacion === 'number' && Number.isFinite(crudo.puntuacion)
    ? Math.max(0, Math.min(100, Math.round(crudo.puntuacion)))
    : null
  const caso: Caso = { url, dominio, puntuacion, canal, sinContenido: crudo.sinContenido === true }

  // El título tiene que corresponder al nivel; si no llega (frontend viejo), sale del nivel.
  const titulo = typeof datos.titulo === 'string' && TITULOS.includes(datos.titulo) && NIVEL_DE[datos.titulo] === nivel
    ? datos.titulo
    : TITULO_DE[nivel]

  const senales: Senal[] = Array.isArray(datos.senales)
    ? datos.senales.slice(0, 12).flatMap((senal) => {
        if (!senal || typeof senal !== 'object') return []
        const s = senal as Record<string, unknown>
        const id = typeof s.id === 'string' ? s.id.replace(/[^a-z0-9_]/gi, '').slice(0, 60) : ''
        const peso = typeof s.peso === 'number' && Number.isFinite(s.peso) ? Math.max(0, Math.min(100, Math.round(s.peso))) : 0
        const texto = typeof s.texto === 'string' ? recortar(s.texto, 240) : ''
        if (!id || !texto) return []
        return [{
          id,
          grupo: typeof s.grupo === 'string' ? s.grupo.replace(/[^a-z0-9_]/gi, '').slice(0, 30) : '',
          fuerza: s.fuerza === 'fuerte' || s.fuerza === 'media' || s.fuerza === 'debil' ? s.fuerza : '',
          peso,
          texto,
        }]
      })
    : []

  const vt = datos.virusTotal as Record<string, unknown> | null | undefined
  const virusTotal: VirusTotal = vt && typeof vt === 'object' && Number.isFinite(vt.maliciosos) && Number.isFinite(vt.total)
    ? { maliciosos: Math.max(0, Math.round(vt.maliciosos as number)), total: Math.max(0, Math.round(vt.total as number)) }
    : null

  const u = datos.umbrales as Record<string, unknown> | undefined
  const umbrales: Umbrales = u && Number.isFinite(u.precaucion) && Number.isFinite(u.peligroso)
    ? { precaucion: u.precaucion as number, peligroso: u.peligroso as number }
    : { precaucion: 20, peligroso: 55 }

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

  return { nivel, titulo, motivos, senales, virusTotal, umbrales, pregunta, turnos, modo, caso }
}

type Consulta = NonNullable<ReturnType<typeof leer>>

function forma(modo: Modo, umbrales: Umbrales) {
  if (modo === 'tecnico') {
    return [
      'Forma técnica: nombrá cada señal activa con su id, su fuerza y su peso, y el puntaje total contra los umbrales',
      `(Precaución desde ${umbrales.precaucion}, Peligroso desde ${umbrales.peligroso}). Decí qué dio VirusTotal o que no se consultó.`,
      'Las señales van en una lista numerada, un ítem por línea, que empiece con "1. ". Hasta seis oraciones además de la lista, sin emojis.',
    ].join(' ')
  }
  if (modo === 'avanzado') {
    return [
      'Forma avanzada: no repitas los motivos tal cual, que el usuario ya los ve en pantalla; interpretalos.',
      'Explicá cómo se combinan: las señales parecidas cuentan como un solo grupo con tope (palabras sospechosas hasta 15, rasgos débiles hasta 30),',
      'y sin una señal fuerte o dos señales medias de grupos distintos el caso no puede pasar de Precaución.',
      'Decí qué señal habilita el nivel, qué no se pudo revisar, qué aporta VirusTotal y qué tendría que pasar para que el nivel cambie.',
      'Si enumerás, usá una lista numerada, un ítem por línea, que empiece con "1. ". Hasta diez oraciones además de la lista, sin emojis.',
    ].join(' ')
  }
  return 'Forma simple: palabras de todos los días, sin jerga, sin ids de señales, sin puntajes ni números de motores. Contá la señal más importante y qué hacer. Hasta cuatro oraciones, sin emojis y sin listas.'
}

const FUERZA: Record<string, string> = { fuerte: 'fuerte', media: 'media', debil: 'débil' }

function instrucciones(c: Consulta) {
  const lista = c.motivos.length > 0 ? c.motivos.map((motivo) => `- ${motivo}`).join('\n') : '- No hay un motivo extra en este caso.'
  const senales = c.senales.length > 0
    ? c.senales.map((s) => `- ${s.id} (grupo ${s.grupo || 'sin grupo'}, ${FUERZA[s.fuerza] ?? 'sin fuerza'}, ${s.peso} puntos): ${s.texto}`).join('\n')
    : '- No hay señales con peso.'
  const ficha = [
    c.caso.dominio ? `Dominio: ${c.caso.dominio}` : 'Dominio: no informado',
    c.caso.url ? `Entrada revisada: ${c.caso.url}` : 'Entrada revisada: no informada',
    c.caso.canal ? `Canal: ${c.caso.canal}` : 'Canal: no informado',
    c.caso.puntuacion == null ? 'Puntaje: no informado' : `Puntaje: ${c.caso.puntuacion} de 100`,
    `Umbrales: Precaución desde ${c.umbrales.precaucion}, Peligroso desde ${c.umbrales.peligroso}`,
    c.virusTotal ? `VirusTotal: ${c.virusTotal.maliciosos} de ${c.virusTotal.total} motores la marcan como peligrosa` : 'VirusTotal: no se consultó',
    c.caso.sinContenido ? 'Contenido de la página: no se pudo revisar; el resultado sale solo de la dirección' : 'Contenido de la página: revisado si el sitio respondió',
  ].join('\n')
  return [
    'Sos Faro, el robot de SafeGuard. Analizás el caso de SafeLink que ya está decidido y respondés la pregunta que te hagan sobre ese caso.',
    'Podés explicar, resumir, dar un ejemplo parecido y contestar preguntas de hábito, de señales o de qué hacer ahora.',
    'Si la pregunta se va del caso, respondé en una oración y volvé a este resultado. No cambies el veredicto. No sanciona ni expongas a nadie.',
    'No te llega el mensaje de WhatsApp, el cuerpo del correo ni el PDF. No los pidas. Usá solo el caso de abajo.',
    'Un ejemplo es un caso parecido y genérico, sin pasos para armar un engaño.',
    'Un resumen es corto: qué se revisó, el nivel y la señal principal.',
    'Si piden analizar el caso, recorré las señales y cerrá con qué no hacer.',
    'Cada respuesta tiene que terminar la última oración. No la dejes a la mitad.',
    forma(c.modo, c.umbrales),
    `Nombrá el nivel exactamente como "${c.titulo}". No uses otros nombres como "Dudoso" o "Sospechoso".`,
    'Nunca digas que el sitio es seguro ni que algo está garantizado. Si no hubo señales, decí que no encontramos señales de riesgo y que eso no garantiza que el sitio sea seguro.',
    'Si el nivel es Peligroso, no digas que se abra, se descargue, se responda, se pague ni que se carguen claves o datos. Decí que no siga el mensaje, que no cargue claves ni datos, y que avise por otro canal.',
    'Si el nivel es Precaución, no digas que se siga el mensaje: explicá qué es raro y qué chequear antes de seguir.',
    'Si no hubo señales de riesgo, recordá que una clave, un código o un pago igual no se hacen desde un enlace que llegó en un mensaje.',
    `Nivel: ${c.titulo}`,
    'Caso:',
    ficha,
    'Señales calculadas por el motor:',
    senales,
    'Motivos que ya se ven en pantalla:',
    lista,
  ].join('\n')
}

function claveGemini() {
  return ['GEMINI_API_KEY', 'Gemini API Key', 'GEMINI_KEY', 'GOOGLE_API_KEY']
    .map((nombre) => Deno.env.get(nombre)?.trim() ?? '')
    .find(Boolean) ?? ''
}

function tope(modo: Modo) {
  if (modo === 'avanzado') return 10
  if (modo === 'tecnico') return 6
  return 4
}

async function pedirGemini(c: Consulta) {
  const { nivel, pregunta, turnos, modo } = c
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
  const configs = [
    { maxOutputTokens: 8192, thinkingConfig: { thinkingBudget: 0, includeThoughts: false } },
    { maxOutputTokens: 8192 },
  ]

  for (const modelo of modelos) {
    for (const generationConfig of configs) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`,
        {
          method: 'POST',
          signal: AbortSignal.timeout(20000),
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': clave,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: instrucciones(c) }] },
            contents,
            generationConfig,
          }),
        },
      )
      if (res.status === 404) break
      if (res.status === 400) continue
      if (!res.ok) {
        const detalle = await res.text()
        console.log('faro-modelo', res.status, detalle.replace(/AIza[0-9A-Za-z_-]+/g, '').slice(0, 180))
        break
      }
      const data = await res.json()
      const partes = data?.candidates?.[0]?.content?.parts
      if (!Array.isArray(partes)) continue
      const texto = sinEmojis(
        partes
          .filter((parte: { thought?: boolean; text?: string }) => !parte?.thought && typeof parte?.text === 'string')
          .map((parte: { text?: string }) => parte.text ?? '')
          .join(' '),
      )
      const corta = cerradas(texto, modo)
      const cortada = data?.candidates?.[0]?.finishReason === 'MAX_TOKENS'
      if (!corta || cortada || contradice(nivel, corta)) continue
      return corta
    }
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
    const respuesta = await pedirGemini(consulta)
    return json({ respuesta })
  } catch {
    return json({ respuesta: null })
  }
})
