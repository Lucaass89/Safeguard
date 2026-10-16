import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function credencialesGmail() {
  const user = Deno.env.get('GMAIL_USER') ?? ''
  const pass = (Deno.env.get('GMAIL_APP_PASSWORD') ?? '').replace(/\s/g, '')
  if (!user || !pass) return null
  return { user, pass }
}

async function mandarGmail(
  cred: { user: string; pass: string },
  para: string,
  subject: string,
  content: string,
  html: string,
) {
  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: cred.user, password: cred.pass },
    },
  })
  await client.send({ from: cred.user, to: para, subject, content, html })
  await client.close()
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function areaDe(departamento: string | null) {
  const texto = departamento?.trim()
  return texto || 'General'
}

function administra(rol: string | null) {
  const texto = (rol ?? '').trim().toLowerCase()
  return texto.startsWith('admin') || texto === 'tecnico'
}

function escapar(valor: string) {
  return valor.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  let token = ''
  try {
    const body = await req.json()
    token = typeof body?.token === 'string' ? body.token.trim() : ''
  } catch {
    token = ''
  }
  if (!token || token.length > 80) return json({ ok: false }, 400)

  const { data: evento, error: falloEvento } = await admin
    .from('eventos_simulacion')
    .select('id, hizo_clic, aviso_caida_en, campana_id, empleado_id')
    .eq('token_unico', token)
    .maybeSingle()

  if (falloEvento || !evento?.hizo_clic || evento.aviso_caida_en) {
    return json({ ok: true, aviso: 'nada' })
  }

  const ahora = new Date().toISOString()
  const { data: tomado } = await admin
    .from('eventos_simulacion')
    .update({ aviso_caida_en: ahora })
    .eq('id', evento.id)
    .is('aviso_caida_en', null)
    .eq('hizo_clic', true)
    .select('id')
    .maybeSingle()

  if (!tomado) return json({ ok: true, aviso: 'nada' })

  async function soltar() {
    await admin.from('eventos_simulacion').update({ aviso_caida_en: null }).eq('id', evento.id)
  }

  const [{ data: campana }, { data: persona }] = await Promise.all([
    admin
      .from('campanas')
      .select('nombre_campana, es_refuerzo, organizacion_id')
      .eq('id', evento.campana_id)
      .maybeSingle(),
    admin.from('empleados').select('nombre, departamento').eq('id', evento.empleado_id).maybeSingle(),
  ])

  if (!campana || !persona) {
    await soltar()
    return json({ ok: false }, 404)
  }

  const { data: admins } = await admin
    .from('usuarios_admin')
    .select('email, rol')
    .eq('organizacion_id', campana.organizacion_id)

  const destinatarios = [
    ...new Set(
      (admins ?? [])
        .filter((fila) => administra(fila.rol))
        .map((fila) => fila.email?.trim())
        .filter(Boolean),
    ),
  ] as string[]

  if (destinatarios.length === 0) {
    await soltar()
    return json({ ok: true, aviso: 'sin destinatario' })
  }

  const area = areaDe(persona.departamento)
  const { data: caidas } = await admin
    .from('eventos_simulacion')
    .select('empleado_id')
    .eq('campana_id', evento.campana_id)
    .eq('hizo_clic', true)

  const ids = [...new Set((caidas ?? []).map((fila) => fila.empleado_id).filter(Boolean))]
  const { data: gente } =
    ids.length === 0
      ? { data: [] }
      : await admin.from('empleados').select('id, departamento').in('id', ids)

  const enArea = (gente ?? []).filter((fila) => areaDe(fila.departamento) === area).length

  const cred = credencialesGmail()
  if (!cred) {
    await soltar()
    return json({ ok: false, error: 'Falta el correo para avisar' }, 500)
  }

  const nombreCampana = campana.nombre_campana || 'la simulación'
  const pieza = campana.es_refuerzo ? 'el refuerzo' : 'la simulación'
  const cuantos =
    enArea === 1
      ? `En ${area} es la primera persona de esta campaña.`
      : `En ${area}, ${enArea} personas tocaron el enlace en esta campaña.`
  const texto = [
    `${persona.nombre}, de ${area}, tocó el enlace de ${pieza} «${nombreCampana}».`,
    cuantos,
    'No es una sanción. La persona ve la explicación en el momento.',
  ].join('\n\n')
  const html = texto
    .split('\n\n')
    .map((parrafo) => `<p>${escapar(parrafo)}</p>`)
    .join('')

  let enviados = 0
  try {
    for (const para of destinatarios) {
      await mandarGmail(
        cred,
        para,
        `PhishGuard: ${persona.nombre} tocó el enlace`,
        texto,
        html,
      )
      enviados += 1
    }
  } catch (e) {
    if (enviados === 0) await soltar()
    const mensaje = e instanceof Error ? e.message : 'No se pudo enviar el aviso'
    return json({ ok: false, error: mensaje }, 500)
  }

  return json({ ok: true, aviso: 'enviado' })
})
